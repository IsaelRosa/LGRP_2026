import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Pencil,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { apiGet, apiPut } from '../lib/api';
import { baixarCSV, fmtInt, fmtMoeda, fmtNum } from '../lib/utils';
import { PALETA } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  DataTable,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
  type Column,
} from '../components/ui';
import { ChartTooltip, StatCard } from '../components/widgets';

const ANO_ATUAL = new Date().getFullYear();
const ANOS = Array.from({ length: 6 }, (_, i) => ANO_ATUAL - 4 + i);

export default function Indicadores() {
  const { podeEditar } = useAuth();
  const { toast } = useToast();
  const [ano, setAno] = useState(ANO_ATUAL);
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await apiGet(`/api/indicadores?ano=${ano}`);
      setDados(r);
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar os indicadores.');
    } finally {
      setLoading(false);
    }
  }, [ano]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const meses: any[] = dados?.meses || [];
  const total = dados?.total || {};

  const comVariacao = useMemo(() => {
    return meses.map((m, i) => {
      const ant = i > 0 ? meses[i - 1] : null;
      const varKg =
        ant && Number(ant.residuos_coletados_kg) > 0
          ? ((Number(m.residuos_coletados_kg) - Number(ant.residuos_coletados_kg)) /
              Number(ant.residuos_coletados_kg)) *
            100
          : null;
      const varPed =
        ant && Number(ant.pedidos_recebidos) > 0
          ? ((Number(m.pedidos_recebidos) - Number(ant.pedidos_recebidos)) /
              Number(ant.pedidos_recebidos)) *
            100
          : null;
      return { ...m, id: m.mes, varKg, varPed };
    });
  }, [meses]);

  function abrirEdicao(m: any) {
    setEditando(m);
    setForm({
      acidentes: String(m.acidentes ?? 0),
      treinamentos: String(m.treinamentos ?? 0),
      custo_operacional: String(m.custo_operacional ?? 0),
      destinacao_correta_pct: m.destinacao_correta_pct ? String(m.destinacao_correta_pct) : '',
      observacoes: m.observacoes || '',
    });
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    try {
      await apiPut('/api/indicadores', {
        mes: editando.mes,
        ano,
        acidentes: Number(form.acidentes || 0),
        treinamentos: Number(form.treinamentos || 0),
        custo_operacional: Number(form.custo_operacional || 0),
        destinacao_correta_pct: form.destinacao_correta_pct === '' ? null : Number(form.destinacao_correta_pct),
        observacoes: form.observacoes,
      });
      toast('sucesso', 'Indicadores salvos', `${editando.nome}/${ano} atualizado com sucesso.`);
      setEditando(null);
      carregar();
    } catch (e: any) {
      toast('erro', 'Erro ao salvar', e?.message);
    } finally {
      setSalvando(false);
    }
  }

  const colunas: Column<any>[] = [
    {
      key: 'nome',
      header: 'Mês',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest-50 text-[11px] font-bold text-forest-700">
            {String(r.mes).padStart(2, '0')}
          </span>
          <span className="text-[13px] font-medium text-ink-800">{r.nome}</span>
        </div>
      ),
    },
    {
      key: 'pedidos_recebidos',
      header: 'Pedidos',
      className: 'text-right whitespace-nowrap',
      render: (r) => <NumeroCelula valor={r.pedidos_recebidos} variacao={r.varPed} />,
    },
    {
      key: 'coletas_realizadas',
      header: 'Coletas',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtInt(r.coletas_realizadas)}</span>,
    },
    {
      key: 'residuos_coletados_kg',
      header: 'Coletado (kg)',
      className: 'text-right whitespace-nowrap',
      render: (r) => <NumeroCelula valor={fmtNum(r.residuos_coletados_kg, 1)} variacao={r.varKg} />,
    },
    {
      key: 'residuos_coletados_l',
      header: 'Coletado (L)',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtNum(r.residuos_coletados_l, 1)}</span>,
    },
    {
      key: 'residuos_tratados_kg',
      header: 'Tratado (kg)',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] font-semibold tabular-nums text-forest-700">{fmtNum(r.residuos_tratados_kg, 1)}</span>,
    },
    {
      key: 'solventes_recuperados_l',
      header: 'Recuperado (L)',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-lagoon-700">{fmtNum(r.solventes_recuperados_l, 1)}</span>,
    },
    {
      key: 'reagentes_vencidos',
      header: 'Reag. vencidos',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className={`text-[13px] font-semibold tabular-nums ${r.reagentes_vencidos > 0 ? 'text-brick-600' : 'text-ink-700'}`}>
          {fmtInt(r.reagentes_vencidos)}
        </span>
      ),
    },
    {
      key: 'vidrarias_descontaminadas',
      header: 'Vidrarias',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtInt(r.vidrarias_descontaminadas)}</span>,
    },
    {
      key: 'destinacao_correta_pct',
      header: 'Destinação correta',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <Badge tone={r.destinacao_correta_pct >= 95 ? 'verde' : r.destinacao_correta_pct >= 80 ? 'ambar' : 'vermelho'}>
          {fmtNum(r.destinacao_correta_pct, 1)}%
        </Badge>
      ),
    },
    {
      key: 'custo_total',
      header: 'Custo',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtMoeda(r.custo_total)}</span>,
    },
    {
      key: 'acidentes',
      header: 'Acidentes',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className={`text-[13px] font-semibold tabular-nums ${r.acidentes > 0 ? 'text-brick-600' : 'text-forest-700'}`}>
          {fmtInt(r.acidentes)}
        </span>
      ),
    },
    {
      key: 'treinamentos',
      header: 'Treinamentos',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtInt(r.treinamentos)}</span>,
    },
    {
      key: 'acoes',
      header: '',
      className: 'text-right whitespace-nowrap',
      render: (r) =>
        podeEditar ? (
          <button
            onClick={() => abrirEdicao(r)}
            title="Editar dados de lançamento manual"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null,
    },
  ];

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Indicadores Mensais" icone={<Gauge className="h-5.5 w-5.5" />} />
        <ErrorState mensagem={erro} onRetry={carregar} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Indicadores Mensais"
        subtitulo="Série histórica calculada automaticamente a partir dos registros operacionais. Os campos de lançamento manual (acidentes, treinamentos e custos operacionais) são editáveis e auditados."
        icone={<Gauge className="h-5.5 w-5.5" />}
        acoes={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white p-1">
              <button
                onClick={() => setAno((a) => Math.max(ANOS[0], a - 1))}
                disabled={ano <= ANOS[0]}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-100 disabled:opacity-35"
                aria-label="Ano anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Select
                className="h-8 w-24 border-0 text-center text-sm font-semibold"
                value={String(ano)}
                onChange={(e) => setAno(Number(e.target.value))}
              >
                {ANOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
              <button
                onClick={() => setAno((a) => Math.min(ANOS[ANOS.length - 1], a + 1))}
                disabled={ano >= ANOS[ANOS.length - 1]}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-100 disabled:opacity-35"
                aria-label="Próximo ano"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button variant="secondary" icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />} onClick={carregar}>
              Recalcular
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() =>
                baixarCSV(
                  `lgrp-indicadores-${ano}`,
                  [
                    { key: 'nome', label: 'Mês' },
                    { key: 'pedidos_recebidos', label: 'Pedidos Recebidos' },
                    { key: 'coletas_realizadas', label: 'Coletas Realizadas' },
                    { key: 'residuos_coletados_kg', label: 'Resíduos Coletados (kg)' },
                    { key: 'residuos_coletados_l', label: 'Resíduos Coletados (L)' },
                    { key: 'residuos_tratados_kg', label: 'Resíduos Tratados (kg)' },
                    { key: 'solventes_recuperados_l', label: 'Solventes Recuperados (L)' },
                    { key: 'reagentes_vencidos', label: 'Reagentes Vencidos' },
                    { key: 'vidrarias_descontaminadas', label: 'Vidrarias Descontaminadas' },
                    { key: 'destinacao_correta_pct', label: 'Destinação Correta (%)' },
                    { key: 'custo_total', label: 'Custo Total (R$)' },
                    { key: 'acidentes', label: 'Acidentes' },
                    { key: 'treinamentos', label: 'Treinamentos' },
                  ],
                  comVariacao
                )
              }
            >
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* KPIs anuais */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          carregando={loading}
          icone={<BadgeCheck className="h-4.5 w-4.5" />}
          rotulo="Pedidos no ano"
          valor={fmtInt(total.pedidos_recebidos)}
          tone="verde"
          detalhe={`${fmtInt(total.coletas_realizadas)} coletas executadas`}
        />
        <StatCard
          carregando={loading}
          icone={<TrendingUp className="h-4.5 w-4.5" />}
          rotulo="Coletado"
          valor={fmtNum(total.residuos_coletados_kg, 1)}
          sufixo="kg"
          tone="azul"
          detalhe={`${fmtNum(total.residuos_tratados_kg, 1)} kg tratados`}
        />
        <StatCard
          carregando={loading}
          icone={<Sparkles className="h-4.5 w-4.5" />}
          rotulo="Solventes recuperados"
          valor={fmtNum(total.solventes_recuperados_l, 1)}
          sufixo="L"
          tone="ciano"
          detalhe="reaproveitados por destilação"
        />
        <StatCard
          carregando={loading}
          icone={<TrendingDown className="h-4.5 w-4.5" />}
          rotulo="Reagentes vencidos"
          valor={fmtInt(total.reagentes_vencidos)}
          tone={total.reagentes_vencidos > 0 ? 'vermelho' : 'verde'}
          detalhe={`${fmtInt(total.vidrarias_descontaminadas)} vidrarias descontaminadas`}
        />
        <StatCard
          carregando={loading}
          icone={<Gauge className="h-4.5 w-4.5" />}
          rotulo="Acidentes"
          valor={fmtInt(total.acidentes)}
          tone={total.acidentes > 0 ? 'vermelho' : 'verde'}
          detalhe={`${fmtInt(total.treinamentos)} treinamentos realizados`}
        />
        <StatCard
          carregando={loading}
          icone={<BadgeCheck className="h-4.5 w-4.5" />}
          rotulo="Custo total"
          valor={fmtMoeda(total.custo_total).replace('R$', '').trim()}
          sufixo="R$"
          tone="cinza"
          detalhe={`ano de ${ano}`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Massa coletada × massa tratada"
            subtitulo={`Comparativo mensal em ${ano} (kg)`}
            icone={<TrendingUp className="h-4.5 w-4.5" />}
          />
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="skeleton h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comVariacao} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" vertical={false} />
                  <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: '#d2dbd7' }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} width={54} />
                  <Tooltip content={<ChartTooltip sufixo="kg" />} cursor={{ fill: 'rgba(31,110,79,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="residuos_coletados_kg" name="Coletado" fill="#2484b4" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="residuos_tratados_kg" name="Tratado" fill="#1f6e4f" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Line
                    type="monotone"
                    dataKey="solventes_recuperados_l"
                    name="Recuperado (L)"
                    stroke="#d97a1c"
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo="Volume de solicitações e eficiência"
            subtitulo="Pedidos recebidos × taxa de destinação correta (%)"
            icone={<Gauge className="h-4.5 w-4.5" />}
          />
          <div className="h-[280px] w-full">
            {loading ? (
              <div className="skeleton h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={comVariacao} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" vertical={false} />
                  <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: '#d2dbd7' }} dy={6} />
                  <YAxis yAxisId="l" tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                  <YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} width={44} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(31,110,79,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar yAxisId="l" dataKey="pedidos_recebidos" name="Pedidos" radius={[4, 4, 0, 0]} maxBarSize={26}>
                    {comVariacao.map((_: any, i: number) => (
                      <Cell key={i} fill={PALETA[i % PALETA.length]} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="destinacao_correta_pct"
                    name="Destinação correta"
                    stroke="#1f6e4f"
                    strokeWidth={2.4}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Tabela */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
              Planilha de indicadores — {ano}
            </h3>
            <p className="mt-0.5 text-xs text-ink-500">
              Valores calculados automaticamente a partir dos módulos operacionais. Variação percentual
              em relação ao mês anterior.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-forest-600" /> aumento
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-brick-500" /> redução
            </span>
          </div>
        </div>
        <div className="p-4">
          <DataTable colunas={colunas} rows={comVariacao} loading={loading} densidade="compacta" />
        </div>
        {!loading && comVariacao.length > 0 && (
          <div className="grid grid-cols-2 gap-px border-t border-ink-200 bg-ink-200 md:grid-cols-4">
            <TotalCelula rotulo="Total coletado" valor={`${fmtNum(total.residuos_coletados_kg, 1)} kg`} />
            <TotalCelula rotulo="Total tratado" valor={`${fmtNum(total.residuos_tratados_kg, 1)} kg`} />
            <TotalCelula rotulo="Custo acumulado" valor={fmtMoeda(total.custo_total)} />
            <TotalCelula rotulo="Treinamentos" valor={`${fmtInt(total.treinamentos)} no ano`} />
          </div>
        )}
      </Card>

      {/* Modal de edição manual */}
      <Modal
        aberto={!!editando}
        onFechar={() => setEditando(null)}
        titulo={`Lançamento manual — ${editando?.nome || ''}/${ano}`}
        subtitulo="Campos que não podem ser derivados automaticamente dos registros operacionais."
        largura="max-w-xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button loading={salvando} onClick={salvar}>
              Salvar lançamento
            </Button>
          </>
        }
      >
        {editando && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-lagoon-200 bg-lagoon-50/60 p-3 text-xs text-lagoon-800 sm:grid-cols-4">
              <Auto rotulo="Pedidos" valor={fmtInt(editando.pedidos_recebidos)} />
              <Auto rotulo="Coletas" valor={fmtInt(editando.coletas_realizadas)} />
              <Auto rotulo="Coletado" valor={`${fmtNum(editando.residuos_coletados_kg, 1)} kg`} />
              <Auto rotulo="Tratado" valor={`${fmtNum(editando.residuos_tratados_kg, 1)} kg`} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Acidentes / incidentes" dica="Eventos com exposição ou derramamento">
                <Input
                  type="number"
                  min="0"
                  value={form.acidentes ?? ''}
                  onChange={(e) => setForm({ ...form, acidentes: e.target.value })}
                />
              </Field>
              <Field label="Treinamentos realizados" dica="Capacitações e DDS no mês">
                <Input
                  type="number"
                  min="0"
                  value={form.treinamentos ?? ''}
                  onChange={(e) => setForm({ ...form, treinamentos: e.target.value })}
                />
              </Field>
              <Field label="Custo operacional adicional (R$)" dica="Somado ao custo de destinação calculado">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.custo_operacional ?? ''}
                  onChange={(e) => setForm({ ...form, custo_operacional: e.target.value })}
                />
              </Field>
              <Field label="Destinação correta (%)" dica="Em branco = calculado automaticamente">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.destinacao_correta_pct ?? ''}
                  onChange={(e) => setForm({ ...form, destinacao_correta_pct: e.target.value })}
                />
              </Field>
              <Field label="Observações do mês" className="sm:col-span-2">
                <Textarea
                  value={form.observacoes ?? ''}
                  placeholder="Não conformidades, auditorias, campanhas internas, mudanças de processo..."
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NumeroCelula({ valor, variacao }: { valor: any; variacao: number | null }) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5">
      <span className="text-[13px] font-semibold tabular-nums text-ink-800">{valor}</span>
      {variacao !== null && Number.isFinite(variacao) && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center gap-0.5 text-[10px] font-semibold ${
            variacao > 0 ? 'text-forest-600' : variacao < 0 ? 'text-brick-500' : 'text-ink-400'
          }`}
        >
          {variacao > 0 ? <TrendingUp className="h-3 w-3" /> : variacao < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {Math.abs(variacao).toFixed(0)}%
        </motion.span>
      )}
    </span>
  );
}

function TotalCelula({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
      <p className="font-display text-base font-bold text-ink-900">{valor}</p>
    </div>
  );
}

function Auto({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{rotulo}</p>
      <p className="text-[13px] font-bold">{valor}</p>
    </div>
  );
}
