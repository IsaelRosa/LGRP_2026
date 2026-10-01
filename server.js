import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import authRoutes, { requireAuth } from './api/auth-routes.js';
import { one } from './api/db.js';
import coletas from './api/coletas.js';
import dashboard from './api/dashboard.js';
import historico from './api/historico.js';
import laboratorio from './api/laboratorio.js';
import indicadores from './api/indicadores.js';
import notificacoes from './api/notificacoes.js';
import pedidos from './api/pedidos.js';
import reagentes from './api/reagentes.js';
import relatorios from './api/relatorios.js';
import solventes from './api/solventes.js';
import tratamentos from './api/tratamentos.js';
import usuarios from './api/usuarios.js';
import vidrarias from './api/vidrarias.js';

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');
const routes = {
  coletas,
  dashboard,
  historico,
  laboratorio,
  indicadores,
  notificacoes,
  pedidos,
  reagentes,
  relatorios,
  solventes,
  tratamentos,
  usuarios,
  vidrarias,
};

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/password/request', rateLimit({ windowMs: 15 * 60 * 1000, limit: 4, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/password/complete', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.get('/api/health', async (_req, res) => {
  try {
    await one('SELECT 1 AS ok');
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return requireAuth(req, res, (error) => {
    if (error) return next(error);
    if (req.path === '/usuarios' && req.authUser.papel !== 'Administrador') {
      return res.status(403).json({ error: 'Somente administradores podem gerenciar usuários.' });
    }
    if (
      req.path === '/laboratorio' &&
      ['POST', 'PUT', 'DELETE'].includes(req.method) &&
      req.authUser.papel !== 'Administrador'
    ) {
      return res.status(403).json({ error: 'Somente administradores podem gerenciar o catálogo de laboratórios.' });
    }
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.authUser.papel === 'Consultor') {
      return res.status(403).json({ error: 'Seu perfil permite somente leitura.' });
    }
    return next();
  });
});

for (const [name, handler] of Object.entries(routes)) {
  app.all(`/api/${name}`, (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  });
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(express.static(dist, { index: false }));
app.get(/.*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
app.use((error, _req, res, _next) => {
  console.error('Server error:', error);
  res.status(error.statusCode || 500).json({ error: 'Erro interno do servidor.' });
});

const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  throw new Error('Configure JWT_SECRET com ao menos 32 caracteres.');
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`LGRP backend listening on port ${port}`);
});