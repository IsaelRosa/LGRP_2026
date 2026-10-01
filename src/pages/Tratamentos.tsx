import { Recycle } from 'lucide-react';
import CrudModule, { type FiltroDef } from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, type Column } from '../components/ui';
import {
  DESTINOS_FINAIS,
  GRUPOS,
  METODOS_TRATAMENTO,
  STATUS_TRATAMENTO,
  STATUS_TRATAMENTO_TONE,
  UNIDADES,
} from '../lib/constants';
import { fmtData, fmtMoeda, fmtNum, hojeISO } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CAMPOS: FieldDef[] = [
  { name: 'residuo', label: 'Resíduo tratado', type: 'text', required: true, span: 2, placeholder: 'Ex.: Mistura de solventes orgânicos halogenados' },
  { name: 'grupo', label: 'Grupo', type: 'select', options: GRUPOS },
  { name: 'metodo', label: 'Método de tratamento', type: 'select', options: METODOS_TRATAMENTO, required: true },
  { name: 'quantidade_entrada', label: 'Quantidade de entrada', type: 'number', step: '0.01', required: true },
  { name: 'unidade', label: 'Unidade', type: 'select', options: UNIDADES },
  { name: 'quantidade_saida', label: 'Quantidade de saída / recuperada', type: 'number', step: '0.01' },
  { name: 'eficiencia', label: 'Eficiência (%)', type: 'number', step: '0.1', hint: 'Calculada automaticamente se deixada em branco' },
  { name: 'data_inicio', label: 'Data de início', type: 'date', required: true },
  { name: 'data_conclusao', label: 'Data de conclusão', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS_TRATAMENTO, required: true },
  { name: 'operador', label: 'Operador responsável', type: 'text', required: true, placeholder: 'Nome do técnico que executou' },
  { name: 'responsavel_tecnico', label: 'Responsável técnico', type: 'text', placeholder: 'Químico responsável (CRQ)' },
  { name: 'destino_final', label: 'Destino final', type: 'select', options: DESTINOS_FINAIS },
  { name: 'cnpj_destinador', label: 'CNPJ do destinador', type: 'text', placeholder: '00.000.000/0000-00' },
  { name: 'mtr', label: 'MTR (Manifesto de Transporte)', type: 'text', placeholder: 'MTR-2026-000000' },
  { name: 'certificado', label: 'Certificado de Destinação Final (CDF)', type: 'text', placeholder: 'CDF-000000' },
  { name: 'custo', label: 'Custo do tratamento (R$)', type: 'number', step: '0.01' },
  { name: 'observacoes', label: 'Observações técnicas', type: 'textarea', span: 2, placeholder: 'Condições operacionais, não conformidades, laudos analíticos...' },
];

const FILTROS: FiltroDef[] = [
  { name: 'status', label: 'Status', type: 'select', options: STATUS_TRATAMENTO, api: 'status' },
  { name: 'metodo', label: 'Método', type: 'select', options: METODOS_TRATAMENTO, api: 'metodo' },
  { name: 'grupo', label: 'Grupo', type: 'select', options: GRUPOS, api: 'grupo' },
  { name: 'de', label: 'Início a partir de', type: 'date', api: 'de' },
  { name: 'ate', label: 'Início até', type: 'date', api: 'ate' },
];

