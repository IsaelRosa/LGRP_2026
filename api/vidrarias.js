import { makeCrud } from './shared.js';

export const CAMPOS = [
  'codigo',
  'tipo',
  'laboratorio',
  'contaminante',
  'classe_contaminante',
  'nivel_contaminacao',
  'quantidade',
  'data_registro',
  'data_descontaminacao',
  'metodo_descontaminacao',
  'responsavel',
  'status',
  'destino',
  'observacoes',
];

export default makeCrud({
  tabela: 'vidrarias',
  prefixo: 'VID',
  campos: CAMPOS,
  searchable: ['codigo', 'tipo', 'laboratorio', 'contaminante', 'responsavel', 'metodo_descontaminacao'],
  rotulo: 'Vidraria contaminada',
  ordenarPor: 'id',
  campoData: 'data_registro',
  beforeInsert: async (body, bruto) => {
    if (!body.data_registro) body.data_registro = new Date().toISOString();
    if (!body.status) body.status = 'Aguardando Descontaminação';
    if (!body.nivel_contaminacao) body.nivel_contaminacao = 'Médio';
    if (!body.quantidade) body.quantidade = 1;
    if (bruto.codigo) body.codigo = bruto.codigo;
  },
});
