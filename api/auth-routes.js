import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { one, query, updateRow } from './db.js';

const router = Router();

function jwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) throw new Error('JWT_SECRET precisa ter ao menos 32 caracteres.');
  return secret;
}

function tokenFor(user) {
  return jwt.sign({ sub: String(user.id) }, jwtSecret(), { expiresIn: '8h' });
}

function publicUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel,
    setor: user.setor || '',
    crq: user.crq || '',
    telefone: user.telefone || '',
    ativo: Boolean(user.ativo),
  };
}

function unauthorized(res) {
  return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
}

function mailer() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error('O envio de e-mails não está configurado no servidor.');
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function verificarMailer() {
  await mailer().verify();
}

export async function enviarConviteSenha(user) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const link = `${process.env.APP_ORIGIN.replace(/\/$/, '')}/redefinir-senha?token=${token}`;
  await updateRow('usuarios', user.id, {
    password_setup_token_hash: tokenHash,
    password_setup_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await mailer().sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: 'Ative seu acesso ao LGRP',
    text: `Olá, ${user.nome}. Configure sua senha no link a seguir, válido por 24 horas: ${link}`,
    html: `<p>Olá, ${String(user.nome).replace(/[&<>"']/g, '')}.</p><p><a href="${link}">Configure sua senha no LGRP</a>. Este link expira em 24 horas.</p>`,
  });
}

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token) return unauthorized(res);

  try {
    const payload = jwt.verify(token, jwtSecret());
    const user = await one(
      'SELECT id, nome, email, papel, setor, crq, telefone, ativo FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
      [payload.sub]
    );
    if (!user) return unauthorized(res);
    req.authUser = publicUser(user);
    return next();
  } catch {
    return unauthorized(res);
  }
}

router.post('/password/request', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const resposta = { ok: true, message: 'Se houver uma conta ativa para este e-mail, enviaremos um link de configuração de senha.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(200).json(resposta);
  try {
    const user = await one('SELECT id, nome, email FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1', [email]);
    if (user) await enviarConviteSenha(user);
  } catch (error) {
    console.error('Password setup email failed:', error.message);
  }
  return res.status(200).json(resposta);
});

router.post('/password/complete', async (req, res) => {
  const token = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'Link inválido ou expirado. Solicite outro.' });
  const tokenHash = createHash('sha256').update(token).digest('hex');
  try {
    const result = await query(
      'UPDATE usuarios SET password_hash = ?, password_setup_token_hash = NULL, password_setup_token_expires_at = NULL WHERE password_setup_token_hash = ? AND password_setup_token_expires_at > UTC_TIMESTAMP() AND ativo = 1',
      [await bcrypt.hash(password, 12), tokenHash]
    );
    if (!result.affectedRows) return res.status(400).json({ error: 'Link inválido ou expirado. Solicite outro.' });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Password setup error:', error.message);
    return res.status(500).json({ error: 'Não foi possível configurar a senha.' });
  }
});

router.post('/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  try {
    const user = await one('SELECT * FROM usuarios WHERE email = ? LIMIT 1', [email]);
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    if (!user.ativo) return res.status(403).json({ error: 'Conta desativada. Procure um administrador.' });
    return res.status(200).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ error: 'Não foi possível entrar.' });
  }
});

router.get('/me', requireAuth, (req, res) => res.status(200).json({ user: req.authUser }));

function oauthConfig() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_ORIGIN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_ORIGIN) {
    throw new Error('Login Google não configurado no servidor.');
  }
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${APP_ORIGIN.replace(/\/$/, '')}/api/auth/google/callback`;
  return {
    clientId: GOOGLE_CLIENT_ID,
    origin: APP_ORIGIN.replace(/\/$/, ''),
    client: new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri),
  };
}

function readCookie(req, name) {
  const prefix = `${name}=`;
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : '';
}

function stateMatches(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function popupResponse(res, origin, payload) {
  const safeOrigin = JSON.stringify(origin).replace(/</g, '\\u003c');
  const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c');
  res.type('html').send(
    `<!doctype html><meta charset="utf-8"><script>window.opener?.postMessage(${safePayload},${safeOrigin});window.close();</script>`
  );
}

router.get('/google', (req, res) => {
  try {
    const { client } = oauthConfig();
    const state = randomBytes(32).toString('hex');
    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google',
    });
    return res.redirect(
      client.generateAuthUrl({
        access_type: 'online',
        prompt: 'select_account',
        scope: ['openid', 'email', 'profile'],
        state,
      })
    );
  } catch (error) {
    return res.status(503).send(error.message);
  }
});

router.get('/google/callback', async (req, res) => {
  let origin = process.env.APP_ORIGIN || '';
  try {
    const { clientId, client, origin: configuredOrigin } = oauthConfig();
    origin = configuredOrigin;
    const expectedState = readCookie(req, 'google_oauth_state');
    res.clearCookie('google_oauth_state', { path: '/api/auth/google' });
    if (!expectedState || !stateMatches(expectedState, String(req.query.state || ''))) {
      return popupResponse(res, origin, { type: 'google-auth-error', error: 'Verificação de acesso falhou.' });
    }
    if (req.query.error || !req.query.code) {
      return popupResponse(res, origin, { type: 'google-auth-error', error: 'Login Google cancelado.' });
    }

    const { tokens } = await client.getToken(String(req.query.code));
    if (!tokens.id_token) throw new Error('O Google não retornou um token de identidade.');
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const identity = ticket.getPayload();
    if (!identity?.email || !identity.email_verified || !identity.sub) {
      throw new Error('A conta Google não forneceu um e-mail verificado.');
    }

    let user = await one(
      'SELECT * FROM usuarios WHERE google_sub = ? OR email = ? LIMIT 1',
      [identity.sub, identity.email.toLowerCase()]
    );
    if (!user) throw new Error('Conta sem convite. Solicite o cadastro a um administrador do sistema.');
    if (user && !user.ativo) throw new Error('Conta desativada. Procure um administrador.');
    if (user) {
      if (user.google_sub !== identity.sub) {
        user = await updateRow('usuarios', user.id, { google_sub: identity.sub });
      }
    } else {
      user = await insertRow('usuarios', {
        nome: identity.name || identity.email.split('@')[0],
        email: identity.email.toLowerCase(),
        papel: 'Técnico de Laboratório',
        setor: 'Laboratório de Gestão de Resíduos Perigosos',
        ativo: 1,
        google_sub: identity.sub,
      });
    }
    return popupResponse(res, origin, {
      type: 'google-auth-success',
      access_token: tokenFor(user),
    });
  } catch (error) {
    console.error('Google OAuth error:', error.message);
    return popupResponse(res, origin, {
      type: 'google-auth-error',
      error: error.message || 'Não foi possível entrar com Google.',
    });
  }
});

export default router;