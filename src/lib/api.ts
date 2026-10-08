// In dev the web app uses the Vite '/api' proxy (see vite.config.ts). For
// Capacitor/device builds set VITE_API_URL to an absolute URL, e.g.
// VITE_API_URL=https://api.domain.com/api
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
