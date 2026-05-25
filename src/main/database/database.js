const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { app } = require('electron');

let connection;

const DATA_FOLDER_NAME = 'Sistema de Gestao Paroquial - SGP';
const DATABASE_FILE_NAME = 'sgp.sqlite';

function normalizeDevolucao(row) {
  return {
    id: row.id,
    dizimistaId: row.dizimista_id,
    dizimistaNome: row.dizimista_nome,
    valor: row.valor,
    data: row.data,
    referencia: row.referencia,
    observacao: row.observacao || ''
  };
}

function normalizeAmbiente(row) {
  return {
    id: row.id,
    nome: row.nome,
    capacidade: row.capacidade || '',
    observacao: row.observacao || ''
  };
}

function normalizeEventoSala(row) {
  return {
    id: row.id,
    ambienteId: row.ambiente_id,
    ambienteNome: row.ambiente_nome,
    titulo: row.titulo,
    responsavel: row.responsavel || '',
    data: row.data,
    horaInicio: row.hora_inicio,
    horaFim: row.hora_fim,
    observacao: row.observacao || ''
  };
}

function normalizeDizimistaParams(dizimista) {
  return {
    id: dizimista.id ? Number(dizimista.id) : null,
    nome: dizimista.nome || '',
    telefone: dizimista.telefone || '',
    nascimento: dizimista.nascimento || '',
    endereco: dizimista.endereco || ''
  };
}

function normalizeDevolucaoParams(devolucao) {
  return {
    id: devolucao.id ? Number(devolucao.id) : null,
    dizimistaId: Number(devolucao.dizimistaId),
    dizimistaNome: devolucao.dizimistaNome || '',
    valor: Number(devolucao.valor) || 0,
    data: devolucao.data || '',
    referencia: devolucao.referencia || '',
    observacao: devolucao.observacao || ''
  };
}

function normalizeAmbienteParams(ambiente) {
  return {
    id: ambiente.id ? Number(ambiente.id) : null,
    nome: ambiente.nome || '',
    capacidade: ambiente.capacidade ? Number(ambiente.capacidade) : null,
    observacao: ambiente.observacao || ''
  };
}

function normalizeEventoSalaParams(evento) {
  return {
    id: evento.id ? Number(evento.id) : null,
    ambienteId: Number(evento.ambienteId),
    ambienteNome: evento.ambienteNome || '',
    titulo: evento.titulo || '',
    responsavel: evento.responsavel || '',
    data: evento.data || '',
    horaInicio: evento.horaInicio || '',
    horaFim: evento.horaFim || '',
    observacao: evento.observacao || ''
  };
}

function openDatabase() {
  if (connection) return connection;

  const dataDir = path.join(app.getPath('documents'), DATA_FOLDER_NAME, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, DATABASE_FILE_NAME);
  const db = new DatabaseSync(dbPath);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  db.exec(schema);
  ensureDatabaseMigrations(db);

  connection = db;
  return connection;
}

function ensureDatabaseMigrations(db) {
  const ambienteColumns = db.prepare('PRAGMA table_info(ambientes)').all().map(column => column.name);
  if (ambienteColumns.length > 0) {
    if (!ambienteColumns.includes('capacidade')) {
      db.exec('ALTER TABLE ambientes ADD COLUMN capacidade INTEGER');
    }
    if (!ambienteColumns.includes('observacao')) {
      db.exec('ALTER TABLE ambientes ADD COLUMN observacao TEXT');
    }

    if (ambienteColumns.includes('descricao')) {
      db.exec(`
        UPDATE ambientes
        SET observacao = COALESCE(NULLIF(observacao, ''), descricao)
        WHERE descricao IS NOT NULL AND descricao <> ''
      `);
    }
  }

  const eventoColumns = db.prepare('PRAGMA table_info(eventos_salas)').all().map(column => column.name);
  if (!eventoColumns.includes('responsavel')) {
    db.exec('ALTER TABLE eventos_salas ADD COLUMN responsavel TEXT');
  }

  db.exec(`
    DELETE FROM ambientes
    WHERE nome IN ('Sala 1', 'Sala 2', 'Salão', 'Salao', 'Igreja')
      AND id NOT IN (SELECT DISTINCT ambiente_id FROM eventos_salas)
  `);
}

