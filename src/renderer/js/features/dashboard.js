function updateDashboard() {
    document.getElementById('dash-total-dizimistas').textContent = db.dizimistas.length;
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const totalMes = db.devolucoes
        .filter(l => l.data.substring(0, 7) === anoMesAtual)
        .reduce((sum, l) => sum + l.valor, 0);
    
    document.getElementById('dash-arrecadacao-mes').textContent = formatCurrency(totalMes);
    const mesAtualNum = hoje.getMonth() + 1;
    const niverMesCount = db.dizimistas.filter(d => {
        if(!d.nascimento) return false;
        const mes = parseInt(d.nascimento.split('-')[1]);
        return mes === mesAtualNum;
    }).length;
    
    document.getElementById('dash-aniversariantes-mes').textContent = niverMesCount;
    const ultimosTbody = document.getElementById('table-ultimos-lancamentos');
    ultimosTbody.innerHTML = '';
    const ultimos = [...db.devolucoes].sort((a,b) => b.id - a.id).slice(0, 5);

    if(ultimos.length === 0) {
        ultimosTbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-400 text-xs">Nenhuma arrecadação recente.</td></tr>`;
        return;
    }

    ultimos.forEach(l => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50/80 transition-all text-xs cursor-pointer";
        tr.onclick = (event) => {
            if(!event.target.closest('button')) showDizimistaDetails(l.dizimistaId);
        };
        tr.innerHTML = `
            <td class="p-3 text-slate-400">${formatDateBR(l.data)}</td>
            <td class="p-3 max-w-[150px] truncate">
                <span class="font-semibold text-slate-700 max-w-[150px] truncate">${l.dizimistaNome}</span>
            </td>
            <td class="p-3 font-medium text-slate-500">${formatRef(l.referencia)}</td>
            <td class="p-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    <span class="font-bold text-emerald-600">${formatCurrency(l.valor)}</span>
                    <button type="button" onclick="event.stopPropagation(); openEditDevolucao(${l.id})" class="text-[#7A0C1E] hover:bg-red-50 px-2 py-1 rounded" title="Editar lançamento"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" onclick="event.stopPropagation(); confirmDeleteDevolucao(${l.id})" class="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded" title="Excluir lançamento"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        ultimosTbody.appendChild(tr);
    });

    const anivSemana = db.dizimistas.filter(d => checkAniversarianteSemana(d.nascimento)).length;
    const badge = document.getElementById('badge-aniversariantes');
    if(anivSemana > 0) {
        badge.textContent = anivSemana;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}
