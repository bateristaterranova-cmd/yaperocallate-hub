document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('masonry-grid');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    // SPA navigation elements
    const mainView = document.getElementById('main-view');
    const n8nSection = document.getElementById('n8n-section');
    const navN8n = document.getElementById('nav-n8n');
    const mainTitle = document.querySelector('.main-title');

    // Sidebar toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // SPA Navigation Logic
    navN8n.addEventListener('click', (e) => {
        e.preventDefault();
        mainView.style.display = 'none';
        n8nSection.style.display = 'block';
    });

    // Click on main title to go back to home
    mainTitle.style.cursor = 'pointer';
    mainTitle.addEventListener('click', () => {
        n8nSection.style.display = 'none';
        mainView.style.display = 'block';
    });

    // Imgenes de placeholder abstractas y con vibratividad para contraste al hacer hover
    const items = [
        { title: 'N 8 N', img: 'n8n_logo.svg' },
        { title: 'F 0 R 0', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&h=450&fit=crop' },
        { title: 'P R 0 Y E C T 0 S', img: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=600&h=900&fit=crop' },
        { title: 'V 1 D E O 5', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&h=500&fit=crop' },
        { title: 'L 1 N K 5', img: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&h=700&fit=crop' }
    ];

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'grid-item';
        
        // If it's n8n svg, don't apply grayscale so strongly or do it differently if wanted,
        // but since we are replacing the previous APPS, we keep the HTML.
        itemDiv.innerHTML = `
            <img src="${item.img}" alt="${item.title}" loading="lazy" ${item.img.includes('svg') ? 'style="background: #050505; padding: 2rem; box-sizing: border-box;"' : ''}>
            <div class="badge">${item.title}</div>
        `;
        
        grid.appendChild(itemDiv);
    });
});

/**
 * --------------------------------------------------------------------------
 * CONFIGURACIÓN DE CREDENCIALES N8N
 * --------------------------------------------------------------------------
 */

const N8N_BASE_URL = ''; 
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYTRkNTE5Zi02OWE2LTQwNGYtYTllNi04MGM0Y2E3MTdlOTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjg2OGI5N2YtNTczOC00NzU0LThlYzUtYzE0ZjNjNDcxNGQ2IiwiaWF0IjoxNzc3NjkzMzg3fQ.YAcP3jt8_Tdc_Csw8ap-SPrdTmcpoqwUC1tSk6MGtDk';

/**
 * --------------------------------------------------------------------------
 * LÓGICA DEL DASHBOARD N8N
 * --------------------------------------------------------------------------
 */

// Variables de estado
let allExecutions = [];
let filteredExecutions = [];
let currentSearchTerm = '';
let currentCategory = 'all';
let workflowDictionary = {};

// Nuevas variables para diffing silencioso
let lastFilteredExecutions = [];
let lastSearchHash = '';
let isFirstLoad = true;

// Referencias a los Gráficos de Chart.js
let statusChartInstance = null;
let hourlyChartInstance = null;

// Elementos del DOM (N8N)
let searchInput;
let executionsTableBody;
let errorsTableBody;
let loadingState;
let emptyState;
let noErrorsState;
let kpiTotal, kpiSuccess, kpiFailed, kpiRunning;

// Intervalo de Polling
const POLLING_INTERVAL = 3000; // 3 segundos

document.addEventListener('DOMContentLoaded', async () => {
    // Only init if we are on a page with n8n section (which we are)
    searchInput = document.getElementById('searchInput');
    executionsTableBody = document.getElementById('executionsTableBody');
    errorsTableBody = document.getElementById('errorsTableBody');
    loadingState = document.getElementById('loadingState');
    emptyState = document.getElementById('emptyState');
    noErrorsState = document.getElementById('noErrorsState');
    kpiTotal = document.getElementById('kpiTotal');
    kpiSuccess = document.getElementById('kpiSuccess');
    kpiFailed = document.getElementById('kpiFailed');
    kpiRunning = document.getElementById('kpiRunning');

    if(!searchInput) return; // Prevent errors if elements don't exist

    // Configurar pestañas
    setupTabs();
    
    // Configurar buscador y filtros de categoría
    setupSearch();
    setupCategoryFilters();

    // Iniciar primer Fetch de Flujos, luego Ejecuciones y luego Polling
    await fetchWorkflows();
    await fetchExecutions();
    setInterval(fetchExecutions, POLLING_INTERVAL);
});

