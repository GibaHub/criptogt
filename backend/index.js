const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");


// Importação única para cada rota
const authRoutes = require("./routes/auth");
const contasRoutes = require("./routes/contas");
const monitoramentoRoute = require('./routes/monitoramento');
const cotacaoRoutes = require("./routes/cotacao");
const binanceSymbolsRoutes = require("./routes/binance_symbols");
const gateioSymbolsRoutes = require("./routes/gateio_symbols");
const { router: ordensRouter, executarOrdens } = require("./routes/ordens_auto");
const feedbackRoutes = require("./routes/feedback");
const dashboardRoutes = require("./routes/dashboard");
const gestaoFinanceiraRoutes = require("./routes/gestaoFinanceira");
const usersRoutes = require("./routes/users");
const { executarAlertas } = require("./utils/verificarAlertas");
const alertasRouter = require('./routes/alertas');
const configuracoesRoutes = require("./routes/configuracoes");


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Rotas ---
app.use("/api/auth", authRoutes);
app.use("/api/contas", contasRoutes);
app.use('/api/monitoramento', monitoramentoRoute);
app.use('/api/cotacao', cotacaoRoutes);
app.use('/api/cotacao', binanceSymbolsRoutes);
app.use('/api/cotacao', gateioSymbolsRoutes);
app.use('/api/ordens_auto', ordensRouter);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gestao', gestaoFinanceiraRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/alertas', alertasRouter);
app.use('/api/configuracoes', configuracoesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// --- Funções de Background ---
const { verificarTodasAsContas } = require("./utils/verificarStatus");
setTimeout(() => {
    verificarTodasAsContas();
    setInterval(verificarTodasAsContas, 1000 * 60 * 30); // A cada 30 minutos
}, 15000);

setTimeout(() => {
    executarOrdens();
    setInterval(executarOrdens, 1000 * 60 * 10); // A cada 10 minutos
}, 20000);

setTimeout(() => {
    executarAlertas(); // <-- Chame a função
    setInterval(executarAlertas, 1000 * 60 * 2); // A cada 2 minutos
}, 25000);