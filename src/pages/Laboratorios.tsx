import { Building2 } from 'lucide-react';
import CrudModule from '../components/CrudModule';
import type { FieldDef } from '../components/DynamicForm';
import { Badge, type Column } from '../components/ui';
import { fmtData } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const CAMPOS: FieldDef[] = [
  {
    name: 'nome',
    label: 'Nome do laboratório / setor',
    type: 'text',
    required: true,
    span: 2,
    placeholder: 'Ex.: Lab. de Química Analítica',
    hint: 'É este texto que aparece nos registros de pedidos, reagentes, solventes e vidrarias.',
  },
  { name: 'unidade', label: 'Unidade / bloco', type: 'text', placeholder: 'Ex.:Departamento de Química — Bloco C' },
  { name: 'responsavel', label: 'Responsável', type: 'text', placeholder: 'Ex.: Prof.ª Helena Vasconcelos' },
  {
    name: 'ativo',
    label: 'Ativo',
    type: 'boolean',
    hint: 'Inativos somem dos formulários, mas preservam os registros já criados.',
  },
];

export default function Laboratorios() {
  const { podeGerenciarUsuarios } = useAuth();

  const colunas: Column<any>[] = [
    {
      key: 'nome',
      header: 'Laboratório / setor',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-800">{r.nome}</p>
          {r.unidade && <p className="truncate text-[11px] text-ink-500">{r.unidade}</p>}
        </div>
      ),
    },
    {
      key: 'responsavel',
      header: 'Responsável',
      render: (r) => (
        <span className="text-[12.5px] text-ink-700">{r.responsavel || '—'}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Situação',
      render: (r) => (
        <Badge tone={Number(r.ativo) === 1 ? 'verde' : 'cinza'}>
          {Number(r.ativo) === 1 ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'criado_em',
      header: 'Cadastrado em',
      render: (r) => <span className="text-[12px] text-ink-500">{fmtData(r.criado_em)}</span>,
    },
  ];

  return (
    <CrudModule
      titulo="Laboratórios e setores"
      subtitulo="Catálogo que alimenta o campo “Laboratório / setor gerador” em pedidos de coleta, reagentes, solventes e vidrarias. Cadastre aqui em vez de alterar o código."
      icone={<Building2 className="h-5 w-5" />}
      apiPath="/api/laboratorio"
      campos={CAMPOS}
      colunas={colunas}
      buscaCampos={['nome', 'unidade', 'responsavel']}
      csvColunas={[
        { key: 'nome', label: 'Laboratório / setor' },
        { key: 'unidade', label: 'Unidade / bloco' },
        { key: 'responsavel', label: 'Responsável' },
        { key: 'ativo', label: 'Ativo' },
      ]}
      csvNome="laboratorios"
      podeEditar={podeGerenciarUsuarios}
      rotuloRegistro="laboratório"
      paraForm={(row) => ({ ativo: Number(row.ativo) === 1 })}
      paraPayload={(form) => ({ ...form, ativo: form.ativo ? 1 : 0 })}
      valoresIniciais={{ ativo: true }}
      resumo={(rows) => {
        const ativos = rows.filter((r) => Number(r.ativo) === 1).length;
        const semResp = rows.filter((r) => !r.responsavel).length;
        return [
          { rotulo: 'Cadastrados', valor: String(rows.length), nota: 'no catálogo', tone: 'azul' },
          { rotulo: 'Ativos', valor: String(ativos), nota: 'disponíveis em formulários', tone: 'verde' },
          {
            rotulo: 'Inativos',
            valor: String(rows.length - ativos),
            nota: 'ocultos dos formulários',
            tone: 'cinza',
          },
          {
            rotulo: 'Sem responsável',
            valor: String(semResp),
            nota: 'defina para(localizar o contato)',
            tone: semResp ? 'ambar' : 'cinza',
          },
        ];
      }}
    />
  );
}