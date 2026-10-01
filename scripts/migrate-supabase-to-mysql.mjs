import 'dotenv/config';
import { getPool, sqlIdentifier } from '../api/db.js';

const tables = [
  'usuarios',
  'pedidos_coleta',
  'coletas',
  'tratamentos',
  'solventes',
  'reagentes',
  'vidrarias',
  'indicadores_mensais',
  'notificacoes',
  'historico',
];
const sourceUrl = String(process.env.SOURCE_SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY || '';
const pageSize = 1000;

if (!sourceUrl || !serviceKey) {
  throw new Error('Defina SOURCE_SUPABASE_URL e SOURCE_SUPABASE_SERVICE_ROLE_KEY temporariamente no ambiente.');
}

function mysqlValue(value) {
  if (value && typeof value === 'object' && !(value instanceof Date)) return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').replace(/Z$/, '').replace(/\.\d{3}$/, '');
  }
  return value;
}

async function fetchRows(table, offset) {
  const response = await fetch(`${sourceUrl}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Range: `${offset}-${offset + pageSize - 1}`,
      'Range-Unit': 'items',
    },
  });
  if (!response.ok) {
    throw new Error(`Falha lendo ${table} no Supabase (${response.status}). Verifique as credenciais e permissões.`);
  }
  return response.json();
}

try {
  const pool = getPool();
  for (const table of tables) {
    const [columnRows] = await pool.query(`SHOW COLUMNS FROM ${sqlIdentifier(table)}`);
    const allowed = new Set(columnRows.map((column) => column.Field));
    let offset = 0;
    let migrated = 0;
    while (true) {
      const rows = await fetchRows(table, offset);
      if (!Array.isArray(rows)) throw new Error(`Resposta inesperada ao ler ${table}.`);
      for (const source of rows) {
        const entries = Object.entries(source).filter(([column]) => allowed.has(column));
        if (table === 'usuarios') {
          for (const column of ['password_hash', 'google_sub', 'password_setup_token_hash', 'password_setup_token_expires_at']) {
            if (allowed.has(column) && !entries.some(([existing]) => existing === column)) {
              entries.push([column, null]);
            }
          }
        }
        if (!entries.length) continue;
        const columns = entries.map(([column]) => sqlIdentifier(column)).join(', ');
        const marks = entries.map(() => '?').join(', ');
        const values = entries.map(([, value]) => mysqlValue(value));
        const [result] = await pool.execute(
          `INSERT IGNORE INTO ${sqlIdentifier(table)} (${columns}) VALUES (${marks})`,
          values
        );
        migrated += result.affectedRows;
      }
      offset += rows.length;
      if (rows.length < pageSize) break;
    }
    console.log(`${table}: ${migrated} registro(s) importado(s)`);
  }
  console.log('Importação concluída. As senhas Supabase não podem ser copiadas; cada usuário deve redefinir a senha ou entrar com Google.');
} finally {
  await getPool().end();
}