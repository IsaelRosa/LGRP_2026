import test from 'node:test';
import assert from 'node:assert/strict';
import { getPool, sqlIdentifier } from '../api/db.js';

test('SQL identifiers are quoted only after allow-list validation', () => {
  assert.equal(sqlIdentifier('pedidos_coleta'), '`pedidos_coleta`');
  assert.throws(() => sqlIdentifier('usuarios; DROP TABLE usuarios'), /Identificador SQL inválido/);
});

test('MySQL pool refuses incomplete connection configuration', () => {
  const originals = Object.fromEntries(
    ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'].map((key) => [key, process.env[key]])
  );
  process.env.MYSQL_HOST = '';
  process.env.MYSQL_USER = '';
  process.env.MYSQL_DATABASE = '';
  try {
    assert.throws(() => getPool(), /Variáveis MySQL ausentes/);
  } finally {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});