import { makeCrud } from './shared.js';

export const CAMPOS = [
  'codigo',
  'nome',
  'formula',
  'cas',
  'fabricante',
  'lote',
  'quantidade',
  'unidade',
  'laboratorio',
  'localizacao',
  'classe_risco',
  'data_aquisicao',
  'data_validade',
  'status',
  'observacoes',
];

function situacao(row) {
  if (!row.data_validade) return 'Sem validade';
  const agora = Date.now();
  const val = new Date(row.data_validade).getTime();
  if (val < agora) return 'Vencido';
  if (val <= agora + 30 * 86400000) return 'A vencer';
  if (val <= agora + 90 * 86400000) return 'Atenção';
  return 'Válido';
}

export default makeCrud({
  tabela: 'reagentes',
  prefixo: 'REA',
  campos: CAMPOS,
  searchable: ['codigo', 'nome', 'formula', 'cas', 'fabricante', 'lote', 'laboratorio', 'localizacao'],
  rotulo: 'Reagente',
  ordenarPor: 'data_validade',
  ascendente: true,
  campoData: 'data_aquisicao',
  beforeInsert: async (body, bruto) => {
    if (!body.data_aquisicao) body.data_aquisicao = new Date().toISOString();
    if (!body.status) body.status = 'Ativo';
    if (!body.unidade) body.unidade = 'g';
    if (!body.classe_risco) body.classe_risco = 'Irritante';
    if (bruto.codigo) body.codigo = bruto.codigo;
  },
  transform: (row) => {
    const s = situacao(row);
    let dias = null;
    if (row.data_validade) {
      dias = Math.ceil((new Date(row.data_validade).getTime() - Date.now()) / 86400000);
    }
    return { ...row, situacao_validade: s, dias_validade: dias };
  },
});
