const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const { enviarMensagemDireta } = require('../utils/telegram');

router.use(authenticateToken);

// Listar todas as configurações do usuário
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM configuracoes WHERE user_id = $1 ORDER BY nome_config ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar configurações." });
    }
});

// Adicionar uma nova configuração
router.post('/', async (req, res) => {
    const { nome_config, telegram_bot_token, telegram_chat_id } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO configuracoes (user_id, nome_config, telegram_bot_token, telegram_chat_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, nome_config, telegram_bot_token, telegram_chat_id]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao salvar configuração." });
    }
});

// Atualizar uma configuração
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nome_config, telegram_bot_token, telegram_chat_id } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE configuracoes SET nome_config = $1, telegram_bot_token = $2, telegram_chat_id = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
            [nome_config, telegram_bot_token, telegram_chat_id, id, req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ erro: "Configuração não encontrada." });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar configuração." });
    }
});

// Excluir uma configuração
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM configuracoes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ erro: "Configuração não encontrada." });
        res.status(200).json({ mensagem: "Configuração excluída com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir configuração." });
    }
});
router.post('/testar', async (req, res) => {
    const { telegram_bot_token, telegram_chat_id } = req.body;
    const mensagemTeste = "✅ Olá! Sua notificação do CriptoGT está funcionando perfeitamente.";

    try {
        await enviarMensagemDireta(telegram_bot_token, telegram_chat_id, mensagemTeste);
        res.status(200).json({ mensagem: "Mensagem de teste enviada com sucesso!" });
    } catch (error) {
        res.status(400).json({ erro: `Falha ao enviar mensagem: ${error.message}` });
    }
});

module.exports = router;