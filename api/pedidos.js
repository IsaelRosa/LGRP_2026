import { makeCrud, registrarHistorico } from './shared.js';
import { insertRow } from './db.js';

export const CAMPOS = [
  'codigo',
  'laboratorio',
  'solicitante',
  'usuario_id',
  'tipo_residuo',
  'grupo',
  'classe',
  'quantidade_estimada',
  'unidade',
  'embalagem',
  'local_coleta',
  'data_solicitacao',
  'data_prevista',
  'data_coleta',
  'status',
  'prioridade',
  'responsavel',
  'risco',
  'observacoes',
];

export default makeCrud({
  tabela: 'pedidos_coleta',
  prefixo: 'PED',
  campos: CAMPOS,
  searchable: ['codigo', 'laboratorio', 'solicitante', 'tipo_residuo', 'local_coleta', 'responsavel'],
  rotulo: 'Pedido de coleta',
  ordenarPor: 'id',
  campoData: 'data_solicitacao',
  beforeInsert: async (body, bruto) => {
    if (!body.data_solicitacao) body.data_solicitacao = new Date().toISOString();
    if (!body.status) body.status = 'Solicitado';
    if (!body.prioridade) body.prioridade = 'Média';
    if (!body.unidade) body.unidade = 'kg';
    if (bruto.codigo) body.codigo = bruto.codigo;
  },
  afterWrite: async (metodo, data, antes) => {
    if (metodo === 'PUT' && antes && antes.status !== data.status) {
      await insertRow('notificacoes', {
        tipo: 'Status atualizado',
        severidade: data.status === 'Destinado' ? 'sucesso' : 'info',
        titulo: `Pedido ${data.codigo} → ${data.status}`,
        mensagem: `O pedido de coleta ${data.codigo} do laboratório ${data.laboratorio} mudou de "${antes.status}" para "${data.status}".`,
        origem: 'pedidos_coleta',
        origem_id: String(data.id),
      });
    }
  },
});

export { registrarHistorico };
