import { setCORS } from './shared.js';
import { query } from './db.js';

const ROTULOS = {
  pedidos_coleta: 'Pedidos de Coleta',
  coletas: 'Coletas',
  tratamentos: 'Tratamentos',
  solventes: 'Solventes',
  reagentes: 'Reagentes',
  vidrarias: 'Vidrarias',
  indicadores_mensais: 'Indicadores Mensais',
  usuarios: 'Usuários',
  notificacoes: 'Notificações',
};

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    if (req.method === 'GET') {
      const where = [];
      const values = [];
      for (const campo of ['tabela', 'acao', 'usuario']) {
        const valor = req.query[campo];
        if (valor && valor !== 'todos') {
          where.push(`${campo} = ?`);
          values.push(valor);
        }
      }
      if (req.query.registro_id) {
        where.push('registro_id = ?');
        values.push(String(req.query.registro_id));
      }
      if (req.query.de) {
        where.push('criado_em >= ?');
        values.push(req.query.de);
      }
      if (req.query.ate) {
        const ate = String(req.query.ate);
        where.push('criado_em <= ?');
        values.push(ate.length === 10 ? `${ate}T23:59:59.999Z` : ate);
      }
      if (req.query.busca) {
        const termo = String(req.query.busca).replace(/[,()%]/g, ' ').trim();
        if (termo) {
          where.push('(descricao LIKE ? OR registro_codigo LIKE ? OR usuario LIKE ?)');
          values.push(`%${termo}%`, `%${termo}%`, `%${termo}%`);
        }
      }
      const limite = Math.min(parseInt(req.query.limit || '200', 10) || 200, 1000);
      const filtro = where.length ? ` WHERE ${where.join(' AND ')}` : '';
      const [data, usuarios] = await Promise.all([
        query(`SELECT * FROM historico${filtro} ORDER BY criado_em DESC LIMIT ?`, [...values, limite]),
        query('SELECT nome FROM usuarios ORDER BY nome'),
      ]);
      return res.status(200).json({
        itens: data.map((h) => ({ ...h, modulo: ROTULOS[h.tabela] || h.tabela })),
        tabelas: Object.keys(ROTULOS).map((k) => ({ valor: k, rotulo: ROTULOS[k] })),
        usuarios: usuarios.map((u) => u.nome),
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
