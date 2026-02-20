/* ============================================================
   charts.js - Chart rendering with Chart.js
   ============================================================ */

let barChart = null;
let pieChart = null;

const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleFont: { size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
            bodyFont: { size: 11, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
            padding: 10,
            cornerRadius: 4
        }
    }
};

function updateCharts() {
    const key = FILTERS.layer;

    // Update stats
    updateStats(key);

    // Bar chart
    const barData = getBarData(key);
    const barTitle = document.getElementById('chart-bar-title');
    barTitle.textContent = barData.title;
    renderBarChart(barData);

    // Pie chart
    const pieData = getPieData(key);
    const pieTitle = document.getElementById('chart-pie-title');
    pieTitle.textContent = pieData.title;
    renderPieChart(pieData);

    // FDI Linkage Explorer
    updateLinkageExplorer(key);
}

function updateStats(key) {
    let count, statesCount;
    const stat3Card = document.getElementById('stat-3-card');
    const statsRow = document.getElementById('stats-row');
    let showThird = false;

    switch (key) {
        case 'energy': {
            const data = getFilteredEnergy();
            count = data.length;
            const totalMW = data.reduce((s, r) => s + (r.capacity_mw || 0), 0);
            const fedLinked = data.filter(r => r.linked_federal_program).length;
            document.getElementById('stat-1-val').textContent = count;
            document.getElementById('stat-1-label').textContent = 'PROJECTS';
            document.getElementById('stat-2-val').textContent = totalMW.toLocaleString();
            document.getElementById('stat-2-label').textContent = 'TOTAL MW';
            if (fedLinked > 0) {
                showThird = true;
                document.getElementById('stat-3-val').textContent = fedLinked;
                document.getElementById('stat-3-label').textContent = 'FED. PROGRAM';
            }
            break;
        }
        case 'greenmfg': {
            const data = getFilteredGreenmfg();
            count = data.length;
            const totalInv = data.reduce((s, r) => s + (r.investment_usd_millions || 0), 0);
            document.getElementById('stat-1-val').textContent = count;
            document.getElementById('stat-1-label').textContent = 'FACILITIES';
            document.getElementById('stat-2-val').textContent = `$${Math.round(totalInv).toLocaleString()}M`;
            document.getElementById('stat-2-label').textContent = 'INVESTMENT';
            break;
        }
        case 'mines': {
            const data = getFilteredMines();
            count = data.length;
            statesCount = new Set(data.map(r => r.state)).size;
            document.getElementById('stat-1-val').textContent = count;
            document.getElementById('stat-1-label').textContent = 'MINES';
            document.getElementById('stat-2-val').textContent = statesCount;
            document.getElementById('stat-2-label').textContent = 'STATES';
            break;
        }
        case 'polos': {
            const data = getFilteredPolos();
            count = data.length;
            statesCount = new Set(data.map(r => normState(r.state)).filter(Boolean)).size;
            const ciitCount = data.filter(r => r.ciit_connected).length;
            document.getElementById('stat-1-val').textContent = count;
            document.getElementById('stat-1-label').textContent = 'DEV. POLES';
            document.getElementById('stat-2-val').textContent = statesCount;
            document.getElementById('stat-2-label').textContent = 'STATES';
            if (ciitCount > 0) {
                showThird = true;
                document.getElementById('stat-3-val').textContent = ciitCount;
                document.getElementById('stat-3-label').textContent = 'CIIT';
            }
            break;
        }
        case 'fdi': {
            const data = getFilteredFdi();
            const totalUsd = data.reduce((s, r) => s + (r.investment_usd_millions || 0), 0);
            const linked = data.filter(r => r.linked_policy_ids && r.linked_policy_ids.length > 0).length;
            document.getElementById('stat-1-val').textContent = data.length;
            document.getElementById('stat-1-label').textContent = 'INVESTMENTS';
            document.getElementById('stat-2-val').textContent = `$${Math.round(totalUsd).toLocaleString()}M`;
            document.getElementById('stat-2-label').textContent = 'TOTAL USD';
            if (linked > 0) {
                showThird = true;
                document.getElementById('stat-3-val').textContent = linked;
                document.getElementById('stat-3-label').textContent = 'POLICY LINKED';
            }
            break;
        }
        case 'federal': {
            const data = getFilteredFederal();
            document.getElementById('stat-1-val').textContent = data.length;
            document.getElementById('stat-1-label').textContent = 'PROGRAMS';
            document.getElementById('stat-2-val').textContent = '32';
            document.getElementById('stat-2-label').textContent = 'STATES';
            break;
        }
        default: {
            const data = getFilteredPolicies();
            statesCount = new Set(data.map(r => normState(r.state)).filter(Boolean)).size;
            document.getElementById('stat-1-val').textContent = data.length;
            document.getElementById('stat-1-label').textContent = 'POLICIES';
            document.getElementById('stat-2-val').textContent = statesCount;
            document.getElementById('stat-2-label').textContent = 'STATES';
        }
    }

    // Show/hide 3rd stat card and adjust grid
    if (stat3Card) {
        stat3Card.style.display = showThird ? '' : 'none';
        statsRow.classList.toggle('three-col', showThird);
    }
}

