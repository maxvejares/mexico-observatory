/* ============================================================
   data.js - Data loading, filtering, state aggregation
   ============================================================ */

const APP_DATA = {
    policies: [],
    federal: [],
    fdi: [],
    energy: [],
    greenmfg: [],
    mines: [],
    polos: [],
    stateData: {},
    geoJson: null
};

// Filter state
const FILTERS = {
    layer: 'policies',
    status: '',
    year: 2026,
    cumulative: true,
    showUndated: true
};

// ---- Load all data ----
async function loadAllData() {
    // Use embedded data (from embedded-data.js) — works on file:// and GitHub Pages
    APP_DATA.policies = (typeof RAW_POLICIES !== 'undefined') ? RAW_POLICIES : [];
    APP_DATA.fdi = (typeof RAW_FDI !== 'undefined') ? RAW_FDI : [];
    APP_DATA.energy = (typeof RAW_ENERGY !== 'undefined') ? RAW_ENERGY : [];
    APP_DATA.greenmfg = (typeof RAW_GREENMFG !== 'undefined') ? RAW_GREENMFG : [];
    APP_DATA.mines = (typeof RAW_MINES !== 'undefined') ? RAW_MINES : [];
    APP_DATA.polos = (typeof RAW_POLOS !== 'undefined') ? RAW_POLOS : [];
    const rawFederal = (typeof RAW_FEDERAL !== 'undefined') ? RAW_FEDERAL : [];
    APP_DATA.federal = parseFederal(rawFederal);

    // Fallback: try fetch if embedded data is missing
    if (APP_DATA.policies.length === 0) {
        console.log('Embedded data not found, attempting fetch...');
        const base = getBasePath();
        try {
            const [policies, federal, fdi, energy, greenmfg, mines, polos] = await Promise.all([
                fetchJson(base + 'data/policies.json'),
                fetchJson(base + 'data/federal.json'),
                fetchJson(base + 'data/fdi.json'),
                fetchJson(base + 'data/energy.json'),
                fetchJson(base + 'data/greenmfg.json'),
                fetchJson(base + 'data/mines.json'),
                fetchJson(base + 'data/polos.json')
            ]);
            APP_DATA.policies = policies;
            APP_DATA.federal = parseFederal(federal);
            APP_DATA.fdi = fdi;
            APP_DATA.energy = energy;
            APP_DATA.greenmfg = greenmfg;
            APP_DATA.mines = mines;
            APP_DATA.polos = polos;
        } catch(e) {
            console.warn('Fetch fallback also failed:', e);
        }
    }

    console.log(`Data loaded: ${APP_DATA.policies.length} policies, ${APP_DATA.fdi.length} FDI, ${APP_DATA.energy.length} energy, ${APP_DATA.greenmfg.length} greenmfg, ${APP_DATA.mines.length} mines, ${APP_DATA.polos.length} polos`);

    // Auto-detect year range
    const allYears = []
        .concat(APP_DATA.policies.map(r => r._year))
        .concat(APP_DATA.fdi.map(r => r._year))
        .concat(APP_DATA.energy.map(r => r._year))
        .concat(APP_DATA.greenmfg.map(r => r._year))
        .concat(APP_DATA.polos.map(r => r._year))
        .filter(y => y != null && y > 1990);
    const minYear = Math.max(2015, allYears.length > 0 ? Math.min(...allYears) : 2015);
    FILTERS.year = 2026;
    const slider = document.getElementById('year-slider');
    if (slider) {
        slider.min = minYear;
        slider.max = 2026;
        slider.value = 2026;
    }

    // Load GeoJSON
    await loadGeoJson();

    // Init state data
    initStateData();
    recomputeStateData();
}

function getBasePath() {
    const path = window.location.pathname;
    if (path.endsWith('/')) return '';
    if (path.endsWith('.html')) return path.substring(0, path.lastIndexOf('/') + 1);
    return '';
}

async function fetchJson(url) {
    try {
        const r = await fetch(url);
        if (r.ok) return await r.json();
    } catch(e) {
        console.warn('Failed to fetch:', url, e);
    }
    return [];
}

async function loadGeoJson() {
    // Try embedded GeoJSON first (works on file:// protocol)
    if (typeof RAW_GEOJSON !== 'undefined' && RAW_GEOJSON) {
        APP_DATA.geoJson = RAW_GEOJSON;
        console.log('GeoJSON loaded from embedded data');
        return;
    }
    // Fallback: try fetching from URLs
    for (const url of CONFIG.GEOJSON_URLS) {
        try {
            const r = await fetch(url);
            if (r.ok) {
                APP_DATA.geoJson = await r.json();
                return;
            }
        } catch(e) {}
    }
    console.warn('GeoJSON failed to load — using centroid fallback');
}

