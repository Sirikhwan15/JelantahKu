// Klien HTTP tunggal untuk seluruh pemanggilan API.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // 0 = gagal terhubung / timeout
    this.details = details; // [{ field, message }] untuk galat validasi
  }
}

let getToken = () => null;
let onUnauthorized = () => {};

/** Dipanggil sekali di main.js agar api.js tidak bergantung langsung pada store (hindari impor melingkar). */
export function configureApi(options) {
  if (options.getToken) getToken = options.getToken;
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized;
}

/**
 * request('/wallet')                             -> GET dengan token
 * request('/auth/login', { method: 'POST', body, auth: false })
 * Mengembalikan isi `data` dari respons; melempar ApiError bila gagal.
 */
export async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ApiError(0, 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.');
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* respons bukan JSON */
  }

  if (!response.ok) {
    const message = payload?.message || 'Terjadi kesalahan. Silakan coba lagi.';
    if (response.status === 401 && auth && token) onUnauthorized();
    throw new ApiError(response.status, message, payload?.errors ?? null);
  }
  return payload?.data ?? null;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
};
