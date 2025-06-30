const axios = require('axios');
const crypto = require('crypto');
const pool = require('../db');

const STABLECOINS = ['USDT', 'BUSD', 'USDC', 'DAI', 'TUSD', 'USDP'];

async function getTickerPrice(asset) {
    if (STABLECOINS.includes(asset)) return 1.0;
    if (asset === 'BRL') {
        try {
            const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL', { timeout: 5000 });
            return 1 / parseFloat(response.data.price);
        } catch (e) {
             return 0;
        }
    }
    const pairsToTry = [`${asset}USDT`, `${asset}BUSD`];
    for (const pair of pairsToTry) {
        try {
            const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`, { timeout: 5000 });
            return parseFloat(response.data.price);
        } catch (error) {
            // Continua
        }
    }
    return 0;
}

async function getSaldoAtualConsolidado(userId) {
    let saldoTotalUsdt = 0;
    try {
        const { rows: contas } = await pool.query(
            "SELECT * FROM contas WHERE status = 'online' AND corretora = 'Binance' AND user_id = $1",
            [userId]
        );

        if (contas.length === 0) {
            return 0;
        }

        for (const conta of contas) {
            try {
                const timestamp = Date.now();
                const queryString = `timestamp=${timestamp}`;
                const signature = crypto.createHmac('sha256', conta.secret_key).update(queryString).digest('hex');
                
                const config = { 
                    headers: { 'X-MBX-APIKEY': conta.api_key }, 
                    params: { timestamp, signature },
                    timeout: 10000 
                };

                const { data: accountInfo } = await axios.get('https://api.binance.com/api/v3/account', config);

                if (accountInfo && accountInfo.balances) {
                    for (const balance of accountInfo.balances) {
                        const totalAsset = parseFloat(balance.free) + parseFloat(balance.locked);
                        if (totalAsset > 0) {
                            const price = await getTickerPrice(balance.asset);
                            saldoTotalUsdt += totalAsset * price;
                        }
                    }
                }
            } catch (apiError) {
                console.error(`AVISO: Falha ao buscar saldo para a conta "${conta.nome}". Verifique as chaves de API ou a conexão. Erro: ${apiError.message}`);
                continue;
            }
        }
        return saldoTotalUsdt;
    } catch (dbError) {
        console.error("Erro de banco de dados ao buscar contas de cripto:", dbError.message);
        return 0;
    }
}

module.exports = { getSaldoAtualConsolidado };