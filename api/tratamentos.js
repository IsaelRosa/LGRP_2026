import { makeCrud } from './shared.js';

export const CAMPOS = [
  'codigo',
  'pedido_id',
  'residuo',
  'grupo',
  'metodo',
  'quantidade_entrada',
  'unidade',
  'quantidade_saida',
  'eficiencia',
  'data_inicio',
  'data_conclusao',
  'operador',
  'responsavel_tecnico',
  'destino_final',
  'cnpj_destinador',
  'mtr',
  'certificado',
  'custo',
  'status',
  'observacoes',
];

export default makeCrud({
  tabela: 'tratamentos',
  prefixo: 'TRT',
  campos: CAMPOS,
  searchable: ['codigo', 'residuo', 'metodo', 'operador', 'destino_final', 'mtr', 'certificado'],
  rotulo: 'Tratamento de resíduo',
  ordenarPor: 'id',
  campoData: 'data_inicio',
  beforeInsert: async (body, bruto) => {
    if (!body.data_inicio) body.data_inicio = new Date().toISOString();
    if (!body.status) body.status = 'Agendado';
    if (!body.unidade) body.unidade = 'kg';
    if (bruto.codigo) body.codigo = bruto.codigo;
  },
});
