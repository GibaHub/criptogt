import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const formatarValor = (valor) => `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard = ({ titulo, valor, formatador = formatarValor }) => (
    <div className="kpi-card">
        <h3>{titulo}</h3>
        <p>{formatador(valor)}</p>
    </div>
);

const MoversList = ({ titulo, data, tipo }) => (
    <div className="movers-list">
        <h3>{titulo}</h3>
        <ul>
            {data.map(moeda => (
                <li key={moeda.symbol}>
                    <span className="moeda-nome">{moeda.symbol}</span>
                    <span className={tipo === 'ganho' ? 'percentual-ganho' : 'percentual-perda'}>
                        {moeda.priceChangePercent.toFixed(2)}%
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // Pega o nome do usuário do localStorage para uma saudação
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.name) {
            setUserName(user.name.split(' ')[0]); // Pega o primeiro nome
        }

        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get("http://localhost:5000/api/dashboard/summary", authHeaders);
                setSummary(data);
            } catch (error) {
                console.error("Erro ao carregar o resumo do dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return <div className="dashboard-container">Carregando...</div>;
    }

    if (!summary) {
        return <div className="dashboard-container">Não foi possível carregar os dados.</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Bem-vindo de volta, {userName}!</h2>
                <p>Aqui está o resumo da sua vida financeira hoje.</p>
            </div>

            <div className="kpi-grid">
                <KpiCard titulo="Saldo Cripto" valor={summary.saldoCripto} />
                <KpiCard titulo="Outros Saldos" valor={summary.saldoOutrosAtivos} />
                <KpiCard titulo="Ordens Ativas" valor={summary.ordensAtivas} formatador={(v) => v} />
            </div>

            <div className="movers-grid">
                <MoversList titulo="Principais Ganhos (24h)" data={summary.ganhos} tipo="ganho" />
                <MoversList titulo="Principais Perdas (24h)" data={summary.perdas} tipo="perda" />
            </div>
        </div>
    );
}

export default Dashboard;