import { makeCrud } from './shared.js';

export const CAMPOS = [
  'pedido_id',
  'data_coleta',
  'coletor',
  'equipe',
  'peso_kg',
  'volume_l',
  'unidades',
  'destino_temporario',
  'veiculo',
  'mtr',
  'observacoes',
];

export default makeCrud({
  tabela: 'coletas',
  campos: CAMPOS,
  searchable: ['coletor', 'equipe', 'mtr', 'destino_temporario', 'veiculo'],
  rotulo: 'Registro de coleta',
  ordenarPor: 'data_coleta',
  campoData: 'data_coleta',
  temAtualizadoEm: false,
  beforeInsert: async (body, bruto) => {
    if (!body.data_coleta) body.data_coleta = new Date().toISOString();
    if (bruto.pedido_id) body.pedido_id = bruto.pedido_id;
  },
});
