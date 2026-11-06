/**
 * TerraGuard AI — Frontend API Configuration & URL Normalization
 * Automatically handles root domain inputs, trailing slashes, and ensures
 * endpoints consistently route through /api/v1 gateway.
 */

export function normalizeApiUrl(rawUrl?: string): string {
  if (!rawUrl || !rawUrl.trim()) {
    return "http://localhost:8000/api/v1";
  }
  let url = rawUrl.trim().replace(/\/+$/, "");
  if (!url.endsWith("/api/v1")) {
    url = `${url}/api/v1`;
  }
  return url;
}

export const API_BASE_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
);

