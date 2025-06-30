import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import './HomeLayout.css';

const HomeLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="logo">CriptoGT</h2>
        <nav>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/contas">Contas</Link></li>
            <li><Link to="/monitoramento-saldos">Monitoramento de Saldos</Link></li>
            <li><Link to="/monitoramento-alertas">Monitoramento de Alertas</Link></li>
            <li><Link to="/gestao">Gestão Financeira</Link></li>
            <li><Link to="/ordensauto">Ordens</Link></li>
            <li><Link to="/gestao-usuarios">Gestão de Usuários</Link></li>
            <li><Link to="/configuracoes">Configurações</Link></li>
            <li><button className="btn-link" onClick={logout}>Sair</button></li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;