const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getSaldoAtualConsolidado } = require('../utils/saldoUtils');
const authenticateToken = require('../middleware/authenticateToken'); // Importa o middleware

// Aplica autenticação a esta rota
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id; // Pega o ID do usuário logado

    // 1. Buscar o saldo atual real da carteira do usuário
    const saldoAtual = await getSaldoAtualConsolidado(userId);

    // 2. Buscar o saldo inicial do usuário (primeiro registro na tabela)
    const saldoInicialResult = await pool.query(
      `SELECT s.saldo FROM saldos s JOIN contas c ON s.conta_id = c.id WHERE c.user_id = $1 ORDER BY s.data ASC, s.created_at ASC LIMIT 1`,
      [userId]
    );
    
    // Se não houver saldo inicial, considera o saldo atual como inicial
    const saldoInicial = saldoInicialResult.rows.length > 0 
        ? parseFloat(saldoInicialResult.rows[0].saldo) 
        : saldoAtual;

    // 3. Calcular variações
    const variacaoValor = saldoAtual - saldoInicial;
    const variacaoPercentual = saldoInicial > 0 ? (variacaoValor / saldoInicial) * 100 : 0;

    // 4. Buscar histórico para o gráfico do usuário
    const historicoResult = await pool.query(`
      SELECT 
        TO_CHAR(s.data, 'DD/MM') as data_formatada,
        SUM(s.saldo) AS saldo
      FROM saldos s
      JOIN contas c ON s.conta_id = c.id
      WHERE c.user_id = $1
      GROUP BY s.data
      ORDER BY s.data ASC
      LIMIT 30
    `, [userId]);

    res.json({
      resumo: {
        saldoInicial: saldoInicial.toFixed(2),
        saldoAtual: saldoAtual.toFixed(2),
        variacaoValor: variacaoValor.toFixed(2),
        variacaoPercentual: variacaoPercentual.toFixed(2)
      },
      historico: historicoResult.rows.map(r => ({
        data: r.data_formatada,
        saldo: parseFloat(r.saldo)
      }))
    });
  } catch (err) {
    console.error("Erro ao consultar monitoramento: ", err.message);
    res.status(500).json({ erro: "Erro ao consultar dados de monitoramento" });
  }
});

module.exports = router;