function parseFederal(records) {
    return records.map(fp => {
        const raw = fp.states || '';
        const parsed = typeof raw === 'string'
            ? raw.replace(/;/g, ',').split(',').map(s => s.trim()).filter(Boolean)
            : [String(raw)];
        fp._parsed_states = parsed.map(normState).filter(Boolean);
        return fp;
    });
}

// ---- State name normalization ----
function normState(name) {
    if (!name) return null;
    if (STATE_NAME_MAP[name]) return STATE_NAME_MAP[name];
    if (STATE_CENTROIDS[name]) return name;

    const n = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const s of Object.keys(STATE_CENTROIDS)) {
        const sn = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (sn.toLowerCase() === n.toLowerCase()) return s;
    }
    for (const s of Object.keys(STATE_CENTROIDS)) {
        if (name.includes(s) || s.includes(name)) return s;
    }
    return null;
}

// ---- Year filter ----
function passesYearFilter(record) {
    const y = record._year;
    if (y == null) return FILTERS.showUndated;
    const yr = Math.round(y);
    return FILTERS.cumulative ? yr <= FILTERS.year : yr === FILTERS.year;
}

// ---- Status filter ----
function passesStatusFilter(record) {
    if (!FILTERS.status) return true;
    return record.status === FILTERS.status;
}

function passesAllFilters(record) {
    return passesStatusFilter(record) && passesYearFilter(record);
}

// ---- State data initialization & recomputation ----
function initStateData() {
    APP_DATA.stateData = {};
    for (const name of Object.keys(STATE_CENTROIDS)) {
        APP_DATA.stateData[name] = makeEmptyState();
    }
}

function makeEmptyState() {
    return {
        policies_count: 0,
        instruments_data: { dominant: 'None', breakdown: {} },
        sectors_data: { dominant: 'None', breakdown: {} },
        hs_data: { dominant: 'None', breakdown: {} },
        education_count: 0,
        rd_count: 0,
        fdi_count: 0,
        fdi_total_usd: 0,
        federal_count: 0,
        // Cross-layer aggregations (verifiable linkages)
        energy_count: 0,
        energy_total_mw: 0,
        energy_verified_capex: 0,
        energy_linked_count: 0,
        fdi_linked_count: 0,
        greenmfg_count: 0,
        greenmfg_investment: 0,
        polos_count: 0,
        polos_investment_committed: 0,
        polos_investment_projected: 0,
        polos_ciit_count: 0,
        // Policy-level binary flag aggregations
        conditionality_count: 0,
        conditionality_names: [],
        planmex_count: 0,
        planmex_names: []
    };
}

function recomputeStateData() {
    // Reset
    for (const s of Object.keys(APP_DATA.stateData)) {
        Object.assign(APP_DATA.stateData[s], makeEmptyState());
    }

    // Policies
    APP_DATA.policies.forEach(p => {
        if (!passesAllFilters(p)) return;
        const state = normState(p.state);
        if (!state || !APP_DATA.stateData[state]) return;
        const sd = APP_DATA.stateData[state];
        sd.policies_count++;

        const instCode = String(p.instrument);
        const instLabel = INSTRUMENT_MAP[instCode] || ('Type ' + instCode);
        sd.instruments_data.breakdown[instLabel] = (sd.instruments_data.breakdown[instLabel] || 0) + 1;

        if (p.sector) {
            sd.sectors_data.breakdown[p.sector] = (sd.sectors_data.breakdown[p.sector] || 0) + 1;
        }
        if (p.hs_section_name) {
            sd.hs_data.breakdown[p.hs_section_name] = (sd.hs_data.breakdown[p.hs_section_name] || 0) + 1;
        }
        if (p.has_training === 1) sd.education_count++;
        if (p['r&d'] === 1) sd.rd_count++;
        if (p.conditionality === 1) {
            sd.conditionality_count++;
            sd.conditionality_names.push(p.name || `Policy #${p.id}`);
        }
        if (p.planmex === 1) {
            sd.planmex_count++;
            sd.planmex_names.push(p.name || `Policy #${p.id}`);
        }
    });

    // Compute dominants
    for (const s of Object.keys(APP_DATA.stateData)) {
        const sd = APP_DATA.stateData[s];
        sd.instruments_data.dominant = getDominant(sd.instruments_data.breakdown);
        sd.sectors_data.dominant = getDominant(sd.sectors_data.breakdown);
        sd.hs_data.dominant = getDominant(sd.hs_data.breakdown);
    }

    // FDI
    APP_DATA.fdi.forEach(f => {
        if (!passesAllFilters(f)) return;
        const state = normState(f.state);
        if (!state || !APP_DATA.stateData[state]) return;
        const sd = APP_DATA.stateData[state];
        sd.fdi_count++;
        sd.fdi_total_usd += (f.investment_usd_millions || 0);
        if (f.linked_policy_ids && f.linked_policy_ids.length > 0) sd.fdi_linked_count++;
    });

    // Federal
    APP_DATA.federal.forEach(fp => {
        if (!passesAllFilters(fp)) return;
        (fp._parsed_states || []).forEach(s => {
            if (APP_DATA.stateData[s]) APP_DATA.stateData[s].federal_count++;
        });
    });

    // Energy
    APP_DATA.energy.forEach(e => {
        if (!passesAllFilters(e)) return;
        const state = normState(e.state);
        if (!state || !APP_DATA.stateData[state]) return;
        const sd = APP_DATA.stateData[state];
        sd.energy_count++;
        sd.energy_total_mw += (e.capacity_mw || 0);
        if (e.investment_usd_millions) {
            sd.energy_verified_capex += e.investment_usd_millions;
        }
        if (e.linked_federal_program) sd.energy_linked_count++;
    });

    // Green Manufacturing
    APP_DATA.greenmfg.forEach(g => {
        if (!passesAllFilters(g)) return;
        const state = normState(g.state);
        if (!state || !APP_DATA.stateData[state]) return;
        const sd = APP_DATA.stateData[state];
        sd.greenmfg_count++;
        sd.greenmfg_investment += (g.investment_usd_millions || 0);
    });

    // Polos de Bienestar
    APP_DATA.polos.forEach(p => {
        if (!passesAllFilters(p)) return;
        const state = normState(p.state);
        if (!state || !APP_DATA.stateData[state]) return;
        const sd = APP_DATA.stateData[state];
        sd.polos_count++;
        sd.polos_investment_committed += (p.investment_committed_usd_millions || 0);
        sd.polos_investment_projected += (p.investment_projected_usd_millions || 0);
        if (p.ciit_connected) sd.polos_ciit_count++;
    });
}

