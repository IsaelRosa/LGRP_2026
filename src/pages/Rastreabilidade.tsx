import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ChevronDown,
  Download,
  Filter,
  History,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Pencil,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import { baixarCSV, fmtDataHora, fmtRelativo } from '../lib/utils';
import { ACAO_LABEL, ACAO_TONE, rotuloCampo } from '../lib/constants';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  Select,
} from '../components/ui';

const CORES_ACAO: Record<string, string> = {
  INSERT: 'bg-forest-500',
  UPDATE: 'bg-lagoon-500',
  DELETE: 'bg-brick-500',
};

export default function Rastreabilidade() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [tabela, setTabela] = useState('todos');
  const [acao, setAcao] = useState('todos');
  const [usuario, setUsuario] = useState('todos');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(true);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const qs = new URLSearchParams();
      if (tabela !== 'todos') qs.set('tabela', tabela);
      if (acao !== 'todos') qs.set('acao', acao);
      if (usuario !== 'todos') qs.set('usuario', usuario);
      if (de) qs.set('de', de);
      if (ate) qs.set('ate', ate);
      if (busca.trim()) qs.set('busca', busca.trim());
      qs.set('limit', '400');
      const r = await apiGet(`/api/historico?${qs.toString()}`);
      setDados(r);
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar a trilha de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabela, acao, usuario, de, ate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (busca.trim()) carregar();
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const itens: any[] = dados?.itens || [];

  const estatisticas = useMemo(() => {
    const total = itens.length;
    const por = { INSERT: 0, UPDATE: 0, DELETE: 0 } as Record<string, number>;
    const usuariosUnicos = new Set<string>();
    itens.forEach((i) => {
      por[i.acao] = (por[i.acao] || 0) + 1;
      if (i.usuario) usuariosUnicos.add(i.usuario);
    });
    return { total, por, usuarios: usuariosUnicos.size };
  }, [itens]);

  function limpar() {
    setTabela('todos');
    setAcao('todos');
    setUsuario('todos');
    setDe('');
    setAte('');
    setBusca('');
  }

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Rastreabilidade" icone={<Activity className="h-5.5 w-5.5" />} />
        <ErrorState mensagem={erro} onRetry={carregar} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Rastreabilidade"
        subtitulo="Trilha de auditoria imutável de todas as operações do sistema: quem alterou, quando alterou e exatamente quais campos mudaram, com valor anterior e novo."
        icone={<Activity className="h-5.5 w-5.5" />}
        acoes={
          <>
            <Button variant="secondary" icon={<RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />} onClick={carregar}>
              Atualizar
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() =>
                baixarCSV(
                  'lgrp-trilha-auditoria',
                  [
                    { key: 'criado_em', label: 'Data/Hora' },
                    { key: 'usuario', label: 'Usuário' },
                    { key: 'usuario_email', label: 'E-mail' },
                    { key: 'modulo', label: 'Módulo' },
                    { key: 'acao', label: 'Ação' },
                    { key: 'registro_codigo', label: 'Registro' },
                    { key: 'descricao', label: 'Descrição' },
                  ],
                  itens
                )
              }
            >
              Exportar auditoria
            </Button>
          </>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Celula rotulo="Eventos no filtro" valor={String(estatisticas.total)} nota="registros de auditoria" tone="cinza" />
        <Celula rotulo="Criações" valor={String(estatisticas.por.INSERT || 0)} nota="novos registros" tone="verde" />
        <Celula rotulo="Alterações" valor={String(estatisticas.por.UPDATE || 0)} nota="campos modificados" tone="azul" />
        <Celula rotulo="Exclusões" valor={String(estatisticas.por.DELETE || 0)} nota={`${estatisticas.usuarios} usuário(s) atuando`} tone="vermelho" />
      </div>

      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-ink-200 px-4 py-3">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por descrição, código ou usuário..."
            className="min-w-[220px] flex-1"
          />
          <Button
            variant={mostrarFiltros ? 'soft' : 'secondary'}
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setMostrarFiltros((v) => !v)}
          >
            Filtros
          </Button>
          <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={limpar}>
            Limpar
          </Button>
        </div>

        {mostrarFiltros && (
          <div className="grid grid-cols-2 gap-3 border-b border-ink-200 bg-ink-50/50 px-4 py-4 md:grid-cols-3 xl:grid-cols-5">
            <Field label="Módulo">
              <Select value={tabela} onChange={(e) => setTabela(e.target.value)}>
                <option value="todos">Todos os módulos</option>
                {(dados?.tabelas || []).map((t: any) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de ação">
              <Select value={acao} onChange={(e) => setAcao(e.target.value)}>
                <option value="todos">Todas</option>
                <option value="INSERT">Criação</option>
                <option value="UPDATE">Alteração</option>
                <option value="DELETE">Exclusão</option>
              </Select>
            </Field>
            <Field label="Usuário">
              <Select value={usuario} onChange={(e) => setUsuario(e.target.value)}>
                <option value="todos">Todos</option>
                {(dados?.usuarios || []).map((u: string) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="A partir de">
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </Field>
            <Field label="Até">
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </Field>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
                <History className="h-6 w-6" />
              </span>
              <p className="font-display text-sm font-semibold text-ink-800">Nenhum evento encontrado</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
                A trilha de auditoria é preenchida automaticamente a cada criação, alteração ou exclusão
                de registros nos módulos operacionais.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-2.5 border-l border-ink-200 pl-6">
              {itens.map((h) => {
                const aberto = expandido === h.id;
                const mudancas = h.mudancas ? Object.entries(h.mudancas) : [];
                return (
                  <li key={h.id} className="relative">
                    <span
                      className={`absolute -left-[31px] top-4 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-4 ring-white ${
                        CORES_ACAO[h.acao] || 'bg-ink-400'
                      }`}
                    />
                    <motion.div
                      layout
                      className={`overflow-hidden rounded-xl border bg-white transition-colors ${
                        aberto ? 'border-forest-300 shadow-md shadow-forest-900/5' : 'border-ink-200/80'
                      }`}
                    >
                      <button
                        onClick={() => setExpandido(aberto ? null : h.id)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ink-50/60"
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            h.acao === 'INSERT'
                              ? 'bg-forest-50 text-forest-700'
                              : h.acao === 'DELETE'
                              ? 'bg-brick-50 text-brick-700'
                              : 'bg-lagoon-50 text-lagoon-700'
                          }`}
                        >
                          {h.acao === 'INSERT' ? (
                            <Plus className="h-3.5 w-3.5" />
                          ) : h.acao === 'DELETE' ? (
                            <Trash2 className="h-3.5 w-3.5" />
                          ) : (
                            <Pencil className="h-3.5 w-3.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={ACAO_TONE[h.acao] || 'cinza'}>{ACAO_LABEL[h.acao] || h.acao}</Badge>
                            <Badge tone="cinza">{h.modulo}</Badge>
                            <span className="font-mono text-[11.5px] font-semibold text-forest-800">
                              {h.registro_codigo}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[13px] font-medium leading-snug text-ink-800">{h.descricao}</p>
                          <p className="mt-0.5 text-[11.5px] text-ink-500">
                            <span className="font-medium text-ink-600">{h.usuario}</span>
                            {h.usuario_email ? ` (${h.usuario_email})` : ''} · {fmtDataHora(h.criado_em)} ·{' '}
                            <span className="text-ink-400">{fmtRelativo(h.criado_em)}</span>
                          </p>
                        </div>

                        <ChevronDown
                          className={`mt-1 h-4 w-4 shrink-0 text-ink-400 transition-transform ${aberto ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {aberto && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-ink-200 bg-ink-50/50 px-4 py-4">
                              {mudancas.length > 0 ? (
                                <>
                                  <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                                    <Activity className="h-3.5 w-3.5" /> Campos alterados ({mudancas.length})
                                  </p>
                                  <div className="overflow-hidden rounded-lg border border-ink-200 bg-white">
                                    <table className="w-full border-collapse text-left">
                                      <thead>
                                        <tr className="border-b border-ink-200 bg-ink-50">
                                          <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">Campo</th>
                                          <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">Valor anterior</th>
                                          <th className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">Novo valor</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-ink-100">
                                        {mudancas.map(([campo, v]: any) => (
                                          <tr key={campo}>
                                            <td className="px-3 py-2 text-[12.5px] font-medium text-ink-700">
                                              {rotuloCampo(campo)}
                                            </td>
                                            <td className="px-3 py-2 text-[12.5px] text-brick-700">
                                              <span className="line-through decoration-brick-300">
                                                {formatarValor(v.antes)}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-[12.5px] font-semibold text-forest-800">
                                              {formatarValor(v.depois)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : h.acao === 'DELETE' ? (
                                <SnapshotBloco titulo="Dados do registro excluído" dados={h.dados_anteriores} />
                              ) : (
                                <SnapshotBloco titulo="Dados do registro criado" dados={h.dados_novos} />
                              )}

                              <div className="mt-3 flex items-start gap-2 rounded-lg border border-forest-200 bg-forest-50/70 px-3 py-2">
                                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" />
                                <p className="text-[11px] leading-relaxed text-forest-800">
                                  Evento registrado automaticamente pelo sistema. Registros de auditoria não
                                  podem ser editados nem removidos pela interface.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}

function SnapshotBloco({ titulo, dados }: { titulo: string; dados: any }) {
  if (!dados) return <p className="text-xs text-ink-400">Sem snapshot disponível.</p>;
  const entradas = Object.entries(dados).filter(
    ([k, v]) => !['criado_em', 'atualizado_em'].includes(k) && v !== null && v !== ''
  );
  return (
    <>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">{titulo}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {entradas.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-400">{rotuloCampo(k)}</p>
            <p className="truncate text-[12.5px] font-medium text-ink-800" title={String(v)}>
              {formatarValor(v)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function formatarValor(v: any) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtDataHora(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Celula({
  rotulo,
  valor,
  nota,
  tone,
}: {
  rotulo: string;
  valor: string;
  nota: string;
  tone: 'cinza' | 'verde' | 'azul' | 'vermelho';
}) {
  const cores: Record<string, string> = {
    cinza: 'text-ink-900',
    verde: 'text-forest-700',
    azul: 'text-lagoon-700',
    vermelho: 'text-brick-700',
  };
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
      <p className={`font-display text-xl font-bold leading-tight ${cores[tone]}`}>{valor}</p>
      <p className="text-[11px] text-ink-400">{nota}</p>
    </div>
  );
}
