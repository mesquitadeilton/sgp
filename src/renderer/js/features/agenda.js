let agendaView = 'semana';
let agendaFocusDate = new Date();

function getStartOfWeek(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - result.getDay());
    return result;
}

function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function toISOAgendaDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseAgendaDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getAgendaEventsForDate(date) {
    const isoDate = toISOAgendaDate(date);
    return (db.eventosSalas || [])
        .filter(evento => evento.data === isoDate)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

function setAgendaView(view) {
    agendaView = view;
    renderAgenda();
}

function changeAgendaPeriod(direction) {
    if (agendaView === 'dia') {
        agendaFocusDate = addDays(agendaFocusDate, direction);
    } else if (agendaView === 'semana') {
        agendaFocusDate = addDays(agendaFocusDate, direction * 7);
    } else {
        agendaFocusDate = addMonths(agendaFocusDate, direction);
    }
    renderAgenda();
}

function goToCurrentAgendaPeriod() {
    agendaFocusDate = new Date();
    renderAgenda();
}

function updateAgendaViewButtons() {
    document.querySelectorAll('.agenda-view-btn').forEach(button => {
        button.classList.remove('bg-red-50', 'text-red-700', 'font-semibold');
        button.classList.add('text-slate-600', 'hover:bg-slate-100');
    });

    const activeButton = document.getElementById(`btn-agenda-${agendaView}`);
    if (activeButton) {
        activeButton.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeButton.classList.add('bg-red-50', 'text-red-700', 'font-semibold');
    }
}

function renderAgenda() {
    updateAgendaViewButtons();
    if (agendaView === 'dia') {
        renderAgendaDia();
    } else if (agendaView === 'mes') {
        renderAgendaMes();
    } else {
        renderAgendaSemana();
    }
}

function renderAgendaDia() {
    const grid = document.getElementById('agenda-calendar-grid');
    const empty = document.getElementById('agenda-empty');
    if (!grid || !empty) return;

    document.getElementById('agenda-periodo').textContent = agendaFocusDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const hasAmbientes = db.ambientes && db.ambientes.length > 0;
    empty.classList.toggle('hidden', hasAmbientes);
    grid.classList.toggle('hidden', !hasAmbientes);
    grid.className = 'grid grid-cols-1 gap-3';
    grid.innerHTML = '';

    const dayEvents = getAgendaEventsForDate(agendaFocusDate);
    const panel = document.createElement('div');
    panel.className = 'border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-[360px]';
    panel.innerHTML = `
        <div class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
                <p class="text-xs font-semibold text-slate-400 uppercase">${agendaFocusDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                <p class="text-xl font-bold text-slate-800">${agendaFocusDate.toLocaleDateString('pt-BR')}</p>
            </div>
            <button onclick="openEventoSalaModal(null, '${toISOAgendaDate(agendaFocusDate)}')" class="px-3 py-2 text-xs text-[#7A0C1E] hover:bg-red-50 rounded-lg transition-all">
                <i class="fa-solid fa-plus mr-1"></i> Evento
            </button>
        </div>
        <div class="p-3 space-y-2">
            ${renderAgendaEventList(dayEvents)}
        </div>
    `;
    grid.appendChild(panel);
}

function renderAgendaSemana() {
    const grid = document.getElementById('agenda-calendar-grid');
    const empty = document.getElementById('agenda-empty');
    if (!grid || !empty) return;

    const weekStart = getStartOfWeek(agendaFocusDate);
    const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
    document.getElementById('agenda-periodo').textContent = `${weekDays[0].toLocaleDateString('pt-BR')} até ${weekDays[6].toLocaleDateString('pt-BR')}`;

    const hasAmbientes = db.ambientes && db.ambientes.length > 0;
    empty.classList.toggle('hidden', hasAmbientes);
    grid.classList.toggle('hidden', !hasAmbientes);
    grid.className = 'grid grid-cols-1 md:grid-cols-7 gap-3';
    grid.innerHTML = '';

    weekDays.forEach(day => {
        const column = document.createElement('div');
        column.className = 'border border-slate-200 rounded-xl overflow-hidden bg-slate-50 min-h-[260px]';
        column.innerHTML = `
            <div class="bg-white border-b border-slate-200 px-3 py-3">
                <p class="text-xs font-semibold text-slate-400 uppercase">${day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <p class="text-lg font-bold text-slate-800">${day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
            </div>
            <div class="p-2 space-y-2">
                ${renderAgendaEventList(getAgendaEventsForDate(day))}
            </div>
        `;
        grid.appendChild(column);
    });
}

function renderAgendaMes() {
    const grid = document.getElementById('agenda-calendar-grid');
    const empty = document.getElementById('agenda-empty');
    if (!grid || !empty) return;

    const monthStart = getStartOfMonth(agendaFocusDate);
    const calendarStart = getStartOfWeek(monthStart);
    const monthLabel = agendaFocusDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('agenda-periodo').textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const hasAmbientes = db.ambientes && db.ambientes.length > 0;
    empty.classList.toggle('hidden', hasAmbientes);
    grid.classList.toggle('hidden', !hasAmbientes);
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3';
    grid.innerHTML = '';

    Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index)).forEach(day => {
        const isCurrentMonth = day.getMonth() === agendaFocusDate.getMonth();
        const column = document.createElement('div');
        column.className = `border border-slate-200 rounded-xl overflow-hidden min-h-[160px] ${isCurrentMonth ? 'bg-slate-50' : 'bg-slate-100/60 opacity-70'}`;
        column.innerHTML = `
            <div class="bg-white border-b border-slate-200 px-3 py-2">
                <p class="text-xs font-semibold text-slate-400 uppercase">${day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                <p class="text-base font-bold text-slate-800">${day.toLocaleDateString('pt-BR', { day: '2-digit' })}</p>
            </div>
            <div class="p-2 space-y-2">
                ${renderAgendaEventList(getAgendaEventsForDate(day), true)}
            </div>
        `;
        grid.appendChild(column);
    });
}

