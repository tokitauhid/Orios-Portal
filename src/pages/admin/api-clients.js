import React, { useEffect, useState } from "react";
import Layout from "@theme/Layout";
import { AdminLayout } from "@site/src/components/AdminSystem";
import { createApiClient, getAll } from "@site/src/auth";
import styles from "./api-integrations.module.css";

export default function ApiClientsPage() {
  const [clients, setClients] = useState([]);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState({
    name: "",
    clientId: "",
    scopes: "notices:read,events:read,assignments:read,notes:read,events_outbox:read",
    allowedCollections: "notices,events,assignments,notes",
    allowedActions: "verify",
    attachmentAccess: "metadata_only",
  });

  const load = async () => setClients(await getAll("api_clients"));
  useEffect(() => {
    load();
  }, []);

  const parseCsv = (value) =>
    value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createApiClient({
      name: form.name.trim() || undefined,
      clientId: form.clientId.trim() || undefined,
      scopes: parseCsv(form.scopes),
      allowedCollections: parseCsv(form.allowedCollections),
      allowedActions: parseCsv(form.allowedActions),
      attachmentAccess: form.attachmentAccess,
    });
    setCreated(result);
    setForm((prev) => ({ ...prev, name: "", clientId: "" }));
    await load();
  };

  return (
    <Layout title="API Clients — Orios Class">
      <AdminLayout title="🔑 API Client Management">
        <div className={styles.section}>
          <div className={styles.card}>
            <h3 className={styles.title}>Create API Client</h3>
            <form onSubmit={handleSubmit} className={styles.grid}>
              <input className={styles.input} placeholder="Display name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={styles.input} placeholder="Client ID (optional auto)" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
              <select className={styles.select} value={form.attachmentAccess} onChange={(e) => setForm({ ...form, attachmentAccess: e.target.value })}>
                <option value="metadata_only">Attachment metadata only</option>
                <option value="full">Attachment full payload</option>
              </select>
              <input className={styles.input} placeholder="Scopes csv" value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} />
              <input className={styles.input} placeholder="Allowed collections csv" value={form.allowedCollections} onChange={(e) => setForm({ ...form, allowedCollections: e.target.value })} />
              <input className={styles.input} placeholder="Allowed actions csv" value={form.allowedActions} onChange={(e) => setForm({ ...form, allowedActions: e.target.value })} />
              <button type="submit" className={styles.btn}>Create Client</button>
            </form>
            <p className={styles.muted}>Use `events_outbox:read` scope + `events_outbox` in allowed collections for bot polling.</p>
            {created?.secret && (
              <div className={styles.secretBox}>
                clientId: {created.clientId}
                <br />
                secret: {created.secret}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.title}>Existing API Clients</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Attachment Access</th>
                  <th>Scopes</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.clientId}>
                    <td>{client.clientId}</td>
                    <td>{client.name || "—"}</td>
                    <td>{client.status || "active"}</td>
                    <td>{client.attachmentAccess || "metadata_only"}</td>
                    <td>{Array.isArray(client.scopes) ? client.scopes.join(", ") : "—"}</td>
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
