import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegisterPage.css";

function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (form.password !== form.confirm) return alert("As senhas não coincidem");
    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });
      alert("Registrado com sucesso!");
      navigate("/");
    } catch (err) {
      alert("Erro ao registrar: " + (err.response?.data?.message || "Erro desconhecido"));
    }
  };

 return (
    <div className="register-container">
      <div className="register-card">
        <img src="/logo.png" alt="CriptoGT Logo" className="register-logo" />
        <h2>Registrar</h2>
        <input type="text" name="name" placeholder="Nome completo" onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} />
        <input type="tel" name="phone" placeholder="Celular" onChange={handleChange} />
        <input type="password" name="password" placeholder="Senha" onChange={handleChange} />
        <input type="password" name="confirm" placeholder="Confirmar senha" onChange={handleChange} />
        <button className="btn-register" onClick={handleRegister}>Inscrever-se</button>
        <p className="register-footer">
          Já tem uma conta? <Link to="/">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;