function renderAgendaEventList(events, compact = false) {
    if (events.length === 0) {
        return '<p class="text-xs text-slate-400 p-2">Sem eventos.</p>';
    }

    return events.map(evento => `
        <button type="button" onclick="openEventoSalaModal(${evento.id})" class="w-full text-left bg-white border border-slate-200 hover:border-[#7A0C1E]/30 hover:shadow-sm rounded-lg p-2 transition-all">
            <span class="block text-[11px] font-semibold text-[#7A0C1E]">${evento.horaInicio} - ${evento.horaFim}</span>
            <span class="block text-xs font-bold text-slate-800 mt-0.5">${evento.titulo}</span>
            <span class="block text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-door-open mr-1"></i>${evento.ambienteNome}</span>
            ${evento.responsavel && !compact ? `<span class="block text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-user mr-1"></i>${evento.responsavel}</span>` : ''}
        </button>
    `).join('');
}

function renderAmbientesTable() {
    const tbody = document.getElementById('table-ambientes');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!db.ambientes || db.ambientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">Nenhum ambiente cadastrado.</td></tr>';
        return;
    }

    db.ambientes.forEach(ambiente => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition-all text-xs';
        tr.innerHTML = `
            <td class="p-3 font-semibold text-slate-700">${ambiente.nome}</td>
            <td class="p-3 text-slate-500">${ambiente.capacidade || 'Não informado'}</td>
            <td class="p-3 text-slate-500">${ambiente.observacao || 'Sem observação'}</td>
            <td class="p-3 text-center flex justify-center gap-1.5">
                <button onclick="openAmbienteModal(${ambiente.id})" class="text-[#7A0C1E] hover:bg-red-50 px-2 py-1 rounded" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="confirmDeleteAmbiente(${ambiente.id})" class="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAmbienteModal(id = null) {
    const ambiente = id ? db.ambientes.find(item => item.id == id) : null;
    document.getElementById('ambiente-id').value = ambiente ? ambiente.id : '';
    document.getElementById('ambiente-nome').value = ambiente ? ambiente.nome : '';
    document.getElementById('ambiente-capacidade').value = ambiente ? ambiente.capacidade : '';
    document.getElementById('ambiente-observacao').value = ambiente ? ambiente.observacao : '';
    document.getElementById('ambiente-modal-title').textContent = ambiente ? 'Editar Ambiente' : 'Cadastrar Ambiente';
    openModal('modal-ambiente');
}

function closeAmbienteModal() {
    closeModal('modal-ambiente');
}

async function saveAmbiente(event) {
    event.preventDefault();

    try {
        await saveAmbienteToDatabase({
            id: document.getElementById('ambiente-id').value || null,
            nome: document.getElementById('ambiente-nome').value.trim(),
            capacidade: document.getElementById('ambiente-capacidade').value,
            observacao: document.getElementById('ambiente-observacao').value.trim()
        });

        closeAmbienteModal();
        renderAmbientesTable();
        renderAgenda();
        showNotificacao('Ambiente salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar ambiente:', error);
        showNotificacao(`Não foi possível salvar o ambiente. ${error.message || error}`);
    }
}

function confirmDeleteAmbiente(id) {
    const ambiente = db.ambientes.find(item => item.id == id);
    if (!ambiente) return;

    document.getElementById('confirmacao-mensagem').innerHTML = `Tem certeza de que deseja excluir o ambiente <span class="confirm-object">${ambiente.nome}</span>? Os eventos desse ambiente também serão removidos.`;
    document.getElementById('btn-confirmar-exclusao').onclick = async () => {
        try {
            await deleteAmbienteFromDatabase(id);
            closeConfirmacaoModal();
            renderAmbientesTable();
            renderAgenda();
            showNotificacao('Ambiente excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir ambiente:', error);
            showNotificacao(`Não foi possível excluir o ambiente. ${error.message || error}`);
        }
    };
    openModal('modal-confirmacao');
}

function populateAmbientesEventoSelect(selectedId = '') {
    const select = document.getElementById('evento-sala-ambiente');
    select.innerHTML = '<option value="">Selecione um ambiente</option>';
    (db.ambientes || []).forEach(ambiente => {
        const option = document.createElement('option');
        option.value = ambiente.id;
        option.textContent = ambiente.nome;
        select.appendChild(option);
    });
    select.value = selectedId ? String(selectedId) : '';
}

function openEventoSalaModal(id = null, date = null) {
    if (!db.ambientes || db.ambientes.length === 0) {
        showNotificacao('Cadastre um ambiente antes de criar eventos.');
        return;
    }

    const evento = id ? db.eventosSalas.find(item => item.id == id) : null;
    populateAmbientesEventoSelect(evento ? evento.ambienteId : '');

    document.getElementById('evento-sala-id').value = evento ? evento.id : '';
    document.getElementById('evento-sala-titulo').value = evento ? evento.titulo : '';
    document.getElementById('evento-sala-responsavel').value = evento ? evento.responsavel : '';
    document.getElementById('evento-sala-data').value = evento ? evento.data : (date || toISOAgendaDate(new Date()));
    document.getElementById('evento-sala-inicio').value = evento ? evento.horaInicio : '';
    document.getElementById('evento-sala-fim').value = evento ? evento.horaFim : '';
    document.getElementById('evento-sala-observacao').value = evento ? evento.observacao : '';
    document.getElementById('evento-sala-repeticao').value = '';
    document.getElementById('evento-sala-repetir-ate').value = '';
    document.getElementById('evento-sala-repeticao').disabled = !!evento;
    document.getElementById('evento-sala-modal-title').textContent = evento ? 'Editar Evento' : 'Cadastrar Evento';
    document.getElementById('btn-excluir-evento-sala').classList.toggle('hidden', !evento);
    toggleEventoSalaRepeticao();
    openModal('modal-evento-sala');
}

function closeEventoSalaModal() {
    closeModal('modal-evento-sala');
}

function toggleEventoSalaRepeticao() {
    const repeticao = document.getElementById('evento-sala-repeticao').value;
    document.getElementById('evento-sala-repetir-ate-wrapper').classList.toggle('hidden', !repeticao);
}

function getEventoSalaOccurrences(startDate, repeatType, repeatUntil) {
    const dates = [startDate];
    if (!repeatType || !repeatUntil) return dates;

    let current = parseAgendaDate(startDate);
    const end = parseAgendaDate(repeatUntil);
    while (true) {
        current = repeatType === 'semanal' ? addDays(current, 7) : addMonths(current, 1);
        if (current > end) break;
        dates.push(toISOAgendaDate(current));
    }

    return dates;
}

async function saveEventoSala(event) {
    event.preventDefault();

    const ambienteId = document.getElementById('evento-sala-ambiente').value;
    const ambiente = db.ambientes.find(item => item.id == ambienteId);
    const id = document.getElementById('evento-sala-id').value;
    const data = document.getElementById('evento-sala-data').value;
    const horaInicio = document.getElementById('evento-sala-inicio').value;
    const horaFim = document.getElementById('evento-sala-fim').value;
    const repeticao = document.getElementById('evento-sala-repeticao').value;
    const repetirAte = document.getElementById('evento-sala-repetir-ate').value;

    if (!ambiente) {
        showNotificacao('Selecione um ambiente válido.');
        return;
    }
    if (horaFim <= horaInicio) {
        showNotificacao('O horário final deve ser maior que o horário inicial.');
        return;
    }
    if (!id && repeticao && (!repetirAte || repetirAte < data)) {
        showNotificacao('Informe uma data final válida para a repetição.');
        return;
    }

    const baseEvento = {
        id: id ? parseInt(id) : null,
        ambienteId: parseInt(ambienteId),
        ambienteNome: ambiente.nome,
        titulo: document.getElementById('evento-sala-titulo').value.trim(),
        responsavel: document.getElementById('evento-sala-responsavel').value.trim(),
        data,
        horaInicio,
        horaFim,
        observacao: document.getElementById('evento-sala-observacao').value.trim()
    };

    try {
        const datas = id ? [data] : getEventoSalaOccurrences(data, repeticao, repetirAte);
        for (const occurrenceDate of datas) {
            await saveEventoSalaToDatabase({
                ...baseEvento,
                id: id ? baseEvento.id : null,
                data: occurrenceDate
            });
        }

        closeEventoSalaModal();
        renderAgenda();
        showNotificacao(datas.length > 1 ? `${datas.length} eventos cadastrados com sucesso!` : 'Evento salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        showNotificacao(`Não foi possível salvar o evento. ${error.message || error}`);
    }
}

function confirmDeleteEventoSala(id) {
    const evento = db.eventosSalas.find(item => item.id == id);
    if (!evento) return;

    document.getElementById('confirmacao-mensagem').innerHTML = `Tem certeza de que deseja excluir o evento <span class="confirm-object">${evento.titulo}</span>?`;
    document.getElementById('btn-confirmar-exclusao').onclick = async () => {
        try {
            await deleteEventoSalaFromDatabase(id);
            closeConfirmacaoModal();
            closeEventoSalaModal();
            renderAgenda();
            showNotificacao('Evento excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            showNotificacao(`Não foi possível excluir o evento. ${error.message || error}`);
        }
    };
    openModal('modal-confirmacao');
}

function confirmDeleteEventoSalaFromEdit() {
    const id = document.getElementById('evento-sala-id').value;
    if (id) confirmDeleteEventoSala(parseInt(id));
}
