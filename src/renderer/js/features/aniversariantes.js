function toISODate(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function parseISODate(dateStr) {
    const [ano, mes, dia] = dateStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
}

function formatDateRangeLabel(inicio, fim) {
    return `${inicio.toLocaleDateString('pt-BR')} até ${fim.toLocaleDateString('pt-BR')}`;
}

function getWeekRange() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasDesdeSabado = (hoje.getDay() + 1) % 7;
    const sabado = new Date(hoje);
    sabado.setDate(hoje.getDate() - diasDesdeSabado);
    const sexta = new Date(sabado);
    sexta.setDate(sabado.getDate() + 6);
    return { inicio: sabado, fim: sexta };
}

function getMonthRange(monthStr) {
    const [ano, mes] = monthStr.split('-').map(Number);
    return { inicio: new Date(ano, mes - 1, 1), fim: new Date(ano, mes, 0) };
}

function setDefaultAniversarioRange() {
    const { inicio, fim } = getWeekRange();
    const monthInput = document.getElementById('filter-aniversario-mes');
    if (monthInput) monthInput.value = '';
    document.getElementById('filter-aniversario-inicio').value = toISODate(inicio);
    document.getElementById('filter-aniversario-fim').value = toISODate(fim);
    return { inicio, fim };
}

function applyAniversarioMonthFilter() {
    const monthInput = document.getElementById('filter-aniversario-mes');
    if (!monthInput.value) {
        renderAniversariantes();
        return;
    }
    const { inicio, fim } = getMonthRange(monthInput.value);
    document.getElementById('filter-aniversario-inicio').value = toISODate(inicio);
    document.getElementById('filter-aniversario-fim').value = toISODate(fim);
    renderAniversariantes();
}

function clearAniversarioMonthAndRender() {
    const monthInput = document.getElementById('filter-aniversario-mes');
    if (monthInput) monthInput.value = '';
    renderAniversariantes();
}

function getAniversarioDateRange() {
    const inputInicio = document.getElementById('filter-aniversario-inicio');
    const inputFim = document.getElementById('filter-aniversario-fim');
    if (!inputInicio.value || !inputFim.value) return setDefaultAniversarioRange();

    let inicio = parseISODate(inputInicio.value);
    let fim = parseISODate(inputFim.value);
    if (inicio > fim) {
        [inicio, fim] = [fim, inicio];
        inputInicio.value = toISODate(inicio);
        inputFim.value = toISODate(fim);
    }
    return { inicio, fim };
}

function getBirthdayOccurrenceInRange(nascimentoStr, inicio, fim) {
    if (!nascimentoStr) return null;
    const [, mes, dia] = nascimentoStr.split('-').map(Number);
    for (let ano = inicio.getFullYear(); ano <= fim.getFullYear(); ano++) {
        const aniversario = new Date(ano, mes - 1, dia);
        aniversario.setHours(0, 0, 0, 0);
        if (aniversario >= inicio && aniversario <= fim) return aniversario;
    }
    return null;
}

function checkAniversarianteSemana(nascimentoStr) {
    const { inicio, fim } = getWeekRange();
    return !!getBirthdayOccurrenceInRange(nascimentoStr, inicio, fim);
}

function getAniversariantesPorPeriodo(inicio, fim) {
    return db.dizimistas
        .map(d => ({ ...d, aniversarioPeriodo: getBirthdayOccurrenceInRange(d.nascimento, inicio, fim) }))
        .filter(d => !!d.aniversarioPeriodo)
        .sort((a, b) => (a.aniversarioPeriodo - b.aniversarioPeriodo) || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function clearAniversarioFilter() {
    setDefaultAniversarioRange();
    renderAniversariantes();
}

function exportAniversariantesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { inicio, fim } = getAniversarioDateRange();
    const aniversariantes = getAniversariantesPorPeriodo(inicio, fim);

    if (aniversariantes.length === 0) {
        showNotificacao('Não há aniversariantes para exportar.', 'warning');
        return;
    }

    const paroquia = (db.configuracoes && db.configuracoes.nomeParoquia) || 'Sistema de Gestão Paroquial - SGP';

    doc.setFontSize(16);
    doc.text('Aniversariantes', 14, 20);
    doc.setFontSize(12);
    doc.text(paroquia, 14, 27);
    doc.setFontSize(10);
    doc.text(`Período: ${formatDateRangeLabel(inicio, fim)}`, 14, 34);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 40);

    const tableData = aniversariantes.map(d => [
        d.nome,
        d.aniversarioPeriodo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    ]);

    doc.autoTable({
        startY: 46,
        head: [['Nome', 'Dia do Aniversário']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [122, 12, 30], textColor: [255, 255, 255] },
        styles: { fontSize: 10, textColor: [0, 0, 0] },
        columnStyles: {
            0: { fontSize: 10 },
            1: { halign: 'center' }
        }
    });

    doc.save(`aniversariantes_${new Date().toISOString().split('T')[0]}.pdf`);
}

function renderAniversariantes() {
    const tbody = document.getElementById('table-aniversariantes');
    const desc = document.getElementById('aniversario-desc');
    const { inicio, fim } = getAniversarioDateRange();
    const aniversariantes = getAniversariantesPorPeriodo(inicio, fim);

    tbody.classList.add('list-fade');
    window.setTimeout(() => {
        tbody.innerHTML = '';
        desc.textContent = `Exibindo aniversariantes de ${formatDateRangeLabel(inicio, fim)}.`;

        const badge = document.getElementById('badge-aniversariantes');
        if (aniversariantes.length > 0) {
            badge.textContent = aniversariantes.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (aniversariantes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400 text-xs">Nenhum aniversariante no período selecionado.</td></tr>';
            requestAnimationFrame(() => tbody.classList.remove('list-fade'));
            return;
        }

        aniversariantes.forEach(d => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-amber-50/40 transition-all text-xs cursor-pointer';
            tr.onclick = () => showDizimistaDetails(d.id);
            tr.innerHTML = `
                <td class="p-3"><span class="font-semibold text-slate-700">${d.nome}</span></td>
                <td class="p-3 font-medium text-amber-700"><i class="fa-solid fa-gift mr-1 text-amber-500"></i> ${d.aniversarioPeriodo.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                <td class="p-3 text-slate-500">${d.telefone || 'Não informado'}</td>
            `;
            tbody.appendChild(tr);
        });

        requestAnimationFrame(() => tbody.classList.remove('list-fade'));
    }, 120);
}
