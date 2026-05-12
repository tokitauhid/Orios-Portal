import { kvGet, kvPut } from "./kv_store.js";

async function signPayload(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enqueueWebhookDeliveries(env, event) {
  const subs = await kvGet(env, "webhook_subscriptions");
  if (!Array.isArray(subs) || subs.length === 0) return;

  const now = new Date().toISOString();
  const next = subs.map((sub) => {
    if (!sub || sub.status !== "active") return sub;
    const listensToAll = !Array.isArray(sub.events) || sub.events.length === 0 || sub.events.includes("*");
    if (!listensToAll && !sub.events.includes(event.entityType)) return sub;
    const queue = Array.isArray(sub.queue) ? sub.queue : [];
    queue.push({
      eventId: event.eventId,
      attempts: 0,
      nextAttemptAt: now,
      lastError: null,
    });
    return { ...sub, queue };
  });

  await kvPut(env, "webhook_subscriptions", next);
}

export async function processWebhookQueue(env, eventIndex, maxDeliveries = 5) {
  const subs = await kvGet(env, "webhook_subscriptions");
  if (!Array.isArray(subs) || subs.length === 0) return [];

  let deliveries = 0;
  const results = [];

  const nextSubs = [];
  for (const sub of subs) {
    if (!sub || sub.status !== "active") {
      nextSubs.push(sub);
      continue;
    }

    const queue = Array.isArray(sub.queue) ? [...sub.queue] : [];
    const deadLetter = Array.isArray(sub.deadLetter) ? [...sub.deadLetter] : [];
    const nowMs = Date.now();
    const maxAttempts = Number(sub.maxAttempts || 6);

    while (queue.length > 0 && deliveries < maxDeliveries) {
      const job = queue[0];
      if (new Date(job.nextAttemptAt).getTime() > nowMs) break;
      const event = eventIndex.get(job.eventId);
      if (!event) {
        queue.shift();
        continue;
      }

      deliveries += 1;
      const payload = JSON.stringify(event);
      const signature = sub.secret ? await signPayload(sub.secret, payload) : "";

      try {
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Orios-Event-Id": event.eventId,
            "X-Orios-Signature": signature,
          },
          body: payload,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        results.push({ webhookId: sub.id, eventId: event.eventId, ok: true });
        queue.shift();
      } catch (error) {
        job.attempts = Number(job.attempts || 0) + 1;
        job.lastError = String(error.message || "delivery_failed");
        if (job.attempts >= maxAttempts) {
          deadLetter.push({ ...job, failedAt: new Date().toISOString() });
          queue.shift();
          results.push({ webhookId: sub.id, eventId: event.eventId, ok: false, deadLetter: true });
        } else {
          const backoffSec = Math.min(2 ** job.attempts, 300);
          job.nextAttemptAt = new Date(Date.now() + backoffSec * 1000).toISOString();
          queue[0] = job;
          results.push({ webhookId: sub.id, eventId: event.eventId, ok: false, retryInSec: backoffSec });
          break;
        }
      }
    }

    nextSubs.push({ ...sub, queue, deadLetter });
  }

  await kvPut(env, "webhook_subscriptions", nextSubs);
  return results;
}
