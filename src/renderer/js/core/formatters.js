function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDateBR(dateStr) {
    if(!dateStr) return '';
    if(dateStr.includes('/')) return dateStr;
    const [ano, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}/${ano}`;
}
function formatDateToISO(dateStr) {
    if(!dateStr) return '';
    if(dateStr.includes('/')) {
        const [dia, mes, ano] = dateStr.split('/');
        return `${ano}-${mes}-${dia}`;
    }
    return dateStr;
}
function formatRef(monthStr) {
    if(!monthStr) return '';
    const [ano, mes] = monthStr.split('-');
    return `${mes}/${ano}`;
}
