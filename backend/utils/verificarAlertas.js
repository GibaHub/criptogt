const pool = require('../db');
const axios = require('axios');
const { notificarUsuario } = require('./telegram'); // <-- Altera para notificarUsuario

async function executarAlertas() {
    console.log("🔍 Verificando alertas de preços...");
    try {
        const { rows: alertas } = await pool.query(
            "SELECT * FROM alertas_monitoramento WHERE ativo = true"
        );

        for (const alerta of alertas) {
            // ... (lógica para obter preço e verificar variação) ...
            
            let notificacaoEnviada = false;
            let mensagem = '';

            if (alerta.percentual_subida && variacao >= alerta.percentual_subida) {
                mensagem = `🚀 *Alerta de Alta!*\n\n*Moeda:* ${alerta.moeda}\n*Variação:* +${variacao.toFixed(2)}%`;
                notificacaoEnviada = true;
            } 
            else if (alerta.percentual_queda && variacao <= -alerta.percentual_queda) {
                mensagem = `🔻 *Alerta de Queda!*\n\n*Moeda:* ${alerta.moeda}\n*Variação:* ${variacao.toFixed(2)}%`;
                notificacaoEnviada = true;
            }

            if (notificacaoEnviada) {
                await notificarUsuario(alerta.user_id, mensagem); // <-- Usa a nova função
                await pool.query("UPDATE alertas_monitoramento SET ativo = false, ultima_notificacao = NOW() WHERE id = $1", [alerta.id]);
            }
        }
    } catch (err) {
        console.error("Erro no job de verificação de alertas:", err.message);
    }
}

module.exports = { executarAlertas };