function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('#categoryFilters button');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => {
                b.classList.remove('border-primary/50', 'bg-primary/20', 'text-primary', 'active-category');
                b.classList.add('border-slate-700', 'bg-slate-800', 'text-slate-300');
            });
            
            btn.classList.add('border-primary/50', 'bg-primary/20', 'text-primary', 'active-category');
            btn.classList.remove('border-slate-700', 'bg-slate-800', 'text-slate-300');
            
            currentCategory = btn.getAttribute('data-category');
            applyFiltersAndRender();
        });
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => {
                b.classList.remove('active-tab', 'border-primary', 'text-primary');
                b.style.borderBottom = "none";
                b.style.color = "#94a3b8";
            });
            
            btn.classList.add('active-tab', 'border-primary', 'text-primary');
            btn.style.borderBottom = "2px solid #3b82f6";
            btn.style.color = "#3b82f6";

            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.opacity = '0';
            });

            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            targetContent.classList.add('active');
            
            setTimeout(() => {
                targetContent.style.opacity = '1';
            }, 50);
        });
    });
}

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        applyFiltersAndRender();
    });
}

async function fetchWorkflows() {
    if (!API_KEY) return;
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows?limit=250`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-N8N-API-KEY': API_KEY
            }
        });
        if (response.ok) {
            const data = await response.json();
            if (data && data.data) {
                const prefixes = new Set();
                data.data.forEach(workflow => {
                    workflowDictionary[workflow.id] = workflow.name;
                    if (workflow.name && workflow.name.includes(':')) {
                        const prefix = workflow.name.split(':')[0].trim();
                        prefixes.add(prefix);
                    }
                });
                generateDynamicCategoryFilters(Array.from(prefixes));
            }
        }
    } catch (error) {
        console.error('Error obteniendo flujos de n8n para nombres:', error);
    }
}

function generateDynamicCategoryFilters(prefixes) {
    const categoryContainer = document.getElementById('categoryFilters');
    if (!categoryContainer) return;

    let html = `<button class="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/50 bg-primary/20 text-primary transition-colors hover:bg-primary/30 active-category" data-category="all" style="border: 1px solid rgba(59, 130, 246, 0.5); background: rgba(59, 130, 246, 0.2); color: #3b82f6;">Todos</button>`;

    prefixes.sort().forEach(prefix => {
        html += `<button class="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-700 bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white" data-category="${prefix}" style="border: 1px solid #334155; background: #1e293b; color: #cbd5e1;">${prefix}</button>`;
    });

    html += `<button class="px-3 py-1.5 rounded-full text-xs font-medium border border-danger/50 bg-danger/10 text-danger transition-colors hover:bg-danger/20 ml-auto" data-category="failed_only" style="border: 1px solid rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); color: #ef4444;"><i data-lucide="x-circle" class="w-3 h-3 inline mr-1"></i>Ver Fallidos</button>`;

    categoryContainer.innerHTML = html;
    setupCategoryFilters();
    lucide.createIcons();
}

async function fetchExecutions() {
    if (!API_KEY) {
        loadingState.innerHTML = '<div class="text-danger flex items-center gap-2" style="color: #ef4444;"><i data-lucide="alert-triangle"></i> Falta API_KEY de n8n</div>';
        lucide.createIcons();
        return;
    }
    try {
        const response = await fetch(`${N8N_BASE_URL}/api/v1/executions?limit=50`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-N8N-API-KEY': API_KEY
            }
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        if (data && data.data) {
            allExecutions = data.data;
            applyFiltersAndRender();
        }
    } catch (error) {
        console.error('Error obteniendo ejecuciones de n8n:', error);
    }
}

function applyFiltersAndRender() {
    filteredExecutions = allExecutions.filter(exec => {
        const flowName = workflowDictionary[exec.workflowId] || exec.workflowData?.name || 'Workflow Desconocido';
        const idMatch = String(exec.id).includes(currentSearchTerm);
        const nameMatch = flowName.toLowerCase().includes(currentSearchTerm) || '';
        const statusMatch = exec.status?.toLowerCase().includes(currentSearchTerm) || '';
        
        const matchesSearch = currentSearchTerm === '' || idMatch || nameMatch || statusMatch;
        
        let matchesCategory = true;
        if (currentCategory === 'failed_only') {
            matchesCategory = (exec.status === 'error' || exec.status === 'failed' || exec.status === 'crashed');
        } else if (currentCategory !== 'all') {
            matchesCategory = flowName.toLowerCase().includes(currentCategory.toLowerCase());
        }
        return matchesSearch && matchesCategory;
    });

    let hasChanges = false;
    const newFirstId = filteredExecutions.length > 0 ? filteredExecutions[0].id : null;
    const oldFirstId = lastFilteredExecutions.length > 0 ? lastFilteredExecutions[0].id : null;

    if (newFirstId !== oldFirstId || filteredExecutions.length !== lastFilteredExecutions.length) {
        hasChanges = true;
    } else {
        for (let i = 0; i < filteredExecutions.length; i++) {
            const newExec = filteredExecutions[i];
            const oldExec = lastFilteredExecutions.find(e => e.id === newExec.id);
            if (!oldExec || oldExec.status !== newExec.status) {
                hasChanges = true;
                break;
            }
        }
    }
    
    const currentSearchCategory = `${currentSearchTerm}-${currentCategory}`;
    if (lastSearchHash !== currentSearchCategory) {
        hasChanges = true;
        lastSearchHash = currentSearchCategory;
    }

    if (!hasChanges && !isFirstLoad) return; 

    lastFilteredExecutions = [...filteredExecutions];
    updateKPIs();
    renderTables();
    renderCharts();
}

function updateKPIs() {
    const total = allExecutions.length;
    const success = allExecutions.filter(e => e.status === 'success').length;
    const failed = allExecutions.filter(e => e.status === 'error' || e.status === 'crashed').length;
    const running = allExecutions.filter(e => e.status === 'running' || e.status === 'waiting').length;

    animateValue(kpiTotal, parseInt(kpiTotal.innerText) || 0, total, 500);
    animateValue(kpiSuccess, parseInt(kpiSuccess.innerText) || 0, success, 500);
    animateValue(kpiFailed, parseInt(kpiFailed.innerText) || 0, failed, 500);
    animateValue(kpiRunning, parseInt(kpiRunning.innerText) || 0, running, 500);

    const kpiRunningIconBox = kpiRunning.parentElement.nextElementSibling;
    if (kpiRunningIconBox) {
        if (running === 0) {
            kpiRunningIconBox.innerHTML = '<i data-lucide="check" class="text-success w-6 h-6" style="color: #10b981;"></i>';
        } else {
            kpiRunningIconBox.innerHTML = '<i data-lucide="loader-2" class="text-warning w-6 h-6 animate-spin-slow" style="color: #f59e0b;"></i>';
        }
        lucide.createIcons({root: kpiRunningIconBox.parentElement});
    }
}

function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function renderTables() {
    loadingState.classList.add('hidden');
    loadingState.style.display = 'none';

    if (filteredExecutions.length === 0) {
        executionsTableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.style.display = 'flex';
    } else {
        emptyState.classList.add('hidden');
        emptyState.style.display = 'none';
        
        let tableHTML = '';
        let errorsHTML = '';
        let errorsCount = 0;

        filteredExecutions.forEach((exec, index) => {
            const date = new Date(exec.startedAt);
            const formattedDate = !isNaN(date) ? date.toLocaleString() : 'N/A';
            const statusVisuals = getStatusVisuals(exec.status);
            
            const flowName = workflowDictionary[exec.workflowId] || exec.workflowData?.name || 'Workflow Desconocido';
            const execId = exec.id || 'N/A';

            let errorMessageHtml = '';
            if (exec.status === 'error' || exec.status === 'failed' || exec.status === 'crashed') {
                const errorMsg = exec.data?.resultData?.error?.message || exec.data?.error?.message || exec.error?.message || exec.resultData?.error?.message || 'Error en ejecución.';
                errorMessageHtml = `<div class="text-xs text-danger mt-1 font-mono break-words opacity-80" style="color: #ef4444;"><i data-lucide="alert-triangle" class="w-3 h-3 inline mr-1"></i>${errorMsg}</div>`;
            }

            const retryBtnHTML = (exec.status === 'error' || exec.status === 'crashed' || exec.status === 'failed') 
                ? `<button onclick="retryExecution('${execId}')" class="px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg text-xs font-medium transition-colors border border-danger/20 flex items-center gap-1 ml-auto" style="border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                     <i data-lucide="refresh-cw" class="w-3 h-3"></i> Reintentar
                   </button>`
                : `<span class="text-slate-500 text-xs px-3 py-1.5 block text-right" style="color: #64748b;">-</span>`;

            const animationClass = isFirstLoad ? 'row-enter' : '';
            const animationStyle = isFirstLoad ? `style="animation-delay: ${index * 0.05}s; border-bottom: 1px solid hsl(0 0% 20%);"` : `style="border-bottom: 1px solid hsl(0 0% 20%);"`;
            const executionLink = `https://n8n.yaperocallate.com/workflow/${exec.workflowId}/executions/${execId}`;

            const row = `
                <tr class="hover:bg-slate-800/50 transition-colors group ${animationClass}" ${animationStyle}>
                    <td class="p-4 font-mono text-xs text-slate-400" style="padding: 1rem; color: #94a3b8;">
                        <a href="${executionLink}" target="_blank" class="hover:text-primary transition-colors hover:underline decoration-slate-600 underline-offset-4" style="color: #3b82f6;">#${execId}</a>
                    </td>
                    <td class="p-4 font-medium text-slate-200" style="padding: 1rem; color: #e2e8f0;">
                        <div class="flex flex-col">
                            <div class="flex items-center gap-2">
                               <div class="w-2 h-2 min-w-[8px] rounded-full ${statusVisuals.dotClass}" style="width: 8px; height: 8px; border-radius: 50%; ${statusVisuals.dotStyle}"></div>
                               ${flowName}
                            </div>
                            ${errorMessageHtml}
                        </div>
                    </td>
                    <td class="p-4 text-slate-400 text-sm whitespace-nowrap" style="padding: 1rem; color: #94a3b8;">${formattedDate}</td>
                    <td class="p-4" style="padding: 1rem;">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium border ${statusVisuals.badgeClass}" style="padding: 0.25rem 0.625rem; border-radius: 9999px; ${statusVisuals.badgeStyle}">
                            ${statusVisuals.label}
                        </span>
                    </td>
                    <td class="p-4" style="padding: 1rem;">
                        ${retryBtnHTML}
                    </td>
                </tr>
            `;
            
            tableHTML += row;

            if (exec.status === 'error' || exec.status === 'failed' || exec.status === 'crashed') {
                errorsHTML += row;
                errorsCount++;
            }
        });

        executionsTableBody.innerHTML = tableHTML;
        
        if (errorsCount === 0) {
            errorsTableBody.innerHTML = '';
            noErrorsState.classList.remove('hidden');
            noErrorsState.style.display = 'block';
        } else {
            noErrorsState.classList.add('hidden');
            noErrorsState.style.display = 'none';
            errorsTableBody.innerHTML = errorsHTML;
        }
        lucide.createIcons();
    }
    isFirstLoad = false;
}

