import { requestApi } from "./authApi.js";

function requestSettings(path = "", options = {}) { return requestApi(`/api/settings${path}`, options); }

export async function getSettings() {
  const payload = await requestSettings();
  if (!payload?.settings) throw new Error("API не вернул настройки.");
  return payload.settings;
}
export async function updateSettings(settings) {
  const payload = await requestSettings("", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
  if (!payload?.settings) throw new Error("API не вернул обновлённые настройки.");
  return payload.settings;
}
export function testTelegramConnection() { return requestSettings("/telegram/test", { method: "POST" }); }
export function changePassword(data) { return requestApi("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export function logoutAll() { return requestApi("/api/auth/logout-all", { method: "POST" }); }
