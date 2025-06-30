const express = require('express');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');
const crypto = require('crypto');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/testar', async (req, res) => {
  const { corretora, api_key, secret_key } = req.body;

  if (corretora === 'Binance') {
    try {
      const timestamp = Date.now();
      const query = `timestamp=${timestamp}`;
      const signature = crypto.createHmac('sha256', secret_key).update(query).digest('hex');
      const response = await axios.get(`https://api.binance.com/api/v3/account?${query}&signature=${signature}`, {
        headers: { 'X-MBX-APIKEY': api_key }
      });
      if (response.status === 200) {
        return res.json({ status: 'online', mensagem: 'Conexão com Binance verificada com sucesso!' });
      }
    } catch (err) {
      return res.status(500).json({ status: 'erro', mensagem: `Erro na Binance: ${err.response?.data?.msg || err.message}` });
    }
  }
  else if (corretora === 'Gate.io') {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const method = 'GET';
      const url = '/api/v4/spot/accounts';
      const query = ''; // Para esta chamada, a query é vazia

      // Gate.io usa um hash diferente
      const hashed_payload = crypto.createHash('sha512').update('').digest('hex');
      const sign_string = `${method}\n${url}\n${query}\n${hashed_payload}\n${timestamp}`;
      const signature = crypto.createHmac('sha512', secret_key).update(sign_string).digest('hex');

      const response = await axios.get(`https://api.gateio.ws${url}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'KEY': api_key,
          'Timestamp': timestamp,
          'SIGN': signature
        }
      });

      if (response.status === 200) {
        return res.json({ status: 'online', mensagem: 'Conexão com Gate.io verificada com sucesso!' });
      }
    } catch (err) {
      return res.status(500).json({ status: 'erro', mensagem: `Erro na Gate.io: ${err.response?.data?.message || err.message}` });
    }
  }

  return res.status(400).json({ status: 'erro', mensagem: 'Corretora não suportada' });
});

router.post('/', async (req, res) => {
  const { nome, corretora, api_key, secret_key, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO contas (user_id, nome, corretora, api_key, secret_key, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, nome, corretora, api_key, secret_key, status || 'offline']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar conta: ' + err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contas WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar contas: ' + err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, corretora, api_key, secret_key, status } = req.body;
  try {
    await pool.query(
      `UPDATE contas SET nome=$1, corretora=$2, api_key=$3, secret_key=$4, status=$5 WHERE id=$6 AND user_id=$7`,
      [nome, corretora, api_key, secret_key, status, id, req.user.id]
    );
    res.json({ mensagem: 'Conta atualizada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar conta: ' + err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contas WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ mensagem: 'Conta excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir conta: ' + err.message });
  }
});

module.exports = router;