CREATE TABLE IF NOT EXISTS dizimistas (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  nascimento TEXT,
  endereco TEXT
);

CREATE TABLE IF NOT EXISTS devolucoes (
  id INTEGER PRIMARY KEY,
  dizimista_id INTEGER NOT NULL,
  dizimista_nome TEXT NOT NULL,
  valor REAL NOT NULL,
  data TEXT NOT NULL,
  referencia TEXT NOT NULL,
  observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_devolucoes_dizimista_id
ON devolucoes (dizimista_id);

CREATE INDEX IF NOT EXISTS idx_devolucoes_data
ON devolucoes (data);

CREATE TABLE IF NOT EXISTS ambientes (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  capacidade INTEGER,
  observacao TEXT
);

CREATE TABLE IF NOT EXISTS eventos_salas (
  id INTEGER PRIMARY KEY,
  ambiente_id INTEGER NOT NULL,
  ambiente_nome TEXT NOT NULL,
  titulo TEXT NOT NULL,
  responsavel TEXT,
  data TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_eventos_salas_data
ON eventos_salas (data);

CREATE INDEX IF NOT EXISTS idx_eventos_salas_ambiente_id
ON eventos_salas (ambiente_id);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT
);
