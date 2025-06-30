const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

// Listar alertas do usuário
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM alertas_monitoramento WHERE user_id = $1 ORDER BY moeda ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar alertas." });
    }
});

// Adicionar um novo alerta
router.post('/', async (req, res) => {
    const { moeda, percentual_subida, percentual_queda } = req.body;
    try {
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${moeda.toUpperCase()}`);
        const preco_referencia = parseFloat(response.data.price);
        
        const { rows } = await pool.query(
            'INSERT INTO alertas_monitoramento (user_id, moeda, preco_referencia, percentual_subida, percentual_queda) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, moeda, preco_referencia, percentual_subida || null, percentual_queda || null]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao criar alerta." });
    }
});

// Excluir um alerta
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM alertas_monitoramento WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.status(200).json({ mensagem: 'Alerta excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir alerta." });
    }
});

module.exports = router;