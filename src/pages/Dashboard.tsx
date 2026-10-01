import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Beaker,
  Bell,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  FlaskConical,
  Gauge,
  PackageCheck,
  Plus,
  Recycle,
  RefreshCw,
  Scale,
  ShieldAlert,
  TestTubes,
  Truck,
  Wine,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import { fmtCompacto, fmtInt, fmtMoeda, fmtNum, fmtRelativo } from '../lib/utils';
import { PALETA } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Button, Card, CardHeader, ErrorState, PageHeader } from '../components/ui';
import { ChartTooltip, LegendaLista, RankingBarras, StatCard } from '../components/widgets';

export default function Dashboard() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { perfil } = useAuth();
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await apiGet('/api/dashboard');
      setDados(r);
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const k = dados?.kpis || {};
  const g = dados?.graficos || {};
  const serie = dados?.serie || [];

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const tipoComCores = (g.porTipo || []).slice(0, 8).map((d: any, i: number) => ({
    ...d,
    cor: PALETA[i % PALETA.length],
  }));
  const totalTipo = tipoComCores.reduce((s: number, d: any) => s + d.valor, 0);

  const riscoComCores = (g.reagentesPorRisco || []).map((d: any, i: number) => ({
    ...d,
    cor: PALETA[(i + 3) % PALETA.length],
  }));
  const totalRisco = riscoComCores.reduce((s: number, d: any) => s + d.valor, 0);

  const metodoDados = (g.porMetodo || []).slice(0, 8);

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Dashboard" subtitulo="Visão geral da gestão de resíduos do LGRP" />
        <ErrorState mensagem={erro} onRetry={carregar} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`${saudacao}, ${primeiroNome(perfil?.nome || 'usuário')}`}
        subtitulo={`Painel operacional do Laboratório de Gestão de Resíduos Perigosos · atualizado ${
          dados ? fmtRelativo(dados.gerado_em) : '—'
        }`}
        icone={<Gauge className="h-5.5 w-5.5" />}
        acoes={
          <>
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={carregar}
            >
              Atualizar
            </Button>
            <Button size="md" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/pedidos?novo=1')}>
              Novo pedido de coleta
            </Button>
          </>
        }
      />

      {/* Faixa de alertas críticos */}
      {!loading && k.alertas_criticos > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-brick-200 bg-gradient-to-r from-brick-50 to-white px-4 py-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brick-100 text-brick-600">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
          <p className="flex-1 text-sm text-brick-800">
            <span className="font-semibold">{k.alertas_criticos} alerta(s) crítico(s)</span> exigem
            ação imediata — reagentes vencidos, coletas atrasadas ou contaminação crítica de
            vidrarias.
          </p>
          <Link
            to="/notificacoes"
            className="flex items-center gap-1 text-xs font-semibold text-brick-700 hover:text-brick-900"
          >
            Revisar agora <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          carregando={loading}
          icone={<ClipboardList className="h-4.5 w-4.5" />}
          rotulo="Pedidos de coleta"
          valor={fmtInt(k.total_pedidos)}
          tone="verde"
          detalhe={`${fmtInt(k.pedidos_abertos)} em aberto · ${fmtInt(
            k.pedidos_em_tratamento
          )} em tratamento`}
          onClick={() => navigate('/pedidos')}
        />
        <StatCard
          carregando={loading}
          icone={<Scale className="h-4.5 w-4.5" />}
          rotulo="Resíduos coletados"
          valor={fmtCompacto(k.kg_coletados)}
          sufixo="kg"
          tone="azul"
          detalhe={`${fmtNum(k.l_coletados)} L em volume · ${fmtInt(k.coletas_realizadas)} coletas`}
          onClick={() => navigate('/pedidos')}
        />
        <StatCard
          carregando={loading}
          icone={<Recycle className="h-4.5 w-4.5" />}
          rotulo="Resíduos tratados"
          valor={fmtCompacto(k.kg_tratados)}
          sufixo="kg"
          tone="ciano"
          detalhe={`${fmtInt(k.tratamentos_concluidos)} de ${fmtInt(
            k.tratamentos_total
          )} tratamentos concluídos`}
          onClick={() => navigate('/tratamentos')}
        />
        <StatCard
          carregando={loading}
          icone={<TestTubes className="h-4.5 w-4.5" />}
          rotulo="Reagentes vencidos"
          valor={fmtInt(k.reagentes_vencidos)}
          tone={k.reagentes_vencidos > 0 ? 'vermelho' : 'verde'}
          detalhe={`${fmtInt(k.reagentes_a_vencer)} vencem nos próximos 30 dias`}
          onClick={() => navigate('/reagentes')}
        />
        <StatCard
          carregando={loading}
          icone={<Wine className="h-4.5 w-4.5" />}
          rotulo="Solventes orgânicos"
          valor={fmtCompacto(k.solventes_litros_estoque)}
          sufixo="L"
          tone="ambar"
          detalhe={`${fmtInt(k.solventes_halogenados)} halogenados · ${fmtNum(
            k.solventes_halogenados_litros
          )} L`}
          onClick={() => navigate('/solventes')}
        />
        <StatCard
          carregando={loading}
          icone={<FlaskConical className="h-4.5 w-4.5" />}
          rotulo="Vidrarias contaminadas"
          valor={fmtInt(k.vidrarias_pendentes)}
          tone="roxo"
          detalhe={`${fmtInt(k.vidrarias_unidades_pendentes)} unidades aguardando descontaminação`}
          onClick={() => navigate('/vidrarias')}
        />
        <StatCard
          carregando={loading}
          icone={<PackageCheck className="h-4.5 w-4.5" />}
          rotulo="Solventes recuperados"
          valor={fmtCompacto(k.l_recuperados)}
          sufixo="L"
          tone="verde"
          detalhe="Recuperação por destilação no próprio LGRP"
          onClick={() => navigate('/solventes')}
        />
        <StatCard
          carregando={loading}
          icone={<Truck className="h-4.5 w-4.5" />}
          rotulo="Pedidos destinados"
          valor={fmtInt(k.pedidos_destinados)}
          tone="azul"
          progresso={{ valor: k.pedidos_destinados || 0, max: k.total_pedidos || 1, tone: 'azul' }}
          detalhe={`${fmtInt(k.total_pedidos || 0)} pedidos registrados no total`}
          onClick={() => navigate('/pedidos')}
        />
        <StatCard
          carregando={loading}
          icone={<ShieldAlert className="h-4.5 w-4.5" />}
          rotulo="Destinação correta"
          valor={fmtNum(k.taxa_destinacao, 1)}
          sufixo="%"
          tone={k.taxa_destinacao >= 95 ? 'verde' : k.taxa_destinacao >= 80 ? 'ambar' : 'vermelho'}
          progresso={{
            valor: k.taxa_destinacao || 0,
            max: 100,
            tone: k.taxa_destinacao >= 95 ? 'verde' : k.taxa_destinacao >= 80 ? 'ambar' : 'vermelho',
          }}
          detalhe="Meta institucional: ≥ 98%"
          onClick={() => navigate('/indicadores')}
        />
        <StatCard
          carregando={loading}
          icone={<CircleDollarSign className="h-4.5 w-4.5" />}
          rotulo="Custo de destinação"
          valor={fmtMoeda(k.custo_total).replace('R$', '').trim()}
          sufixo="R$"
          tone="cinza"
          detalhe={`${fmtInt(k.alertas_abertos)} alertas ativos no sistema`}
          onClick={() => navigate('/relatorios')}
        />
      </div>

      {/* Gráfico principal + pizza */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            titulo="Evolução mensal de resíduos"
            subtitulo="Últimos 12 meses — massa coletada (kg) × massa tratada (kg)"
            icone={<Activity className="h-4.5 w-4.5" />}
            acao={
              <div className="flex items-center gap-3 text-[11px] text-ink-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-lagoon-500" /> Coletado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-forest-600" /> Tratado
                </span>
              </div>
            }
          />
          <div className="h-[290px] w-full">
            {loading ? (
              <div className="skeleton h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gColet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2484b4" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2484b4" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gTrat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f6e4f" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1f6e4f" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" vertical={false} />
                  <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: '#d2dbd7' }} dy={6} />
                  <YAxis tickLine={false} axisLine={false} width={54} />
                  <Tooltip content={<ChartTooltip sufixo="kg" />} cursor={{ stroke: '#adbcb6' }} />
                  <Area
                    type="monotone"
                    dataKey="kg_coletados"
                    name="Coletado (kg)"
                    stroke="#2484b4"
                    strokeWidth={2.2}
                    fill="url(#gColet)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kg_tratados"
                    name="Tratado (kg)"
                    stroke="#1f6e4f"
                    strokeWidth={2.2}
                    fill="url(#gTrat)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo="Resíduos por tipo"
            subtitulo="Distribuição das quantidades registradas"
            icone={<Beaker className="h-4.5 w-4.5" />}
          />
          {loading ? (
            <div className="skeleton h-[190px] w-full rounded-lg" />
          ) : (
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tipoComCores}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {tipoComCores.map((d: any, i: number) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 border-t border-ink-100 pt-3">
            <LegendaLista dados={tipoComCores} total={totalTipo} />
          </div>
        </Card>
      </div>

      {/* Métodos de tratamento + status dos pedidos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            titulo="Tratamentos por método"
            subtitulo="Massa processada por tecnologia de tratamento"
            icone={<Recycle className="h-4.5 w-4.5" />}
            acao={
              <Link to="/tratamentos" className="text-xs font-medium text-forest-700 hover:underline">
                Ver módulo
              </Link>
            }
          />
          <div className="h-[260px] w-full">
            {loading ? (
              <div className="skeleton h-full w-full rounded-lg" />
            ) : metodoDados.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metodoDados} margin={{ top: 6, right: 8, left: -18, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tickLine={false}
                    axisLine={{ stroke: '#d2dbd7' }}
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={62}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tickLine={false} axisLine={false} width={54} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(31,110,79,0.06)' }} />
                  <Bar dataKey="valor" name="Quantidade" radius={[5, 5, 0, 0]} maxBarSize={44}>
                    {metodoDados.map((_: any, i: number) => (
                      <Cell key={i} fill={PALETA[i % PALETA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-ink-400">
                Nenhum tratamento registrado.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            titulo="Pedidos por status"
            subtitulo="Situação atual do fluxo de coleta"
            icone={<CalendarClock className="h-4.5 w-4.5" />}
            acao={
              <Link to="/pedidos" className="text-xs font-medium text-forest-700 hover:underline">
                Ver módulo
              </Link>
            }
          />
          <div className="h-[260px] w-full">
            {loading ? (
              <div className="skeleton h-full w-full rounded-lg" />
            ) : (g.pedidosPorStatus || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={g.pedidosPorStatus}
                  layout="vertical"
                  margin={{ top: 6, right: 24, left: 8, bottom: 6 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edeb" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    tickLine={false}
                    axisLine={false}
                    width={104}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<ChartTooltip sufixo="pedidos" />} cursor={{ fill: 'rgba(31,110,79,0.06)' }} />
                  <Bar dataKey="valor" name="Pedidos" radius={[0, 5, 5, 0]} maxBarSize={22}>
                    {(g.pedidosPorStatus || []).map((d: any, i: number) => (
                      <Cell key={i} fill={corStatus(d.nome)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-ink-400">
                Nenhum pedido registrado.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Laboratórios + risco + alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            titulo="Principais geradores"
            subtitulo="Massa coletada por laboratório (kg)"
            icone={<FlaskConical className="h-4.5 w-4.5" />}
          />
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-6 rounded" />
              ))}
            </div>
          ) : (
            <RankingBarras dados={(g.coletasPorLaboratorio || []).slice(0, 7)} sufixo=" kg" />
          )}
        </Card>

        <Card>
          <CardHeader
            titulo="Reagentes por classe de risco"
            subtitulo="Inventário do banco de reagentes"
            icone={<TestTubes className="h-4.5 w-4.5" />}
            acao={
              <Link to="/reagentes" className="text-xs font-medium text-forest-700 hover:underline">
                Ver banco
              </Link>
            }
          />
          {loading ? (
            <div className="skeleton h-[150px] w-full rounded-lg" />
          ) : (
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riscoComCores}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {riscoComCores.map((d: any, i: number) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 border-t border-ink-100 pt-3">
            <LegendaLista dados={riscoComCores} total={totalRisco} />
          </div>
        </Card>

        <Card padding={false} className="flex flex-col">
          <div className="p-5 pb-3">
            <CardHeader
              titulo="Alertas prioritários"
              subtitulo={`${k.alertas_abertos || 0} não lidos`}
              icone={<Bell className="h-4.5 w-4.5" />}
              acao={
                <Link to="/notificacoes" className="text-xs font-medium text-forest-700 hover:underline">
                  Ver todos
                </Link>
              }
            />
          </div>
          <div className="max-h-[330px] flex-1 overflow-y-auto px-5 pb-3">
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : (dados?.alertas || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <ShieldAlert className="mb-2 h-7 w-7 text-forest-400" />
                <p className="text-sm font-medium text-ink-700">Nenhum alerta pendente</p>
                <p className="mt-0.5 text-[11px] text-ink-500">Operação dentro da normalidade.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {dados.alertas.slice(0, 8).map((n: any) => (
                  <li
                    key={n.id}
                    className="rounded-lg border border-ink-200/80 bg-ink-50/40 p-3 transition hover:border-ink-300 hover:bg-white"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.severidade === 'critica'
                            ? 'bg-brick-500'
                            : n.severidade === 'aviso'
                            ? 'bg-clay-400'
                            : n.severidade === 'sucesso'
                            ? 'bg-forest-500'
                            : 'bg-lagoon-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-snug text-ink-900">{n.titulo}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-500">
                          {n.mensagem}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-400">{fmtRelativo(n.criado_em)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Atividade recente */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
              <Activity className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">
                Atividade recente
              </h3>
              <p className="mt-0.5 text-xs text-ink-500">
                Trilha de auditoria das últimas alterações registradas no sistema
              </p>
            </div>
          </div>
          <Link to="/rastreabilidade">
            <Button variant="secondary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              Rastreabilidade completa
            </Button>
          </Link>
        </div>
        <div className="px-5 py-4">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-11 rounded-lg" />
              ))}
            </div>
          ) : (dados?.atividade || []).length === 0 ? (
            <p className="py-8 text-center text-xs text-ink-400">
              Nenhuma alteração registrada até o momento.
            </p>
          ) : (
            <ul className="space-y-1">
              {dados.atividade.slice(0, 8).map((h: any) => (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2.5 py-2 transition hover:bg-ink-50"
                >
                  <Badge tone={h.acao === 'INSERT' ? 'verde' : h.acao === 'DELETE' ? 'vermelho' : 'azul'}>
                    {h.acao === 'INSERT' ? 'Criação' : h.acao === 'DELETE' ? 'Exclusão' : 'Alteração'}
                  </Badge>
                  <span className="text-[13px] text-ink-700">{h.descricao}</span>
                  <span className="ml-auto flex items-center gap-2 text-[11px] text-ink-400">
                    <span className="hidden sm:inline">{h.usuario}</span>
                    <span>·</span>
                    <span>{fmtRelativo(h.criado_em)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Faixa de resumo normativo */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <MiniResumo
          icone={<AlertTriangle className="h-4 w-4" />}
          rotulo="Acidentes registrados"
          valor="0"
          nota="no período corrente"
          tone="verde"
        />
        <MiniResumo
          icone={<Wine className="h-4 w-4" />}
          rotulo="Solventes em estoque"
          valor={`${fmtInt(k.solventes_total || 0)}`}
          nota={`${fmtNum(k.solventes_litros_total || 0)} L adquiridos`}
          tone="ambar"
        />
        <MiniResumo
          icone={<Recycle className="h-4 w-4" />}
          rotulo="Tratamentos em andamento"
          valor={`${fmtInt(k.tratamentos_andamento || 0)}`}
          nota="processos ativos no LGRP"
          tone="azul"
        />
        <MiniResumo
          icone={<PackageCheck className="h-4 w-4" />}
          rotulo="Vidrarias reaproveitadas"
          valor={`${fmtInt(k.vidrarias_descontaminadas || 0)}`}
          nota="retornaram ao uso laboratorial"
          tone="ciano"
        />
      </div>
    </div>
  );
}

function MiniResumo({
  icone,
  rotulo,
  valor,
  nota,
  tone,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
  nota: string;
  tone: 'verde' | 'ambar' | 'azul' | 'ciano';
}) {
  const cores: Record<string, string> = {
    verde: 'bg-forest-50 text-forest-700 border-forest-200',
    ambar: 'bg-clay-50 text-clay-700 border-clay-200',
    azul: 'bg-lagoon-50 text-lagoon-700 border-lagoon-200',
    ciano: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 bg-white p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cores[tone]}`}>
        {icone}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
        <p className="font-display text-lg font-bold leading-tight text-ink-900">{valor}</p>
        <p className="truncate text-[10.5px] text-ink-400">{nota}</p>
      </div>
    </div>
  );
}

function corStatus(s: string) {
  const m: Record<string, string> = {
    Solicitado: '#e39434',
    Agendado: '#2484b4',
    Coletado: '#0f9b8e',
    'Em Tratamento': '#7c5cbf',
    Destinado: '#1f6e4f',
    Cancelado: '#adbcb6',
  };
  return m[s] || '#1f6e4f';
}

function primeiroNome(nome: string) {
  const p = (nome || '').trim().split(/\s+/)[0];
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : 'usuário';
}
