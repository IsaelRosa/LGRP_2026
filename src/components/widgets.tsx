import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Tone } from '../lib/constants';

/* ------------------------------------------------------------------ */
/* Cartão de indicador (KPI)                                           */
/* ------------------------------------------------------------------ */

const FUNDOS: Record<Tone, string> = {
  verde: 'from-forest-50 to-forest-100/60 text-forest-700 border-forest-200',
  azul: 'from-lagoon-50 to-lagoon-100/60 text-lagoon-700 border-lagoon-200',
  ambar: 'from-clay-50 to-clay-100/60 text-clay-700 border-clay-200',
  vermelho: 'from-brick-50 to-brick-100/60 text-brick-700 border-brick-200',
  cinza: 'from-ink-50 to-ink-100/60 text-ink-600 border-ink-200',
  roxo: 'from-violet-50 to-violet-100/60 text-violet-700 border-violet-200',
  ciano: 'from-teal-50 to-teal-100/60 text-teal-700 border-teal-200',
};

export function StatCard({
  icone,
  rotulo,
  valor,
  sufixo,
  tone = 'verde',
  detalhe,
  delta,
  deltaLabel,
  carregando,
  onClick,
  progresso,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: string | number;
  sufixo?: string;
  tone?: Tone;
  detalhe?: string;
  delta?: number | null;
  deltaLabel?: string;
  carregando?: boolean;
  onClick?: () => void;
  progresso?: { valor: number; max: number; tone?: 'verde' | 'ambar' | 'vermelho' | 'azul' };
}) {
  const Tag: any = onClick ? motion.button : motion.div;
  const cores = FUNDOS[tone];
  const corBarra = {
    verde: 'bg-forest-500',
    ambar: 'bg-clay-400',
    vermelho: 'bg-brick-500',
    azul: 'bg-lagoon-500',
  };

  return (
    <Tag
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={`group relative overflow-hidden rounded-xl border border-ink-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,33,28,0.04),0_10px_28px_-22px_rgba(16,33,28,0.4)] transition-shadow hover:shadow-[0_2px_6px_rgba(16,33,28,0.06),0_18px_36px_-24px_rgba(16,33,28,0.45)] ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br ${cores}`}
        >
          {icone}
        </span>
        {delta !== null && delta !== undefined && (
          <span
            className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${
              delta > 0
                ? 'bg-forest-50 text-forest-700'
                : delta < 0
                ? 'bg-brick-50 text-brick-700'
                : 'bg-ink-100 text-ink-500'
            }`}
            title={deltaLabel}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : delta < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(0)}%
          </span>
        )}
      </div>

      {carregando ? (
        <div className="mt-3.5 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-20 rounded" />
        </div>
      ) : (
        <>
          <p className="mt-3.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
            {rotulo}
          </p>
          <p className="mt-0.5 flex items-baseline gap-1 font-display text-[26px] font-bold leading-none tracking-tight text-ink-900">
            {valor}
            {sufixo && <span className="text-sm font-semibold text-ink-400">{sufixo}</span>}
          </p>
        </>
      )}

      {detalhe && <p className="mt-2 text-[11px] leading-relaxed text-ink-500">{detalhe}</p>}
      {deltaLabel && !detalhe && (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">{deltaLabel}</p>
      )}

      {progresso && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className={`h-full rounded-full ${corBarra[progresso.tone || 'verde']}`}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  100,
                  progresso.max > 0 ? (progresso.valor / progresso.max) * 100 : 0
                )}%`,
              }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip personalizado dos gráficos                                  */
/* ------------------------------------------------------------------ */

export function ChartTooltip({ active, payload, label, sufixo }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-ink-200 bg-white/97 px-3 py-2 shadow-lg shadow-ink-900/10 backdrop-blur">
      {label !== undefined && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: p.color || p.payload?.fill || p.fill }}
            />
            <span className="text-ink-600">{p.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-ink-900">
              {typeof p.value === 'number' ? p.value.toLocaleString('pt-BR') : p.value}
              {sufixo ? ` ${sufixo}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Legenda de lista (para gráficos de pizza)                           */
/* ------------------------------------------------------------------ */

export function LegendaLista({
  dados,
  total,
  sufixo = '',
}: {
  dados: { nome: string; valor: number; cor: string }[];
  total: number;
  sufixo?: string;
}) {
  return (
    <ul className="space-y-1.5">
      {dados.map((d) => {
        const pct = total > 0 ? (d.valor / total) * 100 : 0;
        return (
          <li key={d.nome} className="flex items-center gap-2.5 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.cor }} />
            <span className="min-w-0 flex-1 truncate text-ink-600" title={d.nome}>
              {d.nome}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-ink-900">
              {d.valor.toLocaleString('pt-BR')}
              {sufixo}
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-ink-400">
              {pct.toFixed(0)}%
            </span>
          </li>
        );
      })}
      {!dados.length && <li className="py-4 text-center text-xs text-ink-400">Sem dados no período.</li>}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Barra horizontal ranqueada                                          */
/* ------------------------------------------------------------------ */

export function RankingBarras({
  dados,
  sufixo = '',
  cor = '#1f6e4f',
}: {
  dados: { nome: string; valor: number }[];
  sufixo?: string;
  cor?: string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  if (!dados.length)
    return <p className="py-6 text-center text-xs text-ink-400">Sem dados no período.</p>;
  return (
    <ul className="space-y-2.5">
      {dados.map((d, i) => (
        <li key={d.nome}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-xs text-ink-600" title={d.nome}>
              <span className="mr-1.5 font-semibold tabular-nums text-ink-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              {d.nome}
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-900">
              {d.valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              {sufixo && <span className="ml-0.5 font-normal text-ink-400">{sufixo}</span>}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <motion.div
              className="h-full rounded-full"
              style={{ background: cor, opacity: 1 - i * 0.06 }}
              initial={{ width: 0 }}
              animate={{ width: `${(d.valor / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