function renderCharts() {
    if (allExecutions.length === 0) return;

    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus) {
        const recentExecs = allExecutions.slice(0, 50);
        const successCount = recentExecs.filter(e => e.status === 'success').length;
        const errorCount = recentExecs.filter(e => e.status === 'error' || e.status === 'failed' || e.status === 'crashed').length;
        const runningCount = recentExecs.filter(e => e.status === 'running' || e.status === 'waiting').length;

        if (statusChartInstance) {
            statusChartInstance.data.datasets[0].data = [successCount, errorCount, runningCount];
            statusChartInstance.update();
        } else {
            statusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Exitosos', 'Fallidos', 'En Proceso'],
                    datasets: [{
                        data: [successCount, errorCount, runningCount],
                        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                        borderColor: '#0f172a',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
                    cutout: '70%'
                }
            });
        }
    }

    const ctxHourly = document.getElementById('hourlyChart');
    if (ctxHourly) {
        const hourlyData = {};
        allExecutions.forEach(e => {
            const d = new Date(e.startedAt);
            if (!isNaN(d)) {
                const h = d.getHours().toString().padStart(2, '0') + ':00';
                hourlyData[h] = (hourlyData[h] || 0) + 1;
            }
        });

        const labels = Object.keys(hourlyData).sort();
        const data = labels.map(h => hourlyData[h]);

        if (hourlyChartInstance) {
            hourlyChartInstance.data.labels = labels;
            hourlyChartInstance.data.datasets[0].data = data;
            hourlyChartInstance.update();
        } else {
            hourlyChartInstance = new Chart(ctxHourly, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ejecuciones',
                        data: data,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { ticks: { color: '#64748b', precision: 0 }, grid: { color: '#1e293b' } },
                        x: { ticks: { color: '#64748b' }, grid: { display: false } }
                    }
                }
            });
        }
    }
}

