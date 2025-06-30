import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Configuracoes.css';

// --- Componente do Modal ---
const ConfigModal = ({ config, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nome_config: config?.nome_config || '',
        telegram_bot_token: config?.telegram_bot_token || '',
        telegram_chat_id: config?.telegram_chat_id || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>{config ? 'Editar Configuração' : 'Nova Configuração do Telegram'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome da Configuração</label>
                        <input type="text" name="nome_config" value={formData.nome_config} onChange={handleChange} placeholder="Ex: Notificações Celular" required />
                    </div>
                    <div className="form-group">
                        <label>Token do Bot</label>
                        <input type="text" name="telegram_bot_token" value={formData.telegram_bot_token} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Chat ID</label>
                        <input type="text" name="telegram_chat_id" value={formData.telegram_chat_id} onChange={handleChange} required />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancelar">Cancelar</button>
                        <button type="submit" className="btn-salvar">{config ? 'Atualizar' : 'Salvar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal ---
function Configuracoes() {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState(null);

    const API_URL = "http://localhost:5000/api";
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    const fetchConfigs = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/configuracoes`, authHeaders);
            setConfigs(data);
        } catch (error) {
            console.error("Erro ao buscar configurações:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchConfigs();
    }, [token]);

    const handleOpenModal = (config = null) => {
        setEditingConfig(config);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

    const handleSaveConfig = async (formData) => {
        const url = editingConfig ? `${API_URL}/configuracoes/${editingConfig.id}` : `${API_URL}/configuracoes`;
        const method = editingConfig ? 'put' : 'post';
        try {
            await axios[method](url, formData, authHeaders);
            fetchConfigs();
            handleCloseModal();
        } catch (error) {
            alert('Erro ao salvar configuração.');
        }
    };

    const handleDeleteConfig = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta configuração?")) {
            try {
                await axios.delete(`${API_URL}/configuracoes/${id}`, authHeaders);
                fetchConfigs();
            } catch (error) {
                alert('Erro ao excluir configuração.');
            }
        }
    };
    
    const handleTestConfig = async (config) => {
        try {
            const { data } = await axios.post(`${API_URL}/configuracoes/testar`, {
                telegram_bot_token: config.telegram_bot_token,
                telegram_chat_id: config.telegram_chat_id
            }, authHeaders);
            alert(`✅ ${data.mensagem}`);
        } catch (error) {
            alert(`❌ ${error.response?.data?.erro || 'Erro desconhecido.'}`);
        }
    };
    
    if (loading) return <div className="config-container">Carregando...</div>;

    return (
        <div className="config-container">
            {isModalOpen && <ConfigModal config={editingConfig} onClose={handleCloseModal} onSave={handleSaveConfig} />}
            
            <div className="config-header">
                <h2>Configurações de Notificação</h2>
                <button className="btn-adicionar" onClick={() => handleOpenModal()}>Adicionar Nova</button>
            </div>
            
            <table className="grid-config">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Token do Bot</th>
                        <th>Chat ID</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {configs.map(config => (
                        <tr key={config.id}>
                            <td>{config.nome_config}</td>
                            <td>****{config.telegram_bot_token.slice(-6)}</td>
                            <td>{config.telegram_chat_id}</td>
                            <td className="botoes-acao-tabela">
                                <button className="btn-testar" onClick={() => handleTestConfig(config)}>Testar</button>
                                <button className="btn-editar" onClick={() => handleOpenModal(config)}>Editar</button>
                                <button className="btn-excluir" onClick={() => handleDeleteConfig(config.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Configuracoes;