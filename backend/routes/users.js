const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/authenticateToken');

// Middleware para garantir que apenas administradores acessem (placeholder)
const isAdmin = (req, res, next) => {
    // Em um cenário real, você verificaria o status de admin do usuário.
    // Ex: if (!req.user.is_admin) return res.status(403).send('Acesso negado.');
    next();
};

router.use(authenticateToken, isAdmin);

// Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, email, is_approved, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar usuários." });
    }
});

// Aprovar/Reprovar um usuário
router.put('/:id/toggle-approval', async (req, res) => {
    const { id } = req.params;
    const { is_approved } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE users SET is_approved = $1 WHERE id = $2 RETURNING id, name, email, is_approved',
            [is_approved, id]
        );
        if (rows.length === 0) return res.status(404).json({ erro: "Usuário não encontrado." });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao atualizar status do usuário." });
    }
});

// <-- NOVA ROTA: Editar um usuário -->
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone, is_approved',
            [name, email, phone, id]
        );
        if (rows.length === 0) return res.status(404).json({ erro: "Usuário não encontrado." });
        res.json(rows[0]);
    } catch (error) {
        // Trata erro de email duplicado
        if (error.code === '23505') {
            return res.status(409).json({ erro: "Este e-mail já está em uso." });
        }
        res.status(500).json({ erro: "Erro ao editar usuário." });
    }
});

// <-- NOVA ROTA: Excluir um usuário -->
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Impede que o usuário se auto-delete (opcional, mas recomendado)
        if (req.user.id == id) {
            return res.status(400).json({ erro: "Você não pode excluir a si mesmo." });
        }
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ erro: "Usuário não encontrado." });
        res.status(200).json({ mensagem: "Usuário excluído com sucesso." });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao excluir usuário." });
    }
});

module.exports = router;