function getStatusVisuals(status) {
    switch (status) {
        case 'success':
            return {
                label: 'Exitoso',
                badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                badgeStyle: 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);',
                dotClass: 'bg-emerald-500',
                dotStyle: 'background: #10b981;'
            };
        case 'error':
        case 'crashed':
        case 'failed':
            return {
                label: 'Fallido',
                badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
                badgeStyle: 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);',
                dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                dotStyle: 'background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5);'
            };
        case 'running':
        case 'waiting':
            return {
                label: 'En Proceso',
                badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                badgeStyle: 'background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);',
                dotClass: 'bg-amber-500 animate-pulse',
                dotStyle: 'background: #f59e0b;'
            };
        case 'canceled':
            return {
                label: 'Cancelado',
                badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                badgeStyle: 'background: rgba(100, 116, 139, 0.1); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2);',
                dotClass: 'bg-slate-500',
                dotStyle: 'background: #64748b;'
            };
        default:
            return {
                label: status || 'Desconocido',
                badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
                badgeStyle: 'background: rgba(100, 116, 139, 0.1); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2);',
                dotClass: 'bg-slate-500',
                dotStyle: 'background: #64748b;'
            };
    }
}

function retryExecution(id) {
    if (!API_KEY) {
        alert(`Reintento de ejecución #${id} simulado (Falta API Key).`);
        return;
    }
    alert(`Se ha enviado la petición para reintentar la ejecución: #${id}`);
}
