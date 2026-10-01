import { setCORS, currentUser, diffCampos, registrarHistorico } from './shared.js';
import { enviarConviteSenha, verificarMailer } from './auth-routes.js';
import { deleteRow, insertRow, one, query, updateRow } from './db.js';

const CAMPOS = ['nome', 'email', 'papel', 'setor', 'crq', 'telefone', 'ativo'];
const CAMPOS_BUSCA = ['nome', 'email', 'setor', 'papel', 'crq'];

function permitido(req, res) {
  if (req.authUser?.papel === 'Administrador') return true;
  res.status(403).json({ error: 'Somente administradores podem gerenciar usuários.' });
  return false;
}

function pick(obj) {
  return Object.fromEntries(
    CAMPOS.filter((campo) => obj[campo] !== undefined).map((campo) => [
      campo,
      obj[campo] === '' ? null : obj[campo],
    ])
  );
}

function validarPerfil(body) {
  if (body.nome !== undefined && String(body.nome).trim().length < 3) return 'Informe o nome completo.';
  if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
    return 'Informe um endereço de e-mail válido.';
  }
  return null;
}

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    const user = await currentUser(req);
    if (!permitido(req, res)) return;

    if (req.method === 'GET') {
      const where = [];
      const values = [];
      for (const campo of ['papel', 'setor']) {
        const value = req.query[campo];
        if (value && value !== 'todos' && value !== 'Todas' && value !== 'Todos') {
          where.push(`${campo} = ?`);
          values.push(value);
        }
      }
      if (req.query.busca) {
        const termo = String(req.query.busca).replace(/[,()%]/g, ' ').trim();
        if (termo) {
          where.push(`(${CAMPOS_BUSCA.map((campo) => `\`${campo}\` LIKE ?`).join(' OR ')})`);
          values.push(...CAMPOS_BUSCA.map(() => `%${termo}%`));
        }
      }
      const rows = await query(
        `SELECT id, nome, email, papel, setor, crq, telefone, ativo, criado_em FROM usuarios${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY id ASC LIMIT 3000`,
        values
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const body = pick(req.body || {});
      body.nome = String(body.nome || '').trim();
      body.email = String(body.email || '').trim().toLowerCase();
      const erro = validarPerfil(body);
      if (erro) return res.status(400).json({ error: erro });
      if (await one('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [body.email])) {
        return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      }
      await verificarMailer();
      if (body.ativo === undefined || body.ativo === null) body.ativo = 1;
      if (!body.papel) body.papel = 'Técnico de Laboratório';
      const criado = await insertRow('usuarios', body);
      let conviteEnviado = false;
      try {
        await enviarConviteSenha(criado);
        conviteEnviado = true;
      } catch (error) {
        console.error('User invitation email failed:', error.message);
      }
      await registrarHistorico({
        tabela: 'usuarios',
        registroId: criado.id,
        codigo: `#${criado.id}`,
        acao: 'INSERT',
        descricao: `Usuário criado (${criado.email})`,
        usuario: user,
        depois: body,
      });
      return res.status(201).json({
        id: criado.id,
        ...body,
        criado_em: criado.criado_em,
        convite_enviado: conviteEnviado,
      });
    }

    if (req.method === 'PUT') {
      const id = req.body?.id ?? req.query.id;
      if (!id) return res.status(400).json({ error: 'Campo "id" é obrigatório.' });
      const antes = await one(
        'SELECT id, nome, email, papel, setor, crq, telefone, ativo, criado_em FROM usuarios WHERE id = ? LIMIT 1',
        [id]
      );
      if (!antes) return res.status(404).json({ error: 'Usuário não encontrado.' });
      const body = pick(req.body || {});
      if (Number(id) === Number(user.id) && (body.papel && body.papel !== 'Administrador' || body.ativo === false || body.ativo === 0)) {
        return res.status(400).json({ error: 'Não é possível remover suas próprias permissões de administrador.' });
      }
      if (body.email !== undefined) body.email = String(body.email).trim().toLowerCase();
      if (body.nome !== undefined) body.nome = String(body.nome).trim();
      const erro = validarPerfil(body);
      if (erro) return res.status(400).json({ error: erro });
      body.atualizado_em = new Date();
      const salvo = await updateRow('usuarios', id, body);
      const publico = Object.fromEntries(CAMPOS.concat('id', 'criado_em').map((campo) => [campo, salvo[campo]]));
      const mudancas = diffCampos(antes, salvo, CAMPOS);
      await registrarHistorico({
        tabela: 'usuarios',
        registroId: id,
        codigo: `#${id}`,
        acao: 'UPDATE',
        descricao: `Usuário atualizado (${salvo.email})`,
        usuario: user,
        antes,
        depois: publico,
        mudancas: Object.keys(mudancas).length ? mudancas : null,
      });
      return res.status(200).json(publico);
    }

    if (req.method === 'DELETE') {
      const id = req.body?.id ?? req.query.id;
      if (!id) return res.status(400).json({ error: 'Campo "id" é obrigatório.' });
      if (Number(id) === Number(user.id)) return res.status(400).json({ error: 'Não é possível excluir a própria conta.' });
      const antes = await one(
        'SELECT id, nome, email, papel, setor, crq, telefone, ativo, criado_em FROM usuarios WHERE id = ? LIMIT 1',
        [id]
      );
      if (!antes) return res.status(404).json({ error: 'Usuário não encontrado.' });
      if (antes.papel === 'Administrador' && Number(antes.ativo) === 1) {
        const admins = await one("SELECT COUNT(*) AS total FROM usuarios WHERE papel = 'Administrador' AND ativo = 1");
        if (Number(admins.total) <= 1) {
          return res.status(400).json({ error: 'O último administrador ativo não pode ser removido.' });
        }
      }
      await deleteRow('usuarios', id);
      await registrarHistorico({
        tabela: 'usuarios',
        registroId: id,
        codigo: `#${id}`,
        acao: 'DELETE',
        descricao: `Usuário excluído (${antes.email})`,
        usuario: user,
        antes,
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}