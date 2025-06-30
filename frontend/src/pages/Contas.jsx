import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Contas.css";

function Contas() {
  const [form, setForm] = useState({
    nome: "",
    corretora: "Binance",
    api_key: "",
    secret_key: "",
    status: "offline"
  });
  const [contas, setContas] = useState([]);
  const [editId, setEditId] = useState(null);

  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

  const carregarContas = async () => {
    if (!token) return;
    try {
      const { data: contasRecebidas } = await axios.get(`${API_URL}/contas`, authHeaders);
      const atualizadas = await Promise.all(
        contasRecebidas.map(async (conta) => {
          try {
            const resp = await axios.post(`${API_URL}/contas/testar`, {
              api_key: conta.api_key,
              secret_key: conta.secret_key,
              corretora: conta.corretora,
            }, authHeaders);
            const statusAtual = resp.data.status === "online" ? "online" : "offline";
             if (conta.status !== statusAtual) {
                await axios.put(`${API_URL}/contas/${conta.id}`, { ...conta, status: statusAtual }, authHeaders);
             }
            return { ...conta, status: statusAtual };
          } catch {
            return { ...conta, status: "offline" };
          }
        })
      );
      setContas(atualizadas);
    } catch (err) {
      console.error("Erro ao carregar contas:", err);
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);
  
  const resetForm = () => {
    setEditId(null);
    setForm({ nome: "", corretora: "Binance", api_key: "", secret_key: "", status: "offline" });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `${API_URL}/contas/${editId}` : `${API_URL}/contas`;
    const method = editId ? 'put' : 'post';
    try {
      await axios[method](url, form, authHeaders);
      resetForm();
      carregarContas();
    } catch (err) {
      alert("Erro ao salvar conta");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta conta?")) {
      await axios.delete(`${API_URL}/contas/${id}`, authHeaders);
      carregarContas();
    }
  };

  const handleEdit = (conta) => {
    setForm(conta);
    setEditId(conta.id);
    window.scrollTo(0, 0);
  };

  const testarConexao = async () => {
    if (!form.api_key || !form.secret_key) {
        alert("Preencha a API Key e a Secret Key para testar.");
        return;
    }
    try {
      const res = await axios.post(`${API_URL}/contas/testar`, {
        api_key: form.api_key,
        secret_key: form.secret_key,
        corretora: form.corretora
      }, authHeaders); 

      alert(res.data.status === "online" ? "✅ Conexão bem-sucedida!" : `❌ Erro: ${res.data.message}`);
    } catch (err) {
      alert(`❌ Falha na conexão: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="contas-container">
      <div className="contas-form-box">
        <h2>{editId ? "Editar Conta de Corretora" : "Cadastro de Conta de Corretora"}</h2>
        <form className="contas-form" onSubmit={handleSubmit}>
          <input name="nome" placeholder="Nome da conta (Ex: Minha Binance)" value={form.nome} onChange={handleChange} required />
          <select name="corretora" value={form.corretora} onChange={handleChange}>
            <option value="Binance">Binance</option>
            <option value="Gate.io">Gate.io</option> {/* <-- LINHA CORRIGIDA */}
          </select>
          <input className="full-width" name="api_key" placeholder="API Key" value={form.api_key} onChange={handleChange} required />
          <input className="full-width" name="secret_key" placeholder="Secret Key" value={form.secret_key} onChange={handleChange} required />
          
          <div className="botoes-acao-contas">
            {editId && <button type="button" className="btn cancelar" onClick={resetForm}>Cancelar</button>}
            <button type="button" className="btn testar" onClick={testarConexao}>Testar Conexão</button>
            <button type="submit" className="btn salvar">{editId ? "Atualizar" : "Salvar"}</button>
          </div>
        </form>
      </div>

      <div className="grid-contas">
        <h3>Contas cadastradas</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Corretora</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{c.corretora}</td>
                <td>****{c.api_key.slice(-4)}</td>
                <td>
                  <div className="status-cell">
                    <span className={`status-dot ${c.status === 'online' ? 'status-online' : 'status-offline'}`}></span>
                    {c.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </td>
                <td className="botoes-acao-tabela">
                  <button onClick={() => handleEdit(c)} className="btn-editar">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="btn-excluir">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Contas;