function getDominant(breakdown) {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return 'None';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
}

// ---- Filtered record getters ----
function getFilteredPolicies() {
    return APP_DATA.policies.filter(passesAllFilters);
}

function getFilteredFdi() {
    return APP_DATA.fdi.filter(passesAllFilters);
}

function getFilteredEnergy() {
    return APP_DATA.energy.filter(passesAllFilters);
}

function getFilteredGreenmfg() {
    return APP_DATA.greenmfg.filter(passesAllFilters);
}

function getFilteredMines() {
    return APP_DATA.mines.filter(passesAllFilters);
}

function getFilteredFederal() {
    return APP_DATA.federal.filter(passesAllFilters);
}

function getFilteredPolos() {
    return APP_DATA.polos.filter(passesAllFilters);
}

// ---- Policy lookup by ID (for FDI linkage display) ----
function getPolicyById(id) {
    return APP_DATA.policies.find(p => p.id === id) || null;
}

function getPolicyNameById(id) {
    const p = getPolicyById(id);
    return p ? (p.name || `Policy #${id}`) : `Policy #${id}`;
}

// Get FDI records linked to policies for a given state
function getLinkedFdiForState(state) {
    return getFilteredFdi().filter(f => {
        const fState = normState(f.state);
        return fState === state && f.linked_policy_ids && f.linked_policy_ids.length > 0;
    });
}

// Get all FDI-to-policy linkages (for chart panel)
function getAllFdiLinkages() {
    const linkages = [];
    getFilteredFdi().forEach(f => {
        if (!f.linked_policy_ids || f.linked_policy_ids.length === 0) return;
        f.linked_policy_ids.forEach(pid => {
            const policy = getPolicyById(pid);
            if (policy) {
                linkages.push({
                    fdi: f,
                    policy: policy,
                    company: f.company_name || 'Unknown',
                    fdiSector: f.sector || 'Unknown',
                    fdiState: f.state || 'Unknown',
                    policyName: policy.name || `Policy #${pid}`,
                    policySector: policy.sector || 'Unknown'
                });
            }
        });
    });
    return linkages;
}

// ---- Value getters for choropleth ----
function getStateValue(state, key) {
    const sd = APP_DATA.stateData[state];
    if (!sd) return key === 'instruments' || key === 'sectors' || key === 'hs_codes' ? 'None' : 0;
    switch (key) {
        case 'policies': return sd.policies_count;
        case 'instruments': return sd.instruments_data.dominant;
        case 'federal': return sd.federal_count;
        case 'fdi': return sd.fdi_total_usd;
        case 'sectors': return sd.sectors_data.dominant;
        case 'hs_codes': return sd.hs_data.dominant;
        case 'education': return sd.education_count;
        case 'rd': return sd.rd_count;
        default: return 0;
    }
}
