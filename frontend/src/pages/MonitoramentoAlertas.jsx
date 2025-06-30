import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MonitoramentoAlertas.css';

function MonitoramentoAlertas() {
    const [alertas, setAlertas] = useState([]);
    const [moedas, setMoedas] = useState([]);
    const [form, setForm] = useState({ moeda: '', percentual_subida: '', percentual_queda: '' });

    const API_URL = "http://localhost:5000/api";
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const [alertasRes, moedasRes] = await Promise.all([
                    axios.get(`${API_URL}/alertas`, authHeaders),
                    axios.get(`${API_URL}/cotacao/symbols`, authHeaders)
                ]);
                setAlertas(alertasRes.data);
                // Filtra para garantir que não haja valores duplicados ou vazios
                setMoedas([...new Set(moedasRes.data)].filter(m => m));
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            }
        };
        fetchData();
    }, [token]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.moeda || (!form.percentual_subida && !form.percentual_queda)) {
            alert("Preencha a moeda e pelo menos um percentual.");
            return;
        }
        try {
            const { data } = await axios.post(`${API_URL}/alertas`, form, authHeaders);
            setAlertas([...alertas, data]);
            setForm({ moeda: '', percentual_subida: '', percentual_queda: '' });
        } catch (error) {
            alert("Erro ao criar alerta.");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Tem certeza que deseja excluir este alerta?")){
            try {
                await axios.delete(`${API_URL}/alertas/${id}`, authHeaders);
                setAlertas(alertas.filter(a => a.id !== id));
            } catch (error) {
                alert("Erro ao excluir alerta.");
            }
        }
    };

    return (
        <div className="monitoramento-criptos-container">
            <h2>Monitoramento de Preços</h2>
            <form className="form-alerta" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Moeda</label>
                    <select name="moeda" value={form.moeda} onChange={handleChange} required>
                        <option value="">Selecione a moeda...</option>
                        {moedas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Alerta de Subida (%)</label>
                    <input type="number" step="any" name="percentual_subida" value={form.percentual_subida} onChange={handleChange} placeholder="Ex: 5" />
                </div>
                <div className="form-group">
                    <label>Alerta de Queda (%)</label>
                    <input type="number" step="any" name="percentual_queda" value={form.percentual_queda} onChange={handleChange} placeholder="Ex: 10" />
                </div>
                
                {/* CORREÇÃO: Botão envolvido por uma div.form-group */}
                <div className="form-group button-group">
                    <button type="submit">Adicionar Alerta</button>
                </div>
            </form>

            <div className="lista-alertas">
                <h3>Alertas Ativos</h3>
                 <table className="tabela-alertas">
                    <thead>
                        <tr>
                            <th>Moeda</th>
                            <th>Preço de Referência</th>
                            <th>Alerta de Subida</th>
                            <th>Alerta de Queda</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alertas.filter(a => a.ativo).map(alerta => (
                            <tr key={alerta.id}>
                                <td>{alerta.moeda}</td>
                                <td>${parseFloat(alerta.preco_referencia).toPrecision(4)}</td>
                                <td>{alerta.percentual_subida ? `${alerta.percentual_subida}%` : '-'}</td>
                                <td>{alerta.percentual_queda ? `-${alerta.percentual_queda}%` : '-'}</td>
                                <td>
                                    <button className="btn-excluir" onClick={() => handleDelete(alerta.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MonitoramentoAlertas;