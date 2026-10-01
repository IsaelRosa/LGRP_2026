import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { apiGet } from '../lib/api';
import {
  baixarCSV,
  fmtDataHora,
  isoData,
  paraInputDate,
  paraInputDateTime,
  useCrud,
  usePagination,
  useResource,
} from '../lib/utils';
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
  type Column,
} from './ui';
import { DynamicForm, type FieldDef } from './DynamicForm';

export type FiltroDef = {
  name: string;
  label: string;
  type: 'select' | 'date';
  options?: string[];
  /** campo enviado à API; se omitido, filtra apenas no cliente */
  api?: string;
};

export type ResumoDef = (rows: any[]) => {
  rotulo: string;
  valor: string;
  nota: string;
  tone?: 'cinza' | 'ambar' | 'verde' | 'azul' | 'vermelho';
}[];

export type CrudModuleProps = {
  titulo: string;
  subtitulo: string;
  icone: ReactNode;
  apiPath: string;
  campos: FieldDef[];
  colunas: Column<any>[];
  filtros?: FiltroDef[];
  resumo?: ResumoDef;
  buscaCampos: string[];
  csvColunas: { key: string; label: string }[];
  csvNome: string;
  podeEditar: boolean;
  rotuloRegistro: string;
  pageSize?: number;
  /** converte linha do banco em valores do formulário */
  paraForm?: (row: any) => Record<string, any>;
  /** converte valores do formulário em payload da API */
  paraPayload?: (form: Record<string, any>) => Record<string, any>;
  /** campos de data (yyyy-mm-dd) convertidos para ISO no envio */
  camposData?: string[];
  camposDataHora?: string[];
  camposNumericos?: string[];
  validar?: (form: Record<string, any>) => Record<string, string>;
  acaoExtra?: (row: any) => ReactNode;
  detalheExtra?: (row: any) => ReactNode;
  aoRegistrar?: () => void;
  valoresIniciais?: Record<string, any>;
  mostrarDetalhe?: boolean;
};

