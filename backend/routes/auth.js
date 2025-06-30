const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: "Email já cadastrado." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4)",
      [name, email, phone, hashedPassword]
    );
    res.status(201).json({ message: "Usuário registrado com sucesso." });
  } catch (error) {
    res.status(500).json({ message: "Erro ao registrar usuário." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: "Usuário não encontrado." });

    const user = result.rows[0];

    if (!user.is_approved) {
        return res.status(403).json({ message: "Acesso não liberado. Aguarde a aprovação de um administrador." });
    }

    // --- Início da Depuração e Correção ---

    // 1. Limpa qualquer espaço em branco extra do hash do banco de dados.
    const storedHash = user.password.trim();

    // 2. Log para vermos exatamente o que está sendo comparado.
    console.log("--- Depurando Login ---");
    console.log("Senha recebida (Plain Text):", password);
    console.log("Hash armazenado no Banco:", storedHash);
    console.log("Tamanho do Hash:", storedHash.length);
    console.log("-----------------------");

    const valid = await bcrypt.compare(password, storedHash);
    
    // --- Fim da Depuração e Correção ---

    if (!valid) {
      console.error("Resultado da comparação: Inválido");
      return res.status(401).json({ message: "Senha incorreta." });
    }

    console.log("Resultado da comparação: Válido");
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    const userToReturn = { id: user.id, name: user.name, email: user.email };
    res.json({ token, user: userToReturn });

  } catch (error) {
    console.error("Erro no processo de login:", error);
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

module.exports = router;