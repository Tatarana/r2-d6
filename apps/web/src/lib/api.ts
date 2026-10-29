// api.ts - cliente REST (mesma origem; cookie de sessao httpOnly). Erros em problem+json viram ApiError.
export class ApiError extends Error {
  constructor(public status: number, public title: string, public detail?: string, public body?: any) {
    super(detail || title);
  }
}
export class NetworkError extends Error {
  constructor() { super('Sem conexão com o servidor.'); }
}

export const DEVICE_ID = (() => {
  try {
    let v = localStorage.getItem('r2d6.device');
    if (!v) { v = `web-${crypto.randomUUID().slice(0, 8)}`; localStorage.setItem('r2d6.device', v); }
    return v;
  } catch { return `web-${Math.random().toString(36).slice(2, 10)}`; }
})();

export async function api<T = any>(method: string, path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method, credentials: 'same-origin', ...init,
      headers: { ...(body !== undefined && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {}), 'x-device-id': DEVICE_ID, ...(init.headers ?? {}) },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new NetworkError();
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* corpo nao JSON */ }
  if (!res.ok) throw new ApiError(res.status, data?.title ?? res.statusText, data?.detail ?? data?.message, data);
  return data as T;
}
export const get = <T = any>(p: string) => api<T>('GET', p);
export const post = <T = any>(p: string, b: unknown = {}) => api<T>('POST', p, b);
export const patch = <T = any>(p: string, b: unknown = {}) => api<T>('PATCH', p, b);
export const put = <T = any>(p: string, b: unknown = {}) => api<T>('PUT', p, b);
export const del = <T = any>(p: string) => api<T>('DELETE', p);

export const errText = (e: unknown) => (e instanceof ApiError ? e.detail || e.title : e instanceof Error ? e.message : 'Erro inesperado.');
