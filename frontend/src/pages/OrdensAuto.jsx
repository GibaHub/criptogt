import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrdensAuto.css';

const OrdensAuto = () => {
  const [contas, setContas] = useState([]);
  const [moedasDisponiveis, setMoedasDisponiveis] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    conta_id: '',
    corretora: '',
    moeda: '',
    valor_atual: '',
    percentual_compra: '',
    percentual_venda: '',
    valor_ordem: '',
    valor_compra: '',
    valor_venda: '',
    percentual_perda_maxima: '',
    valor_venda_perda: '',
    ativo: true,
    status: 'pendente'
  });

  const API_URL = "http://localhost:5000/api";
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

  const carregarDadosIniciais = async () => {
    if (!token) return;
    try {
      const [contasRes, ordensRes] = await Promise.all([
        axios.get(`${API_URL}/contas`, authHeaders),
        axios.get(`${API_URL}/ordens_auto`, authHeaders)
      ]);
      setContas(contasRes.data);
      setOrdens(ordensRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    }
  };

  useEffect(() => {
    carregarDadosIniciais();
  }, []);
  
  useEffect(() => {
    const carregarMoedas = async () => {
      if (!form.corretora || !token) {
        setMoedasDisponiveis([]);
        return;
      }
      try {
        let endpoint = '';
        if (form.corretora.toLowerCase() === 'binance') {
            endpoint = `${API_URL}/cotacao/symbols`;
        } else if (form.corretora.toLowerCase() === 'gate.io') {
            endpoint = `${API_URL}/cotacao/gateio/symbols`;
        }
        
        if (endpoint) {
            const res = await axios.get(endpoint, authHeaders);
            setMoedasDisponiveis([...new Set(res.data)].filter(m => m));
        }
      } catch (err) {
        setMoedasDisponiveis([]);
      }
    };
    carregarMoedas();
  }, [form.corretora]);

  useEffect(() => {
    const va = parseFloat(form.valor_atual);
    const pc = parseFloat(form.percentual_compra);
    const pv = parseFloat(form.percentual_venda);
    const pp = parseFloat(form.percentual_perda_maxima);
    
    let novosValores = {};
    let valorCompraCalculado = parseFloat(form.valor_compra);

    if (!isNaN(va) && !isNaN(pc)) {
      valorCompraCalculado = va * (1 - pc / 100);
      novosValores.valor_compra = valorCompraCalculado;
    }
    
    if (!isNaN(valorCompraCalculado) && !isNaN(pv)) {
      novosValores.valor_venda = valorCompraCalculado * (1 + pv / 100);
    }

    if (!isNaN(valorCompraCalculado) && !isNaN(pp)) {
      novosValores.valor_venda_perda = valorCompraCalculado * (1 - pp / 100);
    }

    if(Object.keys(novosValores).length > 0) {
      setForm(prev => ({ ...prev, ...novosValores }));
    }
  }, [form.valor_atual, form.percentual_compra, form.percentual_venda, form.percentual_perda_maxima]);
  
  useEffect(() => {
    const buscarCotacao = async () => {
      if (!form.moeda || !form.corretora) return;
      try {
        const res = await axios.get(`${API_URL}/cotacao/binance/${form.moeda}`, authHeaders);
        setForm(prev => ({ ...prev, valor_atual: res.data.valor_atual }));
      } catch (err) {
        setForm(prev => ({ ...prev, valor_atual: ''}));
      }
    };
    if (form.moeda) {
        buscarCotacao();
    }
  }, [form.moeda, form.corretora]);

  const resetForm = () => {
    setEditId(null);
    setForm({
      conta_id: '', corretora: '', moeda: '', valor_atual: '',
      percentual_compra: '', percentual_venda: '', valor_ordem: '',
      valor_compra: '', valor_venda: '', percentual_perda_maxima: '', valor_venda_perda: '',
      ativo: true, status: 'pendente'
    });
  };

  const handleEdit = (ordem) => {
    setEditId(ordem.id);
    const contaDaOrdem = contas.find(c => c.id === ordem.conta_id);
    setForm({ ...ordem, corretora: contaDaOrdem ? contaDaOrdem.corretora.toLowerCase() : '' });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta ordem?")) {
      try {
        await axios.delete(`${API_URL}/ordens_auto/${id}`, authHeaders);
        carregarDadosIniciais();
      } catch (error) {
        alert('Erro ao excluir ordem.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'conta_id') {
      const contaSelecionada = contas.find(c => c.id === parseInt(value));
      setForm(prev => ({
        ...prev, conta_id: value,
        corretora: contaSelecionada ? contaSelecionada.corretora.toLowerCase() : '',
        moeda: '', valor_atual: ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId ? `${API_URL}/ordens_auto/${editId}` : `${API_URL}/ordens_auto`;
    const method = editId ? 'put' : 'post';
    try {
      await axios[method](url, form, authHeaders);
      alert(`✅ Ordem ${editId ? 'atualizada' : 'salva'} com sucesso!`);
      resetForm();
      carregarDadosIniciais();
    } catch (error) {
      alert(`Erro ao ${editId ? 'atualizar' : 'salvar'} ordem.`);
    }
  };
  
  const getStatusClassName = (status) => {
    switch (status?.toLowerCase()) {
      case 'comprado': return 'status-comprado';
      case 'vendido': return 'status-vendido';
      case 'pendente': return 'status-pendente';
      default: return '';
    }
  };
  
  const formatarPreco = (preco) => {
    if (preco === null || preco === undefined || preco === '') return '';
    const p = parseFloat(preco);
    if (isNaN(p)) return '';
    if (p > 0 && p < 0.01) {
        return p.toFixed(8);
    }
    return p.toFixed(2);
  };

  return (
    <div className="ordens-container">
      <div className="ordem-form-box">
        <h2>{editId ? 'Editar Ordem Automática' : 'Cadastro de Ordem Automática'}</h2>
        <form onSubmit={handleSubmit}>
            <div className="form-grid">
                <select name="conta_id" value={form.conta_id} onChange={handleChange} required>
                    <option value="">Selecione a Conta</option>
                    {contas.map(conta => (
                        <option key={conta.id} value={conta.id}>
                        {conta.nome} ({conta.corretora})
                        </option>
                    ))}
                </select>
                <select name="moeda" value={form.moeda} onChange={handleChange} required disabled={!form.corretora}>
                    <option value="">Selecione a moeda</option>
                    {moedasDisponiveis.map((moeda, idx) => <option key={idx} value={moeda}>{moeda}</option>)}
                </select>
                <input name="valor_atual" placeholder="Valor Atual (USD)" type="text" value={form.valor_atual} readOnly />
                <input name="valor_ordem" placeholder="Valor da Ordem (USDT)" type="number" step="any" value={form.valor_ordem} onChange={handleChange} required />
                <input name="percentual_compra" placeholder="% Queda p/ Compra" type="number" step="any" value={form.percentual_compra} onChange={handleChange} required />
                <input name="valor_compra" placeholder="Valor de Compra" type="text" value={formatarPreco(form.valor_compra)} readOnly />
                <input name="percentual_venda" placeholder="% Alta p/ Venda (Lucro)" type="number" step="any" value={form.percentual_venda} onChange={handleChange} required />
                <input name="valor_venda" placeholder="Valor de Venda (Lucro)" type="text" value={formatarPreco(form.valor_venda)} readOnly />
                <div className="campo-stop-loss">
                    <input name="percentual_perda_maxima" placeholder="% Perda Máxima (Stop)" type="number" step="any" value={form.percentual_perda_maxima} onChange={handleChange} />
                </div>
                <div className="campo-stop-loss">
                    <input name="valor_venda_perda" placeholder="Valor do Stop Loss" type="text" value={formatarPreco(form.valor_venda_perda)} readOnly />
                </div>
            </div>
            <div className="botoes-acao-ordem">
                {editId && (<button type="button" className="btn cancelar" onClick={resetForm}>Cancelar</button>)}
                <button type="submit" className="btn salvar">{editId ? 'Atualizar Ordem' : 'Salvar Ordem'}</button>
            </div>
        </form>
      </div>

      <div className="ordens-grid">
        <h3>Ordens Cadastradas</h3>
        <div className="tabela-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Moeda</th>
                        <th>Vlr Compra</th>
                        <th>Vlr Venda (Lucro)</th>
                        <th>Vlr Venda (Stop)</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {ordens.map((ordem) => (
                    <tr key={ordem.id}>
                        <td>{ordem.moeda}</td>
                        <td>${formatarPreco(ordem.valor_compra)}</td>
                        <td>${formatarPreco(ordem.valor_venda)}</td>
                        <td>{ordem.valor_venda_perda ? `$${formatarPreco(ordem.valor_venda_perda)}` : '-'}</td>
                        <td><span className={getStatusClassName(ordem.status)}>{ordem.status?.charAt(0).toUpperCase() + ordem.status?.slice(1)}</span></td>
                        <td className="botoes-acao-tabela">
                            <button onClick={() => handleEdit(ordem)} className="btn-editar">Editar</button>
                            <button onClick={() => handleDelete(ordem.id)} className="btn-excluir">Excluir</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default OrdensAuto;