function getDatabasePath() {
  return path.join(app.getPath('documents'), DATA_FOLDER_NAME, 'data', DATABASE_FILE_NAME);
}

function listAllData() {
  const db = openDatabase();
  const configuracoesRows = db.prepare('SELECT chave, valor FROM configuracoes').all();
  const configuracoes = Object.fromEntries(configuracoesRows.map(row => [row.chave, row.valor]));

  return {
    dizimistas: db.prepare('SELECT id, nome, telefone, nascimento, endereco FROM dizimistas ORDER BY nome COLLATE NOCASE').all(),
    devolucoes: db.prepare(`
      SELECT id, dizimista_id, dizimista_nome, valor, data, referencia, observacao
      FROM devolucoes
      ORDER BY data DESC, id DESC
    `).all().map(normalizeDevolucao),
    ambientes: db.prepare('SELECT id, nome, capacidade, observacao FROM ambientes ORDER BY nome COLLATE NOCASE').all().map(normalizeAmbiente),
    eventosSalas: db.prepare(`
      SELECT id, ambiente_id, ambiente_nome, titulo, responsavel, data, hora_inicio, hora_fim, observacao
      FROM eventos_salas
      ORDER BY data ASC, hora_inicio ASC, id ASC
    `).all().map(normalizeEventoSala),
    configuracoes
  };
}

