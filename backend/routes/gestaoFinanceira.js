const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getSaldoAtualConsolidado } = require('../utils/saldoUtils');
const authenticateToken = require('../middleware/authenticateToken');

// Aplica autenticação a todas as rotas deste arquivo
router.use(authenticateToken);

// Rota principal que consolida todos os dados financeiros
router.get('/resumo', async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Saldo de Criptoativos
        const saldoCripto = await getSaldoAtualConsolidado(userId);

        // 2. Saldo de Contas Manuais (Bancos, etc.)
        const contasManuaisResult = await pool.query(
            "SELECT COALESCE(SUM(saldo), 0) as total FROM financeiro_contas WHERE user_id = $1",
            [userId]
        );
        const saldoOutrosAtivos = parseFloat(contasManuaisResult.rows[0].total);

        // 3. Total de Passivos (Dívidas)
        const passivosResult = await pool.query(
            "SELECT COALESCE(SUM(valor_total - valor_pago), 0) as total FROM financeiro_passivos WHERE user_id = $1",
            [userId]
        );
        const totalPassivos = parseFloat(passivosResult.rows[0].total);

        // 4. Patrimônio Líquido
        const patrimonioLiquido = saldoCripto + saldoOutrosAtivos - totalPassivos;

        // 5. Listar contas e passivos para exibição
        const listaContas = await pool.query("SELECT * FROM financeiro_contas WHERE user_id = $1 ORDER BY nome ASC", [userId]);
        const listaPassivos = await pool.query("SELECT * FROM financeiro_passivos WHERE user_id = $1 ORDER BY descricao ASC", [userId]);

        res.json({
            saldoCripto,
            saldoOutrosAtivos,
            totalPassivos,
            patrimonioLiquido,
            contas: listaContas.rows,
            passivos: listaPassivos.rows
        });

    } catch (err) {
        console.error("Erro ao buscar resumo financeiro:", err.message);
        res.status(500).json({ erro: 'Erro ao buscar dados financeiros.' });
    }
});

// --- CRUD para Contas Financeiras (Ativos) ---

router.post('/contas', async (req, res) => {
    const { nome, tipo, saldo } = req.body;
    try {
        const novaConta = await pool.query(
            "INSERT INTO financeiro_contas (user_id, nome, tipo, saldo) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.user.id, nome, tipo, saldo]
        );
        res.status(201).json(novaConta.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao adicionar conta.' });
    }
});

router.put('/contas/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, tipo, saldo } = req.body;
    try {
        const contaAtualizada = await pool.query(
            "UPDATE financeiro_contas SET nome = $1, tipo = $2, saldo = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
            [nome, tipo, saldo, id, req.user.id]
        );
        if (contaAtualizada.rows.length === 0) {
            return res.status(404).json({ erro: "Conta não encontrada." });
        }
        res.status(200).json(contaAtualizada.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar conta.' });
    }
});

router.delete('/contas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM financeiro_contas WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        res.status(200).json({ mensagem: 'Conta excluída com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao excluir conta.' });
    }
});

// --- CRUD para Despesas e Passivos ---

router.post('/passivos', async (req, res) => {
    const { descricao, tipo, valor_total, valor_pago, data_vencimento } = req.body;
    try {
        const novoPassivo = await pool.query(
            "INSERT INTO financeiro_passivos (user_id, descricao, tipo, valor_total, valor_pago, data_vencimento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [req.user.id, descricao, tipo, valor_total, valor_pago, data_vencimento || null]
        );
        res.status(201).json(novoPassivo.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao adicionar passivo.' });
    }
});

router.put('/passivos/:id', async (req, res) => {
    const { id } = req.params;
    const { descricao, tipo, valor_total, valor_pago, data_vencimento } = req.body;
    try {
        const passivoAtualizado = await pool.query(
            "UPDATE financeiro_passivos SET descricao = $1, tipo = $2, valor_total = $3, valor_pago = $4, data_vencimento = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
            [descricao, tipo, valor_total, valor_pago, data_vencimento || null, id, req.user.id]
        );
         if (passivoAtualizado.rows.length === 0) {
            return res.status(404).json({ erro: "Passivo não encontrado." });
        }
        res.status(200).json(passivoAtualizado.rows[0]);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar passivo.' });
    }
});

router.delete('/passivos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM financeiro_passivos WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        res.status(200).json({ mensagem: 'Passivo excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao excluir passivo.' });
    }
});

module.exports = router;