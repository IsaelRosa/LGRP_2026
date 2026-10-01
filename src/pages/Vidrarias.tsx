import { FlaskConical } from 'lucide-react';
import CrudModule, { type FiltroDef } from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, type Column } from '../components/ui';
import {
  CLASSES,
  LABORATORIOS,
  METODOS_DESCONTAMINACAO,
  NIVEIS_CONTAMINACAO,
  NIVEL_TONE,
  STATUS_VIDRARIA,
  STATUS_VIDRARIA_TONE,
  TIPOS_VIDRARIA,
} from '../lib/constants';
import { fmtData, fmtInt, hojeISO } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CAMPOS: FieldDef[] = [
  { name: 'tipo', label: 'Tipo de vidraria', type: 'select', options: TIPOS_VIDRARIA, required: true },
  { name: 'quantidade', label: 'Quantidade de peças', type: 'number', required: true, step: '1' },
  { name: 'laboratorio', label: 'Laboratório de origem', type: 'select', options: LABORATORIOS, required: true },
  { name: 'contaminante', label: 'Contaminante principal', type: 'text', required: true, placeholder: 'Ex.: Cromo hexavalente, fenol, prata' },
  { name: 'classe_contaminante', label: 'Classe do contaminante', type: 'select', options: CLASSES },
  { name: 'nivel_contaminacao', label: 'Nível de contaminação', type: 'select', options: NIVEIS_CONTAMINACAO, required: true },
  { name: 'data_registro', label: 'Data de registro', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_VIDRARIA, required: true },
  { name: 'metodo_descontaminacao', label: 'Método de descontaminação', type: 'select', options: METODOS_DESCONTAMINACAO },
  { name: 'data_descontaminacao', label: 'Data da descontaminação', type: 'date' },
  { name: 'responsavel', label: 'Responsável pelo processo', type: 'text', placeholder: 'Nome do técnico' },
  { name: 'destino', label: 'Destino após o processo', type: 'text', placeholder: 'Ex.: Retorno ao Lab. de Química Analítica' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', span: 2, placeholder: 'Estado físico das peças, riscos identificados, EPIs utilizados...' },
];

const FILTROS: FiltroDef[] = [
  { name: 'status', label: 'Status', type: 'select', options: STATUS_VIDRARIA, api: 'status' },
  { name: 'nivel_contaminacao', label: 'Nível', type: 'select', options: NIVEIS_CONTAMINACAO, api: 'nivel_contaminacao' },
  { name: 'laboratorio', label: 'Laboratório', type: 'select', options: LABORATORIOS, api: 'laboratorio' },
  { name: 'tipo', label: 'Tipo de vidraria', type: 'select', options: TIPOS_VIDRARIA, api: 'tipo' },
  { name: 'de', label: 'Registrado a partir de', type: 'date', api: 'de' },
];

export default function Vidrarias() {
  const { podeEditar } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => <span className="font-mono text-[12.5px] font-semibold text-forest-800">{r.codigo}</span>,
    },
    {
      key: 'tipo',
      header: 'Vidraria',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{r.tipo}</p>
          <p className="truncate text-[11px] text-ink-500">{r.laboratorio}</p>
        </div>
      ),
    },
    {
      key: 'quantidade',
      header: 'Peças',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] font-semibold tabular-nums text-ink-800">{fmtInt(r.quantidade)}</span>,
    },
    {
      key: 'contaminante',
      header: 'Contaminante',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-700">{r.contaminante || '—'}</p>
          <p className="truncate text-[11px] text-ink-400">{r.classe_contaminante || '—'}</p>
        </div>
      ),
    },
    {
      key: 'nivel_contaminacao',
      header: 'Nível',
      render: (r) => <Badge tone={NIVEL_TONE[r.nivel_contaminacao] || 'cinza'}>{r.nivel_contaminacao}</Badge>,
    },
    {
      key: 'data_registro',
      header: 'Registro',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_registro)}</span>,
    },
    {
      key: 'metodo_descontaminacao',
      header: 'Método',
      render: (r) => <span className="text-[12.5px] text-ink-600">{r.metodo_descontaminacao || '—'}</span>,
    },
    {
      key: 'data_descontaminacao',
      header: 'Descontaminação',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_descontaminacao)}</span>,
    },
    {
      key: 'responsavel',
      header: 'Responsável',
      render: (r) => <span className="text-[12.5px] text-ink-600">{r.responsavel || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={STATUS_VIDRARIA_TONE[r.status] || 'cinza'} dot>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <CrudModule
      titulo="Vidrarias Contaminadas"
      subtitulo="Controle do ciclo de descontaminação de vidrarias laboratoriais — do registro da contaminação até o reaproveitamento ou descarte como resíduo químico."
      icone={<FlaskConical className="h-5.5 w-5.5" />}
      apiPath="/api/vidrarias"
      rotuloRegistro="Vidraria"
      csvNome="lgrp-vidrarias"
      podeEditar={podeEditar}
      campos={CAMPOS}
      colunas={colunas}
      filtros={FILTROS}
      buscaCampos={['codigo', 'tipo', 'laboratorio', 'contaminante', 'responsavel', 'destino']}
      camposData={['data_registro', 'data_descontaminacao']}
      camposNumericos={['quantidade']}
      valoresIniciais={{
        status: 'Aguardando Descontaminação',
        nivel_contaminacao: 'Médio',
        quantidade: '1',
        data_registro: hojeISO(),
      }}
      resumo={(rows) => {
        const aguardando = rows.filter((r) => r.status === 'Aguardando Descontaminação');
        const emProcesso = rows.filter((r) => r.status === 'Em Descontaminação');
        const concluidas = rows.filter((r) => ['Descontaminada', 'Reaproveitada'].includes(r.status));
        const criticas = rows.filter((r) => r.nivel_contaminacao === 'Crítico');
        const pecasPendentes = [...aguardando, ...emProcesso].reduce((s, r) => s + Number(r.quantidade || 0), 0);
        return [
          { rotulo: 'Registros', valor: String(rows.length), nota: `${criticas.length} com nível crítico`, tone: criticas.length ? 'vermelho' : 'cinza' },
          { rotulo: 'Aguardando', valor: String(aguardando.length), nota: `${pecasPendentes} peças na fila`, tone: 'ambar' },
          { rotulo: 'Em descontaminação', valor: String(emProcesso.length), nota: 'processos em execução', tone: 'azul' },
          { rotulo: 'Reaproveitadas', valor: String(concluidas.length), nota: 'retornaram ao uso ou foram descartadas', tone: 'verde' },
        ];
      }}
      csvColunas={[
        { key: 'codigo', label: 'Código' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'quantidade', label: 'Peças' },
        { key: 'laboratorio', label: 'Laboratório' },
        { key: 'contaminante', label: 'Contaminante' },
        { key: 'classe_contaminante', label: 'Classe do Contaminante' },
        { key: 'nivel_contaminacao', label: 'Nível' },
        { key: 'data_registro', label: 'Registro' },
        { key: 'metodo_descontaminacao', label: 'Método' },
        { key: 'data_descontaminacao', label: 'Descontaminação' },
        { key: 'responsavel', label: 'Responsável' },
        { key: 'destino', label: 'Destino' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