// ---- Bar chart data generators ----
function getBarData(key) {
    switch (key) {
        case 'policies': return getPoliciesBarData();
        case 'instruments': return getInstrumentsBarData();
        case 'federal': return getFederalBarData();
        case 'fdi': return getFdiBarData();
        case 'sectors': return getSectorsBarData();
        case 'hs_codes': return getHsCodesBarData();
        case 'education': return getEducationBarData();
        case 'rd': return getRdBarData();
        case 'energy': return getEnergyBarData();
        case 'greenmfg': return getGreenmfgBarData();
        case 'mines': return getMinesBarData();
        case 'polos': return getPolosBarData();
        default: return getPoliciesBarData();
    }
}

function getPoliciesBarData() {
    const counts = {};
    for (const [state, sd] of Object.entries(APP_DATA.stateData)) {
        if (sd.policies_count > 0) counts[state] = sd.policies_count;
    }
    return sortedBarData('Subnational Industrial Policies by State', counts, '#2563EB');
}

function getInstrumentsBarData() {
    const counts = {};
    getFilteredPolicies().forEach(p => {
        const inst = INSTRUMENT_MAP[String(p.instrument)] || 'Other';
        counts[inst] = (counts[inst] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
        title: 'Instrument Distribution',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map(l => INSTRUMENT_COLORS[l] || '#94A3B8')
    };
}

function getFederalBarData() {
    const counts = {};
    for (const [state, sd] of Object.entries(APP_DATA.stateData)) {
        if (sd.federal_count > 0) counts[state] = sd.federal_count;
    }
    return sortedBarData('Federal Programs by State', counts, '#8e3090');
}

function getFdiBarData() {
    const counts = {};
    for (const [state, sd] of Object.entries(APP_DATA.stateData)) {
        if (sd.fdi_total_usd > 0) counts[state] = Math.round(sd.fdi_total_usd);
    }
    return sortedBarData('FDI by State (USD Millions)', counts, '#e8784a');
}

function getSectorsBarData() {
    const counts = {};
    getFilteredPolicies().forEach(p => {
        if (p.sector) counts[p.sector] = (counts[p.sector] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 15);
    return {
        title: 'Top Sectors',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map((_, i) => SECTOR_PALETTE[i % SECTOR_PALETTE.length])
    };
}

function getHsCodesBarData() {
    const counts = {};
    getFilteredPolicies().forEach(p => {
        if (p.hs_section_name) counts[p.hs_section_name] = (counts[p.hs_section_name] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
        title: 'HS Section Distribution',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map((_, i) => SECTOR_PALETTE[i % SECTOR_PALETTE.length])
    };
}

function getEducationBarData() {
    const counts = {};
    for (const [state, sd] of Object.entries(APP_DATA.stateData)) {
        if (sd.education_count > 0) counts[state] = sd.education_count;
    }
    return sortedBarData('Education Policies by State', counts, '#0277BD');
}

function getRdBarData() {
    const counts = {};
    for (const [state, sd] of Object.entries(APP_DATA.stateData)) {
        if (sd.rd_count > 0) counts[state] = sd.rd_count;
    }
    return sortedBarData('R&D Policies by State', counts, '#7B1FA2');
}

function getEnergyBarData() {
    const counts = {};
    getFilteredEnergy().forEach(r => {
        const tech = r.technology || 'Unknown';
        counts[tech] = (counts[tech] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
        title: 'Projects by Technology',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map(l => ENERGY_TECH_COLORS[l] || ENERGY_TECH_COLORS.default)
    };
}

function getGreenmfgBarData() {
    const counts = {};
    getFilteredGreenmfg().forEach(r => {
        const sec = r.sector || 'Unknown';
        counts[sec] = (counts[sec] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
        title: 'Facilities by Sector',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map(l => GREENMFG_COLORS[l] || GREENMFG_COLORS.default)
    };
}

function getMinesBarData() {
    const counts = {};
    getFilteredMines().forEach(r => {
        const c = r.primary_commodity || 'Unknown';
        counts[c] = (counts[c] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
        title: 'Mines by Commodity',
        labels,
        data: labels.map(l => counts[l]),
        colors: labels.map(l => MINES_COLORS[l] || MINES_COLORS.default)
    };
}

function getPolosBarData() {
    const counts = {};
    getFilteredPolos().forEach(r => {
        const state = normState(r.state) || r.state || 'Unknown';
        counts[state] = (counts[state] || 0) + 1;
    });
    return sortedBarData('Development Poles by State', counts, '#7C3AED');
}

function sortedBarData(title, counts, color) {
    const labels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 15);
    return {
        title,
        labels,
        data: labels.map(l => counts[l]),
        colors: Array(labels.length).fill(color)
    };
}

// ---- Pie chart data ----
function getPieData(key) {
    if (key === 'energy') {
        const data = getFilteredEnergy();
        const fedLinked = data.filter(r => r.linked_federal_program).length;
        const unlinked = data.length - fedLinked;
        // Show federal linkage breakdown (verifiable data)
        if (fedLinked > 0) {
            const clean = data.filter(r => r.clean_energy === 1).length;
            return {
                title: 'Federal Linkage',
                labels: ['Fed. Linked', 'Unlinked'],
                data: [fedLinked, unlinked],
                colors: ['#16A34A', '#94A3B8']
            };
        }
        // Fallback: clean vs conventional
        const clean = data.filter(r => r.clean_energy === 1).length;
        const other = data.length - clean;
        return {
            title: 'Clean vs. Conventional',
            labels: ['Clean Energy', 'Conventional'],
            data: [clean, other],
            colors: ['#16A34A', '#DC2626']
        };
    }
    if (key === 'greenmfg') {
        const data = getFilteredGreenmfg();
        const byStatus = {};
        data.forEach(r => {
            const s = r.status || 'Unknown';
            byStatus[s] = (byStatus[s] || 0) + 1;
        });
        const labels = Object.keys(byStatus);
        return {
            title: 'By Status',
            labels,
            data: labels.map(l => byStatus[l]),
            colors: labels.map((_, i) => ['#16A34A', '#F59E0B', '#2563EB', '#DC2626', '#6B7280'][i % 5])
        };
    }
    if (key === 'mines') {
        const data = getFilteredMines();
        const byComm = {};
        data.forEach(r => {
            const c = r.primary_commodity || 'Other';
            byComm[c] = (byComm[c] || 0) + 1;
        });
        const labels = Object.keys(byComm).sort((a, b) => byComm[b] - byComm[a]).slice(0, 8);
        return {
            title: 'Top Commodities',
            labels,
            data: labels.map(l => byComm[l]),
            colors: labels.map(l => MINES_COLORS[l] || MINES_COLORS.default)
        };
    }
    if (key === 'polos') {
        const data = getFilteredPolos();
        const byCat = {};
        data.forEach(r => {
            const cat = r.category || 'Unknown';
            byCat[cat] = (byCat[cat] || 0) + 1;
        });
        const catOrder = ['En marcha', 'En proceso', 'Nuevos polos', 'En evaluación'];
        const presentCats = catOrder.filter(c => byCat[c]);
        const labels = presentCats.map(c => POLOS_CATEGORY_LABELS[c] || c);
        return {
            title: 'By Category',
            labels,
            data: presentCats.map(c => byCat[c]),
            colors: presentCats.map(c => POLOS_CATEGORY_COLORS[c] || '#6B7280')
        };
    }
    if (key === 'fdi') {
        const data = getFilteredFdi();
        const linked = data.filter(r => r.linked_policy_ids && r.linked_policy_ids.length > 0).length;
        if (linked > 0) {
            return {
                title: 'Policy Linkage',
                labels: ['Policy Linked', 'Unlinked'],
                data: [linked, data.length - linked],
                colors: ['#16A34A', '#94A3B8']
            };
        }
        // Fallback: green vs non-green
        const green = data.filter(r => r.green === 1).length;
        const other = data.length - green;
        return {
            title: 'Green vs. Non-Green FDI',
            labels: ['Green', 'Non-Green'],
            data: [green, other],
            colors: ['#16A34A', '#94A3B8']
        };
    }
    // Default: policies green/non-green
    const data = getFilteredPolicies();
    const green = data.filter(r => r.green === 1).length;
    const other = data.length - green;
    return {
        title: 'Green vs. Non-Green',
        labels: ['Green', 'Non-Green'],
        data: [green, other],
        colors: ['#16A34A', '#94A3B8']
    };
}

// ---- Render functions ----
function renderBarChart(barData) {
    if (barChart) barChart.destroy();
    const ctx = document.getElementById('chart-bar').getContext('2d');

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: barData.labels,
            datasets: [{
                data: barData.data,
                backgroundColor: barData.colors,
                borderRadius: 3,
                maxBarThickness: 28
            }]
        },
        options: {
            ...CHART_DEFAULTS,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { size: 10 } }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                            const label = this.getLabelForValue(value);
                            return label.length > 22 ? label.substring(0, 20) + '...' : label;
                        }
                    }
                }
            }
        }
    });
}

function renderPieChart(pieData) {
    if (pieChart) pieChart.destroy();
    const ctx = document.getElementById('chart-pie').getContext('2d');

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: pieData.labels,
            datasets: [{
                data: pieData.data,
                backgroundColor: pieData.colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            ...CHART_DEFAULTS,
            cutout: '55%',
            plugins: {
                ...CHART_DEFAULTS.plugins,
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 11, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyleWidth: 10
                    }
                }
            }
        }
    });
}

