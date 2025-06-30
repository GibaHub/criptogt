const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const crypto = require('crypto');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

async function obterCotacao(moeda) {
    try {
        const symbol = moeda.toUpperCase().replace(/[^A-Z]/g, '');
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const res = await axios.get(url, { timeout: 5000 });
        return parseFloat(res.data.price);
    } catch (err) {
        return null;
    }
}

async function criarOrdemBinance(apiKey, apiSecret, simbolo, valorEmUSDT, tipoOrdem = 'BUY') {
    const endpoint = 'https://api.binance.com/api/v3/order';
    
    // Para ordens de venda de mercado, o parâmetro correto é `quantity` (o total de moedas a vender).
    // Como estamos baseando a ordem em USDT, precisamos primeiro saber quantos ativos temos.
    // Para simplificar aqui, vamos assumir uma ordem de mercado com base no valor em USDT.
    // ATENÇÃO: A Binance pode exigir `quantity` para ordens de venda a mercado. 
    // Uma implementação mais robusta buscaria o saldo do ativo antes de vender.
    const params = {
        symbol: simbolo,
        side: tipoOrdem,
        type: 'MARKET',
        timestamp: Date.now(),
    };

    if (tipoOrdem === 'BUY') {
        params.quoteOrderQty = valorEmUSDT;
    } else { // SELL
        // Para uma ordem de venda a mercado, o ideal é usar a quantidade do ativo.
        // A API da Binance pode ser restritiva com `quoteOrderQty` em ordens de venda.
        // Esta é uma simplificação. A lógica real pode precisar de ajustes.
        console.warn("Atenção: A API de venda a mercado pode exigir o parâmetro 'quantity' em vez de 'quoteOrderQty'.");
        params.quoteOrderQty = valorEmUSDT;
    }


    const queryString = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
    const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
    
    try {
        console.log(`Enviando Ordem ${tipoOrdem} para ${simbolo} no valor de ${valorEmUSDT} USDT...`);
        const { data } = await axios.post(`${endpoint}?${queryString}&signature=${signature}`, null, {
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        console.log(`Ordem de ${tipoOrdem} enviada com sucesso para a Binance:`, data);
        return { sucesso: true, dados: data };
    } catch (error) {
        console.error(`ERRO AO CRIAR ORDEM DE ${tipoOrdem} NA BINANCE:`, error.response ? error.response.data : error.message);
        return { sucesso: false, erro: error.response ? error.response.data : error.message };
    }
}


async function executarOrdens() {
    console.log("⚙️ Executando verificação de ordens automáticas...");
    try {
        const { rows: ordens } = await pool.query(
          `SELECT o.*, c.api_key, c.secret_key 
           FROM ordens_automaticas o 
           JOIN contas c ON o.conta_id = c.id 
           WHERE o.ativo = true`
        );

        for (const ordem of ordens) {
            const precoAtual = await obterCotacao(ordem.moeda.replace('/', ''));
            if (precoAtual === null) continue;

            if (ordem.status === 'pendente' && precoAtual <= parseFloat(ordem.valor_compra)) {
                console.log(`CONDIÇÃO DE COMPRA ATINGIDA: Ordem #${ordem.id}`);
                const resultadoBinance = await criarOrdemBinance(ordem.api_key, ordem.secret_key, ordem.moeda, ordem.valor_ordem, 'BUY');
                if (resultadoBinance.sucesso) {
                    await pool.query("UPDATE ordens_automaticas SET status = 'comprado' WHERE id = $1", [ordem.id]);
                }
            } 
            else if (ordem.status === 'comprado') {
                if (ordem.valor_venda_perda && precoAtual <= parseFloat(ordem.valor_venda_perda)) {
                    console.log(`STOP-LOSS ATINGIDO: Ordem #${ordem.id}`);
                    const resultadoBinance = await criarOrdemBinance(ordem.api_key, ordem.secret_key, ordem.moeda, ordem.valor_ordem, 'SELL');
                    if (resultadoBinance.sucesso) {
                        await pool.query("UPDATE ordens_automaticas SET status = 'vendido', ativo = false WHERE id = $1", [ordem.id]);
                    }
                }
                else if (precoAtual >= parseFloat(ordem.valor_venda)) {
                    console.log(`LUCRO ATINGIDO: Ordem #${ordem.id}`);
                    const resultadoBinance = await criarOrdemBinance(ordem.api_key, ordem.secret_key, ordem.moeda, ordem.valor_ordem, 'SELL');
                    if (resultadoBinance.sucesso) {
                        await pool.query("UPDATE ordens_automaticas SET status = 'vendido', ativo = false WHERE id = $1", [ordem.id]);
                    }
                }
            }
        }
    } catch (err) {
        console.error("Erro ao executar ordens automáticas:", err.message);
    }
}

router.post("/", async (req, res) => {
    const { conta_id, moeda, percentual_compra, percentual_venda, valor_ordem, percentual_perda_maxima } = req.body;
    try {
        const precoAtual = await obterCotacao(moeda.replace('/', ''));
        if (precoAtual === null) return res.status(400).json({ erro: "Erro ao obter cotação." });

        const valorCompra = precoAtual * (1 - parseFloat(percentual_compra) / 100);
        const valorVenda = valorCompra * (1 + parseFloat(percentual_venda) / 100);
        const valorVendaPerda = (percentual_perda_maxima && percentual_perda_maxima > 0) ? valorCompra * (1 - parseFloat(percentual_perda_maxima) / 100) : null;
        const hoje = new Date().toISOString().slice(0, 10);

        await pool.query(
          `INSERT INTO ordens_automaticas (conta_id, moeda, data_criacao, valor_referencia, percentual_compra, percentual_venda, valor_compra, valor_venda, valor_ordem, percentual_perda_maxima, valor_venda_perda) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [conta_id, moeda, hoje, precoAtual, percentual_compra, percentual_venda, valorCompra, valorVenda, valor_ordem, percentual_perda_maxima || null, valorVendaPerda]
        );
        res.status(201).json({ mensagem: 'Ordem criada com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao salvar ordem.' });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `DELETE FROM ordens_automaticas WHERE id = $1 AND conta_id IN (SELECT id FROM contas WHERE user_id = $2)`,
            [id, req.user.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ erro: "Ordem não encontrada." });
        res.status(200).json({ mensagem: 'Ordem excluída com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao excluir ordem' });
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { conta_id, moeda, percentual_compra, percentual_venda, valor_ordem, valor_referencia, valor_compra: vCompra, valor_venda: vVenda, ativo, status } = req.body;
    try {
        const result = await pool.query(
            `UPDATE ordens_automaticas SET 
                conta_id = $1, moeda = $2, percentual_compra = $3, percentual_venda = $4,
                valor_ordem = $5, valor_referencia = $6, valor_compra = $7, valor_venda = $8,
                ativo = $9, status = $10 
             WHERE id = $11 AND conta_id IN (SELECT id FROM contas WHERE user_id = $12)`,
            [conta_id, moeda, percentual_compra, percentual_venda, valor_ordem, valor_referencia, vCompra, vVenda, ativo, status, id, req.user.id]
        );
         if (result.rowCount === 0) return res.status(404).json({ erro: "Ordem não encontrada." });
        res.status(200).json({ mensagem: 'Ordem atualizada com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar ordem:', err);
        res.status(500).json({ erro: 'Erro ao atualizar ordem' });
    }
});

// Exporta o router e a função para ser usada no index.js
module.exports = { router, executarOrdens };