import { setCORS, registrarHistorico, currentUser } from './shared.js';
import { insertRow, one, query, updateRow } from './db.js';

const MESES_NOME = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function chave(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getUTCFullYear()}-${dt.getUTCMonth() + 1}`;
}

export default async function handler(req, res) {
  if (setCORS(req, res)) return;
  try {
    const user = await currentUser(req);

    if (req.method === 'GET') {
      const ano = parseInt(req.query.ano || String(new Date().getUTCFullYear()), 10);

      const [pedidos, coletas, tratamentos, reagentes, vidrarias, solventes, armazenadosRows] = await Promise.all([
        query('SELECT * FROM pedidos_coleta LIMIT 5000'),
        query('SELECT * FROM coletas LIMIT 5000'),
        query('SELECT * FROM tratamentos LIMIT 5000'),
        query('SELECT * FROM reagentes LIMIT 5000'),
        query('SELECT * FROM vidrarias LIMIT 5000'),
        query('SELECT * FROM solventes LIMIT 5000'),
        query('SELECT * FROM indicadores_mensais WHERE ano = ? LIMIT 24', [ano]),
      ]);

      const armazenados = new Map(armazenadosRows.map((r) => [r.mes, r]));
      const base = (mes) => ({
        mes,
        ano,
        nome: MESES_NOME[mes - 1],
        rotulo: `${MESES_NOME[mes - 1].slice(0, 3)}/${ano}`,
        pedidos_recebidos: 0,
        coletas_realizadas: 0,
        residuos_coletados_kg: 0,
        residuos_coletados_l: 0,
        residuos_tratados_kg: 0,
        solventes_recuperados_l: 0,
        reagentes_vencidos: 0,
        vidrarias_descontaminadas: 0,
        destinacao_correta_pct: 0,
        custo_total: 0,
        acidentes: 0,
        treinamentos: 0,
        observacoes: '',
      });

      const meses = Array.from({ length: 12 }, (_, i) => base(i + 1));
      const porMes = new Map(meses.map((m) => [`${ano}-${m.mes}`, m]));
      const get = (d) => {
        const k = chave(d);
        return k && porMes.get(k) ? porMes.get(k) : null;
      };

      for (const p of pedidos) {
        const m = get(p.data_solicitacao);
        if (m) m.pedidos_recebidos += 1;
      }

      const labPorPedido = new Map(pedidos.map((p) => [p.id, p]));
      for (const c of coletas) {
        const m = get(c.data_coleta);
        if (!m) continue;
        m.coletas_realizadas += 1;
        m.residuos_coletados_kg += num(c.peso_kg);
        m.residuos_coletados_l += num(c.volume_l);
        const ped = labPorPedido.get(c.pedido_id);
        if (ped && ped.status === 'Destinado') m.__destinados = (m.__destinados || 0) + 1;
        if (ped) m.__coletasVinculadas = (m.__coletasVinculadas || 0) + 1;
      }

      for (const t of tratamentos) {
        if (t.status !== 'Concluído') continue;
        const m = get(t.data_conclusao || t.data_inicio);
        if (!m) continue;
        if ((t.unidade || 'kg') === 'kg') m.residuos_tratados_kg += num(t.quantidade_entrada);
        if (/Destila/i.test(t.metodo || '')) m.solventes_recuperados_l += num(t.quantidade_saida);
        m.custo_total += num(t.custo);
      }

      for (const r of reagentes) {
        const m = get(r.data_validade);
        if (m && new Date(r.data_validade).getTime() < Date.now()) m.reagentes_vencidos += 1;
      }

      for (const v of vidrarias) {
        const m = get(v.data_descontaminacao);
        if (m && ['Descontaminada', 'Reaproveitada'].includes(v.status)) {
          m.vidrarias_descontaminadas += num(v.quantidade) || 1;
        }
      }

      for (const sol of solventes) {
        if (sol.status === 'Recuperado' || num(sol.volume_recuperado_l) > 0) {
          const m = get(sol.data_recebimento);
          if (m && !m.__sol) m.__sol = 0;
        }
      }

      const mesesOut = meses.map((m) => {
        const arm = armazenados.get(m.mes) || {};
        const coletasVinc = m.__coletasVinculadas || 0;
        const dest = m.__destinados || 0;
        const autoPct = coletasVinc ? Math.round((dest / coletasVinc) * 1000) / 10 : null;
        return {
          id: arm.id ?? null,
          mes: m.mes,
          ano,
          nome: m.nome,
          rotulo: m.rotulo,
          pedidos_recebidos: m.pedidos_recebidos,
          coletas_realizadas: m.coletas_realizadas,
          residuos_coletados_kg: Math.round(m.residuos_coletados_kg * 10) / 10,
          residuos_coletados_l: Math.round(m.residuos_coletados_l * 10) / 10,
          residuos_tratados_kg: Math.round(m.residuos_tratados_kg * 10) / 10,
          solventes_recuperados_l: Math.round(m.solventes_recuperados_l * 10) / 10,
          reagentes_vencidos: m.reagentes_vencidos,
          vidrarias_descontaminadas: m.vidrarias_descontaminadas,
          destinacao_correta_pct:
            arm.destinacao_correta_pct != null ? num(arm.destinacao_correta_pct) : (autoPct ?? 0),
          custo_total: Math.round((num(m.custo_total) + num(arm.custo_operacional)) * 100) / 100,
          acidentes: arm.acidentes != null ? num(arm.acidentes) : 0,
          treinamentos: arm.treinamentos != null ? num(arm.treinamentos) : 0,
          custo_operacional: arm.custo_operacional != null ? num(arm.custo_operacional) : 0,
          observacoes: arm.observacoes || '',
        };
      });

      const total = mesesOut.reduce(
        (acc, m) => ({
          pedidos_recebidos: acc.pedidos_recebidos + m.pedidos_recebidos,
          coletas_realizadas: acc.coletas_realizadas + m.coletas_realizadas,
          residuos_coletados_kg: acc.residuos_coletados_kg + m.residuos_coletados_kg,
          residuos_tratados_kg: acc.residuos_tratados_kg + m.residuos_tratados_kg,
          solventes_recuperados_l: acc.solventes_recuperados_l + m.solventes_recuperados_l,
          reagentes_vencidos: acc.reagentes_vencidos + m.reagentes_vencidos,
          vidrarias_descontaminadas: acc.vidrarias_descontaminadas + m.vidrarias_descontaminadas,
          custo_total: acc.custo_total + m.custo_total,
          acidentes: acc.acidentes + m.acidentes,
          treinamentos: acc.treinamentos + m.treinamentos,
        }),
        {
          pedidos_recebidos: 0, coletas_realizadas: 0, residuos_coletados_kg: 0,
          residuos_tratados_kg: 0, solventes_recuperados_l: 0, reagentes_vencidos: 0,
          vidrarias_descontaminadas: 0, custo_total: 0, acidentes: 0, treinamentos: 0,
        }
      );
      Object.keys(total).forEach((k) => {
        total[k] = Math.round(total[k] * 10) / 10;
      });

      return res.status(200).json({ ano, meses: mesesOut, total });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const { mes, ano } = req.body || {};
      if (!mes || !ano) return res.status(400).json({ error: 'Informe mês e ano.' });
      const payload = {
        mes: Number(mes),
        ano: Number(ano),
        acidentes: req.body.acidentes != null ? Number(req.body.acidentes) : 0,
        treinamentos: req.body.treinamentos != null ? Number(req.body.treinamentos) : 0,
        custo_operacional: req.body.custo_operacional != null ? Number(req.body.custo_operacional) : 0,
        destinacao_correta_pct:
          req.body.destinacao_correta_pct != null && req.body.destinacao_correta_pct !== ''
            ? Number(req.body.destinacao_correta_pct)
            : null,
        observacoes: req.body.observacoes || '',
      };

      const existente = await one(
        'SELECT * FROM indicadores_mensais WHERE mes = ? AND ano = ? LIMIT 1',
        [payload.mes, payload.ano]
      );

      let salvo;
      if (existente) {
        salvo = await updateRow('indicadores_mensais', existente.id, {
          ...payload,
          atualizado_em: new Date().toISOString(),
        });
        await registrarHistorico({
          tabela: 'indicadores_mensais',
          registroId: salvo.id,
          codigo: `${MESES_NOME[payload.mes - 1]}/${payload.ano}`,
          acao: 'UPDATE',
          descricao: `Indicadores de ${MESES_NOME[payload.mes - 1]}/${payload.ano} atualizados`,
          usuario: user,
          antes: existente,
          depois: salvo,
        });
      } else {
        salvo = await insertRow('indicadores_mensais', payload);
        await registrarHistorico({
          tabela: 'indicadores_mensais',
          registroId: salvo.id,
          codigo: `${MESES_NOME[payload.mes - 1]}/${payload.ano}`,
          acao: 'INSERT',
          descricao: `Indicadores de ${MESES_NOME[payload.mes - 1]}/${payload.ano} registrados`,
          usuario: user,
          antes: null,
          depois: salvo,
        });
      }
      return res.status(200).json(salvo);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
