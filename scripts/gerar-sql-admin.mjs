// Gera o INSERT pronto para o phpMyAdmin, sem precisar de terminal/SSH na VPS.
// Uso: node scripts/gerar-sql-admin.mjs "Nome do Usuario" "email@exemplo.com" "senha-com-12-ou-mais"
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const [nome = '', email = '', senha = ''] = process.argv.slice(2);

if (nome.trim().length < 3) throw new Error('Informe o nome do usuario como primeiro argumento.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Informe um e-mail valido como segundo argumento.');
if (senha.length < 12) throw new Error('A senha precisa ter ao menos 12 caracteres.');

const escape = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const hash = await bcrypt.hash(senha, 12);

console.log('-- SQL para colar na aba SQL do phpMyAdmin (selecione o banco antes de executar)');
console.log(
  [
    `INSERT INTO \`usuarios\` (\`nome\`, \`email\`, \`papel\`, \`setor\`, \`ativo\`, \`password_hash\`, \`criado_em\`, \`atualizado_em\`)`,
    `VALUES (${escape(nome.trim())}, ${escape(email.trim().toLowerCase())}, 'Administrador', 'Administracao do sistema', 1, ${escape(hash)}, NOW(), NOW())`,
    `ON DUPLICATE KEY UPDATE \`nome\` = VALUES(\`nome\`), \`papel\` = 'Administrador', \`setor\` = VALUES(\`setor\`), \`ativo\` = 1, \`password_hash\` = VALUES(\`password_hash\`), \`atualizado_em\` = NOW();`,
  ].join('\n')
);
console.log('');
console.log('-- Depois confira com:');
console.log(`SELECT id, nome, email, papel, ativo, criado_em FROM \`usuarios\`;`);