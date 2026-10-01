import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPool, one, insertRow, updateRow } from '../api/db.js';

const nome = String(process.env.ADMIN_NAME || '').trim();
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');

if (nome.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error('Defina ADMIN_NAME e ADMIN_EMAIL temporariamente no ambiente.');
}
if (password.length < 12) {
  throw new Error('ADMIN_PASSWORD precisa ter ao menos 12 caracteres.');
}

try {
  const existing = await one('SELECT * FROM usuarios WHERE email = ? LIMIT 1', [email]);
  const admins = await one("SELECT COUNT(*) AS total FROM usuarios WHERE papel = 'Administrador' AND ativo = 1");
  if (admins.total > 0 && (!existing || existing.papel !== 'Administrador')) {
    throw new Error('Já existe um administrador ativo. Use a gestão de usuários do sistema.');
  }

  const password_hash = await bcrypt.hash(password, 12);
  const admin = existing
    ? await updateRow('usuarios', existing.id, { nome, papel: 'Administrador', ativo: 1, password_hash })
    : await insertRow('usuarios', {
        nome,
        email,
        papel: 'Administrador',
        setor: 'Administração do sistema',
        ativo: 1,
        password_hash,
      });
  console.log(`Administrador configurado: ${admin.email}`);
} finally {
  await getPool().end();
}