import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  ClipboardList,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Truck,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '../lib/api';
import {
  fmtData,
  fmtDataHora,
  fmtNum,
  isoData,
  paraInputDate,
  useCrud,
  usePagination,
  useResource,
  baixarCSV,
  hojeISO,
} from '../lib/utils';
import {
  CLASSES,
  EMBALAGENS,
  GRUPOS,
  LABORATORIOS,
  PRIORIDADES,
  PRIORIDADE_TONE,
  RISCOS,
  STATUS_PEDIDO,
  STATUS_PEDIDO_TONE,
  TIPOS_RESIDUO,
  UNIDADES,
  VEICULOS,
  LOCAIS_ARMAZENAMENTO,
} from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Textarea,
  type Column,
} from '../components/ui';

const VAZIO = {
  laboratorio: '',
  solicitante: '',
  tipo_residuo: '',
  grupo: '',
  classe: '',
  quantidade_estimada: '',
  unidade: 'kg',
  embalagem: '',
  local_coleta: '',
  data_solicitacao: hojeISO(),
  data_prevista: '',
  status: 'Solicitado',
  prioridade: 'Média',
  responsavel: '',
  risco: '',
  observacoes: '',
};

const VAZIO_COLETA = {
  data_coleta: hojeISO(),
  coletor: '',
  equipe: '',
  peso_kg: '',
  volume_l: '',
  unidades: '1',
  destino_temporario: LOCAIS_ARMAZENAMENTO[0],
  veiculo: VEICULOS[0],
  mtr: '',
  observacoes: '',
};

