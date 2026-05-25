function csvEscape(value) {
    const text = String(value || '');
    return `"${text.replace(/"/g, '""')}"`;
}

function exportDizimistas() {
    if (!db.dizimistas.length) {
        showNotificacao('Não há dizimistas para exportar.', 'warning');
        return;
    }

    const headers = ['Nome', 'Telefone', 'Nascimento', 'Endereco'];
    const rows = db.dizimistas
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .map(dizimista => [
            dizimista.nome,
            dizimista.telefone || '',
            formatDateBR(dizimista.nascimento),
            dizimista.endereco || ''
        ]);

    const csv = [
        headers.map(csvEscape).join(';'),
        ...rows.map(row => row.map(csvEscape).join(';'))
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const hoje = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `dizimistas_${hoje}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
