import { ShieldCheck, Users } from 'lucide-react';
import CrudModule, { type FiltroDef } from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, type Column } from '../components/ui';
import { LABORATORIOS, PAPEIS, PAPEL_TONE } from '../lib/constants';
import { fmtData } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CAMPOS: FieldDef[] = [
  { name: 'nome', label: 'Nome completo', type: 'text', required: true, span: 2, placeholder: 'Ex.: Dra. Helena Vasconcelos Prado' },
  { name: 'email', label: 'E-mail institucional', type: 'text', required: true, placeholder: 'nome@universidade.br' },
  { name: 'papel', label: 'Papel / perfil de acesso', type: 'select', options: PAPEIS, required: true },
  { name: 'setor', label: 'Setor / lotação', type: 'select', options: LABORATORIOS },
  { name: 'crq', label: 'Registro profissional (CRQ)', type: 'text', placeholder: 'Ex.: CRQ-IV 04352891' },
  { name: 'telefone', label: 'Telefone / ramal', type: 'text', placeholder: '(00) 00000-0000' },
  { name: 'ativo', label: 'Usuário ativo', type: 'boolean', hint: 'Usuários inativos não podem operar o sistema' },
];

const FILTROS: FiltroDef[] = [
  { name: 'papel', label: 'Papel', type: 'select', options: PAPEIS, api: 'papel' },
  { name: 'setor', label: 'Setor', type: 'select', options: LABORATORIOS, api: 'setor' },
];

const DESCRICAO_PAPEL: Record<string, string> = {
  Administrador: 'Acesso total, incluindo gestão de usuários e configurações.',
  'Químico Responsável': 'Valida tratamentos, destinação e assina certificados (CDF).',
  'Gestor Ambiental': 'Acompanha indicadores, relatórios e conformidade normativa.',
  'Técnico de Laboratório': 'Registra pedidos, coletas, solventes, reagentes e vidrarias.',
  Consultor: 'Acesso somente leitura a dashboards e relatórios.',
};

export default function Usuarios() {
  const { podeGerenciarUsuarios, perfil } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'nome',
      header: 'Usuário',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forest-600 to-forest-800 text-[11px] font-bold text-white">
            {iniciais(r.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold capitalize text-ink-900">
              {r.nome}
              {perfil?.email && r.email === perfil.email && (
                <span className="ml-1.5 text-[10.5px] font-medium text-forest-600">(você)</span>
              )}
            </p>
            <p className="truncate text-[11.5px] text-ink-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'papel',
      header: 'Papel',
      render: (r) => (
        <div className="min-w-0">
          <Badge tone={PAPEL_TONE[r.papel] || 'cinza'}>{r.papel}</Badge>
          <p className="mt-1 hidden max-w-[16rem] truncate text-[10.5px] text-ink-400 lg:block">
            {DESCRICAO_PAPEL[r.papel] || ''}
          </p>
        </div>
      ),
    },
    { key: 'setor', header: 'Setor / lotação', render: (r) => <span className="text-[12.5px] text-ink-700">{r.setor || '—'}</span> },
    { key: 'crq', header: 'CRQ', render: (r) => <span className="font-mono text-[12px] text-ink-600">{r.crq || '—'}</span> },
    { key: 'telefone', header: 'Contato', render: (r) => <span className="text-[12.5px] text-ink-600">{r.telefone || '—'}</span> },
    {
      key: 'ativo',
      header: 'Situação',
      render: (r) => (
        <Badge tone={r.ativo ? 'verde' : 'cinza'} dot>
          {r.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'criado_em',
      header: 'Cadastrado em',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-xs text-ink-600">{fmtData(r.criado_em)}</span>,
    },
  ];

  return (
    <CrudModule
      titulo="Gerenciamento de Usuários"
      subtitulo="Cadastro de servidores e colaboradores com perfil de acesso, lotação e registro profissional. Perfis controlam as permissões de escrita em cada módulo do sistema."
      icone={<Users className="h-5.5 w-5.5" />}
      apiPath="/api/usuarios"
      rotuloRegistro="Usuário"
      csvNome="lgrp-usuarios"
      podeEditar={podeGerenciarUsuarios}
      campos={CAMPOS}
      colunas={colunas}
      filtros={FILTROS}
      buscaCampos={['nome', 'email', 'setor', 'papel', 'crq']}
      valoresIniciais={{ papel: 'Técnico de Laboratório', ativo: true }}
      mostrarDetalhe={false}
      resumo={(rows) => {
        const ativos = rows.filter((r) => r.ativo).length;
        const admins = rows.filter((r) => r.papel === 'Administrador').length;
        const tecnicos = rows.filter((r) => r.papel === 'Técnico de Laboratório').length;
        return [
          { rotulo: 'Usuários cadastrados', valor: String(rows.length), nota: `${ativos} ativos`, tone: 'cinza' },
          { rotulo: 'Administradores', valor: String(admins), nota: 'acesso total ao sistema', tone: 'azul' },
          { rotulo: 'Técnicos', valor: String(tecnicos), nota: 'operação diária dos módulos', tone: 'verde' },
          { rotulo: 'Inativos', valor: String(rows.length - ativos), nota: 'sem permissão de operação', tone: 'ambar' },
        ];
      }}
      detalheExtra={() => (
        <div className="flex items-start gap-2 rounded-lg border border-forest-200 bg-forest-50/70 px-3 py-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" />
          <p className="text-[11px] leading-relaxed text-forest-800">
            O perfil de acesso determina quais módulos podem ser editados. Alterações de perfil são
            registradas na trilha de auditoria.
          </p>
        </div>
      )}
      csvColunas={[
        { key: 'nome', label: 'Nome' },
        { key: 'email', label: 'E-mail' },
        { key: 'papel', label: 'Papel' },
        { key: 'setor', label: 'Setor' },
        { key: 'crq', label: 'CRQ' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'ativo', label: 'Ativo' },
        { key: 'criado_em', label: 'Cadastrado em' },
      ]}
    />
  );
}

function iniciais(nome: string) {
  const p = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '??';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
