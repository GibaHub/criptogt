const axios = require("axios");
const db = require("../db");
const crypto = require("crypto");

async function verificarStatusContaBinance(apiKey, secretKey) {
  try {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(query)
      .digest("hex");

    const url = `https://api.binance.com/api/v3/account?${query}&signature=${signature}`;

    const response = await axios.get(url, {
      headers: {
        "X-MBX-APIKEY": apiKey
      }
    });

    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function verificarTodasAsContas() {
  try {
    const result = await db.query("SELECT * FROM contas WHERE corretora = 'Binance'");
    const contas = result.rows;

    for (const conta of contas) {
      const isOnline = await verificarStatusContaBinance(conta.api_key, conta.secret_key);
      await db.query(
        "UPDATE contas SET status = $1 WHERE id = $2",
        [isOnline ? "online" : "offline", conta.id]
      );
      console.log(`Conta ${conta.nome}: ${isOnline ? "online" : "offline"}`);
    }
  } catch (err) {
    console.error("Erro ao verificar contas Binance:", err);
  }
}

module.exports = { verificarTodasAsContas };
