import { TestTubes } from 'lucide-react';
import CrudModule, { type FiltroDef } from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, type Column } from '../components/ui';
import {
  CLASSES_RISCO,
  FABRICANTES,
  LABORATORIOS,
  LOCAIS_ARMAZENAMENTO,
  RISCO_TONE,
  SITUACAO_TONE,
  STATUS_REAGENTE,
  STATUS_REAGENTE_TONE,
} from '../lib/constants';
import { fmtData, fmtNum, hojeISO } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const UNIDADES_REAGENTE = ['g', 'kg', 'mg', 'mL', 'L', 'un'];

const CAMPOS: FieldDef[] = [
  { name: 'nome', label: 'Nome do reagente', type: 'text', required: true, placeholder: 'Ex.: Ácido sulfúrico P.A.' },
  { name: 'formula', label: 'Fórmula molecular', type: 'text', placeholder: 'Ex.: H₂SO₄' },
  { name: 'cas', label: 'Número CAS', type: 'text', placeholder: 'Ex.: 7664-93-9' },
  { name: 'classe_risco', label: 'Classe de risco (GHS)', type: 'select', options: CLASSES_RISCO, required: true },
  { name: 'fabricante', label: 'Fabricante', type: 'select', options: FABRICANTES },
  { name: 'lote', label: 'Lote', type: 'text', placeholder: 'Ex.: SLBV4821' },
  { name: 'quantidade', label: 'Quantidade', type: 'number', step: '0.01', required: true },
  { name: 'unidade', label: 'Unidade', type: 'select', options: UNIDADES_REAGENTE },
  { name: 'laboratorio', label: 'Laboratório / setor', type: 'select', options: LABORATORIOS, required: true },
  { name: 'localizacao', label: 'Local de armazenamento', type: 'select', options: LOCAIS_ARMAZENAMENTO },
  { name: 'data_aquisicao', label: 'Data de aquisição', type: 'date', required: true },
  { name: 'data_validade', label: 'Data de validade', type: 'date', required: true },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_REAGENTE, required: true },
  { name: 'observacoes', label: 'Observações', type: 'textarea', span: 2, placeholder: 'Condições de armazenamento, incompatibilidades, fracionamento...' },
];

const FILTROS: FiltroDef[] = [
  { name: 'situacao_validade', label: 'Situação da validade', type: 'select', options: ['Vencido', 'A vencer', 'Atenção', 'Válido', 'Sem validade'] },
  { name: 'classe_risco', label: 'Classe de risco', type: 'select', options: CLASSES_RISCO, api: 'classe_risco' },
  { name: 'laboratorio', label: 'Laboratório', type: 'select', options: LABORATORIOS, api: 'laboratorio' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_REAGENTE, api: 'status' },
  { name: 'de', label: 'Adquirido a partir de', type: 'date', api: 'de' },
];

export default function Reagentes() {
  const { podeEditar } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => <span className="font-mono text-[12.5px] font-semibold text-forest-800">{r.codigo}</span>,
    },
    {
      key: 'nome',
      header: 'Reagente',
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
      key: 'classe_risco',
      header: 'Risco',
      render: (r) => <Badge tone={RISCO_TONE[r.classe_risco] || 'cinza'}>{r.classe_risco || '—'}</Badge>,
    },
    {
      key: 'quantidade',
      header: 'Quantidade',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className="text-[13px] font-semibold tabular-nums text-ink-800">
          {fmtNum(r.quantidade, 2)} <span className="font-normal text-ink-400">{r.unidade}</span>
        </span>
      ),
    },
    {
      key: 'lote',
      header: 'Lote / Fabricante',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-[12px] text-ink-700">{r.lote || '—'}</p>
          <p className="truncate text-[11px] text-ink-400">{r.fabricante || '—'}</p>
        </div>
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
      render: (r) => {
        const vencido = r.situacao_validade === 'Vencido';
        return (
          <div>
            <p className={`text-xs ${vencido ? 'font-semibold text-brick-600' : 'text-ink-600'}`}>
              {fmtData(r.data_validade)}
            </p>
            {r.dias_validade != null && (
              <p className={`text-[10.5px] ${vencido ? 'text-brick-500' : 'text-ink-400'}`}>
                {r.dias_validade < 0
                  ? `${Math.abs(r.dias_validade)} dia(s) vencido`
                  : `faltam ${r.dias_validade} dia(s)`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'situacao_validade',
      header: 'Situação',
      render: (r) => <Badge tone={SITUACAO_TONE[r.situacao_validade] || 'cinza'} dot>{r.situacao_validade}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={STATUS_REAGENTE_TONE[r.status] || 'cinza'}>{r.status}</Badge>,
    },
  ];

  return (
    <CrudModule
      titulo="Banco de Reagentes"
      subtitulo="Inventário de reagentes químicos com controle de lote, validade e classe de risco. Itens vencidos ou próximos do vencimento geram alertas automáticos no sistema."
      icone={<TestTubes className="h-5.5 w-5.5" />}
      apiPath="/api/reagentes"
      rotuloRegistro="Reagente"
      csvNome="lgrp-banco-reagentes"
      podeEditar={podeEditar}
      campos={CAMPOS}
      colunas={colunas}
      filtros={FILTROS}
      buscaCampos={['codigo', 'nome', 'formula', 'cas', 'lote', 'fabricante', 'laboratorio', 'localizacao']}
      camposData={['data_aquisicao', 'data_validade']}
      camposNumericos={['quantidade']}
      valoresIniciais={{
        unidade: 'g',
        status: 'Ativo',
        classe_risco: 'Irritante',
        data_aquisicao: hojeISO(),
      }}
      resumo={(rows) => {
        const vencidos = rows.filter((r) => r.situacao_validade === 'Vencido');
        const aVencer = rows.filter((r) => r.situacao_validade === 'A vencer');
        const segregados = rows.filter((r) => r.status === 'Segregado para Coleta').length;
        return [
          { rotulo: 'Reagentes no banco', valor: String(rows.length), nota: `${segregados} segregados para coleta`, tone: 'cinza' },
          { rotulo: 'Vencidos', valor: String(vencidos.length), nota: 'exigem segregação e coleta imediata', tone: 'vermelho' },
          { rotulo: 'A vencer (30 dias)', valor: String(aVencer.length), nota: 'priorizar uso ou destinação', tone: 'ambar' },
          {
            rotulo: 'Classes de risco críticas',
            valor: String(rows.filter((r) => ['Tóxico', 'Cancerígeno', 'Corrosivo', 'Inflamável'].includes(r.classe_risco)).length),
            nota: 'armazenamento especial',
            tone: 'azul',
          },
        ];
      }}
      csvColunas={[
        { key: 'codigo', label: 'Código' },
        { key: 'nome', label: 'Reagente' },
        { key: 'formula', label: 'Fórmula' },
        { key: 'cas', label: 'CAS' },
        { key: 'classe_risco', label: 'Classe de Risco' },
        { key: 'fabricante', label: 'Fabricante' },
        { key: 'lote', label: 'Lote' },
        { key: 'quantidade', label: 'Quantidade' },
        { key: 'unidade', label: 'Unidade' },
        { key: 'laboratorio', label: 'Laboratório' },
        { key: 'localizacao', label: 'Localização' },
        { key: 'data_aquisicao', label: 'Aquisição' },
        { key: 'data_validade', label: 'Validade' },
        { key: 'situacao_validade', label: 'Situação' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
