import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import Contas from "./pages/Contas";
import MonitoramentoSaldos from "./pages/MonitoramentoSaldos";
import MonitoramentoAlertas from "./pages/MonitoramentoAlertas";
import GestaoFinanceira from "./pages/GestaoFinanceira";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import Configuracoes from "./pages/Configuracoes";
import HomeLayout from "./pages/HomeLayout";
import OrdensAuto from "./pages/OrdensAuto";

const isAuthenticated = () => !!localStorage.getItem("token");

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Privadas com o Layout Principal */}
        <Route path="/" element={<PrivateRoute><HomeLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="contas" element={<Contas />} />
          <Route path="monitoramento-saldos" element={<MonitoramentoSaldos />} />
          <Route path="monitoramento-alertas" element={<MonitoramentoAlertas />} />
          <Route path="gestao" element={<GestaoFinanceira />} />
          <Route path="gestao-usuarios" element={<GestaoUsuarios />} />
          <Route path="ordensauto" element={<OrdensAuto />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;