import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from './api';

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export function fmtData(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function fmtDataHora(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtRelativo(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias < 30) return `há ${dias} d`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `há ${meses} mês${meses > 1 ? 'es' : ''}`;
  return fmtData(v);
}

export function fmtNum(v: unknown, decimais = 1): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export function fmtInt(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('pt-BR');
}

export function fmtMoeda(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtCompacto(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1).replace('.', ',')} M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} mil`;
  return fmtNum(n, n % 1 === 0 ? 0 : 1);
}

/** Converte "2026-09-28" ou Date em ISO para envio à API */
export function isoData(v?: string | null): string | null {
  if (!v) return null;
  if (v.length === 10) return `${v}T12:00:00.000Z`;
  return v;
}

/** Converte ISO em "yyyy-mm-dd" para inputs date */
export function paraInputDate(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function paraInputDateTime(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Hook de recurso (lista + CRUD)                                      */
/* ------------------------------------------------------------------ */

export type Filtros = Record<string, string | number | null | undefined>;

export function useResource<T = any>(path: string, filtros: Filtros = {}) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const qs = useMemo(() => {
    const s = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'todos') s.set(k, String(v));
    });
    const str = s.toString();
    return str ? `?${str}` : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros), path]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiGet<T[]>(`${path}${qs}`);
      setData(Array.isArray(r) ? r : []);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados.');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [path, qs]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload, setData };
}

export function useCrud(path: string, reload: () => void) {
  const [saving, setSaving] = useState(false);
  const ref = useRef(reload);
  ref.current = reload;

  const create = useCallback(
    async (body: unknown) => {
      setSaving(true);
      try {
        const result = await apiPost(path, body);
        ref.current();
        return result;
      } finally {
        setSaving(false);
      }
    },
    [path]
  );

  const update = useCallback(
    async (body: unknown) => {
      setSaving(true);
      try {
        await apiPut(path, body);
        ref.current();
        return true;
      } finally {
        setSaving(false);
      }
    },
    [path]
  );

  const remove = useCallback(
    async (id: number | string) => {
      setSaving(true);
      try {
        await apiDelete(path, id);
        ref.current();
        return true;
      } finally {
        setSaving(false);
      }
    },
    [path]
  );

  return { create, update, remove, saving };
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

export function baixarCSV(nomeArquivo: string, colunas: { key: string; label: string }[], rows: any[]) {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",;\n]/.test(s) ? `"${s}"` : s;
  };
  const linhas = [
    colunas.map((c) => esc(c.label)).join(';'),
    ...rows.map((r) =>
      colunas
        .map((c) => {
          const v = r[c.key];
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return esc(fmtData(v));
          return esc(v);
        })
        .join(';')
    ),
  ];
  const blob = new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Paginação client-side                                               */
/* ------------------------------------------------------------------ */

export function usePagination<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => {
    if (page > total) setPage(1);
  }, [page, total]);
  const inicio = (page - 1) * pageSize;
  return {
    page,
    setPage,
    pageSize,
    total,
    inicio,
    fim: Math.min(inicio + pageSize, rows.length),
    pagina: rows.slice(inicio, inicio + pageSize),
    totalRegistros: rows.length,
  };
}
