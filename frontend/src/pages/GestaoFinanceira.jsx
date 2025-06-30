import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GestaoFinanceira.css';

// --- Componente do Modal para Contas (Ativos) ---
const ContaModal = ({ conta, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nome: conta?.nome || '',
        tipo: conta?.tipo || 'conta_corrente',
        saldo: conta?.saldo || 0,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{conta ? 'Editar Conta' : 'Adicionar Nova Conta'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome da Conta</label>
                        <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Banco Inter" required />
                    </div>
                    <div className="form-group">
                        <label>Tipo de Conta</label>
                        <select name="tipo" value={formData.tipo} onChange={handleChange}>
                            <option value="conta_corrente">Conta Corrente</option>
                            <option value="investimentos">Investimentos</option>
                            <option value="poupanca">Poupança</option>
                            <option value="caixa">Caixa (Dinheiro)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Saldo (R$)</label>
                        <input type="number" name="saldo" step="0.01" value={formData.saldo} onChange={handleChange} required />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancelar">Cancelar</button>
                        <button type="submit" className="btn-salvar">{conta ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente do Modal para Despesas (Passivos) ---
const PassivoModal = ({ passivo, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        descricao: passivo?.descricao || '',
        tipo: passivo?.tipo || 'cartao_credito',
        valor_total: passivo?.valor_total || 0,
        valor_pago: passivo?.valor_pago || 0,
        data_vencimento: passivo?.data_vencimento ? new Date(passivo.data_vencimento).toISOString().split('T')[0] : '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{passivo ? 'Editar Despesa/Dívida' : 'Adicionar Nova Despesa/Dívida'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} placeholder="Ex: Fatura Nubank" required />
                    </div>
                    <div className="form-group">
                        <label>Tipo</label>
                        <select name="tipo" value={formData.tipo} onChange={handleChange}>
                            <option value="cartao_credito">Cartão de Crédito</option>
                            <option value="financiamento">Financiamento</option>
                            <option value="despesa_fixa">Despesa Fixa</option>
                            <option value="outros">Outros</option>
                        </select>
                    </div>
                     <div className="form-group">
                        <label>Valor Total (R$)</label>
                        <input type="number" name="valor_total" step="0.01" value={formData.valor_total} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Valor Pago (R$)</label>
                        <input type="number" name="valor_pago" step="0.01" value={formData.valor_pago} onChange={handleChange} />
                    </div>
                     <div className="form-group">
                        <label>Data de Vencimento</label>
                        <input type="date" name="data_vencimento" value={formData.data_vencimento} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancelar">Cancelar</button>
                        <button type="submit" className="btn-salvar">{passivo ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal ---
function GestaoFinanceira() {
    const [resumo, setResumo] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [isContaModalOpen, setIsContaModalOpen] = useState(false);
    const [contaEmEdicao, setContaEmEdicao] = useState(null);
    
    const [isPassivoModalOpen, setIsPassivoModalOpen] = useState(false);
    const [passivoEmEdicao, setPassivoEmEdicao] = useState(null);

    const API_URL = "http://localhost:5000/api/gestao";
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    const carregarResumo = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get(`${API_URL}/resumo`, authHeaders);
            setResumo(data);
        } catch (err) {
            console.error("Erro ao carregar resumo financeiro:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarResumo();
    }, []);

    const handleOpenContaModal = (conta = null) => {
        setContaEmEdicao(conta);
        setIsContaModalOpen(true);
    };
    const handleCloseContaModal = () => {
        setIsContaModalOpen(false);
        setContaEmEdicao(null);
    };
    const handleSaveConta = async (formData) => {
        const url = contaEmEdicao ? `${API_URL}/contas/${contaEmEdicao.id}` : `${API_URL}/contas`;
        const method = contaEmEdicao ? 'put' : 'post';
        try {
            await axios[method](url, formData, authHeaders);
            handleCloseContaModal();
            carregarResumo();
        } catch (error) { 
            console.error("Erro ao salvar conta:", error);
            alert("Não foi possível salvar a conta."); 
        }
    };
    const handleDeleteConta = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
            try {
                await axios.delete(`${API_URL}/contas/${id}`, authHeaders);
                carregarResumo();
            } catch (error) {
                 console.error("Erro ao excluir conta:", error);
                 alert("Não foi possível excluir a conta.");
            }
        }
    };

    const handleOpenPassivoModal = (passivo = null) => {
        setPassivoEmEdicao(passivo);
        setIsPassivoModalOpen(true);
    };
    const handleClosePassivoModal = () => {
        setIsPassivoModalOpen(false);
        setPassivoEmEdicao(null);
    };
    const handleSavePassivo = async (formData) => {
        const url = passivoEmEdicao ? `${API_URL}/passivos/${passivoEmEdicao.id}` : `${API_URL}/passivos`;
        const method = passivoEmEdicao ? 'put' : 'post';
        try {
            await axios[method](url, formData, authHeaders);
            handleClosePassivoModal();
            carregarResumo();
        } catch (error) { 
            console.error("Erro ao salvar despesa:", error);
            alert("Não foi possível salvar a despesa."); 
        }
    };
    const handleDeletePassivo = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta despesa?")) {
            try {
                await axios.delete(`${API_URL}/passivos/${id}`, authHeaders);
                carregarResumo();
            } catch (error) {
                 console.error("Erro ao excluir despesa:", error);
                 alert("Não foi possível excluir a despesa.");
            }
        }
    };
    
    const formatarValor = (valor) => `R$ ${parseFloat(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return <div className="gestao-container">Carregando...</div>;
    if (!resumo) return <div className="gestao-container">Não foi possível carregar os dados. Tente novamente mais tarde.</div>;

    return (
        <div className="gestao-container">
            {isContaModalOpen && <ContaModal conta={contaEmEdicao} onClose={handleCloseContaModal} onSave={handleSaveConta} />}
            {isPassivoModalOpen && <PassivoModal passivo={passivoEmEdicao} onClose={handleClosePassivoModal} onSave={handleSavePassivo} />}
            
            <h2>Gestão Financeira</h2>

            <div className="resumo-grid-financeiro">
                <div className="resumo-card-financeiro"><h3>Patrimônio Cripto</h3><p>{formatarValor(resumo.saldoCripto)}</p></div>
                <div className="resumo-card-financeiro"><h3>Outros Ativos</h3><p>{formatarValor(resumo.saldoOutrosAtivos)}</p></div>
                <div className="resumo-card-financeiro"><h3>Passivos (Dívidas)</h3><p className="patrimonio-negativo">{formatarValor(resumo.totalPassivos)}</p></div>
                <div className={`resumo-card-financeiro`}><h3 >Patrimônio Líquido Total</h3><p className={resumo.patrimonioLiquido >= 0 ? 'patrimonio-positivo' : 'patrimonio-negativo'}>{formatarValor(resumo.patrimonioLiquido)}</p></div>
            </div>

            <section className="secao-financeira">
                <div className="secao-header">
                    <h3>Minhas Contas e Investimentos</h3>
                    <button className="btn-adicionar" onClick={() => handleOpenContaModal()}>Adicionar Conta</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Saldo</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resumo?.contas?.map(conta => (
                            <tr key={conta.id}>
                                <td>{conta.nome}</td>
                                <td>{conta.tipo.replace('_', ' ')}</td>
                                <td>{formatarValor(conta.saldo)}</td>
                                <td className="botoes-acao-tabela">
                                    <button onClick={() => handleOpenContaModal(conta)} className="btn-editar">Editar</button>
                                    <button onClick={() => handleDeleteConta(conta.id)} className="btn-excluir">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <section className="secao-financeira">
                <div className="secao-header">
                    <h3>Despesas e Passivos</h3>
                    <button className="btn-adicionar" onClick={() => handleOpenPassivoModal()}>Adicionar Despesa</button>
                </div>
                 <table>
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Valor Restante</th>
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resumo?.passivos?.map(p => (
                            <tr key={p.id}>
                                <td>{p.descricao}</td>
                                <td>{p.tipo.replace('_', ' ')}</td>
                                <td className="patrimonio-negativo">{formatarValor(p.valor_total - p.valor_pago)}</td>
                                <td>{formatarValor(p.valor_total)}</td>
                                <td className="botoes-acao-tabela">
                                    <button onClick={() => handleOpenPassivoModal(p)} className="btn-editar">Editar</button>
                                    <button onClick={() => handleDeletePassivo(p.id)} className="btn-excluir">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default GestaoFinanceira;