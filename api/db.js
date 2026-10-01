import mysql from 'mysql2/promise';

let pool;

function identifier(value) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Identificador SQL inválido: ${value}`);
  }
  return `\`${value}\``;
}

function sqlValue(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace('T', ' ').replace(/Z$/, '').replace(/\.\d{3}$/, '');
  }
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }
  return value;
}

export function getPool() {
  if (!pool) {
    const required = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Variáveis MySQL ausentes: ${missing.join(', ')}`);

    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      dateStrings: true,
      timezone: 'Z',
      charset: 'utf8mb4',
    });
  }
  return pool;
}

export async function query(sql, values = []) {
  const [rows] = await getPool().execute(sql, values.map(sqlValue));
  return rows;
}

export async function one(sql, values = []) {
  const rows = await query(sql, values);
  return rows[0] || null;
}

export async function insertRow(table, record) {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  if (!entries.length) throw new Error('Não há campos para inserir.');
  const columns = entries.map(([key]) => identifier(key)).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const result = await query(
    `INSERT INTO ${identifier(table)} (${columns}) VALUES (${placeholders})`,
    entries.map(([, value]) => value)
  );
  return one(`SELECT * FROM ${identifier(table)} WHERE id = ?`, [result.insertId]);
}

export async function updateRow(table, id, record) {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  if (!entries.length) return one(`SELECT * FROM ${identifier(table)} WHERE id = ?`, [id]);
  const assignments = entries.map(([key]) => `${identifier(key)} = ?`).join(', ');
  await query(`UPDATE ${identifier(table)} SET ${assignments} WHERE id = ?`, [
    ...entries.map(([, value]) => value),
    id,
  ]);
  return one(`SELECT * FROM ${identifier(table)} WHERE id = ?`, [id]);
}

export async function deleteRow(table, id) {
  const result = await query(`DELETE FROM ${identifier(table)} WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}

export function sqlIdentifier(value) {
  return identifier(value);
}
