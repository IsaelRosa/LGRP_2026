import { Wine } from 'lucide-react';
import CrudModule, { type FiltroDef } from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, ProgressBar, type Column } from '../components/ui';
import {
  CATEGORIAS_SOLVENTE,
  EMBALAGENS,
  LABORATORIOS,
  LOCAIS_ARMAZENAMENTO,
  SITUACAO_TONE,
  STATUS_SOLVENTE,
  STATUS_SOLVENTE_TONE,
} from '../lib/constants';
import { fmtData, fmtNum, hojeISO } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CAMPOS: FieldDef[] = [
  { name: 'nome', label: 'Nome do solvente', type: 'text', required: true, placeholder: 'Ex.: Acetona P.A.' },
  { name: 'formula', label: 'Fórmula molecular', type: 'text', placeholder: 'Ex.: C₃H₆O' },
  { name: 'cas', label: 'Número CAS', type: 'text', placeholder: 'Ex.: 67-64-1' },
  { name: 'categoria', label: 'Categoria', type: 'select', options: CATEGORIAS_SOLVENTE, required: true },
  { name: 'pureza', label: 'Pureza (%)', type: 'number', step: '0.1' },
  { name: 'inflamavel', label: 'Inflamável', type: 'boolean' },
  { name: 'volume_total_l', label: 'Volume total recebido (L)', type: 'number', step: '0.01', required: true },
  { name: 'volume_restante_l', label: 'Volume restante (L)', type: 'number', step: '0.01' },
  { name: 'volume_recuperado_l', label: 'Volume recuperado por destilação (L)', type: 'number', step: '0.01' },
  { name: 'embalagem', label: 'Embalagem', type: 'select', options: EMBALAGENS },
  { name: 'laboratorio', label: 'Laboratório / setor', type: 'select', options: LABORATORIOS, required: true },
  { name: 'localizacao', label: 'Local de armazenamento', type: 'select', options: LOCAIS_ARMAZENAMENTO },
  { name: 'data_recebimento', label: 'Data de recebimento', type: 'date', required: true },
  { name: 'data_validade', label: 'Data de validade', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_SOLVENTE, required: true },
  { name: 'responsavel', label: 'Responsável', type: 'text', placeholder: 'Nome do responsável pelo frasco' },
  { name: 'observacoes', label: 'Observações', type: 'textarea', span: 2 },
];

const FILTROS: FiltroDef[] = [
  { name: 'categoria', label: 'Categoria', type: 'select', options: CATEGORIAS_SOLVENTE, api: 'categoria' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_SOLVENTE, api: 'status' },
  { name: 'laboratorio', label: 'Laboratório', type: 'select', options: LABORATORIOS, api: 'laboratorio' },
  { name: 'de', label: 'Recebido a partir de', type: 'date', api: 'de' },
  { name: 'ate', label: 'Recebido até', type: 'date', api: 'ate' },
];

