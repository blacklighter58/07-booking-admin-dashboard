import { requestApi } from "./authApi.js";

export async function getServices({ includeInactive = false } = {}) {
  const payload = await requestApi(`/api/services${includeInactive ? "?includeInactive=true" : ""}`);
  if (!Array.isArray(payload?.services)) throw new Error("Booking API вернул услуги в неверном формате.");
  return payload.services;
}
export async function createService(data) { return (await requestApi("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).service; }
export async function updateService(id, data) { return (await requestApi(`/api/services/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).service; }
export async function deleteServiceFromApi(id) { await requestApi(`/api/services/${encodeURIComponent(id)}`, { method: "DELETE" }); }
