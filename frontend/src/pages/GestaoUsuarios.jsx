import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GestaoUsuarios.css';

// --- Componente do Modal de Edição ---
const UserEditModal = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Editar Usuário</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Telefone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancelar">Cancelar</button>
                        <button type="submit" className="btn-salvar">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal da Página ---
function GestaoUsuarios() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const API_URL = "http://localhost:5000/api";
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };

    const fetchUsers = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get(`${API_URL}/users`, authHeaders);
            setUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprovalChange = async (userId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await axios.put(`${API_URL}/users/${userId}/toggle-approval`, { is_approved: newStatus }, authHeaders);
            
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId ? { ...user, is_approved: newStatus } : user
                )
            );
        } catch (error) {
            console.error("Erro ao atualizar status do usuário:", error);
            alert("Não foi possível atualizar o status.");
        }
    };
    
    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userId, formData) => {
        try {
            const { data } = await axios.put(`${API_URL}/users/${userId}`, formData, authHeaders);
            setUsers(prevUsers => prevUsers.map(user => (user.id === userId ? { ...user, ...data } : user)));
            handleCloseModal();
            alert("Usuário atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            alert(`Não foi possível salvar: ${error.response?.data?.erro || 'Erro desconhecido'}`);
        }
    };
    
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
            try {
                await axios.delete(`${API_URL}/users/${userId}`, authHeaders);
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
                alert("Usuário excluído com sucesso!");
            } catch (error) {
                 console.error("Erro ao excluir usuário:", error);
                 alert(`Não foi possível excluir: ${error.response?.data?.erro || 'Erro desconhecido'}`);
            }
        }
    };

    if (loading) return <div className="gestao-usuarios-container">Carregando usuários...</div>;

    return (
        <div className="gestao-usuarios-container">
            {isModalOpen && <UserEditModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}
            <h2>Gestão de Usuários</h2>
            <table className="tabela-usuarios">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Data de Cadastro</th>
                        <th>Acesso Liberado</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                            <td>
                                <label className="switch">
                                    <input 
                                        type="checkbox" 
                                        checked={user.is_approved}
                                        onChange={() => handleApprovalChange(user.id, user.is_approved)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </td>
                            <td className="botoes-acao-tabela">
                                <button className="btn-editar" onClick={() => handleEditUser(user)}>Editar</button>
                                <button className="btn-excluir" onClick={() => handleDeleteUser(user.id)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default GestaoUsuarios;