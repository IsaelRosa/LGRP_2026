import { setCORS, gerarAlertas } from './shared.js';
import { query } from './db.js';

const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mesDe(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return { ano: dt.getUTCFullYear(), mes: dt.getUTCMonth() + 1 };
}

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    await gerarAlertas();

    const [
      pedidos,
      coletas,
      tratamentos,
      solventes,
      reagentes,
      vidrarias,
      notificacoes,
      atividade,
    ] = await Promise.all([
      query('SELECT * FROM pedidos_coleta LIMIT 3000'),
      query('SELECT * FROM coletas LIMIT 3000'),
      query('SELECT * FROM tratamentos LIMIT 3000'),
      query('SELECT * FROM solventes LIMIT 3000'),
      query('SELECT * FROM reagentes LIMIT 3000'),
      query('SELECT * FROM vidrarias LIMIT 3000'),
      query('SELECT * FROM notificacoes WHERE lida = 0 ORDER BY criado_em DESC LIMIT 50'),
      query('SELECT * FROM historico ORDER BY criado_em DESC LIMIT 12'),
    ]);

    const agora = Date.now();
    const em30 = agora + 30 * 86400000;

    /* ------------------------------ indicadores globais */
    const kgColetados = coletas.reduce((s, c) => s + num(c.peso_kg), 0);
    const lColetados = coletas.reduce((s, c) => s + num(c.volume_l), 0);
    const kgTratados = tratamentos
      .filter((t) => t.status === 'Concluído' && (t.unidade || 'kg') === 'kg')
      .reduce((s, t) => s + num(t.quantidade_entrada), 0);
    const lTratados = tratamentos
      .filter((t) => t.status === 'Concluído' && t.unidade === 'L')
      .reduce((s, t) => s + num(t.quantidade_entrada), 0);
    const lRecuperados = tratamentos
      .filter((t) => t.status === 'Concluído' && /Destila/i.test(t.metodo || ''))
      .reduce((s, t) => s + num(t.quantidade_saida), 0);

    const reagentesVencidos = reagentes.filter(
      (r) => r.data_validade && new Date(r.data_validade).getTime() < agora
    );
    const reagentesAVencer = reagentes.filter((r) => {
      if (!r.data_validade) return false;
      const t = new Date(r.data_validade).getTime();
      return t >= agora && t <= em30;
    });

    const solventesHalogenados = solventes.filter((s) => /Halogenado/.test(s.categoria || '') && !/N[iã]o/.test(s.categoria || ''));
    const volEstoque = solventes.reduce((s, x) => s + num(x.volume_restante_l), 0);
    const volTotal = solventes.reduce((s, x) => s + num(x.volume_total_l), 0);
    const volRecuperadoSol = solventes.reduce((s, x) => s + num(x.volume_recuperado_l), 0);

    const vidrariasPendentes = vidrarias.filter((v) =>
      ['Aguardando Descontaminação', 'Em Descontaminação'].includes(v.status)
    );
    const vidrariasConcluidas = vidrarias.filter((v) =>
      ['Descontaminada', 'Reaproveitada'].includes(v.status)
    );

    const pedidosDestinados = pedidos.filter((p) => p.status === 'Destinado').length;
    const pedidosEncerrados = pedidos.filter((p) =>
      ['Destinado', 'Cancelado'].includes(p.status)
    ).length;
    const taxaDestinacao = pedidosEncerrados
      ? Math.round((pedidosDestinados / pedidosEncerrados) * 1000) / 10
      : 0;

    const custoTotal = tratamentos.reduce((s, t) => s + num(t.custo), 0);

    const kpis = {
      total_pedidos: pedidos.length,
      pedidos_abertos: pedidos.filter((p) => ['Solicitado', 'Agendado'].includes(p.status)).length,
      pedidos_em_tratamento: pedidos.filter((p) => p.status === 'Em Tratamento').length,
      pedidos_destinados: pedidosDestinados,
      coletas_realizadas: coletas.length,
      kg_coletados: Math.round(kgColetados * 10) / 10,
      l_coletados: Math.round(lColetados * 10) / 10,
      kg_tratados: Math.round(kgTratados * 10) / 10,
      l_tratados: Math.round(lTratados * 10) / 10,
      l_recuperados: Math.round(lRecuperados * 10) / 10,
      tratamentos_total: tratamentos.length,
      tratamentos_concluidos: tratamentos.filter((t) => t.status === 'Concluído').length,
      tratamentos_andamento: tratamentos.filter((t) => t.status === 'Em Andamento').length,
      reagentes_total: reagentes.length,
      reagentes_vencidos: reagentesVencidos.length,
      reagentes_a_vencer: reagentesAVencer.length,
      solventes_total: solventes.length,
      solventes_litros_estoque: Math.round(volEstoque * 10) / 10,
      solventes_litros_total: Math.round(volTotal * 10) / 10,
      solventes_halogenados: solventesHalogenados.length,
      solventes_halogenados_litros: Math.round(
        solventesHalogenados.reduce((s, x) => s + num(x.volume_restante_l), 0) * 10
      ) / 10,
      solventes_recuperados_l: Math.round(volRecuperadoSol * 10) / 10,
      vidrarias_total: vidrarias.length,
      vidrarias_pendentes: vidrariasPendentes.length,
      vidrarias_unidades_pendentes: vidrariasPendentes.reduce((s, v) => s + num(v.quantidade), 0),
      vidrarias_descontaminadas: vidrariasConcluidas.length,
      taxa_destinacao: taxaDestinacao,
      custo_total: Math.round(custoTotal * 100) / 100,
      alertas_abertos: notificacoes.length,
      alertas_criticos: notificacoes.filter((n) => n.severidade === 'critica').length,
    };

    /* ------------------------------ séries mensais (12 meses) */
    const hoje = new Date();
    const serie = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - i, 1));
      serie.push({
        ano: d.getUTCFullYear(),
        mes: d.getUTCMonth() + 1,
        rotulo: `${MESES[d.getUTCMonth()]}/${String(d.getUTCFullYear()).slice(2)}`,
        pedidos: 0,
        coletas: 0,
        kg_coletados: 0,
        l_coletados: 0,
        kg_tratados: 0,
        l_recuperados: 0,
        custo: 0,
      });
    }
    const idx = (ano, mes) => serie.findIndex((s) => s.ano === ano && s.mes === mes);

    for (const p of pedidos) {
      const d = mesDe(p.data_solicitacao);
      if (!d) continue;
      const i = idx(d.ano, d.mes);
      if (i >= 0) serie[i].pedidos += 1;
    }
    for (const c of coletas) {
      const d = mesDe(c.data_coleta);
      if (!d) continue;
      const i = idx(d.ano, d.mes);
      if (i >= 0) {
        serie[i].coletas += 1;
        serie[i].kg_coletados += num(c.peso_kg);
        serie[i].l_coletados += num(c.volume_l);
      }
    }
    for (const t of tratamentos) {
      if (t.status !== 'Concluído') continue;
      const d = mesDe(t.data_conclusao || t.data_inicio);
      if (!d) continue;
      const i = idx(d.ano, d.mes);
      if (i >= 0) {
        if ((t.unidade || 'kg') === 'kg') serie[i].kg_tratados += num(t.quantidade_entrada);
        if (/Destila/i.test(t.metodo || '')) serie[i].l_recuperados += num(t.quantidade_saida);
        serie[i].custo += num(t.custo);
      }
    }
    serie.forEach((s) => {
      s.kg_coletados = Math.round(s.kg_coletados * 10) / 10;
      s.l_coletados = Math.round(s.l_coletados * 10) / 10;
      s.kg_tratados = Math.round(s.kg_tratados * 10) / 10;
      s.l_recuperados = Math.round(s.l_recuperados * 10) / 10;
      s.custo = Math.round(s.custo);
    });

    /* ------------------------------ agrupamentos */
    const agrupar = (lista, chaveFn, valorFn) => {
      const m = new Map();
      for (const it of lista) {
        const k = chaveFn(it);
        if (!k) continue;
        m.set(k, (m.get(k) || 0) + valorFn(it));
      }
      return [...m.entries()]
        .map(([nome, valor]) => ({ nome, valor: Math.round(valor * 100) / 100 }))
        .sort((a, b) => b.valor - a.valor);
    };

    const porTipo = agrupar(
      coletas.length ? coletas : [],
      () => null,
      () => 0
    );

    const pedidosPorTipo = agrupar(
      pedidos,
      (p) => p.tipo_residuo,
      (p) => num(p.quantidade_estimada) || 1
    );

    const pedidosPorStatus = agrupar(
      pedidos,
      (p) => p.status,
      () => 1
    );

    const pedidosPorClasse = agrupar(
      pedidos,
      (p) => p.classe,
      (p) => num(p.quantidade_estimada) || 1
    );

    const porLaboratorio = agrupar(
      pedidos,
      (p) => p.laboratorio,
      (p) => num(p.quantidade_estimada) || 1
    ).slice(0, 8);

    const coletasPorLaboratorio = (() => {
      const mapa = new Map(pedidos.map((p) => [p.id, p.laboratorio]));
      return agrupar(
        coletas,
        (c) => mapa.get(c.pedido_id) || 'Não vinculado',
        (c) => num(c.peso_kg)
      ).slice(0, 8);
    })();

    const porMetodo = agrupar(
      tratamentos,
      (t) => t.metodo,
      (t) => num(t.quantidade_entrada)
    );

    const tratamentosPorStatus = agrupar(
      tratamentos,
      (t) => t.status,
      () => 1
    );

    const reagentesPorRisco = agrupar(
      reagentes,
      (r) => r.classe_risco,
      () => 1
    );

    const solventesPorCategoria = agrupar(
      solventes,
      (s) => s.categoria,
      (s) => num(s.volume_restante_l)
    );

    const vidrariasPorStatus = agrupar(
      vidrarias,
      (v) => v.status,
      (v) => num(v.quantidade)
    );

    return res.status(200).json({
      kpis,
      serie,
      graficos: {
        porTipo: porTipo.length ? porTipo : pedidosPorTipo,
        pedidosPorTipo,
        pedidosPorStatus,
        pedidosPorClasse,
        porLaboratorio,
        coletasPorLaboratorio,
        porMetodo,
        tratamentosPorStatus,
        reagentesPorRisco,
        solventesPorCategoria,
        vidrariasPorStatus,
      },
      alertas: notificacoes,
      atividade,
      gerado_em: new Date().toISOString(),
    });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