// ---- FDI-Policy Linkage Explorer ----
function updateLinkageExplorer(key) {
    const section = document.getElementById('linkage-explorer-section');
    const listEl = document.getElementById('linkage-explorer-list');
    if (!section || !listEl) return;

    if (key !== 'fdi') {
        section.style.display = 'none';
        return;
    }

    const linkages = getAllFdiLinkages();
    if (linkages.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';

    // Group linkages by state
    const byState = {};
    linkages.forEach(l => {
        const st = l.fdiState;
        if (!byState[st]) byState[st] = [];
        byState[st].push(l);
    });

    // Sort states by number of linkages
    const sortedStates = Object.keys(byState).sort((a, b) => byState[b].length - byState[a].length);

    let html = '';
    sortedStates.forEach(state => {
        const stateLinkages = byState[state];
        // Group by FDI company within state
        const byCompany = {};
        stateLinkages.forEach(l => {
            const key = l.company + '|' + l.fdi.id;
            if (!byCompany[key]) byCompany[key] = { fdi: l.fdi, company: l.company, sector: l.fdiSector, policies: [] };
            byCompany[key].policies.push(l);
        });

        html += `<div class="le-state-group">`;
        html += `<div class="le-state-header">${state} <span class="le-count">${Object.keys(byCompany).length} FDI</span></div>`;

        Object.values(byCompany).forEach(group => {
            const inv = group.fdi.investment_usd_millions ? `$${group.fdi.investment_usd_millions}M` : '';
            const origin = group.fdi.country_of_origin ? ` (${group.fdi.country_of_origin})` : '';
            html += `<div class="le-linkage-card">`;
            html += `<div class="le-fdi-row">`;
            html += `<span class="le-company">${group.company}${origin}</span>`;
            html += `<span class="le-fdi-meta">${group.sector}${inv ? ' · ' + inv : ''}</span>`;
            html += `</div>`;
            html += `<div class="le-policies">`;
            group.policies.forEach(l => {
                const shortName = l.policyName.length > 55 ? l.policyName.substring(0, 53) + '...' : l.policyName;
                html += `<div class="le-policy-row" title="${l.policyName}">`;
                html += `<span class="le-arrow">→</span>`;
                html += `<span class="le-policy-name">${shortName}</span>`;
                html += `<span class="le-policy-sector">${l.policySector}</span>`;
                html += `</div>`;
            });
            html += `</div></div>`;
        });

        html += `</div>`;
    });

    listEl.innerHTML = html;
}
