const PUBLIC_READ_COLLECTIONS = [
  "notices",
  "events",
  "assignments",
  "labReports",
  "teachers",
  "files",
  "notes",
  "routine",
  "settings",
  "subjects",
];

const BOT_PRIVATE_COLLECTIONS = new Set([
  "admins",
  "api_clients",
  "webhook_subscriptions",
  "audit_log",
  "idempotency_keys",
  "rate_limits",
]);

export function canReadCollection(principal, collection) {
  if (principal.type === "admin") return true;
  if (principal.type === "public") return PUBLIC_READ_COLLECTIONS.includes(collection);
  if (BOT_PRIVATE_COLLECTIONS.has(collection)) return false;
  if (principal.allowedCollections.length > 0) return principal.allowedCollections.includes(collection);
  return principal.scopes.includes(`${collection}:read`) || principal.scopes.includes("*");
}

export function canWriteCollection(principal, collection, action) {
  if (principal.type === "admin") return true;
  if (principal.type !== "client") return false;
  if (BOT_PRIVATE_COLLECTIONS.has(collection)) return false;

  const required = `${collection}:${action}`;
  const genericWrite = `${collection}:write`;
  const allowedByActions = principal.allowedActions.length === 0 || principal.allowedActions.includes(action);

  if (!allowedByActions) return false;
  if (principal.allowedCollections.length > 0 && !principal.allowedCollections.includes(collection)) return false;

  return principal.scopes.includes(required) || principal.scopes.includes(genericWrite) || principal.scopes.includes("*");
}

export function sanitizeForPrincipal(principal, collection, payload) {
  if (principal.type === "admin") return payload;

  if (collection === "admins") {
    return [];
  }

  if (!Array.isArray(payload)) return payload;
  if (!["notes", "assignments"].includes(collection)) return payload;

  const includeAttachment = principal.type === "client" && principal.attachmentAccess === "full";
  return payload.map((item) => {
    if (!item || typeof item !== "object") return item;
    if (includeAttachment) return item;

    const { fileData, ...rest } = item;
    if (!fileData) return rest;
    return {
      ...rest,
      attachment: {
        present: true,
        size: item.size || null,
        format: item.format || null,
        type: item.type || null,
        name: item.name || null,
      },
    };
  });
}
