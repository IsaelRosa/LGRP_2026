import test from 'node:test';
import assert from 'node:assert/strict';

// O módulo importa ./db.js, que exige variáveis MYSQL_* só ao criar o pool.
// Importamos para garantir que a carga de sintaxe/imports do novo recurso está ok.
test('módulo de laboratório exporta handler padrão', async () => {
  const mod = await import('../api/laboratorio.js');
  assert.equal(typeof mod.default, 'function');
  assert.ok(Array.isArray(mod.CAMPOS));
  assert.deepEqual(mod.CAMPOS, ['nome', 'unidade', 'responsavel', 'ativo']);
});