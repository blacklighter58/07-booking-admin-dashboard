import { requestApi } from "./authApi.js";

export async function getEmployees({ includeInactive = false, serviceId } = {}) {
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  if (serviceId) params.set("serviceId", serviceId);
  const payload = await requestApi(`/api/employees${params.size ? `?${params}` : ""}`);
  if (!Array.isArray(payload?.employees)) throw new Error("Booking API вернул сотрудников в неверном формате.");
  return payload.employees;
}

export async function createEmployee(data) { return (await requestApi("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).employee; }
export async function updateEmployee(id, data) { return (await requestApi(`/api/employees/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })).employee; }
export async function updateEmployeeServices(id, serviceIds) { return (await requestApi(`/api/employees/${encodeURIComponent(id)}/services`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceIds }) })).employee; }
export async function deleteEmployeeFromApi(id) { await requestApi(`/api/employees/${encodeURIComponent(id)}`, { method: "DELETE" }); }
