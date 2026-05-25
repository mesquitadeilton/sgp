async function saveDizimista(e) {
    e.preventDefault();
    const id = document.getElementById('dizimista-id').value;
    const nome = document.getElementById('dizimista-nome').value.trim();
    const telefone = document.getElementById('dizimista-telefone').value.trim();
    const nascimento = document.getElementById('dizimista-nascimento').value;
    const endereco = document.getElementById('dizimista-endereco').value.trim();

    try {
        await saveDizimistaToDatabase({
            id: id ? parseInt(id, 10) : null,
            nome,
            telefone,
            nascimento: formatDateToISO(nascimento),
            endereco
        });

        cancelDizimistaEdit();
        renderDizimistasTable();
        showNotificacao('Dados do dizimista salvos com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar dizimista:', error);
        showNotificacao(`Não foi possível salvar o dizimista. ${error.message || error}`, 'error');
    }
}

function editDizimista(id) {
    const d = db.dizimistas.find(item => item.id == id);
    if (!d) return;

    document.getElementById('dizimista-id').value = d.id;
    document.getElementById('dizimista-nome').value = d.nome;
    document.getElementById('dizimista-telefone').value = d.telefone;
    document.getElementById('dizimista-nascimento').value = formatDateBR(d.nascimento);
    document.getElementById('dizimista-endereco').value = d.endereco || '';

    document.getElementById('form-dizimista-title').innerHTML = '<i class="fa-solid fa-user-pen text-amber-600"></i> Editar Dados do Dizimista';
    document.getElementById('btn-cancelar-dizimista').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editFromDizimistaModal() {
    const id = document.getElementById('modal-id').value;
    closeDizimistaModal();
    if (currentModule !== 'dizimistas') openModule('dizimistas');
    switchTab('tab-dizimistas');
    if (id) editDizimista(Number(id));
}

function deleteDizimista(id) {
    const d = db.dizimistas.find(item => item.id == id);
    if (!d) return;

    document.getElementById('confirmacao-mensagem').innerHTML = `Tem certeza de que deseja remover o dizimista <span class="confirm-object">${d.nome}</span>? O histórico de lançamentos permanecerá vinculado para fins de contabilidade geral.`;
    const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
    btnConfirmar.onclick = async () => {
        await deleteDizimistaFromDatabase(id);
        renderDizimistasTable();
        closeConfirmacaoModal();
        showNotificacao('Dizimista removido com sucesso!', 'success');
    };
    openModal('modal-confirmacao');
}

function closeConfirmacaoModal() {
    closeModal('modal-confirmacao');
}

function cancelDizimistaEdit() {
    document.getElementById('form-dizimista').reset();
    document.getElementById('dizimista-id').value = '';
    document.getElementById('form-dizimista-title').innerHTML = '<i class="fa-solid fa-user-plus text-[#7A0C1E]"></i> Cadastrar Novo Dizimista';
    document.getElementById('btn-cancelar-dizimista').classList.add('hidden');
}

function showDizimistaDetails(id) {
    const d = db.dizimistas.find(item => item.id == id);
    if (!d) {
        showNotificacao('Cadastro do dizimista não encontrado.', 'warning');
        return;
    }

    document.getElementById('modal-id').value = d.id;
    document.getElementById('modal-nome').textContent = d.nome;
    document.getElementById('modal-telefone').textContent = d.telefone || 'Não informado';
    document.getElementById('modal-nascimento').textContent = formatDateBR(d.nascimento);
    document.getElementById('modal-endereco').textContent = d.endereco || 'Não informado';

    const devolucoesDizimista = db.devolucoes.filter(dev => dev.dizimistaId == d.id);
    const anos = [...new Set(devolucoesDizimista.map(dev => new Date(dev.data).getFullYear()))].sort((a, b) => b - a);
    const anoFilter = document.getElementById('filter-ano-devolucao');
    anoFilter.innerHTML = '<option value="">Todos os anos</option>';
    anos.forEach(ano => {
        anoFilter.innerHTML += `<option value="${ano}">${ano}</option>`;
    });

    const anoAtual = new Date().getFullYear();
    if (anos.includes(anoAtual)) anoFilter.value = anoAtual;

    renderDevolucoesHistory(id);
    openModal('modal-dizimista');
}

function filterDevolucoesByYear() {
    const id = document.getElementById('modal-id').value;
    renderDevolucoesHistory(id);
}

function renderDevolucoesHistory(id) {
    const devolucoesContainer = document.getElementById('modal-devolucoes');
    const anoFilter = document.getElementById('filter-ano-devolucao').value;
    const devolucoesDizimista = db.devolucoes.filter(dev => dev.dizimistaId == id);

    let filtrados = devolucoesDizimista;
    if (anoFilter) {
        filtrados = devolucoesDizimista.filter(dev => new Date(dev.data).getFullYear() == anoFilter);
    }

    if (filtrados.length === 0) {
        devolucoesContainer.innerHTML = '<p class="text-xs text-slate-400">Nenhuma devolução registrada para o período selecionado.</p>';
        return;
    }

    const porAno = {};
    filtrados.forEach(dev => {
        const ano = new Date(dev.data).getFullYear();
        if (!porAno[ano]) porAno[ano] = [];
        porAno[ano].push(dev);
    });

    let html = '';
    Object.keys(porAno).sort((a, b) => b - a).forEach(ano => {
        html += `<div class="mb-3">
            <p class="text-xs font-semibold text-slate-700 mb-1">${ano}</p>
            <div class="space-y-1">
                ${porAno[ano].map(dev => `
                    <div class="flex items-center justify-between gap-2 text-xs bg-slate-50 px-2 py-1 rounded">
                        <span class="text-slate-600">${formatRef(dev.referencia)}</span>
                        <div class="flex items-center gap-2">
                            <span class="text-emerald-600 font-medium">${formatCurrency(dev.valor)}</span>
                            <button type="button" onclick="openEditDevolucao(${dev.id})" class="text-[#7A0C1E] hover:bg-red-50 px-1.5 py-0.5 rounded" title="Editar lançamento"><i class="fa-solid fa-pen"></i></button>
                            <button type="button" onclick="confirmDeleteDevolucao(${dev.id})" class="text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded" title="Excluir lançamento"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    });
    devolucoesContainer.innerHTML = html;
}
