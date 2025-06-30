const express = require('express');
const router = express.Router();
const axios = require('axios');

// Consulta real à Binance
router.get('/symbols', async (req, res) => {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
    const symbols = response.data.symbols
      .filter(s => s.status === 'TRADING')
      .map(s => s.symbol) // Alterado de s.symbols para s.symbol
      .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicatas
    res.json(symbols);
  } catch (err) {
    console.error('Erro ao consultar Binance:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar moedas da Binance.' });
  }
});

module.exports = router;