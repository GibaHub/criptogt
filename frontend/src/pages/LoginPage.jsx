import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      // Salva o token E os dados do usuário
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // <-- ADICIONE ESTA LINHA
      navigate("/dashboard");
    } catch (err) {
      alert("Falha no login: " + (err.response?.data?.message || "Erro desconhecido"));
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <img src="/logo.png" alt="CriptoGT Logo" className="logo" />
        <h2>Entrar</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn" onClick={handleLogin}>Entrar</button>
        <p className="text">
          Não é registrado? <Link to="/register">Registrar</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;