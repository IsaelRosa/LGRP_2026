import { setCORS, gerarAlertas } from './shared.js';
import { deleteRow, insertRow, query, updateRow } from './db.js';

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    if (req.method === 'GET') {
      await gerarAlertas();
      const where = [];
      const values = [];
      if (req.query.lida === 'true' || req.query.lida === 'false') {
        where.push('lida = ?');
        values.push(req.query.lida === 'true');
      }
      if (req.query.severidade && req.query.severidade !== 'todos') {
        where.push('severidade = ?');
        values.push(req.query.severidade);
      }
      if (req.query.tipo && req.query.tipo !== 'todos') {
        where.push('tipo = ?');
        values.push(req.query.tipo);
      }
      const filtro = where.length ? ` WHERE ${where.join(' AND ')}` : '';
      const data = await query(
        `SELECT * FROM notificacoes${filtro} ORDER BY criado_em DESC LIMIT 300`,
        values
      );
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { titulo, mensagem, severidade = 'info', tipo = 'Aviso', origem, origem_id } =
        req.body || {};
      if (!titulo) return res.status(400).json({ error: 'Título é obrigatório.' });
      const data = await insertRow('notificacoes', {
        titulo,
        mensagem,
        severidade,
        tipo,
        origem,
        origem_id: origem_id || null,
      });
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, lida, todas } = req.body || {};
      if (todas) {
        const anteriores = await query('SELECT * FROM notificacoes WHERE lida = ?', [lida === false]);
        await query('UPDATE notificacoes SET lida = ? WHERE lida = ?', [lida !== false, lida === false]);
        return res.status(200).json(anteriores.map((item) => ({ ...item, lida: lida !== false })));
      }
      if (!id) return res.status(400).json({ error: 'Campo "id" é obrigatório.' });
      const data = await updateRow('notificacoes', id, { lida: !!lida });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id, todasLidas } = req.body || {};
      if (todasLidas) {
        await query('DELETE FROM notificacoes WHERE lida = 1');
        return res.status(200).json({ ok: true });
      }
      if (!id) return res.status(400).json({ error: 'Campo "id" é obrigatório.' });
      await deleteRow('notificacoes', id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}
