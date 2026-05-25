async function saveDevolucao(e) {
    e.preventDefault();
    const dizimistaId = document.getElementById('devolucao-dizimista').value;
    const valorStr = document.getElementById('devolucao-valor').value;
    const valor = parseCurrency(valorStr);
    const data = document.getElementById('devolucao-data').value;
    const referencia = document.getElementById('devolucao-referencia').value;

    const dizimista = db.dizimistas.find(d => d.id == dizimistaId);
    if (!dizimista) {
        showNotificacao('Selecione um dizimista válido para continuar.', 'warning');
        return;
    }

    try {
        await saveDevolucaoToDatabase({
            dizimistaId: parseInt(dizimistaId, 10),
            dizimistaNome: dizimista.nome,
            valor,
            data,
            referencia,
            observacao: ''
        });

        document.getElementById('devolucao-valor').value = '';
        document.getElementById('devolucao-dizimista').value = '';

        showNotificacao('Devolução de dízimo registrada com sucesso!', 'success');
        switchTab('tab-dashboard');
    } catch (error) {
        console.error('Erro ao salvar devolução:', error);
        showNotificacao(`Não foi possível salvar a devolução. ${error.message || error}`, 'error');
    }
}

function openEditDevolucao(id) {
    const devolucao = db.devolucoes.find(item => item.id == id);
    if (!devolucao) {
        showNotificacao('Lançamento não encontrado.', 'warning');
        return;
    }

    document.getElementById('editar-devolucao-id').value = devolucao.id;
    document.getElementById('editar-devolucao-dizimista').value = devolucao.dizimistaId;
    document.getElementById('editar-devolucao-dizimista-search').value = devolucao.dizimistaNome;
    document.getElementById('editar-devolucao-valor').value = formatCurrency(devolucao.valor).replace('R$', '').trim();
    document.getElementById('editar-devolucao-data').value = devolucao.data;
    document.getElementById('editar-devolucao-referencia').value = devolucao.referencia;
    document.getElementById('editar-devolucao-dizimista-dropdown').classList.add('hidden');
    openModal('modal-editar-devolucao');
}

function closeEditarDevolucaoModal() {
    closeModal('modal-editar-devolucao');
}

function confirmDeleteDevolucao(id) {
    const devolucao = db.devolucoes.find(item => item.id == id);
    if (!devolucao) {
        showNotificacao('Lançamento não encontrado.', 'warning');
        return;
    }

    document.getElementById('confirmacao-mensagem').innerHTML = `Tem certeza de que deseja excluir o lançamento <span class="confirm-object">${formatCurrency(devolucao.valor)}</span> de ${devolucao.dizimistaNome}?`;
    const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
    btnConfirmar.onclick = async () => {
        try {
            await deleteDevolucaoFromDatabase(id);
            closeConfirmacaoModal();
            closeEditarDevolucaoModal();
            renderCurrentView();
            showNotificacao('Lançamento excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir devolução:', error);
            showNotificacao(`Não foi possível excluir o lançamento. ${error.message || error}`, 'error');
        }
    };
    openModal('modal-confirmacao');
}

function confirmDeleteDevolucaoFromEdit() {
    const id = document.getElementById('editar-devolucao-id').value;
    if (id) confirmDeleteDevolucao(parseInt(id, 10));
}

function filterEditarDizimistasSelect(searchTerm) {
    const dropdown = document.getElementById('editar-devolucao-dizimista-dropdown');
    const input = document.getElementById('editar-devolucao-dizimista-search');
    const hiddenInput = document.getElementById('editar-devolucao-dizimista');

    hiddenInput.value = '';

    if (searchTerm.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    const filtrados = db.dizimistas.filter(d => d.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    dropdown.innerHTML = '';

    if (filtrados.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    filtrados.forEach(d => {
        const div = document.createElement('div');
        div.className = 'px-3 py-2 hover:bg-red-50 cursor-pointer text-sm';
        div.textContent = d.nome;
        div.onclick = () => {
            input.value = d.nome;
            hiddenInput.value = d.id;
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(div);
    });

    dropdown.classList.remove('hidden');
}

async function saveEditedDevolucao(e) {
    e.preventDefault();

    const id = document.getElementById('editar-devolucao-id').value;
    const dizimistaId = document.getElementById('editar-devolucao-dizimista').value;
    const valor = parseCurrency(document.getElementById('editar-devolucao-valor').value);
    const data = document.getElementById('editar-devolucao-data').value;
    const referencia = document.getElementById('editar-devolucao-referencia').value;

    const dizimista = db.dizimistas.find(d => d.id == dizimistaId);
    if (!dizimista) {
        showNotificacao('Selecione um dizimista válido para continuar.', 'warning');
        return;
    }

    try {
        await saveDevolucaoToDatabase({
            id: parseInt(id, 10),
            dizimistaId: parseInt(dizimistaId, 10),
            dizimistaNome: dizimista.nome,
            valor,
            data,
            referencia,
            observacao: ''
        });

        closeEditarDevolucaoModal();
        renderCurrentView();
        showNotificacao('Lançamento atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao atualizar devolução:', error);
        showNotificacao(`Não foi possível atualizar o lançamento. ${error.message || error}`, 'error');
    }
}

function renderCurrentView() {
    updateDashboard();

    const dizimistasTab = document.getElementById('tab-dizimistas');
    if (dizimistasTab && !dizimistasTab.classList.contains('hidden')) {
        renderDizimistasTable(false);
    }

    const relatoriosTab = document.getElementById('tab-relatorios');
    if (relatoriosTab && !relatoriosTab.classList.contains('hidden')) {
        generateReport(false);
    }

    const modalDizimista = document.getElementById('modal-dizimista');
    const modalDizimistaAberto = modalDizimista && !modalDizimista.classList.contains('hidden');
    if (modalDizimistaAberto) {
        const id = document.getElementById('modal-id').value;
        if (id) renderDevolucoesHistory(id);
    }
}