export default function Pedidos() {
  const { podeEditar } = useAuth();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [fStatus, setFStatus] = useState('todos');
  const [fLab, setFLab] = useState('todos');
  const [fClasse, setFClasse] = useState('todos');
  const [fPrioridade, setFPrioridade] = useState('todos');
  const [fDe, setFDe] = useState('');
  const [fAte, setFAte] = useState('');
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const filtros = useMemo(
    () => ({ status: fStatus, laboratorio: fLab, classe: fClasse, prioridade: fPrioridade, de: fDe, ate: fAte }),
    [fStatus, fLab, fClasse, fPrioridade, fDe, fAte]
  );
  const { data, loading, error, reload } = useResource<any>('/api/pedidos', filtros);
  const { update, remove, saving } = useCrud('/api/pedidos', reload);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<any>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [modalColeta, setModalColeta] = useState<any>(null);
  const [formColeta, setFormColeta] = useState<any>(VAZIO_COLETA);
  const [errosColeta, setErrosColeta] = useState<Record<string, string>>({});

  const [detalhe, setDetalhe] = useState<any>(null);
  const [detalheColetas, setDetalheColetas] = useState<any[]>([]);
  const [detalheHist, setDetalheHist] = useState<any[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const [excluir, setExcluir] = useState<any>(null);

  const coletasResource = useResource<any>('/api/coletas', {});

  useEffect(() => {
    if (params.get('novo') === '1') {
      abrirNovo();
      params.delete('novo');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return data;
    return data.filter((p) =>
      [p.codigo, p.laboratorio, p.solicitante, p.tipo_residuo, p.local_coleta, p.responsavel, p.classe]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [data, busca]);

  const pag = usePagination(filtrados, 10);

  const resumo = useMemo(() => {
    const total = data.length;
    const abertos = data.filter((p) => ['Solicitado', 'Agendado'].includes(p.status)).length;
    const destinados = data.filter((p) => p.status === 'Destinado').length;
    const qtd = data.reduce((s, p) => s + Number(p.quantidade_estimada || 0), 0);
    return { total, abertos, destinados, qtd };
  }, [data]);

  function abrirNovo() {
    setEditando(null);
    setForm({ ...VAZIO, data_solicitacao: hojeISO() });
    setErros({});
    setModalAberto(true);
  }

  function abrirEdicao(row: any) {
    setEditando(row);
    setForm({
      ...VAZIO,
      ...row,
      data_solicitacao: paraInputDate(row.data_solicitacao),
      data_prevista: paraInputDate(row.data_prevista),
      quantidade_estimada: row.quantidade_estimada != null ? String(row.quantidade_estimada) : '',
    });
    setErros({});
    setModalAberto(true);
  }

  function validar() {
    const e: Record<string, string> = {};
    if (!form.laboratorio) e.laboratorio = 'Selecione o laboratório gerador.';
    if (!form.solicitante.trim()) e.solicitante = 'Informe o nome do solicitante.';
    if (!form.tipo_residuo) e.tipo_residuo = 'Selecione o tipo de resíduo.';
    if (!form.classe) e.classe = 'Selecione a classificação.';
    if (!form.quantidade_estimada || Number(form.quantidade_estimada) <= 0)
      e.quantidade_estimada = 'Informe uma quantidade maior que zero.';
    if (!form.local_coleta.trim()) e.local_coleta = 'Informe o local de coleta.';
    if (!form.data_solicitacao) e.data_solicitacao = 'Informe a data da solicitação.';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    if (!validar()) {
      toast('aviso', 'Revise o formulário', 'Há campos obrigatórios pendentes.');
      return;
    }
    const payload = {
      ...form,
      quantidade_estimada: Number(form.quantidade_estimada),
      data_solicitacao: isoData(form.data_solicitacao),
      data_prevista: isoData(form.data_prevista),
    };
    try {
      if (editando) {
        await update({ ...payload, id: editando.id });
        toast('sucesso', 'Pedido atualizado', `${editando.codigo} foi alterado com sucesso.`);
      } else {
        const r: any = await apiPost('/api/pedidos', payload);
        toast('sucesso', 'Pedido registrado', `Código gerado: ${r?.codigo || '—'}`);
      }
      setModalAberto(false);
    } catch (e: any) {
      toast('erro', 'Erro ao salvar', e?.message);
    }
  }

  async function confirmarExclusao() {
    try {
      await remove(excluir.id);
      toast('sucesso', 'Pedido excluído', `${excluir.codigo} foi removido do sistema.`);
      setExcluir(null);
    } catch (e: any) {
      toast('erro', 'Erro ao excluir', e?.message);
    }
  }

  function abrirColeta(row: any) {
    setModalColeta(row);
    setFormColeta({ ...VAZIO_COLETA, coletor: row.responsavel || '' });
    setErrosColeta({});
  }

  async function salvarColeta() {
    const e: Record<string, string> = {};
    if (!formColeta.coletor.trim()) e.coletor = 'Informe o responsável pela coleta.';
    if (!formColeta.peso_kg && !formColeta.volume_l)
      e.peso_kg = 'Informe ao menos peso ou volume coletado.';
    setErrosColeta(e);
    if (Object.keys(e).length) return;
    try {
      await apiPost('/api/coletas', {
          pedido_id: modalColeta.id,
          data_coleta: isoData(formColeta.data_coleta),
          coletor: formColeta.coletor,
          equipe: formColeta.equipe,
          peso_kg: formColeta.peso_kg ? Number(formColeta.peso_kg) : 0,
          volume_l: formColeta.volume_l ? Number(formColeta.volume_l) : 0,
          unidades: Number(formColeta.unidades || 1),
          destino_temporario: formColeta.destino_temporario,
          veiculo: formColeta.veiculo,
          mtr: formColeta.mtr,
          observacoes: formColeta.observacoes,
      });
      await apiPut('/api/pedidos', {
          id: modalColeta.id,
          status: 'Coletado',
          data_coleta: isoData(formColeta.data_coleta),
      });
      toast('sucesso', 'Coleta registrada', `Pedido ${modalColeta.codigo} marcado como Coletado.`);
      setModalColeta(null);
      reload();
      coletasResource.reload();
    } catch (err: any) {
      toast('erro', 'Erro ao registrar coleta', err?.message);
    }
  }

  async function abrirDetalhe(row: any) {
    setDetalhe(row);
    setCarregandoDetalhe(true);
    try {
      const [c, h] = await Promise.all([
        apiGet<any[]>(`/api/coletas?pedido_id=${row.id}`),
        apiGet<any>(`/api/historico?registro_id=${row.id}&tabela=pedidos_coleta&limit=30`),
      ]);
      setDetalheColetas(c || []);
      setDetalheHist(h?.itens || []);
    } catch {
      setDetalheColetas([]);
      setDetalheHist([]);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  async function mudarStatus(row: any, status: string) {
    try {
      await update({ id: row.id, status });
      toast('sucesso', 'Status atualizado', `${row.codigo} → ${status}`);
    } catch (e: any) {
      toast('erro', 'Erro ao atualizar', e?.message);
    }
  }

  function limparFiltros() {
    setFStatus('todos');
    setFLab('todos');
    setFClasse('todos');
    setFPrioridade('todos');
    setFDe('');
    setFAte('');
    setBusca('');
  }

  const colunas: Column<any>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => (
        <span className="font-mono text-[12.5px] font-semibold text-forest-800">{r.codigo || `#${r.id}`}</span>
      ),
    },
    {
      key: 'laboratorio',
      header: 'Laboratório / Setor',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{r.laboratorio}</p>
          <p className="truncate text-[11px] text-ink-500">{r.local_coleta}</p>
        </div>
      ),
    },
    {
      key: 'tipo_residuo',
      header: 'Resíduo',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-700">{r.tipo_residuo}</p>
          <p className="truncate text-[11px] text-ink-400">{r.classe}</p>
        </div>
      ),
    },
    {
      key: 'quantidade_estimada',
      header: 'Qtd.',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className="text-[13px] font-semibold tabular-nums text-ink-800">
          {fmtNum(r.quantidade_estimada, 1)} <span className="font-normal text-ink-400">{r.unidade}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={STATUS_PEDIDO_TONE[r.status] || 'cinza'} dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (r) => <Badge tone={PRIORIDADE_TONE[r.prioridade] || 'cinza'}>{r.prioridade}</Badge>,
    },
    {
      key: 'data_solicitacao',
      header: 'Solicitação',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_solicitacao)}</span>,
    },
    {
      key: 'data_prevista',
      header: 'Prevista',
      className: 'whitespace-nowrap',
      render: (r) => {
        const atrasado =
          r.data_prevista &&
          ['Solicitado', 'Agendado'].includes(r.status) &&
          new Date(r.data_prevista).getTime() < Date.now();
        return (
          <span className={`text-xs ${atrasado ? 'font-semibold text-brick-600' : 'text-ink-600'}`}>
            {fmtData(r.data_prevista)}
            {atrasado && ' ⚠'}
          </span>
        );
      },
    },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right whitespace-nowrap',
      headerClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconBtn titulo="Ver detalhes" onClick={() => abrirDetalhe(r)}>
            <Eye className="h-4 w-4" />
          </IconBtn>
          {podeEditar && ['Solicitado', 'Agendado'].includes(r.status) && (
            <IconBtn titulo="Registrar coleta" onClick={() => abrirColeta(r)} destaque>
              <Truck className="h-4 w-4" />
            </IconBtn>
          )}
          {podeEditar && (
            <IconBtn titulo="Editar" onClick={() => abrirEdicao(r)}>
              <Pencil className="h-4 w-4" />
            </IconBtn>
          )}
          {podeEditar && (
            <IconBtn titulo="Excluir" onClick={() => setExcluir(r)} perigo>
              <Trash2 className="h-4 w-4" />
            </IconBtn>
          )}
        </div>
      ),
    },
  ];

  const filtrosAtivos = [fStatus, fLab, fClasse, fPrioridade, fDe, fAte].filter(
    (v) => v && v !== 'todos'
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Pedidos & Coletas"
        subtitulo="Solicitações de coleta dos laboratórios geradores e registros de execução, com numeração automática e fluxo de status auditável."
        icone={<ClipboardList className="h-5.5 w-5.5" />}
        acoes={
          <>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() =>
                baixarCSV(
                  'lgrp-pedidos-coleta',
                  [
                    { key: 'codigo', label: 'Código' },
                    { key: 'laboratorio', label: 'Laboratório' },
                    { key: 'solicitante', label: 'Solicitante' },
                    { key: 'tipo_residuo', label: 'Tipo de Resíduo' },
                    { key: 'classe', label: 'Classe' },
                    { key: 'quantidade_estimada', label: 'Quantidade' },
                    { key: 'unidade', label: 'Unidade' },
                    { key: 'embalagem', label: 'Embalagem' },
                    { key: 'status', label: 'Status' },
                    { key: 'prioridade', label: 'Prioridade' },
                    { key: 'data_solicitacao', label: 'Solicitação' },
                    { key: 'data_prevista', label: 'Prevista' },
                    { key: 'data_coleta', label: 'Coleta' },
                  ],
                  filtrados
                )
              }
            >
              Exportar CSV
            </Button>
            {podeEditar && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={abrirNovo}>
                Novo pedido
              </Button>
            )}
          </>
        }
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumoCelula rotulo="Pedidos no filtro" valor={String(resumo.total)} nota="registros listados" />
        <ResumoCelula rotulo="Em aberto" valor={String(resumo.abertos)} nota="solicitados ou agendados" tone="ambar" />
        <ResumoCelula rotulo="Destinados" valor={String(resumo.destinados)} nota="ciclo encerrado" tone="verde" />
        <ResumoCelula
          rotulo="Quantidade estimada"
          valor={fmtNum(resumo.qtd, 1)}
          nota="soma das solicitações"
          tone="azul"
        />
      </div>

      {/* Barra de filtros */}
      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-ink-200 px-4 py-3">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por código, laboratório, solicitante..."
            className="min-w-[220px] flex-1"
          />
          <Button
            variant={mostrarFiltros ? 'soft' : 'secondary'}
            size="md"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => setMostrarFiltros((v) => !v)}
          >
            Filtros
            {filtrosAtivos > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-700 px-1.5 text-[10px] font-bold text-white">
                {filtrosAtivos}
              </span>
            )}
          </Button>
          {filtrosAtivos > 0 && (
            <Button variant="ghost" size="md" icon={<RotateCcw className="h-4 w-4" />} onClick={limparFiltros}>
              Limpar
            </Button>
          )}
        </div>

        {mostrarFiltros && (
          <div className="grid grid-cols-2 gap-3 border-b border-ink-200 bg-ink-50/50 px-4 py-4 md:grid-cols-3 xl:grid-cols-6">
            <Field label="Status">
              <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                <option value="todos">Todos</option>
                {STATUS_PEDIDO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Laboratório">
              <Select value={fLab} onChange={(e) => setFLab(e.target.value)}>
                <option value="todos">Todos</option>
                {LABORATORIOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Classe">
              <Select value={fClasse} onChange={(e) => setFClasse(e.target.value)}>
                <option value="todos">Todas</option>
                {CLASSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={fPrioridade} onChange={(e) => setFPrioridade(e.target.value)}>
                <option value="todos">Todas</option>
                {PRIORIDADES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Solicitado de">
              <Input type="date" value={fDe} onChange={(e) => setFDe(e.target.value)} />
            </Field>
            <Field label="Solicitado até">
              <Input type="date" value={fAte} onChange={(e) => setFAte(e.target.value)} />
            </Field>
          </div>
        )}

        <div className="p-4">
          {error ? (
            <p className="rounded-lg border border-brick-200 bg-brick-50 px-3 py-2 text-xs text-brick-700">
              {error}
            </p>
          ) : (
            <DataTable
              colunas={colunas}
              rows={pag.pagina}
              loading={loading}
              paginacao={pag}
              emptyTitle="Nenhum pedido de coleta encontrado"
              emptyMessage="Ajuste os filtros aplicados ou registre uma nova solicitação de coleta."
              onRowClick={abrirDetalhe}
            />
          )}
        </div>
      </Card>

      {/* Modal novo/editar pedido */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? `Editar pedido ${editando.codigo}` : 'Novo pedido de coleta'}
        subtitulo={
          editando
            ? 'As alterações serão registradas na trilha de auditoria.'
            : 'O código do documento será gerado automaticamente pelo sistema.'
        }
        largura="max-w-3xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Registrar pedido'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Laboratório / setor gerador" obrigatorio erro={erros.laboratorio} className="sm:col-span-2">
            <Select
              value={form.laboratorio}
              invalid={!!erros.laboratorio}
              onChange={(e) => setForm({ ...form, laboratorio: e.target.value })}
            >
              <option value="">Selecione...</option>
              {LABORATORIOS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Solicitante" obrigatorio erro={erros.solicitante}>
            <Input
              value={form.solicitante}
              invalid={!!erros.solicitante}
              placeholder="Nome do responsável pela solicitação"
              onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
            />
          </Field>

          <Field label="Responsável pela coleta">
            <Input
              value={form.responsavel}
              placeholder="Técnico do LGRP"
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            />
          </Field>

          <Field label="Tipo de resíduo" obrigatorio erro={erros.tipo_residuo}>
            <Select
              value={form.tipo_residuo}
              invalid={!!erros.tipo_residuo}
              onChange={(e) => setForm({ ...form, tipo_residuo: e.target.value })}
            >
              <option value="">Selecione...</option>
              {TIPOS_RESIDUO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Grupo">
            <Select value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })}>
              <option value="">Selecione...</option>
              {GRUPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Classificação (NBR 10004 / RDC 222)" obrigatorio erro={erros.classe}>
            <Select
              value={form.classe}
              invalid={!!erros.classe}
              onChange={(e) => setForm({ ...form, classe: e.target.value })}
            >
              <option value="">Selecione...</option>
              {CLASSES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Risco associado">
            <Select value={form.risco} onChange={(e) => setForm({ ...form, risco: e.target.value })}>
              <option value="">Selecione...</option>
              {RISCOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Quantidade estimada" obrigatorio erro={erros.quantidade_estimada}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.quantidade_estimada}
              invalid={!!erros.quantidade_estimada}
              onChange={(e) => setForm({ ...form, quantidade_estimada: e.target.value })}
            />
          </Field>

          <Field label="Unidade">
            <Select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
              {UNIDADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Embalagem / acondicionamento" className="sm:col-span-2">
            <Select value={form.embalagem} onChange={(e) => setForm({ ...form, embalagem: e.target.value })}>
              <option value="">Selecione...</option>
              {EMBALAGENS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Local de coleta (sala / prédio)" obrigatorio erro={erros.local_coleta} className="sm:col-span-2">
            <Input
              value={form.local_coleta}
              invalid={!!erros.local_coleta}
              placeholder="Ex.: Sala 214 — Bloco C, Departamento de Química"
              onChange={(e) => setForm({ ...form, local_coleta: e.target.value })}
            />
          </Field>

          <Field label="Data da solicitação" obrigatorio erro={erros.data_solicitacao}>
            <Input
              type="date"
              value={form.data_solicitacao}
              invalid={!!erros.data_solicitacao}
              onChange={(e) => setForm({ ...form, data_solicitacao: e.target.value })}
            />
          </Field>

          <Field label="Data prevista para coleta">
            <Input
              type="date"
              value={form.data_prevista}
              onChange={(e) => setForm({ ...form, data_prevista: e.target.value })}
            />
          </Field>

          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS_PEDIDO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
              {PRIORIDADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              value={form.observacoes || ''}
              placeholder="Informações complementares sobre o resíduo, segregação, incompatibilidades químicas..."
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* Modal registrar coleta */}
      <Modal
        aberto={!!modalColeta}
        onFechar={() => setModalColeta(null)}
        titulo="Registrar coleta"
        subtitulo={modalColeta ? `${modalColeta.codigo} · ${modalColeta.laboratorio}` : ''}
        largura="max-w-2xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setModalColeta(null)}>
              Cancelar
            </Button>
            <Button icon={<Truck className="h-4 w-4" />} onClick={salvarColeta}>
              Confirmar coleta
            </Button>
          </>
        }
      >
        {modalColeta && (
          <div className="mb-4 rounded-lg border border-lagoon-200 bg-lagoon-50 px-3.5 py-2.5 text-xs text-lagoon-800">
            <strong>{modalColeta.tipo_residuo}</strong> · {modalColeta.classe} · estimado{' '}
            {fmtNum(modalColeta.quantidade_estimada, 1)} {modalColeta.unidade} · {modalColeta.embalagem || 'embalagem não informada'}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data da coleta" obrigatorio>
            <Input
              type="date"
              value={formColeta.data_coleta}
              onChange={(e) => setFormColeta({ ...formColeta, data_coleta: e.target.value })}
            />
          </Field>
          <Field label="Nº do MTR (Manifesto de Transporte)">
            <Input
              value={formColeta.mtr}
              placeholder="Ex.: MTR-2026-000123"
              onChange={(e) => setFormColeta({ ...formColeta, mtr: e.target.value })}
            />
          </Field>
          <Field label="Responsável pela coleta" obrigatorio erro={errosColeta.coletor}>
            <Input
              value={formColeta.coletor}
              invalid={!!errosColeta.coletor}
              onChange={(e) => setFormColeta({ ...formColeta, coletor: e.target.value })}
            />
          </Field>
          <Field label="Equipe">
            <Input
              value={formColeta.equipe}
              placeholder="Ex.: Equipe B — LGRP"
              onChange={(e) => setFormColeta({ ...formColeta, equipe: e.target.value })}
            />
          </Field>
          <Field label="Peso aferido (kg)" erro={errosColeta.peso_kg}>
            <Input
              type="number"
              step="0.01"
              min="0"
              invalid={!!errosColeta.peso_kg}
              value={formColeta.peso_kg}
              onChange={(e) => setFormColeta({ ...formColeta, peso_kg: e.target.value })}
            />
          </Field>
          <Field label="Volume aferido (L)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formColeta.volume_l}
              onChange={(e) => setFormColeta({ ...formColeta, volume_l: e.target.value })}
            />
          </Field>
          <Field label="Nº de volumes / embalagens">
            <Input
              type="number"
              min="1"
              value={formColeta.unidades}
              onChange={(e) => setFormColeta({ ...formColeta, unidades: e.target.value })}
            />
          </Field>
          <Field label="Veículo / meio de transporte">
            <Select
              value={formColeta.veiculo}
              onChange={(e) => setFormColeta({ ...formColeta, veiculo: e.target.value })}
            >
              {VEICULOS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Destino temporário" className="sm:col-span-2">
            <Select
              value={formColeta.destino_temporario}
              onChange={(e) => setFormColeta({ ...formColeta, destino_temporario: e.target.value })}
            >
              {LOCAIS_ARMAZENAMENTO.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Observações da coleta" className="sm:col-span-2">
            <Textarea
              value={formColeta.observacoes}
              onChange={(e) => setFormColeta({ ...formColeta, observacoes: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* Modal de detalhes */}
      <Modal
        aberto={!!detalhe}
        onFechar={() => setDetalhe(null)}
        titulo={detalhe ? `Pedido ${detalhe.codigo}` : ''}
        subtitulo={detalhe ? `${detalhe.laboratorio} · ${detalhe.tipo_residuo}` : ''}
        largura="max-w-3xl"
        rodape={
          detalhe && (
            <>
              <Select
                className="mr-auto max-w-[13rem]"
                value={detalhe.status}
                disabled={!podeEditar}
                onChange={(e) => {
                  mudarStatus(detalhe, e.target.value);
                  setDetalhe({ ...detalhe, status: e.target.value });
                }}
              >
                {STATUS_PEDIDO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={() => setDetalhe(null)}>
                Fechar
              </Button>
              {podeEditar && (
                <Button
                  onClick={() => {
                    abrirEdicao(detalhe);
                    setDetalhe(null);
                  }}
                  icon={<Pencil className="h-4 w-4" />}
                >
                  Editar pedido
                </Button>
              )}
            </>
          )
        }
      >
        {detalhe && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DetalheItem rotulo="Status" valor={<Badge tone={STATUS_PEDIDO_TONE[detalhe.status]} dot>{detalhe.status}</Badge>} />
              <DetalheItem rotulo="Prioridade" valor={<Badge tone={PRIORIDADE_TONE[detalhe.prioridade]}>{detalhe.prioridade}</Badge>} />
              <DetalheItem rotulo="Classe" valor={detalhe.classe} />
              <DetalheItem rotulo="Grupo" valor={detalhe.grupo} />
              <DetalheItem rotulo="Quantidade estimada" valor={`${fmtNum(detalhe.quantidade_estimada, 1)} ${detalhe.unidade}`} />
              <DetalheItem rotulo="Embalagem" valor={detalhe.embalagem} />
              <DetalheItem rotulo="Solicitante" valor={detalhe.solicitante} />
              <DetalheItem rotulo="Responsável LGRP" valor={detalhe.responsavel} />
              <DetalheItem rotulo="Risco associado" valor={detalhe.risco} />
              <DetalheItem rotulo="Local de coleta" valor={detalhe.local_coleta} />
              <DetalheItem rotulo="Data da solicitação" valor={fmtData(detalhe.data_solicitacao)} />
              <DetalheItem rotulo="Data prevista" valor={fmtData(detalhe.data_prevista)} />
            </div>

            {detalhe.observacoes && (
              <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Observações</p>
                <p className="text-[13px] leading-relaxed text-ink-700">{detalhe.observacoes}</p>
              </div>
            )}

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
                <Truck className="h-4 w-4 text-forest-600" /> Coletas registradas ({detalheColetas.length})
              </h4>
              {carregandoDetalhe ? (
                <div className="skeleton h-16 rounded-lg" />
              ) : detalheColetas.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-300 px-3 py-5 text-center text-xs text-ink-400">
                  Nenhuma coleta registrada para este pedido.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detalheColetas.map((c) => (
                    <li key={c.id} className="rounded-lg border border-ink-200 bg-white px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="font-semibold text-ink-800">{fmtData(c.data_coleta)}</span>
                        <span className="text-ink-600">{fmtNum(c.peso_kg, 2)} kg</span>
                        <span className="text-ink-600">{fmtNum(c.volume_l, 2)} L</span>
                        <span className="text-ink-600">{c.unidades} volume(s)</span>
                        {c.mtr && <Badge tone="azul">{c.mtr}</Badge>}
                        <span className="ml-auto text-ink-500">{c.coletor}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-400">
                        {c.destino_temporario} · {c.veiculo}
                        {c.equipe ? ` · ${c.equipe}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
                <Activity className="h-4 w-4 text-forest-600" /> Rastreabilidade do pedido
              </h4>
              {carregandoDetalhe ? (
                <div className="skeleton h-16 rounded-lg" />
              ) : detalheHist.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-300 px-3 py-5 text-center text-xs text-ink-400">
                  Sem eventos de auditoria registrados.
                </p>
              ) : (
                <ol className="relative space-y-3 border-l border-ink-200 pl-5">
                  {detalheHist.map((h) => (
                    <li key={h.id} className="relative">
                      <span
                        className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                          h.acao === 'INSERT' ? 'bg-forest-500' : h.acao === 'DELETE' ? 'bg-brick-500' : 'bg-lagoon-500'
                        }`}
                      />
                      <p className="text-[13px] font-medium text-ink-800">{h.descricao}</p>
                      <p className="text-[11px] text-ink-500">
                        {h.usuario} · {fmtDataHora(h.criado_em)}
                      </p>
                      {h.mudancas && Object.keys(h.mudancas).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {Object.entries(h.mudancas).map(([campo, v]: any) => (
                            <span
                              key={campo}
                              className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10.5px] text-ink-600"
                            >
                              {campo}: <span className="text-brick-600 line-through">{String(v.antes ?? '—')}</span>{' '}
                              → <span className="font-semibold text-forest-700">{String(v.depois ?? '—')}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        aberto={!!excluir}
        onFechar={() => setExcluir(null)}
        onConfirmar={confirmarExclusao}
        confirmando={saving}
        titulo="Excluir pedido de coleta"
        mensagem={`Deseja excluir definitivamente o pedido ${excluir?.codigo || ''}? Os registros de coleta vinculados também serão removidos.`}
      />
    </div>
  );
}

function IconBtn({
  children,
  titulo,
  onClick,
  perigo,
  destaque,
}: {
  children: React.ReactNode;
  titulo: string;
  onClick: () => void;
  perigo?: boolean;
  destaque?: boolean;
}) {
  return (
    <button
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        perigo
          ? 'border-transparent text-ink-400 hover:border-brick-200 hover:bg-brick-50 hover:text-brick-600'
          : destaque
          ? 'border-transparent text-ink-400 hover:border-forest-300 hover:bg-forest-50 hover:text-forest-700'
          : 'border-transparent text-ink-400 hover:border-ink-200 hover:bg-ink-50 hover:text-ink-700'
      }`}
    >
      {children}
    </button>
  );
}

function ResumoCelula({
  rotulo,
  valor,
  nota,
  tone = 'cinza',
}: {
  rotulo: string;
  valor: string;
  nota: string;
  tone?: 'cinza' | 'ambar' | 'verde' | 'azul';
}) {
  const cores: Record<string, string> = {
    cinza: 'text-ink-900',
    ambar: 'text-clay-700',
    verde: 'text-forest-700',
    azul: 'text-lagoon-700',
  };
  return (
    <div className="rounded-xl border border-ink-200/80 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
      <p className={`font-display text-xl font-bold leading-tight ${cores[tone]}`}>{valor}</p>
      <p className="text-[11px] text-ink-400">{nota}</p>
    </div>
  );
}

function DetalheItem({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-ink-200/80 bg-ink-50/40 px-3 py-2">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{rotulo}</p>
      <div className="mt-0.5 text-[13px] font-medium text-ink-800">{valor || '—'}</div>
    </div>
  );
}
