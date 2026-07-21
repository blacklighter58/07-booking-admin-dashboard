import { requestApi } from "./authApi.js";

export function getClients(filters = {}) {
  const params = new URLSearchParams();
  ["page", "limit", "search", "tag", "favorite", "sort", "order"].forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== "") params.set(key, String(filters[key]));
  });
  return requestApi(`/api/clients${params.size ? `?${params}` : ""}`);
}

export function getClient(id) { return requestApi(`/api/clients/${encodeURIComponent(id)}`); }
export function createClient(data) { return requestApi("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export function updateClient(id, data) { return requestApi(`/api/clients/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export function mergeClient(sourceId, targetClientId) { return requestApi(`/api/clients/${encodeURIComponent(sourceId)}/merge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetClientId }) }); }
