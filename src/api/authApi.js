const TOKEN_STORAGE_KEY = "booking-desk-admin-token";
const REQUEST_TIMEOUT_MS = 9000;
let unauthorizedNotified = false;

export class ApiRequestError extends Error {
  constructor(message, { status = 0, code = "REQUEST_FAILED", details = null, kind = "http" } = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.kind = kind;
  }
}

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (!configuredUrl) throw new ApiRequestError("Не указан VITE_API_URL для Dashboard.", { kind: "config", code: "API_URL_MISSING" });
  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
    const isLocalApi = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (import.meta.env.PROD && url.protocol !== "https:" && !isLocalApi) throw new Error("Public API must use HTTPS");
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new ApiRequestError("VITE_API_URL должен быть абсолютным HTTP(S)-адресом API.", { kind: "config", code: "API_URL_INVALID" });
  }
}

function getErrorData(payload, fallback) {
  const apiError = payload?.error;
  if (apiError && typeof apiError === "object") {
    return { message: apiError.message || fallback, code: apiError.code || "REQUEST_FAILED", details: apiError.details ?? null };
  }
  if (typeof apiError === "string") return { message: payload?.message || apiError || fallback, code: apiError, details: payload?.fields ?? null };
  return { message: payload?.message || fallback, code: "REQUEST_FAILED", details: payload?.fields ?? null };
}

function notifyUnauthorized() {
  if (unauthorizedNotified || window.location.hash === "#/login") return;
  unauthorizedNotified = true;
  clearAuthToken();
  document.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  unauthorizedNotified = false;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function requestApi(path, { auth = true, timeoutMs = REQUEST_TIMEOUT_MS, signal, headers, ...options } = {}) {
  const controller = new AbortController();
  const abortFromOutside = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", abortFromOutside, { once: true });
  }
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = new Headers({ Accept: "application/json", ...headers });
  const token = getAuthToken();
  if (auth && token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers: requestHeaders, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      const kind = signal?.aborted ? "aborted" : "timeout";
      const requestError = new ApiRequestError(kind === "timeout" ? "Сервер не ответил вовремя." : "Запрос был отменён.", { kind, code: kind.toUpperCase() });
      if (kind === "aborted") requestError.name = "AbortError";
      throw requestError;
    }
    throw new ApiRequestError("Не удалось подключиться к Booking API.", { kind: "network", code: "NETWORK_ERROR" });
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromOutside);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch {
      if (!response.ok) throw new ApiRequestError("Сервер вернул ответ в неизвестном формате.", { status: response.status, kind: "response", code: "INVALID_API_RESPONSE" });
      throw new ApiRequestError("Booking API вернул некорректный JSON.", { status: response.status, kind: "response", code: "INVALID_JSON_RESPONSE" });
    }
  }

  if (!response.ok) {
    if (auth && response.status === 401) notifyUnauthorized();
    const error = getErrorData(payload, `Ошибка Booking API: ${response.status}.`);
    throw new ApiRequestError(error.message, { status: response.status, code: error.code, details: error.details, kind: "http" });
  }
  return payload;
}

export async function login(loginValue, password) {
  const payload = await requestApi("/api/auth/login", {
    auth: false,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: loginValue, password }),
  });
  if (!payload?.token) throw new ApiRequestError("Booking API не вернул токен авторизации.", { kind: "response", code: "TOKEN_MISSING" });
  setAuthToken(payload.token);
}
