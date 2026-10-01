async function accessToken(): Promise<string> {
  try {
    return window.localStorage.getItem('lgrp_access_token') || '';
  } catch {
    return '';
  }
}

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    throw new Error('Falha de conexão com o servidor. Verifique sua rede.');
  }

  if (!res.ok) {
    let msg = `Erro ${res.status} ao comunicar com o servidor.`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export const apiGet = <T = any>(path: string) => api<T>(path);
export const apiPost = <T = any>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T = any>(path: string, body: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = <T = any>(path: string, id: number | string) =>
  api<T>(path, { method: 'DELETE', body: JSON.stringify({ id }) });
