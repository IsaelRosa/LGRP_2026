import { makeCrud } from './shared.js';

export const CAMPOS = [
  'codigo',
  'nome',
  'formula',
  'cas',
  'categoria',
  'pureza',
  'volume_total_l',
  'volume_restante_l',
  'volume_recuperado_l',
  'embalagem',
  'laboratorio',
  'localizacao',
  'data_recebimento',
  'data_validade',
  'status',
  'inflamavel',
  'responsavel',
  'observacoes',
];

function situacao(row) {
  const total = Number(row.volume_total_l || 0);
  const rest = Number(row.volume_restante_l || 0);
  const agora = new Date().toISOString();
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString();
  if (row.data_validade && row.data_validade < agora) return 'Vencido';
  if (row.data_validade && row.data_validade <= em30) return 'A vencer';
  if (total > 0 && rest / total <= 0.15) return 'Estoque baixo';
  if (rest <= 0) return 'Esgotado';
  return 'Regular';
}

export default makeCrud({
  tabela: 'solventes',
  prefixo: 'SOL',
  campos: CAMPOS,
  searchable: ['codigo', 'nome', 'formula', 'cas', 'laboratorio', 'localizacao', 'categoria'],
  rotulo: 'Solvente',
  ordenarPor: 'id',
  campoData: 'data_recebimento',
  beforeInsert: async (body, bruto) => {
    if (!body.data_recebimento) body.data_recebimento = new Date().toISOString();
    if (!body.status) body.status = 'Em Estoque';
    if (!body.categoria) body.categoria = 'Não Halogenado';
    if (body.volume_restante_l === undefined || body.volume_restante_l === null) {
      body.volume_restante_l = body.volume_total_l;
    }
    if (bruto.codigo) body.codigo = bruto.codigo;
  },
  transform: (row) => ({ ...row, situacao: situacao(row) }),
});
