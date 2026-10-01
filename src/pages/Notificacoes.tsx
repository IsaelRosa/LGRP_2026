import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Info,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import { fmtDataHora, fmtRelativo } from '../lib/utils';
import { SEVERIDADE_LABEL, SEVERIDADE_TONE } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  ErrorState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui';

const ICONES: Record<string, React.ReactNode> = {
  critica: <ShieldAlert className="h-4.5 w-4.5" />,
  aviso: <AlertTriangle className="h-4.5 w-4.5" />,
  sucesso: <CheckCircle2 className="h-4.5 w-4.5" />,
  info: <Info className="h-4.5 w-4.5" />,
};

const FUNDOS: Record<string, string> = {
  critica: 'bg-brick-50 text-brick-700 border-brick-200',
  aviso: 'bg-clay-50 text-clay-700 border-clay-200',
  sucesso: 'bg-forest-50 text-forest-700 border-forest-200',
  info: 'bg-lagoon-50 text-lagoon-700 border-lagoon-200',
};

const TIPOS = [
  'Reagente vencido',
  'Reagente a vencer',
  'Solvente vencido',
  'Estoque baixo',
  'Coleta atrasada',
  'Pedido pendente',
  'Prioridade crítica',
  'Contaminação crítica',
  'Tratamento prolongado',
  'Status atualizado',
  'Aviso',
];

