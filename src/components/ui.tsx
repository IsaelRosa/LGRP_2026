import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Inbox, Info, Loader2, Search, X, XCircle } from 'lucide-react';
import type { Tone } from '../lib/constants';

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
};

const VARIANTES: Record<string, string> = {
  primary:
    'bg-forest-700 text-white hover:bg-forest-800 active:bg-forest-900 shadow-sm shadow-forest-900/20 disabled:bg-forest-700/50',
  secondary:
    'bg-white text-ink-700 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-brick-600 text-white hover:bg-brick-700 active:bg-brick-800 shadow-sm',
  soft: 'bg-forest-50 text-forest-800 border border-forest-200 hover:bg-forest-100',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
};

const TAMANHOS: Record<string, string> = {
  xs: 'h-7 px-2.5 text-[11px] gap-1 rounded-md',
  sm: 'h-8.5 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variant]} ${TAMANHOS[size]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

const TONES: Record<Tone, string> = {
  verde: 'bg-forest-50 text-forest-800 border-forest-200',
  azul: 'bg-lagoon-50 text-lagoon-800 border-lagoon-200',
  ambar: 'bg-clay-50 text-clay-800 border-clay-200',
  vermelho: 'bg-brick-50 text-brick-800 border-brick-200',
  cinza: 'bg-ink-100 text-ink-600 border-ink-200',
  roxo: 'bg-violet-50 text-violet-800 border-violet-200',
  ciano: 'bg-teal-50 text-teal-800 border-teal-200',
};

export function Badge({
  tone = 'cinza',
  children,
  className = '',
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 ${TONES[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-ink-200/80 bg-white shadow-[0_1px_2px_rgba(16,33,28,0.04),0_8px_24px_-16px_rgba(16,33,28,0.18)] ${
        padding ? 'p-5' : ''
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  titulo,
  subtitulo,
  acao,
  icone,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icone && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
            {icone}
          </span>
        )}
        <div>
          <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
            {titulo}
          </h3>
          {subtitulo && <p className="mt-0.5 text-xs text-ink-500">{subtitulo}</p>}
        </div>
      </div>
      {acao}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  children,
  erro,
  obrigatorio,
  dica,
  className = '',
}: {
  label: string;
  children: ReactNode;
  erro?: string;
  obrigatorio?: boolean;
  dica?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-700">
        {label}
        {obrigatorio && <span className="text-brick-500">*</span>}
      </span>
      {children}
      {dica && !erro && <span className="mt-1 block text-[11px] text-ink-400">{dica}</span>}
      {erro && <span className="mt-1 block text-[11px] font-medium text-brick-600">{erro}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition focus:outline-none focus:ring-2 focus:ring-forest-500/25 disabled:bg-ink-50 disabled:text-ink-400';

export function Input({
  className = '',
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      className={`${inputBase} h-10 ${
        invalid ? 'border-brick-400 focus:border-brick-500' : 'border-ink-200 focus:border-forest-500'
      } ${className}`}
    />
  );
}

export function Textarea({
  className = '',
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      className={`${inputBase} min-h-[84px] resize-y py-2.5 leading-relaxed ${
        invalid ? 'border-brick-400 focus:border-brick-500' : 'border-ink-200 focus:border-forest-500'
      } ${className}`}
    />
  );
}

export function Select({
  className = '',
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...rest}
      className={`${inputBase} h-10 cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235f7a70%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9 ${
        invalid ? 'border-brick-400 focus:border-brick-500' : 'border-ink-200 focus:border-forest-500'
      } ${className}`}
    >
      {children}
    </select>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-8 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/25"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  children,
  largura = 'max-w-2xl',
  rodape,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  largura?: string;
  rodape?: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [aberto, onFechar]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/45 p-4 backdrop-blur-[2px] sm:items-center no-print"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onFechar}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`my-auto w-full ${largura} overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl shadow-ink-950/25`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-ink-200 bg-gradient-to-r from-forest-50 to-white px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
                  {titulo}
                </h2>
                {subtitulo && <p className="mt-0.5 text-xs text-ink-500">{subtitulo}</p>}
              </div>
              <button
                onClick={onFechar}
                className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
                aria-label="Fechar"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </header>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
            {rodape && (
              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/70 px-5 py-3.5">
                {rodape}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  aberto,
  onFechar,
  onConfirmar,
  titulo,
  mensagem,
  confirmando = false,
  rotuloConfirmar = 'Excluir',
}: {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensagem: string;
  confirmando?: boolean;
  rotuloConfirmar?: string;
}) {
  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={titulo}
      largura="max-w-md"
      rodape={
        <>
          <Button variant="secondary" size="sm" onClick={onFechar}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={confirmando} onClick={onConfirmar}>
            {rotuloConfirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{mensagem}</p>
      <p className="mt-3 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-xs text-clay-800">
        Esta ação será registrada na trilha de auditoria do sistema.
      </p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tabela de dados                                                     */
/* ------------------------------------------------------------------ */

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export function DataTable<T extends { id: number | string }>({
  colunas,
  rows,
  loading,
  emptyTitle = 'Nenhum registro encontrado',
  emptyMessage = 'Ajuste os filtros aplicados ou cadastre um novo registro.',
  onRowClick,
  paginacao,
  densidade = 'normal',
}: {
  colunas: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  paginacao?: {
    page: number;
    total: number;
    setPage: (p: number) => void;
    inicio: number;
    fim: number;
    totalRegistros: number;
  };
  densidade?: 'normal' | 'compacta';
}) {
  const celula = densidade === 'compacta' ? 'px-3 py-2' : 'px-4 py-3';

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-ink-200/80 bg-white">
        <div className="flex items-center gap-3 border-b border-ink-200 bg-ink-50/60 px-4 py-3">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton ml-auto h-3 w-20 rounded" />
        </div>
        <div className="divide-y divide-ink-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              {colunas.slice(0, 5).map((_, j) => (
                <div key={j} className="skeleton h-3 flex-1 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white/60 px-6 py-16 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
          <Inbox className="h-6 w-6" />
        </span>
        <p className="font-display text-sm font-semibold text-ink-800">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-[0_1px_2px_rgba(16,33,28,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/80">
              {colunas.map((c) => (
                <th
                  key={c.key}
                  className={`${celula} whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-ink-500 ${
                    c.headerClassName || ''
                  }`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`group transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${i % 2 ? 'bg-ink-50/35' : 'bg-white'} hover:bg-forest-50/60`}
              >
                {colunas.map((c) => (
                  <td key={c.key} className={`${celula} align-middle text-sm text-ink-700 ${c.className || ''}`}>
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginacao && paginacao.total > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-ink-50/60 px-4 py-2.5">
          <p className="text-xs text-ink-500">
            Exibindo <span className="font-semibold text-ink-700">{paginacao.inicio + 1}</span>–
            <span className="font-semibold text-ink-700">{paginacao.fim}</span> de{' '}
            <span className="font-semibold text-ink-700">{paginacao.totalRegistros}</span> registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => paginacao.setPage(Math.max(1, paginacao.page - 1))}
              disabled={paginacao.page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 transition hover:bg-ink-100 disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-ink-600">
              {paginacao.page} / {paginacao.total}
            </span>
            <button
              onClick={() => paginacao.setPage(Math.min(paginacao.total, paginacao.page + 1))}
              disabled={paginacao.page === paginacao.total}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 transition hover:bg-ink-100 disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diversos                                                            */
/* ------------------------------------------------------------------ */

export function PageHeader({
  titulo,
  subtitulo,
  acoes,
  icone,
}: {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {icone && (
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-forest-200 bg-gradient-to-br from-forest-50 to-forest-100 text-forest-700 sm:flex">
            {icone}
          </span>
        )}
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            {titulo}
          </h1>
          {subtitulo && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{subtitulo}</p>}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2 no-print">{acoes}</div>}
    </header>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-forest-600 ${className}`} />;
}

export function ErrorState({ mensagem, onRetry }: { mensagem: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-brick-200 bg-brick-50/60 px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brick-100 text-brick-600">
        <XCircle className="h-5 w-5" />
      </span>
      <p className="font-display text-sm font-semibold text-brick-800">Não foi possível carregar os dados</p>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-brick-700/80">{mensagem}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function InfoBar({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'aviso' }) {
  const cls =
    tone === 'aviso'
      ? 'border-clay-200 bg-clay-50 text-clay-800'
      : 'border-lagoon-200 bg-lagoon-50 text-lagoon-800';
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${cls}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function ProgressBar({
  valor,
  max = 100,
  tone = 'verde',
}: {
  valor: number;
  max?: number;
  tone?: 'verde' | 'ambar' | 'vermelho' | 'azul';
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (valor / max) * 100)) : 0;
  const cores: Record<string, string> = {
    verde: 'bg-forest-500',
    ambar: 'bg-clay-400',
    vermelho: 'bg-brick-500',
    azul: 'bg-lagoon-500',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <motion.div
        className={`h-full rounded-full ${cores[tone]}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
