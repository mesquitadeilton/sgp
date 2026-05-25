function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const panel = modal.querySelector('.modal-panel');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');

        if (panel) {
            panel.classList.remove('opacity-0', 'translate-y-3', 'scale-95');
            panel.classList.add('opacity-100', 'translate-y-0', 'scale-100');
        }
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const panel = modal.querySelector('.modal-panel');

    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');

    if (panel) {
        panel.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        panel.classList.add('opacity-0', 'translate-y-3', 'scale-95');
    }

    window.setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'opacity-100');
        modal.classList.add('opacity-0');

        if (panel) {
            panel.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
            panel.classList.add('opacity-0', 'translate-y-3', 'scale-95');
        }

        document.body.focus();
    }, 200);
}

function closeDizimistaModal() {
    closeModal('modal-dizimista');
}

function showNotificacao(mensagem, type = 'info') {
    const header = document.getElementById('modal-notificacao-header');
    const okButton = document.getElementById('modal-notificacao-ok');
    const closeButton = document.getElementById('modal-notificacao-close');
    const styles = {
        success: { header: 'bg-emerald-600', button: 'bg-emerald-600 hover:bg-emerald-700', close: 'hover:text-emerald-200' },
        warning: { header: 'bg-amber-600', button: 'bg-amber-600 hover:bg-amber-700', close: 'hover:text-amber-200' },
        error: { header: 'bg-rose-600', button: 'bg-rose-600 hover:bg-rose-700', close: 'hover:text-rose-200' },
        info: { header: 'bg-slate-700', button: 'bg-slate-700 hover:bg-slate-800', close: 'hover:text-slate-200' }
    };
    const current = styles[type] || styles.info;
    if (header) {
        header.className = `text-white px-6 py-4 flex justify-between items-center ${current.header}`;
    }
    if (okButton) {
        okButton.className = `text-white px-4 py-2 text-sm font-semibold rounded-lg transition-all ${current.button}`;
    }
    if (closeButton) {
        closeButton.className = `text-white transition-colors ${current.close}`;
    }
    document.getElementById('notificacao-mensagem').textContent = mensagem;
    openModal('modal-notificacao');
}

function closeNotificacaoModal() {
    closeModal('modal-notificacao');
}
