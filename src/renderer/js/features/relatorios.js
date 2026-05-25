const relatorioPagination = {
    currentPage: 1,
    perPage: 50
};

function ensureDefaultReportPeriod() {
    const startEl = document.getElementById('report-start');
    const endEl = document.getElementById('report-end');
    if (!startEl || !endEl) return;
    if (startEl.value || endEl.value) return;

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    startEl.value = inicioMes.toISOString().split('T')[0];
    endEl.value = fimMes.toISOString().split('T')[0];
}

function getFilteredReportRows() {
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;

    let filtrados = [...db.devolucoes];
    if (start) filtrados = filtrados.filter(l => l.data >= start);
    if (end) filtrados = filtrados.filter(l => l.data <= end);
    filtrados.sort((a, b) => b.data.localeCompare(a.data));
    return filtrados;
}

function updateRelatorioPaginationControls(total) {
    const totalPages = Math.max(1, Math.ceil(total / relatorioPagination.perPage));
    if (relatorioPagination.currentPage > totalPages) relatorioPagination.currentPage = totalPages;

    const start = total === 0 ? 0 : ((relatorioPagination.currentPage - 1) * relatorioPagination.perPage) + 1;
    const end = Math.min(total, relatorioPagination.currentPage * relatorioPagination.perPage);

    document.getElementById('relatorio-page-info').textContent = `${start}-${end} de ${total}`;
    document.getElementById('relatorio-page-number').textContent = `Página ${total === 0 ? 0 : relatorioPagination.currentPage} de ${total === 0 ? 0 : totalPages}`;
    document.getElementById('relatorio-prev-page').disabled = relatorioPagination.currentPage <= 1;
    document.getElementById('relatorio-next-page').disabled = relatorioPagination.currentPage >= totalPages;
}

function handleRelatorioPerPageChange() {
    const select = document.getElementById('relatorio-per-page');
    relatorioPagination.perPage = Number(select.value) || 50;
    relatorioPagination.currentPage = 1;
    generateReport();
}

function changeRelatorioPage(offset) {
    relatorioPagination.currentPage += offset;
    generateReport(false);
}

function generateReport(resetPage = true) {
    ensureDefaultReportPeriod();
    if (resetPage) relatorioPagination.currentPage = 1;

    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    const tbody = document.getElementById('table-relatorio-resultados');
    tbody.classList.add('list-fade');

    window.setTimeout(() => {
        tbody.innerHTML = '';

        const filtrados = getFilteredReportRows();
        updateRelatorioPaginationControls(filtrados.length);
        const total = filtrados.reduce((sum, l) => sum + l.valor, 0);

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">Nenhum lançamento encontrado para o período.</td></tr>';
            document.getElementById('report-total-amount').textContent = formatCurrency(0);
            document.getElementById('report-period-text').textContent = 'Sem lançamentos';
            requestAnimationFrame(() => tbody.classList.remove('list-fade'));
            return;
        }

        const startIndex = (relatorioPagination.currentPage - 1) * relatorioPagination.perPage;
        const endIndex = startIndex + relatorioPagination.perPage;
        const pageRows = filtrados.slice(startIndex, endIndex);

        pageRows.forEach(l => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition-all text-xs cursor-pointer';
            tr.onclick = (event) => {
                if (!event.target.closest('button')) showDizimistaDetails(l.dizimistaId);
            };
            tr.innerHTML = `
                <td class="p-3 text-slate-500">${formatDateBR(l.data)}</td>
                <td class="p-3"><span class="font-semibold text-slate-700">${l.dizimistaNome}</span></td>
                <td class="p-3 font-medium text-slate-600">${formatRef(l.referencia)}</td>
                <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <span class="font-bold text-slate-700">${formatCurrency(l.valor)}</span>
                        <button type="button" onclick="event.stopPropagation(); openEditDevolucao(${l.id})" class="text-[#7A0C1E] hover:bg-red-50 px-2 py-1 rounded" title="Editar lançamento"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" onclick="event.stopPropagation(); confirmDeleteDevolucao(${l.id})" class="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded" title="Excluir lançamento"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('report-total-amount').textContent = formatCurrency(total);
        document.getElementById('report-period-text').textContent = `Período de ${formatDateBR(start)} até ${formatDateBR(end)}`;
        requestAnimationFrame(() => tbody.classList.remove('list-fade'));
    }, 120);
}

function exportReportPDF() {
    ensureDefaultReportPeriod();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const start = document.getElementById('report-start').value;
    const end = document.getElementById('report-end').value;
    const filtrados = getFilteredReportRows();

    if (filtrados.length === 0) {
        showNotificacao('Não há dados para exportar.', 'warning');
        return;
    }

    const totalGeral = filtrados.reduce((sum, l) => sum + l.valor, 0);
    const agrupadoPorDia = filtrados.reduce((acc, item) => {
        const chave = item.data;
        acc[chave] = (acc[chave] || 0) + item.valor;
        return acc;
    }, {});

    const linhas = Object.entries(agrupadoPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, valor]) => [formatDateBR(data), formatCurrency(valor)]);

    doc.setFontSize(16);
    doc.text('Relatório Financeiro - Paróquia', 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${formatDateBR(start)} até ${formatDateBR(end)}`, 14, 28);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 34);

    doc.autoTable({
        startY: 40,
        head: [['Data', 'Total do Dia']],
        body: linhas,
        theme: 'grid',
        headStyles: { fillColor: [122, 12, 30], textColor: [255, 255, 255] },
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        foot: [['Total Geral', formatCurrency(totalGeral)]],
        footStyles: { fillColor: [122, 12, 30], fontStyle: 'bold', textColor: [255, 255, 255] }
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportReportCSV() {
    const filtrados = getFilteredReportRows();
    if (filtrados.length === 0) {
        showNotificacao('Não há dados para exportar.', 'warning');
        return;
    }

    let csv = 'Data,Dizimista,Referência,Valor\n';
    filtrados.forEach(l => {
        csv += `${formatDateBR(l.data)},"${l.dizimistaNome}",${formatRef(l.referencia)},${l.valor.toFixed(2).replace('.', ',')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