export default function Notificacoes() {
  const { podeEditar } = useAuth();
  const { toast } = useToast();

  const [itens, setItens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fSeveridade, setFSeveridade] = useState('todos');
  const [fTipo, setFTipo] = useState('todos');
  const [fLida, setFLida] = useState('false');
  const [excluir, setExcluir] = useState<any>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensagem: '', severidade: 'aviso', tipo: 'Aviso' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const qs = new URLSearchParams();
      if (fSeveridade !== 'todos') qs.set('severidade', fSeveridade);
      if (fTipo !== 'todos') qs.set('tipo', fTipo);
      if (fLida !== 'todos') qs.set('lida', fLida);
      const r = await apiGet<any[]>(`/api/notificacoes?${qs.toString()}`);
      setItens(Array.isArray(r) ? r : []);
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }, [fSeveridade, fTipo, fLida]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const agrupadas = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    itens.forEach((n) => {
      const d = new Date(n.criado_em).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      if (!grupos[d]) grupos[d] = [];
      grupos[d].push(n);
    });
    return Object.entries(grupos);
  }, [itens]);

  async function marcarLida(n: any, lida: boolean) {
    setItens((p) => p.map((x) => (x.id === n.id ? { ...x, lida } : x)));
    try {
      await apiPut('/api/notificacoes', { id: n.id, lida });
    } catch (e: any) {
      toast('erro', 'Erro ao atualizar', e?.message);
      carregar();
    }
  }

  async function marcarTodas(lida: boolean) {
    try {
      await apiPut('/api/notificacoes', { todas: true, lida });
      toast('sucesso', lida ? 'Tudo marcado como lido' : 'Tudo marcado como não lido');
      carregar();
    } catch (e: any) {
      toast('erro', 'Erro ao atualizar', e?.message);
    }
  }

  async function confirmarExclusao() {
    try {
      await apiDelete('/api/notificacoes', excluir.id);
      toast('sucesso', 'Notificação removida');
      setExcluir(null);
      carregar();
    } catch (e: any) {
      toast('erro', 'Erro ao excluir', e?.message);
    }
  }

  async function criarManual() {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = 'Informe um título para o alerta.';
    if (!form.mensagem.trim()) e.mensagem = 'Descreva a mensagem do alerta.';
    setErros(e);
    if (Object.keys(e).length) return;
    setSalvando(true);
    try {
      await apiPost('/api/notificacoes', form);
      toast('sucesso', 'Alerta publicado', 'A notificação foi enviada à central de alertas.');
      setModalNovo(false);
      setForm({ titulo: '', mensagem: '', severidade: 'aviso', tipo: 'Aviso' });
      carregar();
    } catch (err: any) {
      toast('erro', 'Erro ao publicar', err?.message);
    } finally {
      setSalvando(false);
    }
  }

  const contagem = useMemo(() => {
    const c: Record<string, number> = { critica: 0, aviso: 0, info: 0, sucesso: 0 };
    itens.forEach((n) => {
      if (c[n.severidade] !== undefined) c[n.severidade] += 1;
    });
    return c;
  }, [itens]);

  if (erro) {
    return (
      <div>
        <PageHeader titulo="Central de Notificações" icone={<Bell className="h-5.5 w-5.5" />} />
        <ErrorState mensagem={erro} onRetry={carregar} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Central de Notificações"
        subtitulo="Alertas gerados automaticamente pelo motor de regras do LGRP — reagentes vencidos, coletas atrasadas, estoque baixo e contaminações críticas — além de comunicados manuais da equipe."
        icone={<Bell className="h-5.5 w-5.5" />}
        acoes={
          <>
            <Button variant="secondary" icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />} onClick={carregar}>
              Atualizar
            </Button>
            <Button variant="secondary" icon={<CheckCheck className="h-4 w-4" />} onClick={() => marcarTodas(true)}>
              Marcar todas como lidas
            </Button>
            {podeEditar && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalNovo(true)}>
                Novo alerta
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CelulaContagem rotulo="Críticas" valor={contagem.critica} tone="vermelho" icone={<ShieldAlert className="h-4 w-4" />} />
        <CelulaContagem rotulo="Avisos" valor={contagem.aviso} tone="ambar" icone={<AlertTriangle className="h-4 w-4" />} />
        <CelulaContagem rotulo="Informativas" valor={contagem.info} tone="azul" icone={<Info className="h-4 w-4" />} />
        <CelulaContagem rotulo="Concluídas" valor={contagem.sucesso} tone="verde" icone={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card padding={false}>
        <div className="grid grid-cols-1 gap-3 border-b border-ink-200 bg-ink-50/50 px-4 py-4 sm:grid-cols-3">
          <Field label="Severidade">
            <Select value={fSeveridade} onChange={(e) => setFSeveridade(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="critica">Crítica</option>
              <option value="aviso">Aviso</option>
              <option value="info">Informação</option>
              <option value="sucesso">Sucesso</option>
            </Select>
          </Field>
          <Field label="Tipo de alerta">
            <Select value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
              <option value="todos">Todos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Situação de leitura">
            <Select value={fLida} onChange={(e) => setFLida(e.target.value)}>
              <option value="false">Não lidas</option>
              <option value="true">Lidas</option>
              <option value="todos">Todas</option>
            </Select>
          </Field>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-500">
                <BellOff className="h-6 w-6" />
              </span>
              <p className="font-display text-sm font-semibold text-ink-800">Nenhuma notificação neste filtro</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
                O motor de regras reavalia os módulos operacionais a cada acesso ao painel e publica
                alertas automaticamente quando algum parâmetro sai da normalidade.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {agrupadas.map(([dia, lista]) => (
                <div key={dia}>
                  <p className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                    <span className="h-px w-4 bg-ink-300" />
                    {dia === new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' }) ? 'Hoje' : dia}
                    <span className="font-normal normal-case text-ink-400">· {lista.length} alerta(s)</span>
                  </p>
                  <ul className="space-y-2.5">
                    {lista.map((n) => (
                      <motion.li
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3.5 rounded-xl border p-4 transition ${
                          n.lida
                            ? 'border-ink-200/70 bg-white/60'
                            : n.severidade === 'critica'
                            ? 'border-brick-200 bg-brick-50/40'
                            : 'border-ink-200 bg-white'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            FUNDOS[n.severidade] || FUNDOS.info
                          }`}
                        >
                          {ICONES[n.severidade] || ICONES.info}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={SEVERIDADE_TONE[n.severidade] || 'cinza'}>
                              {SEVERIDADE_LABEL[n.severidade] || n.severidade}
                            </Badge>
                            <Badge tone="cinza">{n.tipo}</Badge>
                            {n.lida && <span className="text-[10.5px] text-ink-400">lida</span>}
                            {n.origem && (
                              <span className="font-mono text-[10.5px] text-ink-400">
                                {n.origem}#{n.origem_id}
                              </span>
                            )}
                          </div>
                          <p className={`mt-1.5 text-[13.5px] leading-snug ${n.lida ? 'text-ink-600' : 'font-semibold text-ink-900'}`}>
                            {n.titulo}
                          </p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{n.mensagem}</p>
                          <p className="mt-1.5 text-[11px] text-ink-400" title={fmtDataHora(n.criado_em)}>
                            {fmtRelativo(n.criado_em)} · {fmtDataHora(n.criado_em)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <button
                            onClick={() => marcarLida(n, !n.lida)}
                            title={n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-forest-50 hover:text-forest-700"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </button>
                          {podeEditar && (
                            <button
                              onClick={() => setExcluir(n)}
                              title="Excluir notificação"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-brick-50 hover:text-brick-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        aberto={modalNovo}
        onFechar={() => setModalNovo(false)}
        titulo="Publicar novo alerta"
        subtitulo="O alerta será exibido a todos os usuários na central de notificações."
        largura="max-w-xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setModalNovo(false)}>
              Cancelar
            </Button>
            <Button loading={salvando} onClick={criarManual}>
              Publicar alerta
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Severidade">
              <Select value={form.severidade} onChange={(e) => setForm({ ...form, severidade: e.target.value })}>
                <option value="critica">Crítica</option>
                <option value="aviso">Aviso</option>
                <option value="info">Informação</option>
                <option value="sucesso">Sucesso</option>
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Título" obrigatorio erro={erros.titulo}>
            <Input
              value={form.titulo}
              invalid={!!erros.titulo}
              placeholder="Ex.: Manutenção programada no abrigo de resíduos"
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </Field>
          <Field label="Mensagem" obrigatorio erro={erros.mensagem}>
            <Textarea
              value={form.mensagem}
              invalid={!!erros.mensagem}
              placeholder="Descreva a orientação, o prazo e a ação esperada dos laboratórios..."
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        aberto={!!excluir}
        onFechar={() => setExcluir(null)}
        onConfirmar={confirmarExclusao}
        titulo="Excluir notificação"
        mensagem={`Deseja excluir a notificação "${excluir?.titulo || ''}"?`}
        rotuloConfirmar="Excluir"
      />
    </div>
  );
}

function CelulaContagem({
  rotulo,
  valor,
  tone,
  icone,
}: {
  rotulo: string;
  valor: number;
  tone: 'vermelho' | 'ambar' | 'azul' | 'verde';
  icone: React.ReactNode;
}) {
  const cores: Record<string, string> = {
    vermelho: 'bg-brick-50 text-brick-700 border-brick-200',
    ambar: 'bg-clay-50 text-clay-700 border-clay-200',
    azul: 'bg-lagoon-50 text-lagoon-700 border-lagoon-200',
    verde: 'bg-forest-50 text-forest-700 border-forest-200',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 bg-white px-4 py-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${cores[tone]}`}>
        {icone}
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
        <p className="font-display text-xl font-bold leading-tight text-ink-900">{valor}</p>
      </div>
    </div>
  );
}
