const axios = require('axios');
const pool = require('../db');

/**
 * Envia uma notificação para um usuário específico, buscando suas credenciais no banco.
 * Usado pelos jobs de alerta.
 */
const notificarUsuario = async (userId, mensagem) => {
    try {
        const { rows } = await pool.query(
            'SELECT telegram_bot_token, telegram_chat_id FROM configuracoes WHERE user_id = $1',
            [userId]
        );

        if (rows.length > 0 && rows[0].telegram_bot_token && rows[0].telegram_chat_id) {
            const { telegram_bot_token, telegram_chat_id } = rows[0];
            // Reutiliza a função de envio direto
            await enviarMensagemDireta(telegram_bot_token, telegram_chat_id, mensagem);
        } else {
            console.warn(`Configurações do Telegram não encontradas para o usuário ${userId}. Notificação não enviada.`);
        }
    } catch (error) {
        console.error(`Erro ao buscar config do Telegram para user ${userId}:`, error.message);
    }
};

/**
 * Envia uma mensagem de teste diretamente com as credenciais fornecidas.
 * Usado pela rota de teste.
 */
const enviarMensagemDireta = async (botToken, chatId, mensagem) => {
    if (!botToken || !chatId) {
        throw new Error("Token do Bot e Chat ID são obrigatórios.");
    }
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: chatId,
            text: mensagem,
            parse_mode: 'Markdown'
        });
        console.log("Mensagem enviada para o Telegram com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar mensagem para o Telegram:", error.response ? error.response.data : error.message);
        // Lança o erro para que a rota de teste possa capturá-lo
        throw new Error(error.response?.data?.description || "Falha ao enviar mensagem.");
    }
};

module.exports = { notificarUsuario, enviarMensagemDireta };