import { requestApi } from "./authApi.js";

export function getAvailableSlots({ serviceId, employeeId, date }) {
  const params = new URLSearchParams({ serviceId, employeeId, date });
  return requestApi(`/api/availability?${params}`);
}
