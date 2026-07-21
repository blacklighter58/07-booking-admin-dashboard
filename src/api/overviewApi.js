import { requestApi } from "./authApi.js";

export function getDashboardOverview(period = "today", signal) {
  return requestApi(`/api/dashboard/overview?period=${encodeURIComponent(period)}`, { signal });
}