function saveConfiguracoes(configuracoes) {
  const db = openDatabase();
  const entries = Object.entries(configuracoes || {}).filter(([, valor]) => valor !== undefined && valor !== null);
  if (!entries.length) return listAllData();

  const upsert = db.prepare(`
    INSERT INTO configuracoes (chave, valor)
    VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
  `);

  db.exec('BEGIN IMMEDIATE');
  try {
    entries.forEach(([chave, valor]) => upsert.run(chave, String(valor)));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return listAllData();
}

function saveDizimista(dizimista) {
  const db = openDatabase();
  const params = normalizeDizimistaParams(dizimista);

  if (params.id) {
    db.prepare(`
      UPDATE dizimistas
      SET nome = @nome,
          telefone = @telefone,
          nascimento = @nascimento,
          endereco = @endereco
      WHERE id = @id
    `).run(params);

    db.prepare(`
      UPDATE devolucoes
      SET dizimista_nome = @nome
      WHERE dizimista_id = @id
    `).run({ id: params.id, nome: params.nome });

    return params.id;
  }

  const result = db.prepare(`
    INSERT INTO dizimistas (nome, telefone, nascimento, endereco)
    VALUES (@nome, @telefone, @nascimento, @endereco)
  `).run({
    nome: params.nome,
    telefone: params.telefone,
    nascimento: params.nascimento,
    endereco: params.endereco
  });

  return Number(result.lastInsertRowid);
}

function deleteDizimista(id) {
  return openDatabase().prepare('DELETE FROM dizimistas WHERE id = ?').run(id).changes;
}

function saveDevolucao(devolucao) {
  const db = openDatabase();
  const params = normalizeDevolucaoParams(devolucao);

  if (params.id) {
    db.prepare(`
      UPDATE devolucoes
      SET dizimista_id = @dizimistaId,
          dizimista_nome = @dizimistaNome,
          valor = @valor,
          data = @data,
          referencia = @referencia,
          observacao = @observacao
      WHERE id = @id
    `).run(params);
    return params.id;
  }

  const result = db.prepare(`
    INSERT INTO devolucoes (dizimista_id, dizimista_nome, valor, data, referencia, observacao)
    VALUES (@dizimistaId, @dizimistaNome, @valor, @data, @referencia, @observacao)
  `).run({
    dizimistaId: params.dizimistaId,
    dizimistaNome: params.dizimistaNome,
    valor: params.valor,
    data: params.data,
    referencia: params.referencia,
    observacao: params.observacao
  });

  return Number(result.lastInsertRowid);
}

function deleteDevolucao(id) {
  return openDatabase().prepare('DELETE FROM devolucoes WHERE id = ?').run(id).changes;
}

function saveAmbiente(ambiente) {
  const db = openDatabase();
  const params = normalizeAmbienteParams(ambiente);

  if (params.id) {
    db.prepare(`
      UPDATE ambientes
      SET nome = @nome,
          capacidade = @capacidade,
          observacao = @observacao
      WHERE id = @id
    `).run(params);

    db.prepare(`
      UPDATE eventos_salas
      SET ambiente_nome = @nome
      WHERE ambiente_id = @id
    `).run({ id: params.id, nome: params.nome });

    return params.id;
  }

  const result = db.prepare(`
    INSERT INTO ambientes (nome, capacidade, observacao)
    VALUES (@nome, @capacidade, @observacao)
  `).run({
    nome: params.nome,
    capacidade: params.capacidade,
    observacao: params.observacao
  });

  return Number(result.lastInsertRowid);
}

function deleteAmbiente(id) {
  const db = openDatabase();
  db.prepare('DELETE FROM eventos_salas WHERE ambiente_id = ?').run(id);
  return db.prepare('DELETE FROM ambientes WHERE id = ?').run(id).changes;
}

function saveEventoSala(evento) {
  const db = openDatabase();
  const params = normalizeEventoSalaParams(evento);

  if (params.id) {
    db.prepare(`
      UPDATE eventos_salas
      SET ambiente_id = @ambienteId,
          ambiente_nome = @ambienteNome,
          titulo = @titulo,
          responsavel = @responsavel,
          data = @data,
          hora_inicio = @horaInicio,
          hora_fim = @horaFim,
          observacao = @observacao
      WHERE id = @id
    `).run(params);
    return params.id;
  }

  const result = db.prepare(`
    INSERT INTO eventos_salas (ambiente_id, ambiente_nome, titulo, responsavel, data, hora_inicio, hora_fim, observacao)
    VALUES (@ambienteId, @ambienteNome, @titulo, @responsavel, @data, @horaInicio, @horaFim, @observacao)
  `).run({
    ambienteId: params.ambienteId,
    ambienteNome: params.ambienteNome,
    titulo: params.titulo,
    responsavel: params.responsavel,
    data: params.data,
    horaInicio: params.horaInicio,
    horaFim: params.horaFim,
    observacao: params.observacao
  });

  return Number(result.lastInsertRowid);
}

function deleteEventoSala(id) {
  return openDatabase().prepare('DELETE FROM eventos_salas WHERE id = ?').run(id).changes;
}

function replaceAllData(data) {
  const db = openDatabase();
  try {
    db.exec('BEGIN IMMEDIATE');
    db.prepare('DELETE FROM devolucoes').run();
    db.prepare('DELETE FROM eventos_salas').run();
    db.prepare('DELETE FROM ambientes').run();
    db.prepare('DELETE FROM dizimistas').run();

    const insertDizimista = db.prepare(`
      INSERT INTO dizimistas (id, nome, telefone, nascimento, endereco)
      VALUES (@id, @nome, @telefone, @nascimento, @endereco)
    `);
    const insertDevolucao = db.prepare(`
      INSERT INTO devolucoes (id, dizimista_id, dizimista_nome, valor, data, referencia, observacao)
      VALUES (@id, @dizimistaId, @dizimistaNome, @valor, @data, @referencia, @observacao)
    `);
    const insertAmbiente = db.prepare(`
      INSERT INTO ambientes (id, nome, capacidade, observacao)
      VALUES (@id, @nome, @capacidade, @observacao)
    `);
    const insertEventoSala = db.prepare(`
      INSERT INTO eventos_salas (id, ambiente_id, ambiente_nome, titulo, responsavel, data, hora_inicio, hora_fim, observacao)
      VALUES (@id, @ambienteId, @ambienteNome, @titulo, @responsavel, @data, @horaInicio, @horaFim, @observacao)
    `);

    (data.dizimistas || []).forEach(dizimista => insertDizimista.run(normalizeDizimistaParams(dizimista)));
    (data.devolucoes || []).forEach(devolucao => insertDevolucao.run(normalizeDevolucaoParams(devolucao)));
    (data.ambientes || []).forEach(ambiente => insertAmbiente.run(normalizeAmbienteParams(ambiente)));
    (data.eventosSalas || []).forEach(evento => insertEventoSala.run(normalizeEventoSalaParams(evento)));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return listAllData();
}

module.exports = {
  getDatabasePath,
  openDatabase,
  listAllData,
  saveDizimista,
  deleteDizimista,
  saveDevolucao,
  deleteDevolucao,
  saveAmbiente,
  deleteAmbiente,
  saveEventoSala,
  deleteEventoSala,
  replaceAllData,
  saveConfiguracoes
};