export default function Tratamentos() {
  const { podeEditar } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (r) => <span className="font-mono text-[12.5px] font-semibold text-forest-800">{r.codigo}</span>,
    },
    {
      key: 'residuo',
      header: 'Resíduo',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{r.residuo}</p>
          <p className="truncate text-[11px] text-ink-500">{r.grupo || '—'}</p>
        </div>
      ),
    },
    {
      key: 'metodo',
      header: 'Método',
      render: (r) => <span className="text-[13px] text-ink-700">{r.metodo}</span>,
    },
    {
      key: 'quantidade_entrada',
      header: 'Entrada',
      className: 'text-right whitespace-nowrap',
      render: (r) => (
        <span className="text-[13px] font-semibold tabular-nums text-ink-800">
          {fmtNum(r.quantidade_entrada, 1)} <span className="font-normal text-ink-400">{r.unidade}</span>
        </span>
      ),
    },
    {
      key: 'quantidade_saida',
      header: 'Saída',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-600">{fmtNum(r.quantidade_saida, 1)}</span>,
    },
    {
      key: 'eficiencia',
      header: 'Eficiência',
      className: 'text-right whitespace-nowrap',
      render: (r) => {
        const e = Number(r.eficiencia || 0);
        return (
          <Badge tone={e >= 90 ? 'verde' : e >= 70 ? 'ambar' : 'vermelho'}>{fmtNum(e, 1)}%</Badge>
        );
      },
    },
    {
      key: 'data_inicio',
      header: 'Início',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_inicio)}</span>,
    },
    {
      key: 'data_conclusao',
      header: 'Conclusão',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.data_conclusao)}</span>,
    },
    {
      key: 'destino_final',
      header: 'Destino final',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-700">{r.destino_final || '—'}</p>
          {r.mtr && <p className="truncate font-mono text-[10.5px] text-ink-400">{r.mtr}</p>}
        </div>
      ),
    },
    {
      key: 'custo',
      header: 'Custo',
      className: 'text-right whitespace-nowrap',
      render: (r) => <span className="text-[13px] tabular-nums text-ink-700">{fmtMoeda(r.custo)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={STATUS_TRATAMENTO_TONE[r.status] || 'cinza'} dot>
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <CrudModule
      titulo="Tratamento de Resíduos"
      subtitulo="Registro dos processos de tratamento interno e da destinação final externa, com eficiência, manifesto de transporte (MTR) e certificado de destinação (CDF)."
      icone={<Recycle className="h-5.5 w-5.5" />}
      apiPath="/api/tratamentos"
      rotuloRegistro="Tratamento"
      csvNome="lgrp-tratamentos"
      podeEditar={podeEditar}
      campos={CAMPOS}
      colunas={colunas}
      filtros={FILTROS}
      buscaCampos={['codigo', 'residuo', 'metodo', 'operador', 'destino_final', 'mtr', 'certificado']}
      camposData={['data_inicio', 'data_conclusao']}
      camposNumericos={['quantidade_entrada', 'quantidade_saida', 'eficiencia', 'custo']}
      valoresIniciais={{
        unidade: 'kg',
        status: 'Agendado',
        metodo: '',
        data_inicio: hojeISO(),
      }}
      paraPayload={(payload) => {
        const ent = Number(payload.quantidade_entrada || 0);
        const sai = Number(payload.quantidade_saida || 0);
        let ef = payload.eficiencia;
        if ((ef === null || ef === undefined || ef === '') && ent > 0 && sai > 0) {
          ef = Math.round(((ent - sai) / ent) * 1000) / 10;
        }
        return { ...payload, eficiencia: ef === null || ef === undefined || ef === '' ? null : Number(ef) };
      }}
      resumo={(rows) => {
        const concluidos = rows.filter((r) => r.status === 'Concluído');
        const kg = concluidos
          .filter((r) => (r.unidade || 'kg') === 'kg')
          .reduce((s, r) => s + Number(r.quantidade_entrada || 0), 0);
        const litros = concluidos
          .filter((r) => r.unidade === 'L')
          .reduce((s, r) => s + Number(r.quantidade_saida || 0), 0);
        const custo = rows.reduce((s, r) => s + Number(r.custo || 0), 0);
        const emAndamento = rows.filter((r) => r.status === 'Em Andamento').length;
        const efic = concluidos.length
          ? concluidos.reduce((s, r) => s + Number(r.eficiencia || 0), 0) / concluidos.length
          : 0;
        return [
          { rotulo: 'Processos registrados', valor: String(rows.length), nota: `${emAndamento} em andamento`, tone: 'cinza' },
          { rotulo: 'Massa tratada', valor: `${fmtNum(kg, 1)} kg`, nota: 'processos concluídos', tone: 'verde' },
          { rotulo: 'Solventes recuperados', valor: `${fmtNum(litros, 1)} L`, nota: 'destilação interna', tone: 'azul' },
          { rotulo: 'Eficiência média', valor: `${fmtNum(efic, 1)}%`, nota: `${fmtMoeda(custo)} em custos`, tone: 'ambar' },
        ];
      }}
      csvColunas={[
        { key: 'codigo', label: 'Código' },
        { key: 'residuo', label: 'Resíduo' },
        { key: 'grupo', label: 'Grupo' },
        { key: 'metodo', label: 'Método' },
        { key: 'quantidade_entrada', label: 'Qtd. Entrada' },
        { key: 'unidade', label: 'Unidade' },
        { key: 'quantidade_saida', label: 'Qtd. Saída' },
        { key: 'eficiencia', label: 'Eficiência (%)' },
        { key: 'data_inicio', label: 'Início' },
        { key: 'data_conclusao', label: 'Conclusão' },
        { key: 'operador', label: 'Operador' },
        { key: 'responsavel_tecnico', label: 'Responsável Técnico' },
        { key: 'destino_final', label: 'Destino Final' },
        { key: 'cnpj_destinador', label: 'CNPJ Destinador' },
        { key: 'mtr', label: 'MTR' },
        { key: 'certificado', label: 'CDF' },
        { key: 'custo', label: 'Custo (R$)' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
