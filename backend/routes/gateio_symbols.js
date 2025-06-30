const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/gateio/symbols', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get('https://api.gateio.ws/api/v4/spot/currency_pairs');
    // Filtra apenas os pares que estão sendo negociados e os mapeia para o formato "BTC_USDT"
    const symbols = response.data
      .filter(p => p.trade_status === 'tradable')
      .map(p => p.id);
    res.json(symbols);
  } catch (err) {
    console.error('Erro ao consultar Gate.io:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar moedas da Gate.io.' });
  }
});

module.exports = router;