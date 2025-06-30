const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const { getSaldoAtualConsolidado } = require('../utils/saldoUtils');
const authenticateToken = require('../middleware/authenticateToken');

// Função para buscar os top 5 ativos com maiores ganhos e perdas nas últimas 24h
async function getTopMovers() {
    try {
        const { data: tickers } = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
        const usdtTickers = tickers
            .filter(t => t.symbol.endsWith('USDT'))
            .map(t => ({
                symbol: t.symbol.replace('USDT', ''),
                priceChangePercent: parseFloat(t.priceChangePercent)
            }))
            .sort((a, b) => b.priceChangePercent - a.priceChangePercent);

        return {
            ganhos: usdtTickers.slice(0, 5),
            perdas: usdtTickers.slice(-5).reverse()
        };
    } catch (error) {
        console.error("Erro ao buscar top movers da Binance:", error.message);
        return { ganhos: [], perdas: [] };
    }
}

// Rota principal que consolida todos os dados para o dashboard
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Executa todas as buscas em paralelo para mais performance
        const [
            saldoCripto,
            contasManuaisResult,
            ordensAtivasResult,
            topMovers
        ] = await Promise.all([
            getSaldoAtualConsolidado(userId),
            pool.query("SELECT COALESCE(SUM(saldo), 0) as total FROM financeiro_contas WHERE user_id = $1", [userId]),
            pool.query("SELECT COUNT(*) as total FROM ordens_automaticas o JOIN contas c ON o.conta_id = c.id WHERE c.user_id = $1 AND o.ativo = true", [userId]),
            getTopMovers()
        ]);

        const saldoOutrosAtivos = parseFloat(contasManuaisResult.rows[0].total);
        const ordensAtivas = parseInt(ordensAtivasResult.rows[0].total, 10);
        
        res.json({
            saldoCripto,
            saldoOutrosAtivos,
            ordensAtivas,
            ...topMovers
        });

    } catch (err) {
        console.error("Erro ao buscar resumo do dashboard:", err.message);
        res.status(500).json({ erro: 'Erro ao buscar dados do dashboard.' });
    }
});

module.exports = router;