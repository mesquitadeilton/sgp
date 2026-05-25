function maskPhone(input) {
    let value = input.value.replace(/\D/g, '');
    if(value.length > 11) value = value.slice(0, 11);
    if(value.length > 6) {
        value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
    } else if(value.length > 2) {
        value = `(${value.slice(0,2)}) ${value.slice(2)}`;
    } else if(value.length > 0) {
        value = `(${value}`;
    }
    input.value = value;
}
function maskDate(input) {
    let value = input.value.replace(/\D/g, '');
    if(value.length > 8) value = value.slice(0, 8);
    if(value.length > 4) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
    } else if(value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    input.value = value;
}
function maskCurrency(input) {
    let value = input.value.replace(/\D/g, '');
    if(value.length > 2) {
        value = (parseInt(value) / 100).toFixed(2);
    } else {
        value = (parseInt(value) / 100).toFixed(2);
    }
    input.value = value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseCurrency(value) {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}
