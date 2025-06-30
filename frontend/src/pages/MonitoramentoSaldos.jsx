import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "./MonitoramentoSaldos.css";

function Monitoramento() {
  const [historico, setHistorico] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
      const res = await axios.get("http://localhost:5000/api/monitoramento", authHeaders);
      setHistorico(res.data.historico);
      setResumo(res.data.resumo);
    } catch (err) {
      console.error("Erro ao carregar dados de monitoramento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);
  
  const formatadorTooltip = (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatadorYAxis = (tick) => `R$ ${tick.toLocaleString('pt-BR')}`;

  if (loading) {
    return <div>Carregando dados de monitoramento...</div>;
  }

  if (!resumo) {
    return <div>Não foi possível carregar os dados. Verifique se você possui contas cadastradas e online.</div>;
  }

  return (
    <div className="monitoramento-container">
      <h2>Monitoramento de Performance</h2>

      <div className="resumo-grid">
        <div className="resumo-card">
          <h3>Saldo Inicial</h3>
          <p>R$ {parseFloat(resumo.saldoInicial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="resumo-card">
          <h3>Saldo Atual</h3>
          <p>R$ {parseFloat(resumo.saldoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="resumo-card">
          <h3>Variação (R$)</h3>
          <p className={resumo.variacaoValor >= 0 ? 'variacao-positiva' : 'variacao-negativa'}>
            R$ {parseFloat(resumo.variacaoValor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="resumo-card">
          <h3>Variação (%)</h3>
          <p className={resumo.variacaoPercentual >= 0 ? 'variacao-positiva' : 'variacao-negativa'}>
            {parseFloat(resumo.variacaoPercentual).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grafico-box">
        <h3>Evolução do Patrimônio (Últimos 30 dias)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={historico} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="data" stroke="#888" />
            <YAxis stroke="#888" tickFormatter={formatadorYAxis} />
            <Tooltip
              formatter={formatadorTooltip}
              contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444' }}
              labelStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="saldo" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSaldo)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Monitoramento;