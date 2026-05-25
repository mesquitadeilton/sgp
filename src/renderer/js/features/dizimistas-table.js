const dizimistasPagination = {
    currentPage: 1,
    perPage: 50
};

function updateDizimistasPaginationControls(total) {
    const totalPages = Math.max(1, Math.ceil(total / dizimistasPagination.perPage));
    if (dizimistasPagination.currentPage > totalPages) {
        dizimistasPagination.currentPage = totalPages;
    }

    const start = total === 0 ? 0 : ((dizimistasPagination.currentPage - 1) * dizimistasPagination.perPage) + 1;
    const end = Math.min(total, dizimistasPagination.currentPage * dizimistasPagination.perPage);

    document.getElementById('dizimistas-page-info').textContent = `${start}-${end} de ${total}`;
    document.getElementById('dizimistas-page-number').textContent = `Página ${total === 0 ? 0 : dizimistasPagination.currentPage} de ${total === 0 ? 0 : totalPages}`;
    document.getElementById('dizimistas-prev-page').disabled = dizimistasPagination.currentPage <= 1;
    document.getElementById('dizimistas-next-page').disabled = dizimistasPagination.currentPage >= totalPages;
}

function handleDizimistasPerPageChange() {
    const select = document.getElementById('dizimistas-per-page');
    dizimistasPagination.perPage = Number(select.value) || 50;
    dizimistasPagination.currentPage = 1;
    renderDizimistasTable();
}

function changeDizimistasPage(offset) {
    dizimistasPagination.currentPage += offset;
    renderDizimistasTable();
}

function renderDizimistasTable(resetPage = false) {
    const tbody = document.getElementById('table-dizimistas');
    const search = document.getElementById('search-dizimistas').value.toLowerCase();
    const filterLetra = document.getElementById('filter-letra').value;

    if (resetPage) {
        dizimistasPagination.currentPage = 1;
    }

    tbody.classList.add('list-fade');
    window.setTimeout(() => {
        tbody.innerHTML = '';

        let filtrados = db.dizimistas.filter(d => d.nome.toLowerCase().includes(search));
        if (filterLetra) {
            filtrados = filtrados.filter(d => d.nome.toUpperCase().startsWith(filterLetra));
        }

        filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
        updateDizimistasPaginationControls(filtrados.length);

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 text-xs">Nenhum dizimista encontrado.</td></tr>';
            requestAnimationFrame(() => tbody.classList.remove('list-fade'));
            return;
        }

        const startIndex = (dizimistasPagination.currentPage - 1) * dizimistasPagination.perPage;
        const endIndex = startIndex + dizimistasPagination.perPage;
        const pageRows = filtrados.slice(startIndex, endIndex);

        pageRows.forEach(d => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition-all text-xs cursor-pointer';
            tr.onclick = (e) => {
                if (!e.target.closest('button')) {
                    showDizimistaDetails(d.id);
                }
            };
            tr.innerHTML = `
                <td class="p-3 font-semibold text-slate-700">${d.nome}</td>
                <td class="p-3 text-slate-500">${d.telefone || 'Não informado'}</td>
                <td class="p-3 text-slate-500">${formatDateBR(d.nascimento)}</td>
                <td class="p-3 text-center flex justify-center gap-1.5">
                    <button onclick="event.stopPropagation(); editDizimista(${d.id})" class="text-[#7A0C1E] hover:bg-red-50 px-2 py-1 rounded" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="event.stopPropagation(); deleteDizimista(${d.id})" class="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        requestAnimationFrame(() => tbody.classList.remove('list-fade'));
    }, 120);
}

function filterDizimistasSelect(searchTerm) {
    const dropdown = document.getElementById('devolucao-dizimista-dropdown');
    const input = document.getElementById('devolucao-dizimista-search');
    const hiddenInput = document.getElementById('devolucao-dizimista');

    if (searchTerm.length === 0) {
        dropdown.classList.add('hidden');
        hiddenInput.value = '';
        return;
    }

    const filtrados = db.dizimistas.filter(d => d.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
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
