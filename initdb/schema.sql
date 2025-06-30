-- Apaga tabelas antigas se existirem para garantir um começo limpo
DROP TABLE IF EXISTS feedbacks, ordens_automaticas, saldos, financeiro_contas, financeiro_passivos, contas, users CASCADE;

-- Recria as tabelas com a estrutura correta
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  -- CORREÇÃO: Aumenta o tamanho do campo para armazenar o hash completo
  password VARCHAR(255) NOT NULL, 
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserção do usuário administrador padrão
-- ATENÇÃO: Substitua pelo seu hash gerado anteriormente
INSERT INTO users (name, email, password, is_approved) VALUES (
    'Administrador',
    'admin@criptogt.com',
    '1234', -- <-- COLOQUE SEU HASH AQUI
    TRUE
);

-- O restante do seu schema (tabelas contas, saldos, etc.) permanece o mesmo...
CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  corretora TEXT NOT NULL,
  api_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  status TEXT DEFAULT 'offline'
);

CREATE TABLE IF NOT EXISTS saldos (
  id SERIAL PRIMARY KEY,
  conta_id INTEGER REFERENCES contas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  saldo NUMERIC NOT NULL,
  tipo VARCHAR(10) DEFAULT 'automático',
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordens_automaticas (
  id SERIAL PRIMARY KEY,
  conta_id INTEGER REFERENCES contas(id) ON DELETE CASCADE,
  moeda VARCHAR(20) NOT NULL,
  data_criacao DATE NOT NULL,
  valor_referencia NUMERIC NOT NULL,
  percentual_compra NUMERIC NOT NULL,
  percentual_venda NUMERIC NOT NULL,
  valor_compra NUMERIC NOT NULL,
  valor_venda NUMERIC NOT NULL,
  valor_ordem NUMERIC,
  percentual_perda_maxima NUMERIC, -- <-- NOVA COLUNA
  valor_venda_perda NUMERIC,       -- <-- NOVA COLUNA
  status VARCHAR(20) DEFAULT 'pendente',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  referencia TEXT,
  mensagem TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS financeiro_contas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  saldo NUMERIC NOT NULL DEFAULT 0,
  data_saldo DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS financeiro_passivos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  descricao VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  data_vencimento DATE
);

CREATE TABLE IF NOT EXISTS alertas_monitoramento (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    moeda VARCHAR(20) NOT NULL,
    preco_referencia NUMERIC NOT NULL,
    percentual_subida NUMERIC,
    percentual_queda NUMERIC,
    ativo BOOLEAN DEFAULT TRUE,
    ultima_notificacao TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ... (todas as outras tabelas permanecem as mesmas) ...

CREATE TABLE IF NOT EXISTS configuracoes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nome_config TEXT NOT NULL, -- Nome para identificar a configuração (ex: "Meu Celular Pessoal")
  telegram_bot_token TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL
);