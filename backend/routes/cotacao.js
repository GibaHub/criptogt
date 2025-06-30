const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.get('/binance/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase().replace(/[^A-Z]/g, '');
  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    res.json({ valor_atual: response.data.price });
  } catch (err) {
    console.error('Erro ao buscar cotação:', err.message);
    res.status(500).json({ erro: 'Erro ao buscar cotação da moeda.' });
  }
});

module.exports = router;