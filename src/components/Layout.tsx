import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Beaker,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  Search,
  ShieldCheck,
  TestTubes,
  Trash2,
  Users,
  Wine,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiGet, apiPut } from '../lib/api';
import { fmtRelativo } from '../lib/utils';
import { SEVERIDADE_LABEL, SEVERIDADE_TONE } from '../lib/constants';
import { Badge, Button } from './ui';

type ItemNav = { to: string; label: string; icone: ReactNode; badge?: number };
type GrupoNav = { titulo: string; itens: ItemNav[] };

const MARCA = {
  nome: 'LGRP',
  extenso: 'Laboratório de Gestão de Resíduos Perigosos',
  org: 'Universidade Pública Federal · Pró-Reitoria de Pesquisa',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { perfil, signOut, user } = useAuth();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [sinoAberto, setSinoAberto] = useState(false);
  const [contaAberto, setContaAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [carregandoNotif, setCarregandoNotif] = useState(true);

  const carregarNotificacoes = async () => {
    setCarregandoNotif(true);
    try {
      const r = await apiGet<any[]>('/api/notificacoes?lida=false');
      setNotificacoes(Array.isArray(r) ? r : []);
    } catch {
      setNotificacoes([]);
    } finally {
      setCarregandoNotif(false);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    const t = window.setInterval(carregarNotificacoes, 90000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setMenuAberto(false);
    setSinoAberto(false);
    setContaAberto(false);
  }, [location.pathname]);

  const naoLidas = notificacoes.length;
  const criticas = notificacoes.filter((n) => n.severidade === 'critica').length;

  const grupos: GrupoNav[] = [
    {
      titulo: 'Visão geral',
      itens: [
        { to: '/', label: 'Dashboard', icone: <LayoutDashboard className="h-4.5 w-4.5" /> },
        { to: '/indicadores', label: 'Indicadores Mensais', icone: <Gauge className="h-4.5 w-4.5" /> },
      ],
    },
    {
      titulo: 'Operação',
      itens: [
        {
          to: '/pedidos',
          label: 'Pedidos & Coletas',
          icone: <ClipboardList className="h-4.5 w-4.5" />,
        },
        { to: '/tratamentos', label: 'Tratamento de Resíduos', icone: <Recycle className="h-4.5 w-4.5" /> },
        { to: '/solventes', label: 'Controle de Solventes', icone: <Wine className="h-4.5 w-4.5" /> },
        { to: '/reagentes', label: 'Banco de Reagentes', icone: <TestTubes className="h-4.5 w-4.5" /> },
        { to: '/vidrarias', label: 'Vidrarias Contaminadas', icone: <FlaskConical className="h-4.5 w-4.5" /> },
      ],
    },
    {
      titulo: 'Governança',
      itens: [
        { to: '/relatorios', label: 'Relatórios', icone: <BarChart3 className="h-4.5 w-4.5" /> },
        { to: '/rastreabilidade', label: 'Rastreabilidade', icone: <Activity className="h-4.5 w-4.5" /> },
        {
          to: '/notificacoes',
          label: 'Notificações',
          icone: <Bell className="h-4.5 w-4.5" />,
          badge: naoLidas,
        },
        { to: '/usuarios', label: 'Usuários', icone: <Users className="h-4.5 w-4.5" /> },
      ],
    },
  ];

  const marcarLida = async (id: number) => {
    setNotificacoes((p) => p.filter((n) => n.id !== id));
    try {
      await apiPut('/api/notificacoes', { id, lida: true });
    } catch {
      carregarNotificacoes();
    }
  };

  const marcarTodas = async () => {
    setNotificacoes([]);
    try {
      await apiPut('/api/notificacoes', { todas: true, lida: true });
    } catch {
      carregarNotificacoes();
    }
  };

  const resultadosBusca = busca.trim().length >= 2 ? filtrarBusca(busca.trim()) : [];

  const sidebar = (
    <div className="flex h-full flex-col bg-forest-950 sidebar-texture">
      {/* Marca */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 shadow-lg shadow-forest-900/40">
          <Beaker className="h-6 w-6 text-white" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-none tracking-tight text-white">
            {MARCA.nome}
          </p>
          <p className="mt-1 truncate text-[10.5px] font-medium uppercase tracking-[0.14em] text-forest-300">
            Resíduos Químicos
          </p>
        </div>
        <button
          onClick={() => setMenuAberto(false)}
          className="ml-auto rounded-lg p-1.5 text-forest-200 hover:bg-white/10 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {grupos.map((g) => (
          <div key={g.titulo}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-400/80">
              {g.titulo}
            </p>
            <ul className="space-y-0.5">
              {g.itens.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-white/12 text-white shadow-inner'
                          : 'text-forest-100/70 hover:bg-white/[0.06] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-ativo"
                            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-forest-300"
                          />
                        )}
                        <span className={isActive ? 'text-forest-300' : 'text-forest-200/60'}>
                          {item.icone}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {!!item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brick-500 px-1.5 text-[10px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé do sidebar */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 flex items-start gap-2.5 rounded-lg bg-white/[0.06] p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-300" />
          <div>
            <p className="text-[11px] font-semibold text-white">Conformidade NBR 10004</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-forest-200/70">
              Rastreabilidade completa e histórico imutável de alterações.
            </p>
          </div>
        </div>
        <p className="px-1 text-[10px] leading-relaxed text-forest-300/50">{MARCA.org}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f5f3]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block no-print">{sidebar}</aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {menuAberto && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden no-print"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuAberto(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden no-print"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Conteúdo */}
      <div className="lg:pl-[264px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/85 backdrop-blur-md no-print">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMenuAberto(true)}
              className="rounded-lg border border-ink-200 p-2 text-ink-600 transition hover:bg-ink-50 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Busca global */}
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar módulo, ação ou documento..."
                className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50/70 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-forest-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
              {resultadosBusca.length > 0 && (
                <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl shadow-ink-900/10">
                  {resultadosBusca.map((r) => (
                    <Link
                      key={r.to}
                      to={r.to}
                      onClick={() => setBusca('')}
                      className="flex items-center gap-3 border-b border-ink-100 px-3.5 py-2.5 transition last:border-0 hover:bg-forest-50"
                    >
                      <span className="text-forest-600">{r.icone}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-ink-800">{r.label}</span>
                        <span className="block text-[11px] text-ink-500">{r.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Sino */}
              <div className="relative">
                <button
                  onClick={() => {
                    setSinoAberto((v) => !v);
                    setContaAberto(false);
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
                  aria-label="Notificações"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {naoLidas > 0 && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                        criticas > 0 ? 'bg-brick-500 pulse-ring' : 'bg-clay-500'
                      }`}
                    >
                      {naoLidas > 99 ? '99+' : naoLidas}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {sinoAberto && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSinoAberto(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-12 z-20 w-[min(92vw,23rem)] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl shadow-ink-900/15"
                      >
                        <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50/70 px-4 py-3">
                          <div>
                            <p className="font-display text-sm font-semibold text-ink-900">
                              Alertas do sistema
                            </p>
                            <p className="text-[11px] text-ink-500">
                              {naoLidas} não lida{naoLidas === 1 ? '' : 's'}
                              {criticas > 0 && ` · ${criticas} crítica${criticas === 1 ? '' : 's'}`}
                            </p>
                          </div>
                          {naoLidas > 0 && (
                            <button
                              onClick={marcarTodas}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-forest-700 transition hover:bg-forest-50"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                            </button>
                          )}
                        </div>
                        <div className="max-h-[22rem] overflow-y-auto">
                          {carregandoNotif ? (
                            <div className="space-y-2 p-4">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="skeleton h-14 rounded-lg" />
                              ))}
                            </div>
                          ) : notificacoes.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                              <ShieldCheck className="mx-auto mb-2 h-7 w-7 text-forest-400" />
                              <p className="text-sm font-medium text-ink-700">Nenhum alerta pendente</p>
                              <p className="mt-0.5 text-[11px] text-ink-500">
                                Todos os parâmetros estão dentro da normalidade.
                              </p>
                            </div>
                          ) : (
                            notificacoes.slice(0, 12).map((n) => (
                              <div
                                key={n.id}
                                className="flex gap-3 border-b border-ink-100 px-4 py-3 transition last:border-0 hover:bg-ink-50/60"
                              >
                                <span
                                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                    n.severidade === 'critica'
                                      ? 'bg-brick-500'
                                      : n.severidade === 'aviso'
                                      ? 'bg-clay-400'
                                      : n.severidade === 'sucesso'
                                      ? 'bg-forest-500'
                                      : 'bg-lagoon-400'
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-semibold leading-snug text-ink-900">
                                    {n.titulo}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-500">
                                    {n.mensagem}
                                  </p>
                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Badge tone={SEVERIDADE_TONE[n.severidade] || 'cinza'}>
                                      {SEVERIDADE_LABEL[n.severidade] || n.severidade}
                                    </Badge>
                                    <span className="text-[10.5px] text-ink-400">
                                      {fmtRelativo(n.criado_em)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => marcarLida(n.id)}
                                  className="h-fit rounded p-1 text-ink-300 transition hover:bg-ink-100 hover:text-ink-600"
                                  aria-label="Marcar como lida"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <Link
                          to="/notificacoes"
                          className="block border-t border-ink-200 bg-ink-50/70 px-4 py-2.5 text-center text-xs font-medium text-forest-700 transition hover:bg-forest-50"
                        >
                          Ver central de notificações
                        </Link>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Conta */}
              <div className="relative">
                <button
                  onClick={() => {
                    setContaAberto((v) => !v);
                    setSinoAberto(false);
                  }}
                  className="flex items-center gap-2.5 rounded-lg border border-ink-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:bg-ink-50"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-forest-600 to-forest-800 text-[11px] font-bold text-white">
                    {iniciais(perfil?.nome || user?.email || 'LGRP')}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[9rem] truncate text-xs font-semibold capitalize text-ink-800">
                      {perfil?.nome || user?.email || 'Usuário'}
                    </span>
                    <span className="block text-[10px] text-ink-500">{perfil?.papel || '—'}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
                </button>

                <AnimatePresence>
                  {contaAberto && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setContaAberto(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-12 z-20 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl shadow-ink-900/15"
                      >
                        <div className="border-b border-ink-100 bg-gradient-to-br from-forest-50 to-white px-4 py-3.5">
                          <p className="truncate text-sm font-semibold capitalize text-ink-900">
                            {perfil?.nome || 'Usuário'}
                          </p>
                          <p className="truncate text-[11px] text-ink-500">{perfil?.email}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge tone="verde">{perfil?.papel || 'Consultor'}</Badge>
                            {perfil?.crq && <Badge tone="cinza">CRQ {perfil.crq}</Badge>}
                          </div>
                        </div>
                        <div className="p-1.5">
                          <Link
                            to="/usuarios"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50"
                          >
                            <Users className="h-4 w-4 text-ink-400" /> Gerenciar usuários
                          </Link>
                          <Link
                            to="/rastreabilidade"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-700 transition hover:bg-ink-50"
                          >
                            <Activity className="h-4 w-4 text-ink-400" /> Minha trilha de auditoria
                          </Link>
                          <button
                            onClick={signOut}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-brick-600 transition hover:bg-brick-50"
                          >
                            <LogOut className="h-4 w-4" /> Encerrar sessão
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1500px] print-full">{children}</div>
        </main>

        <footer className="border-t border-ink-200 bg-white/60 px-4 py-5 text-center sm:px-6 no-print">
          <p className="text-[11px] leading-relaxed text-ink-500">
            <span className="font-semibold text-ink-700">{MARCA.extenso}</span> · Sistema de Gestão de
            Resíduos Químicos · {MARCA.org}
          </p>
          <p className="mt-1 text-[10.5px] text-ink-400">
            Em conformidade com a NBR 10004, RDC ANVISA nº 222/2018 e CONAMA nº 313/452 · Registro
            de alterações auditável
          </p>
        </footer>
      </div>
    </div>
  );
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '??';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const MODULOS_BUSCA = [
  { to: '/', label: 'Dashboard', desc: 'Visão geral e indicadores', icone: <LayoutDashboard className="h-4 w-4" />, palavras: 'dashboard painel inicio indicadores kpi' },
  { to: '/pedidos', label: 'Pedidos & Coletas', desc: 'Solicitações e registros de coleta', icone: <ClipboardList className="h-4 w-4" />, palavras: 'pedido coleta solicitacao mtr' },
  { to: '/tratamentos', label: 'Tratamento de Resíduos', desc: 'Métodos, eficiência e destinação', icone: <Recycle className="h-4 w-4" />, palavras: 'tratamento incineracao neutralizacao destinacao' },
  { to: '/solventes', label: 'Controle de Solventes', desc: 'Estoque e recuperação', icone: <Wine className="h-4 w-4" />, palavras: 'solvente halogenado alcool acetona destilacao' },
  { to: '/reagentes', label: 'Banco de Reagentes', desc: 'Validade e classes de risco', icone: <TestTubes className="h-4 w-4" />, palavras: 'reagente vencido validade lote cas' },
  { to: '/vidrarias', label: 'Vidrarias Contaminadas', desc: 'Descontaminação e reaproveitamento', icone: <FlaskConical className="h-4 w-4" />, palavras: 'vidraria bequer contaminacao descontaminacao' },
  { to: '/indicadores', label: 'Indicadores Mensais', desc: 'Série histórica e metas', icone: <Gauge className="h-4 w-4" />, palavras: 'indicador mensal metrica acidente treinamento' },
  { to: '/relatorios', label: 'Relatórios', desc: 'Gerador personalizável e exportação', icone: <BarChart3 className="h-4 w-4" />, palavras: 'relatorio exportar csv imprimir' },
  { to: '/rastreabilidade', label: 'Rastreabilidade', desc: 'Trilha de auditoria completa', icone: <Activity className="h-4 w-4" />, palavras: 'rastreabilidade auditoria historico log' },
  { to: '/notificacoes', label: 'Notificações', desc: 'Central de alertas', icone: <Bell className="h-4 w-4" />, palavras: 'notificacao alerta aviso' },
  { to: '/usuarios', label: 'Usuários', desc: 'Perfis e permissões', icone: <Users className="h-4 w-4" />, palavras: 'usuario perfil permissao papel' },
];

function filtrarBusca(termo: string) {
  const t = termo.toLowerCase();
  return MODULOS_BUSCA.filter(
    (m) => m.label.toLowerCase().includes(t) || m.palavras.includes(t) || m.desc.toLowerCase().includes(t)
  ).slice(0, 6);
}

export { MARCA };
