import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Check,
  Columns3,
  FileText,
  Loader2,
  Printer,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Table2,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import { baixarCSV, fmtData, fmtDataHora, fmtMoeda, fmtNum } from '../lib/utils';
import { PALETA } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
} from '../components/ui';
import { ChartTooltip } from '../components/widgets';

type Modulo = {
  valor: string;
  rotulo: string;
  colunas: { key: string; label: string; tipo: string }[];
  agrupaveis: string[];
};

const PRIMEIRO_DIA_ANO = `${new Date().getFullYear()}-01-01`;
const HOJE = new Date().toISOString().slice(0, 10);

export default function Relatorios() {
  const { perfil } = useAuth();
  const { toast } = useToast();

  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>(['pedidos_coleta']);
  const [de, setDe] = useState(PRIMEIRO_DIA_ANO);
  const [ate, setAte] = useState(HOJE);
  const [agrupar, setAgrupar] = useState('');
  const [campoFiltro, setCampoFiltro] = useState('');
  const [valorFiltro, setValorFiltro] = useState('');
  const [colunasEscolhidas, setColunasEscolhidas] = useState<Record<string, string[]>>({});
  const [mostrarColunas, setMostrarColunas] = useState(false);

  const [resultado, setResultado] = useState<any>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiGet('/api/relatorios?modulos=lista');
        const m: Modulo[] = r?.modulos || [];
        setModulos(m);
        const inicial: Record<string, string[]> = {};
        m.forEach((mod) => {
          inicial[mod.valor] = mod.colunas.slice(0, 7).map((c) => c.key);
        });
        setColunasEscolhidas(inicial);
      } catch (e: any) {
        setErro(e?.message || 'Falha ao carregar os módulos disponíveis.');
      }
    })();
  }, []);

  const moduloAtivo = modulos.find((m) => m.valor === selecionados[0]);

  const gerar = useCallback(async () => {
    if (!selecionados.length) {
      toast('aviso', 'Selecione ao menos um módulo', 'Escolha quais bases de dados entram no relatório.');
      return;
    }
    setGerando(true);
    setErro(null);
    try {
      const qs = new URLSearchParams();
      qs.set('modulo', selecionados.join(','));
      if (de) qs.set('de', de);
      if (ate) qs.set('ate', ate);
      if (agrupar) qs.set('agrupar', agrupar);
      if (campoFiltro && valorFiltro) {
        qs.set('campo', campoFiltro);
        qs.set('valor', valorFiltro);
      }
      const r = await apiGet(`/api/relatorios?${qs.toString()}`);
      setResultado(r);
      toast('sucesso', 'Relatório gerado', `${r?.resumo?.registros ?? 0} registros no período selecionado.`);
    } catch (e: any) {
      setErro(e?.message || 'Falha ao gerar o relatório.');
    } finally {
      setGerando(false);
    }
  }, [selecionados, de, ate, agrupar, campoFiltro, valorFiltro, toast]);

  useEffect(() => {
    if (modulos.length) gerar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulos.length]);

  const alternarModulo = (v: string) => {
    setSelecionados((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
    setAgrupar('');
    setCampoFiltro('');
    setValorFiltro('');
  };

  const alternarColuna = (mod: string, key: string) => {
    setColunasEscolhidas((p) => {
      const atual = p[mod] || [];
      return {
        ...p,
        [mod]: atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key],
      };
    });
  };

  const valoresPossiveis = useMemo(() => {
    if (!resultado || !campoFiltro || !moduloAtivo) return [];
    const mod = resultado.resultados?.[moduloAtivo.valor];
    if (!mod) return [];
    const set = new Set<string>();
    mod.rows.forEach((r: any) => {
      if (r[campoFiltro] != null && r[campoFiltro] !== '') set.add(String(r[campoFiltro]));
    });
    return [...set].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, campoFiltro, moduloAtivo?.valor]);

  function exportarTudo() {
    Object.entries(resultado?.resultados || {}).forEach(([mod, r]: any) => {
      const cols = (r.colunas as any[]).filter((c) => (colunasEscolhidas[mod] || []).includes(c.key));
      baixarCSV(`lgrp-relatorio-${mod}`, cols.length ? cols : r.colunas, r.rows);
    });
  }

  return (
    <div className="space-y-5">
      <div className="no-print">
        <PageHeader
          titulo="Relatórios Personalizáveis"
          subtitulo="Monte relatórios sob medida selecionando módulos, período, agrupamento e colunas. Exporte em CSV ou imprima em formato institucional."
          icone={<BarChart3 className="h-5.5 w-5.5" />}
          acoes={
            <>
              <Button
                variant="secondary"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => window.print()}
                disabled={!resultado}
              >
                Imprimir / PDF
              </Button>
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" />}
                onClick={exportarTudo}
                disabled={!resultado}
              >
                Exportar CSV
              </Button>
              <Button icon={<RefreshCw className={`h-4 w-4 ${gerando ? 'animate-spin' : ''}`} />} onClick={gerar}>
                Gerar relatório
              </Button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        {/* Painel de configuração */}
        <div className="space-y-4 no-print">
          <Card>
            <CardHeader titulo="Configuração" subtitulo="Defina o escopo do relatório" icone={<SlidersHorizontal className="h-4.5 w-4.5" />} />

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Módulos</p>
            <div className="mb-4 space-y-1.5">
              {modulos.map((m) => {
                const ativo = selecionados.includes(m.valor);
                return (
                  <button
                    key={m.valor}
                    onClick={() => alternarModulo(m.valor)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                      ativo
                        ? 'border-forest-300 bg-forest-50 font-medium text-forest-900'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        ativo ? 'border-forest-600 bg-forest-600 text-white' : 'border-ink-300 bg-white'
                      }`}
                    >
                      {ativo && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    {m.rotulo}
                  </button>
                );
              })}
              {!modulos.length && <div className="skeleton h-24 rounded-lg" />}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Período de">
                <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
              </Field>
              <Field label="Período até">
                <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
              </Field>
            </div>

            <div className="mt-3 space-y-3">
              <Field label="Agrupar por" dica="Gera tabela e gráfico consolidados">
                <Select value={agrupar} onChange={(e) => setAgrupar(e.target.value)}>
                  <option value="">Sem agrupamento</option>
                  {(moduloAtivo?.agrupaveis || []).map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Filtrar por campo">
                <Select
                  value={campoFiltro}
                  onChange={(e) => {
                    setCampoFiltro(e.target.value);
                    setValorFiltro('');
                  }}
                >
                  <option value="">Sem filtro adicional</option>
                  {(moduloAtivo?.colunas || [])
                    .filter((c) => c.tipo === 'texto')
                    .map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                </Select>
              </Field>

              {campoFiltro && (
                <Field label="Valor do filtro">
                  <Select value={valorFiltro} onChange={(e) => setValorFiltro(e.target.value)}>
                    <option value="">Todos</option>
                    {valoresPossiveis.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            <Button className="mt-4 w-full" loading={gerando} onClick={gerar} icon={<FileText className="h-4 w-4" />}>
              Gerar relatório
            </Button>
          </Card>

          <Card>
            <button
              onClick={() => setMostrarColunas((v) => !v)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                  <Columns3 className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block font-display text-[15px] font-semibold tracking-tight text-ink-900">
                    Colunas exibidas
                  </span>
                  <span className="block text-xs text-ink-500">Personalize a saída do relatório</span>
                </span>
              </span>
              <span className="text-xs font-medium text-forest-700">{mostrarColunas ? 'Ocultar' : 'Abrir'}</span>
            </button>

            {mostrarColunas && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-4">
                {selecionados.map((mod) => {
                  const m = modulos.find((x) => x.valor === mod);
                  if (!m) return null;
                  return (
                    <div key={mod}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{m.rotulo}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.colunas.map((c) => {
                          const on = (colunasEscolhidas[mod] || []).includes(c.key);
                          return (
                            <button
                              key={c.key}
                              onClick={() => alternarColuna(mod, c.key)}
                              className={`rounded-md border px-2 py-1 text-[11px] transition ${
                                on
                                  ? 'border-forest-300 bg-forest-50 font-medium text-forest-800'
                                  : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300'
                              }`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </Card>
        </div>

        {/* Resultado */}
        <div className="space-y-4 print-full">
          {erro && !resultado ? (
            <ErrorState mensagem={erro} onRetry={gerar} />
          ) : !resultado ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-forest-600" />
                <p className="text-sm font-medium text-ink-700">Preparando relatório...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Cabeçalho institucional (visível apenas na impressão) */}
              <div className="hidden print-full">
                <CabecalhoImpressao
                  perfil={perfil}
                  de={de}
                  ate={ate}
                  modulos={selecionados.map((s) => modulos.find((m) => m.valor === s)?.rotulo || s)}
                  geradoEm={resultado.gerado_em}
                />
              </div>

              {/* Resumo */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <CelulaResumo
                  rotulo="Registros no período"
                  valor={String(resultado.resumo?.registros ?? 0)}
                  nota={`${fmtData(de)} a ${fmtData(ate)}`}
                />
                {Object.entries(resultado.resumo?.somas || {})
                  .slice(0, 3)
                  .map(([k, v]: any) => (
                    <CelulaResumo
                      key={k}
                      rotulo={rotuloSoma(k)}
                      valor={/custo/i.test(k) ? fmtMoeda(v) : fmtNum(v, 1)}
                      nota={/custo/i.test(k) ? 'custo acumulado' : 'soma dos registros'}
                    />
                  ))}
              </div>

              {Object.entries(resultado.resultados || {}).map(([mod, r]: any) => {
                const cols = (r.colunas as any[]).filter((c) => (colunasEscolhidas[mod] || []).includes(c.key));
                const colunasFinais = cols.length ? cols : r.colunas;
                return (
                  <div key={mod} className="space-y-4">
                    <Card padding={false}>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                            <Table2 className="h-4.5 w-4.5" />
                          </span>
                          <div>
                            <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
                              {r.rotulo}
                            </h3>
                            <p className="mt-0.5 text-xs text-ink-500">
                              {r.total} registro(s) · campo de data: {r.campoData.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(r.somas || {}).map(([k, v]: any) => (
                            <Badge key={k} tone="cinza">
                              {rotuloSoma(k)}: {/custo/i.test(k) ? fmtMoeda(v) : fmtNum(v, 1)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="border-b border-ink-200 bg-ink-50/80">
                              {colunasFinais.map((c: any) => (
                                <th
                                  key={c.key}
                                  className="whitespace-nowrap px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500"
                                >
                                  {c.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-100">
                            {r.rows.length === 0 ? (
                              <tr>
                                <td colSpan={colunasFinais.length} className="px-3 py-10 text-center text-xs text-ink-400">
                                  Nenhum registro encontrado para o período e filtros selecionados.
                                </td>
                              </tr>
                            ) : (
                              r.rows.slice(0, 300).map((row: any, i: number) => (
                                <tr key={row.id ?? i} className={i % 2 ? 'bg-ink-50/35' : 'bg-white'}>
                                  {colunasFinais.map((c: any) => (
                                    <td key={c.key} className="whitespace-nowrap px-3 py-2 text-[12.5px] text-ink-700">
                                      {formatarCelula(row[c.key], c.tipo)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {r.rows.length > 300 && (
                        <p className="border-t border-ink-200 bg-ink-50/60 px-4 py-2 text-[11px] text-ink-500">
                          Exibindo os primeiros 300 de {r.rows.length} registros. Exporte o CSV para a base completa.
                        </p>
                      )}
                    </Card>

                    {r.agrupado?.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Card>
                          <CardHeader
                            titulo={`Consolidado por ${agrupar.replace(/_/g, ' ')}`}
                            subtitulo={`${r.rotulo} · ${r.agrupado.length} grupos`}
                            icone={<BarChart3 className="h-4.5 w-4.5" />}
                          />
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={r.agrupado} margin={{ top: 6, right: 8, left: -20, bottom: 46 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" vertical={false} />
                                <XAxis
                                  dataKey="chave"
                                  tickLine={false}
                                  axisLine={{ stroke: '#d2dbd7' }}
                                  interval={0}
                                  angle={-26}
                                  textAnchor="end"
                                  height={66}
                                  tick={{ fontSize: 10 }}
                                />
                                <YAxis tickLine={false} axisLine={false} width={50} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(31,110,79,0.05)' }} />
                                <Bar dataKey="registros" name="Registros" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                  {r.agrupado.map((_: any, i: number) => (
                                    <Cell key={i} fill={PALETA[i % PALETA.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card padding={false}>
                          <div className="border-b border-ink-200 px-5 py-4">
                            <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
                              Tabela consolidada
                            </h3>
                            <p className="mt-0.5 text-xs text-ink-500">
                              Totais por {agrupar.replace(/_/g, ' ')} ordenados por volume de registros
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                              <thead>
                                <tr className="border-b border-ink-200 bg-ink-50/80">
                                  <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
                                    {agrupar.replace(/_/g, ' ')}
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
                                    Registros
                                  </th>
                                  {Object.keys(r.agrupado[0]?.somas || {}).map((k) => (
                                    <th
                                      key={k}
                                      className="px-4 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-wider text-ink-500"
                                    >
                                      {rotuloSoma(k)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-ink-100">
                                {r.agrupado.map((g: any, i: number) => (
                                  <tr key={g.chave} className={i % 2 ? 'bg-ink-50/35' : 'bg-white'}>
                                    <td className="px-4 py-2.5 text-[13px] font-medium text-ink-800">{g.chave}</td>
                                    <td className="px-4 py-2.5 text-right text-[13px] tabular-nums text-ink-700">
                                      {g.registros}
                                    </td>
                                    {Object.entries(g.somas || {}).map(([k, v]: any) => (
                                      <td key={k} className="px-4 py-2.5 text-right text-[13px] tabular-nums text-ink-700">
                                        {/custo/i.test(k) ? fmtMoeda(v) : fmtNum(v, 1)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      </div>
                    )}
                  </div>
                );
              })}

              <p className="pt-2 text-center text-[11px] text-ink-400 no-print">
                Relatório gerado em {fmtDataHora(resultado.gerado_em)} por {perfil?.nome || 'usuário'} ·
                LGRP — Sistema de Gestão de Resíduos Químicos
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatarCelula(v: any, tipo: string) {
  if (v === null || v === undefined || v === '') return '—';
  if (tipo === 'data') return fmtData(v);
  if (tipo === 'numero') {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : String(v);
  }
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  return String(v);
}

function rotuloSoma(k: string) {
  const m: Record<string, string> = {
    quantidade_estimada: 'Qtd. estimada',
    peso_kg: 'Peso (kg)',
    volume_l: 'Volume (L)',
    unidades: 'Unidades',
    quantidade_entrada: 'Qtd. entrada',
    quantidade_saida: 'Qtd. saída',
    custo: 'Custo',
    volume_total_l: 'Volume total (L)',
    volume_restante_l: 'Volume restante (L)',
    volume_recuperado_l: 'Volume recuperado (L)',
    quantidade: 'Quantidade',
  };
  return m[k] || k.replace(/_/g, ' ');
}

function CelulaResumo({ rotulo, valor, nota }: { rotulo: string; valor: string; nota: string }) {
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
      <p className="font-display text-xl font-bold leading-tight text-ink-900">{valor}</p>
      <p className="text-[11px] text-ink-400">{nota}</p>
    </div>
  );
}

function CabecalhoImpressao({
  perfil,
  de,
  ate,
  modulos,
  geradoEm,
}: {
  perfil: any;
  de: string;
  ate: string;
  modulos: string[];
  geradoEm: string;
}) {
  return (
    <div className="mb-6 border-b-2 border-forest-800 pb-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-forest-900">
            Universidade Pública Federal
          </p>
          <p className="text-[12px] text-ink-700">
            Laboratório de Gestão de Resíduos Perigosos — LGRP
          </p>
          <p className="text-[11px] text-ink-500">Pró-Reitoria de Pesquisa · Departamento de Química</p>
        </div>
        <div className="text-right text-[11px] text-ink-600">
          <p className="text-[14px] font-bold text-ink-900">RELATÓRIO DE GESTÃO DE RESÍDUOS QUÍMICOS</p>
          <p>Período: {fmtData(de)} a {fmtData(ate)}</p>
          <p>Emitido em: {fmtDataHora(geradoEm)}</p>
          <p>Responsável: {perfil?.nome || '—'} ({perfil?.papel || '—'})</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-600">
        <strong>Módulos incluídos:</strong> {modulos.join(' · ')}
      </p>
    </div>
  );
}
