let db = {
    dizimistas: [],
    devolucoes: [],
    ambientes: [],
    eventosSalas: [],
    configuracoes: {}
};

async function loadDatabase() {
    db = await window.sgp.db.list();
    return db;
}

async function saveDizimistaToDatabase(dizimista) {
    await window.sgp.db.saveDizimista(dizimista);
    await loadDatabase();
    updateDashboard();
}

async function deleteDizimistaFromDatabase(id) {
    await window.sgp.db.deleteDizimista(id);
    await loadDatabase();
    updateDashboard();
}

async function saveDevolucaoToDatabase(devolucao) {
    await window.sgp.db.saveDevolucao(devolucao);
    await loadDatabase();
    updateDashboard();
}

async function deleteDevolucaoFromDatabase(id) {
    await window.sgp.db.deleteDevolucao(id);
    await loadDatabase();
    updateDashboard();
}

async function saveAmbienteToDatabase(ambiente) {
    await window.sgp.db.saveAmbiente(ambiente);
    await loadDatabase();
}

async function deleteAmbienteFromDatabase(id) {
    await window.sgp.db.deleteAmbiente(id);
    await loadDatabase();
}

async function saveEventoSalaToDatabase(evento) {
    await window.sgp.db.saveEventoSala(evento);
    await loadDatabase();
}

async function deleteEventoSalaFromDatabase(id) {
    await window.sgp.db.deleteEventoSala(id);
    await loadDatabase();
}

async function replaceDatabase(data) {
    db = await window.sgp.db.replaceAll(data);
    updateDashboard();
}

async function saveConfiguracoesToDatabase(configuracoes) {
    db = await window.sgp.db.saveConfiguracoes(configuracoes);
    return db.configuracoes || {};
}
