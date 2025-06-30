const pool = require('../db');
const { getSaldoAtualConsolidado } = require('../utils/saldoUtils');

async function registrarSaldoDiario() {
    console.log('Executando job de registro de saldo diário...');
    try {
        const saldoAtual = await getSaldoAtualConsolidado();
        
        // Se o saldo for maior que zero, prossiga
        if (saldoAtual > 0) {
            const hoje = new Date().toISOString().slice(0, 10);
            
            // Verifica se já existe um saldo automático para hoje
            const { rows } = await pool.query(
                "SELECT * FROM saldos WHERE data = $1 AND tipo = 'automático'",
                [hoje]
            );

            // Se não houver registro para hoje, insere um novo
            if (rows.length === 0) {
                // Pega a primeira conta online para associar o saldo consolidado
                const contaResult = await pool.query("SELECT id FROM contas WHERE status = 'online' LIMIT 1");
                if (contaResult.rows.length > 0) {
                    const contaId = contaResult.rows[0].id;
                    await pool.query(
                        "INSERT INTO saldos (conta_id, data, saldo, tipo) VALUES ($1, $2, $3, 'automático')",
                        [contaId, hoje, saldoAtual.toFixed(2)]
                    );
                    console.log(`Saldo diário de ${saldoAtual.toFixed(2)} registrado para ${hoje}`);
                } else {
                    console.log('Nenhuma conta online encontrada para registrar o saldo diário.');
                }
            } else {
                console.log(`Saldo para ${hoje} já existe. Ignorando.`);
            }
        } else {
            console.log('Saldo atual é zero, nenhum registro foi criado.');
        }
    } catch (error) {
        console.error('Erro ao executar o job de registro de saldo diário:', error.message);
    }
}

module.exports = { registrarSaldoDiario };