import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type Tipo = 'sucesso' | 'erro' | 'aviso' | 'info';
type Toast = { id: number; tipo: Tipo; titulo: string; descricao?: string };

const ToastContext = createContext<{
  toast: (tipo: Tipo, titulo: string, descricao?: string) => void;
}>({ toast: () => {} });

const CORES: Record<Tipo, { borda: string; fundo: string; icone: ReactNode }> = {
  sucesso: {
    borda: 'border-l-forest-600',
    fundo: 'bg-forest-50',
    icone: <CheckCircle2 className="h-5 w-5 text-forest-600" />,
  },
  erro: {
    borda: 'border-l-brick-600',
    fundo: 'bg-brick-50',
    icone: <XCircle className="h-5 w-5 text-brick-600" />,
  },
  aviso: {
    borda: 'border-l-clay-500',
    fundo: 'bg-clay-50',
    icone: <AlertTriangle className="h-5 w-5 text-clay-600" />,
  },
  info: {
    borda: 'border-l-lagoon-600',
    fundo: 'bg-lagoon-50',
    icone: <Info className="h-5 w-5 text-lagoon-600" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Toast[]>([]);

  const remover = useCallback((id: number) => {
    setItens((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (tipo: Tipo, titulo: string, descricao?: string) => {
      const id = Date.now() + Math.random();
      setItens((prev) => [...prev.slice(-3), { id, tipo, titulo, descricao }]);
      window.setTimeout(() => remover(id), 5000);
    },
    [remover]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,26rem)] flex-col gap-2 no-print">
        <AnimatePresence>
          {itens.map((t) => {
            const c = CORES[t.tipo];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-200 ${c.borda} border-l-4 bg-white p-3.5 shadow-lg shadow-ink-900/10`}
              >
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.fundo}`}>
                  {c.icone}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{t.titulo}</p>
                  {t.descricao && (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{t.descricao}</p>
                  )}
                </div>
                <button
                  onClick={() => remover(t.id)}
                  className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Fechar notificação"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