export default function CrudModule(props: CrudModuleProps) {
  const {
    titulo,
    subtitulo,
    icone,
    apiPath,
    campos,
    colunas,
    filtros = [],
    resumo,
    buscaCampos,
    csvColunas,
    csvNome,
    podeEditar,
    rotuloRegistro,
    pageSize = 10,
    paraForm,
    paraPayload,
    camposData = [],
    camposDataHora = [],
    camposNumericos = [],
    validar,
    acaoExtra,
    detalheExtra,
    aoRegistrar,
    valoresIniciais = {},
    mostrarDetalhe = true,
  } = props;

  const { toast } = useToast();
  const tabela = apiPath.replace('/api/', '');

  const [estadoFiltros, setEstadoFiltros] = useState<Record<string, string>>(() =>
    Object.fromEntries(filtros.map((f) => [f.name, '']))
  );
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const filtrosApi = useMemo(() => {
    const o: Record<string, string> = {};
    filtros.forEach((f) => {
      if (f.api && estadoFiltros[f.name] && estadoFiltros[f.name] !== 'todos') {
        o[f.api] = estadoFiltros[f.name];
      }
    });
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estadoFiltros)]);

  const { data, loading, error, reload } = useResource<any>(apiPath, filtrosApi);
  const { create, update, remove, saving } = useCrud(apiPath, () => {
    reload();
    aoRegistrar?.();
  });

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>(valoresIniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [excluir, setExcluir] = useState<any>(null);
  const [detalhe, setDetalhe] = useState<any>(null);
  const [hist, setHist] = useState<any[]>([]);
  const [carregandoHist, setCarregandoHist] = useState(false);

  const filtrados = useMemo(() => {
    let rows = data;
    // filtros somente-cliente
    filtros.forEach((f) => {
      if (f.api) return;
      const v = estadoFiltros[f.name];
      if (v && v !== 'todos') rows = rows.filter((r) => String(r[f.name] ?? '') === v);
    });
    const t = busca.trim().toLowerCase();
    if (t) {
      rows = rows.filter((r) =>
        buscaCampos.some((c) => String(r[c] ?? '').toLowerCase().includes(t))
      );
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, busca, JSON.stringify(estadoFiltros)]);

  const pag = usePagination(filtrados, pageSize);
  const filtrosAtivos = Object.values(estadoFiltros).filter((v) => v && v !== 'todos').length;

  function abrirNovo() {
    setEditando(null);
    setForm({ ...valoresIniciais });
    setErros({});
    setModalAberto(true);
  }

  function abrirEdicao(row: any) {
    setEditando(row);
    let base: Record<string, any> = { ...row };
    camposData.forEach((c) => (base[c] = paraInputDate(row[c])));
    camposDataHora.forEach((c) => (base[c] = paraInputDateTime(row[c])));
    camposNumericos.forEach((c) => (base[c] = row[c] != null ? String(row[c]) : ''));
    if (paraForm) base = { ...base, ...paraForm(row) };
    setForm(base);
    setErros({});
    setModalAberto(true);
  }

  async function abrirDetalhe(row: any) {
    if (!mostrarDetalhe) return;
    setDetalhe(row);
    setCarregandoHist(true);
    try {
      const r = await apiGet<any>(`/api/historico?registro_id=${row.id}&tabela=${tabela}&limit=40`);
      setHist(r?.itens || []);
    } catch {
      setHist([]);
    } finally {
      setCarregandoHist(false);
    }
  }

  function validarForm() {
    let e: Record<string, string> = {};
    campos.forEach((c) => {
      if (c.required) {
        const v = form[c.name];
        if (v === undefined || v === null || String(v).trim() === '') {
          e[c.name] = 'Campo obrigatório.';
        }
        if (c.type === 'number' && v !== '' && v != null && Number(v) <= 0) {
          e[c.name] = 'Informe um valor maior que zero.';
        }
      }
    });
    if (validar) e = { ...e, ...validar(form) };
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    if (!validarForm()) {
      toast('aviso', 'Revise o formulário', 'Há campos obrigatórios pendentes ou inválidos.');
      return;
    }
    let payload: Record<string, any> = { ...form };
    camposData.forEach((c) => (payload[c] = isoData(payload[c])));
    camposDataHora.forEach((c) => (payload[c] = payload[c] ? new Date(payload[c]).toISOString() : null));
    camposNumericos.forEach((c) => {
      payload[c] = payload[c] === '' || payload[c] == null ? null : Number(payload[c]);
    });
    if (paraPayload) payload = paraPayload(payload);

    try {
      if (editando) {
        await update({ ...payload, id: editando.id });
        toast('sucesso', `${rotuloRegistro} atualizado`, 'As alterações foram registradas na auditoria.');
      } else {
        const r: any = await create(payload);
        if (r?.convite_enviado === false) {
          toast('aviso', `${rotuloRegistro} criado`, 'Convite não enviado. Verifique SMTP e solicite a configuração de senha por e-mail.');
        } else {
          toast('sucesso', `${rotuloRegistro} criado`, r?.codigo ? `Código: ${r.codigo}` : undefined);
        }
      }
      setModalAberto(false);
    } catch (e: any) {
      toast('erro', 'Erro ao salvar', e?.message);
    }
  }

  async function confirmarExclusao() {
    try {
      await remove(excluir.id);
      toast('sucesso', `${rotuloRegistro} excluído`, 'A exclusão foi registrada na trilha de auditoria.');
      setExcluir(null);
    } catch (e: any) {
      toast('erro', 'Erro ao excluir', e?.message);
    }
  }

  function limparFiltros() {
    setEstadoFiltros(Object.fromEntries(filtros.map((f) => [f.name, ''])));
    setBusca('');
  }

  const colunasComAcoes: Column<any>[] = [
    ...colunas,
    {
      key: '__acoes',
      header: 'Ações',
      className: 'text-right whitespace-nowrap',
      headerClassName: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {mostrarDetalhe && (
            <AcaoBotao titulo="Detalhes e rastreabilidade" onClick={() => abrirDetalhe(r)}>
              <Eye className="h-4 w-4" />
            </AcaoBotao>
          )}
          {acaoExtra?.(r)}
          {podeEditar && (
            <AcaoBotao titulo="Editar" onClick={() => abrirEdicao(r)}>
              <Pencil className="h-4 w-4" />
            </AcaoBotao>
          )}
          {podeEditar && (
            <AcaoBotao titulo="Excluir" perigo onClick={() => setExcluir(r)}>
              <Trash2 className="h-4 w-4" />
            </AcaoBotao>
          )}
        </div>
      ),
    },
  ];

  const cardsResumo = resumo ? resumo(filtrados) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={titulo}
        subtitulo={subtitulo}
        icone={icone}
        acoes={
          <>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => baixarCSV(csvNome, csvColunas, filtrados)}
            >
              Exportar CSV
            </Button>
            {podeEditar && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={abrirNovo}>
                Novo registro
              </Button>
            )}
          </>
        }
      />

      {cardsResumo.length > 0 && (
        <div className={`grid grid-cols-2 gap-3 ${cardsResumo.length >= 4 ? 'lg:grid-cols-4' : `lg:grid-cols-${cardsResumo.length}`}`}>
          {cardsResumo.map((c) => (
            <CelulaResumo key={c.rotulo} {...c} />
          ))}
        </div>
      )}

      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-ink-200 px-4 py-3">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar..."
            className="min-w-[200px] flex-1"
          />
          {filtros.length > 0 && (
            <Button
              variant={mostrarFiltros ? 'soft' : 'secondary'}
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
          )}
          {filtrosAtivos > 0 && (
            <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={limparFiltros}>
              Limpar
            </Button>
          )}
          <span className="ml-auto hidden text-xs text-ink-500 sm:block">
            {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}
          </span>
        </div>

        {mostrarFiltros && filtros.length > 0 && (
          <div className="grid grid-cols-2 gap-3 border-b border-ink-200 bg-ink-50/50 px-4 py-4 md:grid-cols-3 xl:grid-cols-5">
            {filtros.map((f) => (
              <Field key={f.name} label={f.label}>
                {f.type === 'select' ? (
                  <Select
                    value={estadoFiltros[f.name] || 'todos'}
                    onChange={(e) => setEstadoFiltros((p) => ({ ...p, [f.name]: e.target.value }))}
                  >
                    <option value="todos">Todos</option>
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type="date"
                    value={estadoFiltros[f.name] || ''}
                    onChange={(e) => setEstadoFiltros((p) => ({ ...p, [f.name]: e.target.value }))}
                  />
                )}
              </Field>
            ))}
          </div>
        )}

        <div className="p-4">
          {error ? (
            <div className="rounded-lg border border-brick-200 bg-brick-50 px-3.5 py-3 text-xs text-brick-700">
              {error}
            </div>
          ) : (
            <DataTable
              colunas={colunasComAcoes}
              rows={pag.pagina}
              loading={loading}
              paginacao={pag}
              onRowClick={mostrarDetalhe ? abrirDetalhe : undefined}
              emptyTitle={`Nenhum ${rotuloRegistro.toLowerCase()} encontrado`}
              emptyMessage="Ajuste os filtros aplicados ou cadastre um novo registro."
            />
          )}
        </div>
      </Card>

      {/* Modal criar/editar */}
      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? `Editar ${rotuloRegistro.toLowerCase()}` : `Novo ${rotuloRegistro.toLowerCase()}`}
        subtitulo={
          editando
            ? 'As alterações serão registradas na trilha de auditoria.'
            : 'Os campos marcados com * são obrigatórios.'
        }
        largura="max-w-3xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button loading={saving} onClick={salvar}>
              {editando ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <DynamicForm
          campos={campos}
          values={form}
          erros={erros}
          onChange={(name, value) => setForm((p) => ({ ...p, [name]: value }))}
        />
      </Modal>

      {/* Modal de detalhes */}
      <Modal
        aberto={!!detalhe}
        onFechar={() => setDetalhe(null)}
        titulo={`${rotuloRegistro} ${detalhe?.codigo || detalhe?.nome || detalhe?.tipo || `#${detalhe?.id ?? ''}`}`}
        subtitulo="Ficha completa do registro e histórico de alterações"
        largura="max-w-3xl"
        rodape={
          <>
            <Button variant="secondary" onClick={() => setDetalhe(null)}>
              Fechar
            </Button>
            {podeEditar && detalhe && (
              <Button
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  abrirEdicao(detalhe);
                  setDetalhe(null);
                }}
              >
                Editar registro
              </Button>
            )}
          </>
        }
      >
        {detalhe && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {campos
                .filter((c) => c.type !== 'textarea')
                .map((c) => {
                  const v = detalhe[c.name];
                  let exibido: ReactNode = v === null || v === undefined || v === '' ? '—' : String(v);
                  if (camposData.includes(c.name) || camposDataHora.includes(c.name)) {
                    exibido = v ? fmtDataHora(v) : '—';
                  } else if (c.type === 'boolean') {
                    exibido = v ? 'Sim' : 'Não';
                  } else if (c.type === 'number' && v != null && v !== '') {
                    exibido = Number(v).toLocaleString('pt-BR');
                  }
                  return (
                    <div key={c.name} className="rounded-lg border border-ink-200/80 bg-ink-50/40 px-3 py-2">
                      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-500">{c.label}</p>
                      <p className="mt-0.5 break-words text-[13px] font-medium text-ink-800">{exibido}</p>
                    </div>
                  );
                })}
            </div>

            {detalhe.observacoes && (
              <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3.5 py-3">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Observações</p>
                <p className="text-[13px] leading-relaxed text-ink-700">{detalhe.observacoes}</p>
              </div>
            )}

            {detalheExtra?.(detalhe)}

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-ink-900">
                <Activity className="h-4 w-4 text-forest-600" /> Rastreabilidade
              </h4>
              {carregandoHist ? (
                <div className="skeleton h-16 rounded-lg" />
              ) : hist.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-300 px-3 py-5 text-center text-xs text-ink-400">
                  Sem eventos de auditoria registrados para este item.
                </p>
              ) : (
                <ol className="relative max-h-72 space-y-3 overflow-y-auto border-l border-ink-200 pl-5 pr-1">
                  {hist.map((h) => (
                    <li key={h.id} className="relative">
                      <span
                        className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                          h.acao === 'INSERT'
                            ? 'bg-forest-500'
                            : h.acao === 'DELETE'
                            ? 'bg-brick-500'
                            : 'bg-lagoon-500'
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
                              {campo}: <span className="text-brick-600 line-through">{String(v.antes ?? '—')}</span> →{' '}
                              <span className="font-semibold text-forest-700">{String(v.depois ?? '—')}</span>
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
        titulo={`Excluir ${rotuloRegistro.toLowerCase()}`}
        mensagem={`Deseja excluir definitivamente o registro ${
          excluir?.codigo || excluir?.nome || `#${excluir?.id ?? ''}`
        }? Esta operação não pode ser desfeita.`}
      />
    </div>
  );
}

function AcaoBotao({
  children,
  titulo,
  onClick,
  perigo,
}: {
  children: ReactNode;
  titulo: string;
  onClick: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition ${
        perigo
          ? 'text-ink-400 hover:border-brick-200 hover:bg-brick-50 hover:text-brick-600'
          : 'text-ink-400 hover:border-ink-200 hover:bg-ink-50 hover:text-ink-700'
      }`}
    >
      {children}
    </button>
  );
}

function CelulaResumo({
  rotulo,
  valor,
  nota,
  tone = 'cinza',
}: {
  rotulo: string;
  valor: string;
  nota: string;
  tone?: 'cinza' | 'ambar' | 'verde' | 'azul' | 'vermelho';
}) {
  const cores: Record<string, string> = {
    cinza: 'text-ink-900',
    ambar: 'text-clay-700',
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

export { Badge };
