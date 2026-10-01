import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiGet } from './api';
import { useAuth } from '../contexts/AuthContext';
import { CatalogoContext, type CatalogoValue, type Laboratorio } from './catalogo';
import { LABORATORIOS as FALLBACK } from './constants';

export type { Laboratorio } from './catalogo';

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [usandoFallback, setUsandoFallback] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;
    apiGet<Laboratorio[]>('/api/laboratorio')
      .then((r) => {
        if (cancelado) return;
        const lista = Array.isArray(r) ? r : [];
        // Sem tabela (ainda não migrada) ou vazio: mantém a lista fixa.
        if (!lista.length) {
          setRegistros([]);
          setUsandoFallback(true);
          return;
        }
        setRegistros(lista);
        setUsandoFallback(false);
      })
      .catch(() => {
        if (!cancelado) {
          setRegistros([]);
          setUsandoFallback(true);
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [user, nonce]);

  const nomes = useMemo(() => {
    const ativos = registros.filter((l) => Number(l.ativo) === 1).map((l) => l.nome);
    return ativos.length ? ativos : usandoFallback ? FALLBACK : [];
  }, [registros, usandoFallback]);

  const value = useMemo<CatalogoValue>(
    () => ({
      nomes,
      registros,
      loading,
      usandoFallback,
      recarregar: () => setNonce((n) => n + 1),
    }),
    [nomes, registros, loading, usandoFallback]
  );

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>;
}
