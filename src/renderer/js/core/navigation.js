let currentModule = null;
let currentTabId = null;

function resetAllFilters() {
    const letra = document.getElementById('filter-letra');
    const busca = document.getElementById('search-dizimistas');
    const relInicio = document.getElementById('report-start');
    const relFim = document.getElementById('report-end');

    if (letra) letra.value = '';
    if (busca) busca.value = '';
    if (relInicio) relInicio.value = '';
    if (relFim) relFim.value = '';

    if (typeof setDefaultAniversarioRange === 'function') {
        setDefaultAniversarioRange();
    }
}

function updateModuleBreadcrumb(moduleName) {
    const breadcrumb = document.getElementById('module-breadcrumb');
    if (!breadcrumb) return;
    breadcrumb.innerHTML = moduleName === 'dizimistas'
        ? 'Módulo <i class="fa-solid fa-chevron-right text-[10px] opacity-70"></i> Dizimistas'
        : 'Módulo <i class="fa-solid fa-chevron-right text-[10px] opacity-70"></i> Agenda';
}

function showModuleHome() {
    currentModule = null;
    const home = document.getElementById('module-home');
    const header = document.getElementById('app-header');
    const shell = document.getElementById('app-shell');

    header.classList.remove('opacity-100', 'translate-y-0');
    header.classList.add('opacity-0', '-translate-y-2');
    shell.classList.remove('opacity-100', 'translate-y-0');
    shell.classList.add('opacity-0', 'translate-y-3');

    window.setTimeout(() => {
        header.classList.add('hidden');
        header.classList.remove('flex', 'opacity-100', 'translate-y-0');
        shell.classList.add('hidden');
        shell.classList.remove('grid', 'opacity-100', 'translate-y-0');

        home.classList.remove('hidden');
        home.classList.remove('opacity-100');
        home.classList.add('flex', 'opacity-0');
        requestAnimationFrame(() => {
            home.classList.remove('opacity-0');
            home.classList.add('opacity-100');
        });
    }, 180);
}

function openModule(moduleName) {
    currentModule = moduleName;
    const home = document.getElementById('module-home');
    const header = document.getElementById('app-header');
    const shell = document.getElementById('app-shell');
    const isDizimistas = moduleName === 'dizimistas';

    document.getElementById('nav-dizimistas').classList.toggle('hidden', !isDizimistas);
    document.getElementById('nav-dizimistas').classList.toggle('flex', isDizimistas);
    document.getElementById('nav-agenda').classList.toggle('hidden', isDizimistas);
    document.getElementById('nav-agenda').classList.toggle('flex', !isDizimistas);
    document.getElementById('nav-exportacao').classList.toggle('hidden', !isDizimistas);
    updateModuleBreadcrumb(moduleName);
    updateDataLocal();
    resetAllFilters();

    home.classList.remove('opacity-100');
    home.classList.add('opacity-0');

    window.setTimeout(() => {
        home.classList.add('hidden');
        home.classList.remove('flex');

        header.classList.remove('hidden');
        header.classList.remove('opacity-100', 'translate-y-0');
        header.classList.add('flex', 'opacity-0', '-translate-y-2');
        shell.classList.remove('hidden');
        shell.classList.remove('opacity-100', 'translate-y-0');
        shell.classList.add('grid', 'opacity-0', 'translate-y-3');

        switchTab(isDizimistas ? 'tab-dashboard' : 'tab-agenda');

        requestAnimationFrame(() => {
            header.classList.remove('opacity-0', '-translate-y-2');
            header.classList.add('opacity-100', 'translate-y-0');
            shell.classList.remove('opacity-0', 'translate-y-3');
            shell.classList.add('opacity-100', 'translate-y-0');
        });
    }, 180);
}

function switchTab(tabId) {
    if (currentTabId && currentTabId !== tabId) {
        resetAllFilters();
    }
    currentTabId = tabId;

    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active', 'opacity-100', 'translate-y-0');
        el.classList.add('hidden', 'opacity-0', 'translate-y-3');
    });
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-red-50', 'text-red-700', 'shadow-sm', 'scale-[1.01]');
        el.classList.add('text-slate-600', 'hover:bg-slate-100');
    });

    const activeTab = document.getElementById(tabId);
    activeTab.classList.remove('hidden');
    requestAnimationFrame(() => {
        activeTab.classList.add('active', 'opacity-100', 'translate-y-0');
        activeTab.classList.remove('opacity-0', 'translate-y-3');
    });

    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeBtn.classList.add('bg-red-50', 'text-red-700', 'shadow-sm', 'scale-[1.01]');
    }

    if (tabId === 'tab-dizimistas') {
        renderDizimistasTable();
    } else if (tabId === 'tab-devolucoes') {
        document.getElementById('devolucao-data').value = new Date().toISOString().split('T')[0];
    } else if (tabId === 'tab-aniversariantes') {
        renderAniversariantes();
    } else if (tabId === 'tab-relatorios') {
        generateReport();
    } else if (tabId === 'tab-agenda') {
        renderAgenda();
    } else if (tabId === 'tab-ambientes') {
        renderAmbientesTable();
    }

    if (tabId !== 'tab-dizimistas') {
        cancelDizimistaEdit();
    }
    if (tabId !== 'tab-devolucoes') {
        document.getElementById('devolucao-dizimista-search').value = '';
        document.getElementById('devolucao-dizimista').value = '';
        document.getElementById('devolucao-valor').value = '';
        document.getElementById('devolucao-data').value = '';
        document.getElementById('devolucao-referencia').value = '';
    }
}
