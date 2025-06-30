
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Criar novo feedback
router.post('/', async (req, res) => {
  try {
    const { tipo, referencia, mensagem } = req.body;
    const result = await pool.query(
      'INSERT INTO feedbacks (tipo, referencia, mensagem) VALUES ($1, $2, $3) RETURNING *',
      [tipo, referencia, mensagem]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao salvar feedback:', err);
    res.status(500).json({ error: 'Erro interno ao salvar feedback' });
  }
});

// Listar feedbacks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM feedbacks ORDER BY data DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar feedbacks:', err);
    res.status(500).json({ error: 'Erro interno ao buscar feedbacks' });
  }
});

module.exports = router;
