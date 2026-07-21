import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL?.trim();
  if (!apiUrl) throw new Error("VITE_API_URL is required to build Booking Desk Dashboard.");
  try {
    const url = new URL(apiUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported protocol");
    const isLocalApi = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (mode === "production" && url.protocol !== "https:" && !isLocalApi) {
      throw new Error("Public production API URL must use HTTPS.");
    }
  } catch {
    throw new Error("VITE_API_URL must be an absolute HTTP(S) URL.");
  }
  return {};
});