export default function Solventes() {
  const { podeEditar } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => <span className="font-mono text-[12.5px] font-semibold text-forest-800">{r.codigo}</span>,
    },
    {
      key: 'nome',
      header: 'Solvente',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{r.nome}</p>
          <p className="truncate font-mono text-[11px] text-ink-500">
            {r.formula || '—'} {r.cas ? `· CAS ${r.cas}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      render: (r) => (
        <Badge tone={/Halogenado/.test(r.categoria || '') && !/Não/.test(r.categoria || '') ? 'vermelho' : 'azul'}>
          {r.categoria}
        </Badge>
      ),
    },
    {
      key: 'volume',
      header: 'Volume',
      className: 'w-40',
      render: (r) => {
        const total = Number(r.volume_total_l || 0);
        const rest = Number(r.volume_restante_l || 0);
        const tone = total > 0 && rest / total <= 0.15 ? 'vermelho' : total > 0 && rest / total <= 0.4 ? 'ambar' : 'verde';
        return (
          <div>
            <p className="text-[12.5px] font-semibold tabular-nums text-ink-800">
              {fmtNum(rest, 1)} <span className="font-normal text-ink-400">/ {fmtNum(total, 1)} L</span>
            </p>
            <div className="mt-1">
              <ProgressBar valor={rest} max={total || 1} tone={tone} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'volume_recuperado_l',
      header: 'Recuperado',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className="text-[13px] tabular-nums text-forest-700">{fmtNum(r.volume_recuperado_l, 1)} L</span>
      ),
    },
    {
      key: 'laboratorio',
      header: 'Laboratório',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-700">{r.laboratorio}</p>
          <p className="truncate text-[11px] text-ink-400">{r.localizacao || '—'}</p>
        </div>
      ),
    },
    {
      key: 'data_validade',
      header: 'Validade',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_validade)}</span>,
    },
    {
      key: 'situacao',
      header: 'Situação',
      render: (r) => <Badge tone={SITUACAO_TONE[r.situacao] || 'cinza'} dot>{r.situacao}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_SOLVENTE_TONE[r.status] || 'cinza'}>{r.status}</Badge>,
    },
  ];

  return (
    <CrudModule
      titulo="Controle de Solventes"
      subtitulo="Inventário de solventes orgânicos halogenados e não halogenados, com acompanhamento de consumo, validade e recuperação por destilação no próprio LGRP."
      icone={<Wine className="h-5.5 w-5.5" />}
      apiPath="/api/solventes"
      rotuloRegistro="Solvente"
      csvNome="lgrp-solventes"
      podeEditar={podeEditar}
      campos={CAMPOS}
      colunas={colunas}
      filtros={FILTROS}
      buscaCampos={['codigo', 'nome', 'formula', 'cas', 'laboratorio', 'localizacao', 'responsavel']}
      camposData={['data_recebimento', 'data_validade']}
      camposNumericos={['pureza', 'volume_total_l', 'volume_restante_l', 'volume_recuperado_l']}
      valoresIniciais={{
        categoria: 'Não Halogenado',
        status: 'Em Estoque',
        inflamavel: true,
        data_recebimento: hojeISO(),
        pureza: '99.5',
      }}
      resumo={(rows) => {
        const emEstoque = rows.reduce((s, r) => s + Number(r.volume_restante_l || 0), 0);
        const total = rows.reduce((s, r) => s + Number(r.volume_total_l || 0), 0);
        const halo = rows.filter((r) => /Halogenado/.test(r.categoria || '') && !/Não/.test(r.categoria || ''));
        const haloL = halo.reduce((s, r) => s + Number(r.volume_restante_l || 0), 0);
        const recuperado = rows.reduce((s, r) => s + Number(r.volume_recuperado_l || 0), 0);
        const criticos = rows.filter((r) => r.situacao === 'Vencido' || r.situacao === 'Estoque baixo').length;
        return [
          { rotulo: 'Itens cadastrados', valor: String(rows.length), nota: `${criticos} em situação crítica`, tone: criticos ? 'vermelho' : 'cinza' },
          { rotulo: 'Volume em estoque', valor: `${fmtNum(emEstoque, 1)} L`, nota: `de ${fmtNum(total, 1)} L recebidos`, tone: 'azul' },
          { rotulo: 'Halogenados', valor: `${fmtNum(haloL, 1)} L`, nota: `${halo.length} itens segregados`, tone: 'ambar' },
          { rotulo: 'Recuperados', valor: `${fmtNum(recuperado, 1)} L`, nota: 'reaproveitados por destilação', tone: 'verde' },
        ];
      }}
      csvColunas={[
        { key: 'codigo', label: 'Código' },
        { key: 'nome', label: 'Solvente' },
        { key: 'formula', label: 'Fórmula' },
        { key: 'cas', label: 'CAS' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'pureza', label: 'Pureza (%)' },
        { key: 'volume_total_l', label: 'Volume Total (L)' },
        { key: 'volume_restante_l', label: 'Volume Restante (L)' },
        { key: 'volume_recuperado_l', label: 'Volume Recuperado (L)' },
        { key: 'embalagem', label: 'Embalagem' },
        { key: 'laboratorio', label: 'Laboratório' },
        { key: 'localizacao', label: 'Localização' },
        { key: 'data_recebimento', label: 'Recebimento' },
        { key: 'data_validade', label: 'Validade' },
        { key: 'situacao', label: 'Situação' },
        { key: 'status', label: 'Status' },
        { key: 'responsavel', label: 'Responsável' },
      ]}
    />
  );
}
