import React, { useEffect, useState } from "react";
import Layout from "@theme/Layout";
import { AdminLayout } from "@site/src/components/AdminSystem";
import { getAll, upsertWebhook } from "@site/src/auth";
import styles from "./api-integrations.module.css";

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([]);
  const [form, setForm] = useState({
    id: "",
    endpoint: "",
    secret: "",
    events: "notices,events,assignments,notes",
    status: "active",
    maxAttempts: "6",
  });

  const load = async () => setHooks(await getAll("webhook_subscriptions"));
  useEffect(() => {
    load();
  }, []);

  const parseCsv = (value) =>
    value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    await upsertWebhook({
      id: form.id.trim() || undefined,
      endpoint: form.endpoint.trim(),
      secret: form.secret,
      events: parseCsv(form.events),
      status: form.status,
      maxAttempts: Number(form.maxAttempts || 6),
    });
    setForm((prev) => ({ ...prev, id: "", endpoint: "", secret: "" }));
    await load();
  };

  return (
    <Layout title="Webhooks — Orios Class">
      <AdminLayout title="🛰️ Webhook Subscriptions">
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.title}>Create / Update Webhook</h3>
            <form onSubmit={submit} className={styles.grid}>
              <input className={styles.input} placeholder="Webhook ID (optional for new)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              <input className={styles.input} placeholder="https://your-bot.example/webhook" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} required />
              <input className={styles.input} placeholder="Webhook secret (for X-Orios-Signature)" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} />
              <input className={styles.input} placeholder="Events csv or *" value={form.events} onChange={(e) => setForm({ ...form, events: e.target.value })} />
              <select className={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
              </select>
              <input className={styles.input} type="number" min="1" max="20" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} />
              <button type="submit" className={styles.btn}>Save Webhook</button>
            </form>
            <p className={styles.muted}>Your endpoint receives POST JSON payloads with `X-Orios-Event-Id` and `X-Orios-Signature` headers.</p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.title}>Registered Webhooks</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th>Queue</th>
                  <th>Dead Letter</th>
                </tr>
              </thead>
              <tbody>
                {hooks.map((hook) => (
                  <tr key={hook.id}>
                    <td>{hook.id}</td>
                    <td>{hook.endpoint}</td>
                    <td>{hook.status || "active"}</td>
                    <td>{Array.isArray(hook.events) ? hook.events.join(", ") : "*"}</td>
                    <td>{Array.isArray(hook.queue) ? hook.queue.length : 0}</td>
                    <td>{Array.isArray(hook.deadLetter) ? hook.deadLetter.length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AdminLayout>
    </Layout>
  );
}
