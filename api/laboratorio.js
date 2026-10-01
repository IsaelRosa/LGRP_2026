import { makeCrud, registrarHistorico, setCORS, currentUser } from './shared.js';
import { deleteRow, one, query } from './db.js';

export const CAMPOS = ['nome', 'unidade', 'responsavel', 'ativo'];

const erro = (statusCode, message) => Object.assign(new Error(message), { statusCode });

/**
 * Onde cada laboratório é usado.
 * Os cadastros guardam `laboratorio` como texto, então a contagem é por nome.
 * Isso permite avisar antes de excluir ou renomear um item em uso.
 */
async function contarUso(nomes) {
  const contagem = {};
  if (!nomes.length) return contagem;
  const fontes = [
    ['pedidos_coleta', 'laboratorio'],
    ['reagentes', 'laboratorio'],
    ['solventes', 'laboratorio'],
    ['vidrarias', 'laboratorio'],
    ['usuarios', 'setor'],
  ];
  for (const [tabela, campo] of fontes) {
    const linhas = await query(
      `SELECT \`${campo}\` AS ref, COUNT(*) AS total FROM \`${tabela}\` WHERE \`${campo}\` IN (${nomes
        .map(() => '?')
        .join(', ')}) GROUP BY \`${campo}\``,
      nomes
    );
    for (const linha of linhas) {
      if (!linha.ref) continue;
      contagem[linha.ref] = (contagem[linha.ref] || 0) + Number(linha.total || 0);
    }
  }
  return contagem;
}

function validarNome(nome) {
  const limpo = String(nome || '').trim();
  if (limpo.length < 3) throw erro(400, 'Informe o nome do laboratório ou setor.');
  return limpo;
}

const crud = makeCrud({
  tabela: 'laboratorio',
  campos: CAMPOS,
  searchable: ['nome', 'unidade', 'responsavel'],
  rotulo: 'Laboratório',
  ordenarPor: 'nome',
  ascendente: true,
  beforeInsert: async (body, bruto) => {
    body.nome = validarNome(bruto.nome);
    if (body.unidade === undefined) body.unidade = '';
    if (body.responsavel === undefined) body.responsavel = '';
  },
  beforeUpdate: async (body, bruto, antes) => {
    if (body.nome !== undefined) body.nome = validarNome(bruto.nome);
    if (body.nome && body.nome !== antes.nome) {
      const { usos } = await usoDe(antes.nome);
      if (usos > 0) {
        throw erro(
          409,
          `"${antes.nome}" é usado em ${usos} registro(s). Renomear deixaria esses registros com o texto antigo. Desative o laboratório em vez de renomear.`
        );
      }
    }
  },
});

async function usoDe(nome) {
  const contagem = await contarUso([nome]);
  return { nome, usos: contagem[nome] || 0 };
}

export default async function handler(req, res) {
  if (setCORS(req, res)) return;

  // Relatório de uso: GET /api/laboratorio?uso=1&nomes=A,B
  if (req.method === 'GET' && req.query.uso) {
    try {
      await currentUser(req);
      const nomes = String(req.query.nomes || '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
      return res.status(200).json(await contarUso(nomes));
    } catch (e) {
      return res.status(e.statusCode || 500).json({ error: e.message });
    }
  }

  // Exclusão protegida: bloqueia remover laboratório já usado em cadastros.
  if (req.method === 'DELETE') {
    try {
      const user = await currentUser(req);
      const id = (req.body || {}).id ?? req.query.id;
      if (!id) return res.status(400).json({ error: 'Campo "id" é obrigatório.' });
      const antes = await one('SELECT * FROM `laboratorio` WHERE id = ? LIMIT 1', [id]);
      if (!antes) return res.status(404).json({ error: 'Laboratório não encontrado.' });
      const { usos } = await usoDe(antes.nome);
      if (usos > 0) {
        return res.status(409).json({
          error: `"${antes.nome}" é usado em ${usos} registro(s) e não pode ser excluído. Desative-o para retirá-lo dos formulários.`,
        });
      }
      await deleteRow('laboratorio', id);
      await registrarHistorico({
        tabela: 'laboratorio',
        registroId: id,
        codigo: antes.nome,
        acao: 'DELETE',
        descricao: `Laboratório excluído (${antes.nome})`,
        usuario: user,
        antes,
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Laboratorio API error:', e);
      return res.status(e.statusCode || 500).json({ error: e.message });
    }
  }

  return crud(req, res);
}