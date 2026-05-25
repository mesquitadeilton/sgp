let parishConfigRequired = false;

function updateDataLocal() {
    const dataEl = document.getElementById('data-hoje');
    const localEl = document.getElementById('local-hoje');
    if (!dataEl || !localEl) return;

    const hoje = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dataEl.textContent = hoje.toLocaleDateString('pt-BR', options);
    localEl.textContent = (db.configuracoes && db.configuracoes.localizacao) || '';
}

function applyParoquiaConfig() {
    const cfg = db.configuracoes || {};
    const nomeParoquia = cfg.nomeParoquia || 'Sistema de Gestão Paroquial - SGP';
    const hasBrasao = Boolean(cfg.brasaoDataUrl);
    const brasaoDataUrl = hasBrasao ? cfg.brasaoDataUrl : 'assets/app-icon.png';

    const nomeHeader = document.getElementById('nome-paroquia-header');
    const homeParishName = document.getElementById('home-parish-name');
    if (nomeHeader) nomeHeader.textContent = nomeParoquia;
    if (homeParishName) homeParishName.textContent = nomeParoquia;

    const brasaoHeader = document.getElementById('header-brasao');
    const brasaoHome = document.getElementById('home-brasao');

    if (brasaoHeader) {
        brasaoHeader.src = brasaoDataUrl;
        const fallbackIcon = brasaoHeader.nextElementSibling;
        if (fallbackIcon) {
            if (hasBrasao) {
                brasaoHeader.style.display = '';
                fallbackIcon.style.display = 'none';
            } else {
                brasaoHeader.style.display = 'none';
                fallbackIcon.style.display = 'inline-block';
            }
        }
    }

    if (brasaoHome) brasaoHome.src = brasaoDataUrl;
}

function openConfigModal(firstAccess = false) {
    parishConfigRequired = firstAccess || !(db.configuracoes && db.configuracoes.nomeParoquia);
    const cfg = db.configuracoes || {};
    document.getElementById('cfg-nome-paroquia').value = cfg.nomeParoquia || '';
    document.getElementById('cfg-localizacao').value = cfg.localizacao || '';
    document.getElementById('cfg-brasao-file').value = '';
    openModal('modal-configuracao');
    if (firstAccess) {
        showNotificacao('Bem-vindo! Vamos configurar a paróquia antes do primeiro uso.', 'info');
    }
}

function closeConfigModal() {
    if (parishConfigRequired) {
        showNotificacao('Para continuar, configure o nome da paróquia e salve.', 'warning');
        return;
    }
    closeModal('modal-configuracao');
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function saveParoquiaConfig(event) {
    event.preventDefault();
    const nomeParoquia = document.getElementById('cfg-nome-paroquia').value.trim();
    const localizacao = document.getElementById('cfg-localizacao').value.trim();
    const brasaoFile = document.getElementById('cfg-brasao-file').files[0];
    const brasaoDataUrl = await fileToDataUrl(brasaoFile);

    const payload = { nomeParoquia, localizacao };
    if (brasaoDataUrl) payload.brasaoDataUrl = brasaoDataUrl;

    await saveConfiguracoesToDatabase(payload);
    parishConfigRequired = false;
    applyParoquiaConfig();
    updateDataLocal();
    closeConfigModal();
    showNotificacao('Configuração da paróquia salva com sucesso!', 'success');
}

let appBootstrapped = false;

async function bootstrapApp() {
    if (appBootstrapped) return;
    appBootstrapped = true;

    try {
        await loadDatabase();
        applyParoquiaConfig();
        updateDashboard();
    } catch (error) {
        console.error('Falha ao carregar dados iniciais:', error);
    } finally {
        updateDataLocal();
        const nomeParoquia = db.configuracoes && db.configuracoes.nomeParoquia;
        if (!nomeParoquia) openConfigModal(true);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}
