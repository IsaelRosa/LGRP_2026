import { setCORS } from './shared.js';
import { query, sqlIdentifier } from './db.js';

const MODULOS = {
  pedidos_coleta: {
    rotulo: 'Pedidos de Coleta',
    campoData: 'data_solicitacao',
    colunas: [
      { key: 'codigo', label: 'Código', tipo: 'texto' },
      { key: 'laboratorio', label: 'Laboratório / Setor', tipo: 'texto' },
      { key: 'solicitante', label: 'Solicitante', tipo: 'texto' },
      { key: 'tipo_residuo', label: 'Tipo de Resíduo', tipo: 'texto' },
      { key: 'grupo', label: 'Grupo', tipo: 'texto' },
      { key: 'classe', label: 'Classe', tipo: 'texto' },
      { key: 'quantidade_estimada', label: 'Quantidade', tipo: 'numero' },
      { key: 'unidade', label: 'Unidade', tipo: 'texto' },
      { key: 'embalagem', label: 'Embalagem', tipo: 'texto' },
      { key: 'local_coleta', label: 'Local de Coleta', tipo: 'texto' },
      { key: 'data_solicitacao', label: 'Data da Solicitação', tipo: 'data' },
      { key: 'data_prevista', label: 'Data Prevista', tipo: 'data' },
      { key: 'data_coleta', label: 'Data da Coleta', tipo: 'data' },
      { key: 'status', label: 'Status', tipo: 'texto' },
      { key: 'prioridade', label: 'Prioridade', tipo: 'texto' },
      { key: 'responsavel', label: 'Responsável', tipo: 'texto' },
      { key: 'risco', label: 'Risco Associado', tipo: 'texto' },
    ],
    agrupaveis: ['laboratorio', 'tipo_residuo', 'classe', 'status', 'prioridade', 'grupo'],
    numericos: ['quantidade_estimada'],
  },
  coletas: {
    rotulo: 'Registros de Coleta',
    campoData: 'data_coleta',
    colunas: [
      { key: 'id', label: 'Nº', tipo: 'numero' },
      { key: 'pedido_codigo', label: 'Pedido', tipo: 'texto' },
      { key: 'laboratorio', label: 'Laboratório', tipo: 'texto' },
      { key: 'data_coleta', label: 'Data da Coleta', tipo: 'data' },
      { key: 'coletor', label: 'Coletor', tipo: 'texto' },
      { key: 'equipe', label: 'Equipe', tipo: 'texto' },
      { key: 'peso_kg', label: 'Peso (kg)', tipo: 'numero' },
      { key: 'volume_l', label: 'Volume (L)', tipo: 'numero' },
      { key: 'unidades', label: 'Unidades', tipo: 'numero' },
      { key: 'destino_temporario', label: 'Destino Temporário', tipo: 'texto' },
      { key: 'mtr', label: 'MTR', tipo: 'texto' },
      { key: 'veiculo', label: 'Veículo', tipo: 'texto' },
    ],
    agrupaveis: ['laboratorio', 'coletor', 'destino_temporario'],
    numericos: ['peso_kg', 'volume_l', 'unidades'],
  },
  tratamentos: {
    rotulo: 'Tratamentos e Destinação',
    campoData: 'data_inicio',
    colunas: [
      { key: 'codigo', label: 'Código', tipo: 'texto' },
      { key: 'residuo', label: 'Resíduo', tipo: 'texto' },
      { key: 'grupo', label: 'Grupo', tipo: 'texto' },
      { key: 'metodo', label: 'Método', tipo: 'texto' },
      { key: 'quantidade_entrada', label: 'Qtd. Entrada', tipo: 'numero' },
      { key: 'unidade', label: 'Unidade', tipo: 'texto' },
      { key: 'quantidade_saida', label: 'Qtd. Saída', tipo: 'numero' },
      { key: 'eficiencia', label: 'Eficiência (%)', tipo: 'numero' },
      { key: 'data_inicio', label: 'Início', tipo: 'data' },
      { key: 'data_conclusao', label: 'Conclusão', tipo: 'data' },
      { key: 'operador', label: 'Operador', tipo: 'texto' },
      { key: 'destino_final', label: 'Destino Final', tipo: 'texto' },
      { key: 'mtr', label: 'MTR', tipo: 'texto' },
      { key: 'certificado', label: 'Certificado (CDF)', tipo: 'texto' },
      { key: 'custo', label: 'Custo (R$)', tipo: 'numero' },
      { key: 'status', label: 'Status', tipo: 'texto' },
    ],
    agrupaveis: ['metodo', 'status', 'destino_final', 'grupo', 'operador'],
    numericos: ['quantidade_entrada', 'quantidade_saida', 'custo'],
  },
  solventes: {
    rotulo: 'Controle de Solventes',
    campoData: 'data_recebimento',
    colunas: [
      { key: 'codigo', label: 'Código', tipo: 'texto' },
      { key: 'nome', label: 'Solvente', tipo: 'texto' },
      { key: 'formula', label: 'Fórmula', tipo: 'texto' },
      { key: 'cas', label: 'CAS', tipo: 'texto' },
      { key: 'categoria', label: 'Categoria', tipo: 'texto' },
      { key: 'pureza', label: 'Pureza (%)', tipo: 'numero' },
      { key: 'volume_total_l', label: 'Volume Total (L)', tipo: 'numero' },
      { key: 'volume_restante_l', label: 'Volume Restante (L)', tipo: 'numero' },
      { key: 'volume_recuperado_l', label: 'Volume Recuperado (L)', tipo: 'numero' },
      { key: 'laboratorio', label: 'Laboratório', tipo: 'texto' },
      { key: 'localizacao', label: 'Localização', tipo: 'texto' },
      { key: 'data_validade', label: 'Validade', tipo: 'data' },
      { key: 'status', label: 'Status', tipo: 'texto' },
    ],
    agrupaveis: ['categoria', 'laboratorio', 'status'],
    numericos: ['volume_total_l', 'volume_restante_l', 'volume_recuperado_l'],
  },
  reagentes: {
    rotulo: 'Banco de Reagentes',
    campoData: 'data_aquisicao',
    colunas: [
      { key: 'codigo', label: 'Código', tipo: 'texto' },
      { key: 'nome', label: 'Reagente', tipo: 'texto' },
      { key: 'formula', label: 'Fórmula', tipo: 'texto' },
      { key: 'cas', label: 'CAS', tipo: 'texto' },
      { key: 'fabricante', label: 'Fabricante', tipo: 'texto' },
      { key: 'lote', label: 'Lote', tipo: 'texto' },
      { key: 'quantidade', label: 'Quantidade', tipo: 'numero' },
      { key: 'unidade', label: 'Unidade', tipo: 'texto' },
      { key: 'classe_risco', label: 'Classe de Risco', tipo: 'texto' },
      { key: 'laboratorio', label: 'Laboratório', tipo: 'texto' },
      { key: 'localizacao', label: 'Localização', tipo: 'texto' },
      { key: 'data_validade', label: 'Validade', tipo: 'data' },
      { key: 'situacao_validade', label: 'Situação', tipo: 'texto' },
      { key: 'status', label: 'Status', tipo: 'texto' },
    ],
    agrupaveis: ['classe_risco', 'laboratorio', 'status', 'fabricante'],
    numericos: ['quantidade'],
  },
  vidrarias: {
    rotulo: 'Vidrarias Contaminadas',
    campoData: 'data_registro',
    colunas: [
      { key: 'codigo', label: 'Código', tipo: 'texto' },
      { key: 'tipo', label: 'Tipo de Vidraria', tipo: 'texto' },
      { key: 'laboratorio', label: 'Laboratório', tipo: 'texto' },
      { key: 'contaminante', label: 'Contaminante', tipo: 'texto' },
      { key: 'classe_contaminante', label: 'Classe do Contaminante', tipo: 'texto' },
      { key: 'nivel_contaminacao', label: 'Nível de Contaminação', tipo: 'texto' },
      { key: 'quantidade', label: 'Quantidade', tipo: 'numero' },
      { key: 'data_registro', label: 'Data de Registro', tipo: 'data' },
      { key: 'data_descontaminacao', label: 'Data de Descontaminação', tipo: 'data' },
      { key: 'metodo_descontaminacao', label: 'Método de Descontaminação', tipo: 'texto' },
      { key: 'responsavel', label: 'Responsável', tipo: 'texto' },
      { key: 'status', label: 'Status', tipo: 'texto' },
      { key: 'destino', label: 'Destino', tipo: 'texto' },
    ],
    agrupaveis: ['tipo', 'laboratorio', 'nivel_contaminacao', 'status', 'metodo_descontaminacao'],
    numericos: ['quantidade'],
  },
};

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (req.query.modulos === 'lista' || !req.query.modulo) {
      return res.status(200).json({
        modulos: Object.entries(MODULOS).map(([valor, m]) => ({
          valor,
          rotulo: m.rotulo,
          colunas: m.colunas,
          agrupaveis: m.agrupaveis,
        })),
      });
    }

    const mods = String(req.query.modulo).split(',').filter((m) => MODULOS[m]);
    if (!mods.length) return res.status(400).json({ error: 'Módulo inválido.' });

    const de = req.query.de || null;
    const ate = req.query.ate ? (String(req.query.ate).length === 10 ? `${req.query.ate}T23:59:59.999Z` : req.query.ate) : null;
    const filtroCampo = req.query.campo || null;
    const filtroValor = req.query.valor && req.query.valor !== 'todos' ? req.query.valor : null;
    const agrupar = req.query.agrupar || null;

    const resultados = {};
    const resumoGeral = { registros: 0, somas: {} };

    for (const mod of mods) {
      const cfg = MODULOS[mod];
      const where = [];
      const values = [];
      if (de) {
        where.push(`${sqlIdentifier(cfg.campoData)} >= ?`);
        values.push(de);
      }
      if (ate) {
        where.push(`${sqlIdentifier(cfg.campoData)} <= ?`);
        values.push(ate);
      }
      if (filtroCampo && filtroValor && cfg.colunas.some((c) => c.key === filtroCampo)) {
        where.push(`${sqlIdentifier(filtroCampo)} = ?`);
        values.push(filtroValor);
      }
      let rows = await query(
        `SELECT * FROM ${sqlIdentifier(mod)}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${sqlIdentifier(cfg.campoData)} DESC LIMIT 3000`,
        values
      );

      // enriquece coletas com dados do pedido
      if (mod === 'coletas' && rows.length) {
        const ids = [...new Set(rows.map((r) => r.pedido_id).filter(Boolean))];
        const peds = await query(
          `SELECT id, codigo, laboratorio, tipo_residuo FROM pedidos_coleta WHERE id IN (${ids.map(() => '?').join(', ')})`,
          ids
        );
        const mapa = new Map(peds.map((p) => [p.id, p]));
        rows = rows.map((r) => ({
          ...r,
          pedido_codigo: mapa.get(r.pedido_id)?.codigo || '—',
          laboratorio: mapa.get(r.pedido_id)?.laboratorio || '—',
          tipo_residuo: mapa.get(r.pedido_id)?.tipo_residuo || '—',
        }));
      }

      // situação de validade dos reagentes
      if (mod === 'reagentes') {
        const agora = Date.now();
        rows = rows.map((r) => {
          let s = 'Sem validade';
          if (r.data_validade) {
            const t = new Date(r.data_validade).getTime();
            if (t < agora) s = 'Vencido';
            else if (t <= agora + 30 * 86400000) s = 'A vencer';
            else if (t <= agora + 90 * 86400000) s = 'Atenção';
            else s = 'Válido';
          }
          return { ...r, situacao_validade: s };
        });
      }

      const somas = {};
      for (const c of cfg.numericos) {
        somas[c] = Math.round(rows.reduce((s, r) => s + num(r[c]), 0) * 100) / 100;
      }

      let agrupado = [];
      if (agrupar && cfg.agrupaveis.includes(agrupar)) {
        const m = new Map();
        for (const r of rows) {
          const k = r[agrupar] || 'Não informado';
          if (!m.has(k)) m.set(k, { chave: k, registros: 0, somas: {} });
          const g = m.get(k);
          g.registros += 1;
          for (const c of cfg.numericos) g.somas[c] = Math.round(((g.somas[c] || 0) + num(r[c])) * 100) / 100;
        }
        agrupado = [...m.values()].sort((a, b) => b.registros - a.registros);
      }

      resumoGeral.registros += rows.length;
      for (const [k, v] of Object.entries(somas)) {
        resumoGeral.somas[k] = Math.round(((resumoGeral.somas[k] || 0) + v) * 100) / 100;
      }

      resultados[mod] = {
        rotulo: cfg.rotulo,
        campoData: cfg.campoData,
        colunas: cfg.colunas,
        agrupaveis: cfg.agrupaveis,
        rows,
        somas,
        agrupado,
        total: rows.length,
      };
    }

    return res.status(200).json({
      periodo: { de, ate },
      agrupar,
      resumo: resumoGeral,
      resultados,
      gerado_em: new Date().toISOString(),
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}

export { MODULOS };
