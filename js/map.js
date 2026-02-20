/* ============================================================
   map.js - Map initialization, rendering, legends, popups
   ============================================================ */

let map;
let geoJsonLayerRef = null;
let markerLayerRef = null;

// ---- Initialize map ----
function initMap() {
    map = L.map('map', {
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM,
        minZoom: CONFIG.MAP_MIN_ZOOM,
        maxZoom: CONFIG.MAP_MAX_ZOOM,
        zoomControl: false
    });

    L.tileLayer(CONFIG.TILE_URL, {
        attribution: CONFIG.TILE_ATTR,
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomleft' }).addTo(map);
}

// ---- Main render entry ----
function renderLayer() {
    clearLayers();
    resetInfoBox();
    const layerDef = LAYER_DEFS[FILTERS.layer];
    if (layerDef.type === 'choropleth') {
        renderChoropleth();
    } else {
        renderMarkers();
    }
    updateLegend();
    updateRecordCount();
}

function clearLayers() {
    if (geoJsonLayerRef) { map.removeLayer(geoJsonLayerRef); geoJsonLayerRef = null; }
    if (markerLayerRef) { map.removeLayer(markerLayerRef); markerLayerRef = null; }
}

// ---- Choropleth ----
function renderChoropleth() {
    if (APP_DATA.geoJson) {
        renderGeoJsonChoropleth();
    } else {
        renderCentroidFallback();
    }
}

function renderGeoJsonChoropleth() {
    const key = FILTERS.layer;
    geoJsonLayerRef = L.geoJSON(APP_DATA.geoJson, {
        style: function(feature) {
            const name = normState(feature.properties.name || feature.properties.ESTADO || feature.properties.state_name || '');
            const value = getStateValue(name, key);
            return {
                fillColor: getChoroplethColor(value, key),
                weight: 1.2,
                color: '#fff',
                fillOpacity: 0.78
            };
        },
        onEachFeature: function(feature, layer) {
            const name = normState(feature.properties.name || feature.properties.ESTADO || feature.properties.state_name || '');
            layer.on({
                mouseover: function(e) {
                    e.target.setStyle({ weight: 2.5, color: '#333', fillOpacity: 0.9 });
                    e.target.bringToFront();
                    updateInfoBox(name, key);
                },
                mouseout: function(e) {
                    geoJsonLayerRef.resetStyle(e.target);
                    resetInfoBox();
                },
                click: function() {
                    showStatePopup(name, key);
                }
            });
        }
    }).addTo(map);
}

function renderCentroidFallback() {
    const key = FILTERS.layer;
    const group = L.layerGroup();
    for (const [state, coords] of Object.entries(STATE_CENTROIDS)) {
        const value = getStateValue(state, key);
        const color = getChoroplethColor(value, key);
        const displayVal = typeof value === 'number' ? value : 0;
        const radius = Math.max(8, Math.min(30, 8 + displayVal * 1.5));

        const marker = L.circleMarker(coords, {
            radius: radius,
            fillColor: color,
            color: '#fff',
            weight: 1.5,
            fillOpacity: 0.78
        });

        marker.on('mouseover', () => updateInfoBox(state, key));
        marker.on('mouseout', () => resetInfoBox());
        marker.on('click', () => showStatePopup(state, key));
        group.addLayer(marker);
    }
    markerLayerRef = group.addTo(map);
}

// ---- Color functions ----
function getChoroplethColor(value, key) {
    if (key === 'instruments') return INSTRUMENT_COLORS[value] || '#ffffff';
    if (key === 'sectors' || key === 'hs_codes') return getSectorColor(value, key);
    if (key === 'federal') return getSequentialColor(value, FED_BREAKS, FED_COLORS);
    if (key === 'fdi') return getSequentialColor(value, FDI_BREAKS, FDI_COLORS);
    // policies, education, rd
    return getSequentialColor(value, SEQ_BREAKS, SEQ_COLORS);
}

function getSequentialColor(value, breaks, colors) {
    for (let i = breaks.length - 1; i >= 0; i--) {
        if (value >= breaks[i]) return colors[i];
    }
    return colors[0];
}

function getSectorColor(value, key) {
    if (!value || value === 'None') return '#ffffff';
    const list = key === 'sectors' ? getUniqueSectors() : getUniqueHsCodes();
    const idx = list.indexOf(value);
    return idx >= 0 ? SECTOR_PALETTE[idx % SECTOR_PALETTE.length] : '#e0e0e0';
}

function getUniqueSectors() {
    const set = new Set();
    for (const sd of Object.values(APP_DATA.stateData)) {
        if (sd.sectors_data.dominant && sd.sectors_data.dominant !== 'None') set.add(sd.sectors_data.dominant);
    }
    return [...set].sort();
}

function getUniqueHsCodes() {
    const set = new Set();
    for (const sd of Object.values(APP_DATA.stateData)) {
        if (sd.hs_data.dominant && sd.hs_data.dominant !== 'None') set.add(sd.hs_data.dominant);
    }
    return [...set].sort();
}

// ---- Point markers ----
function renderMarkers() {
    const key = FILTERS.layer;
    const group = L.layerGroup();
    let records, getColor, getTooltip, getPopup, getShape;

    if (key === 'energy') {
        records = getFilteredEnergy().filter(r => r.latitude && r.longitude);
        getColor = r => ENERGY_TECH_COLORS[r.technology] || ENERGY_TECH_COLORS.default;
        getShape = r => ENERGY_SHAPES[r.project_type] || 'circle';
        getTooltip = r => `${r.project_name || 'Energy Project'} (${r.capacity_mw || '?'} MW)`;
        getPopup = r => buildEnergyPopup(r);
    } else if (key === 'greenmfg') {
        records = getFilteredGreenmfg().filter(r => r.latitude && r.longitude);
        getColor = r => GREENMFG_COLORS[r.sector] || GREENMFG_COLORS.default;
        getShape = () => 'circle';
        getTooltip = r => `${r.name || r.company || 'Facility'} (${r.sector || ''})`;
        getPopup = r => buildGreenmfgPopup(r);
    } else if (key === 'mines') {
        records = getFilteredMines().filter(r => r.latitude && r.longitude);
        getColor = r => MINES_COLORS[r.primary_commodity] || MINES_COLORS.default;
        getShape = () => 'circle';
        getTooltip = r => `${r.property_name || 'Mine'} (${r.primary_commodity || ''})`;
        getPopup = r => buildMinePopup(r);
    } else if (key === 'polos') {
        records = getFilteredPolos().filter(r => r.latitude && r.longitude);
        getColor = r => POLOS_CATEGORY_COLORS[r.category] || POLOS_CATEGORY_COLORS.default;
        getShape = () => 'circle';
        getTooltip = r => `${r.name || 'Polo'} (${POLOS_CATEGORY_LABELS[r.category] || r.category || ''})`;
        getPopup = r => buildPoloPopup(r);
    } else {
        return;
    }

    records.forEach(rec => {
        const color = getColor(rec);
        const shape = getShape(rec);
        const icon = makeMarkerIcon(shape, color);
        const marker = L.marker([rec.latitude, rec.longitude], { icon });
        marker.bindTooltip(getTooltip(rec), { direction: 'top', offset: [0, -8] });
        marker.bindPopup(getPopup(rec), { maxWidth: 300 });
        group.addLayer(marker);
    });

    markerLayerRef = group.addTo(map);
}

function makeMarkerIcon(shape, color) {
    let svg, size;
    if (shape === 'star') {
        size = 20;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 20 20">
            <polygon points="10,1 12.5,7.5 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7.5" fill="${color}" stroke="#fff" stroke-width="1.2" cursor="pointer"/>
        </svg>`;
    } else if (shape === 'triangle') {
        size = 18;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 18 18">
            <polygon points="9,1 17,17 1,17" fill="${color}" stroke="#fff" stroke-width="1.5" cursor="pointer"/>
        </svg>`;
    } else if (shape === 'diamond') {
        size = 18;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 18 18">
            <rect x="4" y="4" width="10" height="10" rx="1.5" fill="${color}" stroke="#fff" stroke-width="1.5" transform="rotate(45 9 9)" cursor="pointer"/>
        </svg>`;
    } else if (shape === 'square') {
        size = 16;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
            <rect x="2" y="2" width="12" height="12" rx="2" fill="${color}" stroke="#fff" stroke-width="1.5" cursor="pointer"/>
        </svg>`;
    } else {
        size = 16;
        svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="${color}" stroke="#fff" stroke-width="1.5" cursor="pointer"/>
        </svg>`;
    }
    const half = Math.round(size / 2);
    return L.divIcon({
        html: svg,
        className: '',
        iconSize: [size, size],
        iconAnchor: [half, half]
    });
}

// ---- Info box ----
function updateInfoBox(state, key) {
    const el = document.getElementById('info-box');
    if (!state) return;
    const value = getStateValue(state, key);
    const sd = APP_DATA.stateData[state];
    const layerTitle = LAYER_DEFS[key].title;
    let valueStr;

    if (key === 'fdi') {
        valueStr = `$${Math.round(value).toLocaleString()}M USD`;
        if (sd && sd.fdi_linked_count > 0) valueStr += ` (${sd.fdi_linked_count} linked)`;
    } else if (typeof value === 'number') {
        valueStr = value.toString();
    } else {
        valueStr = value || 'None';
    }

    el.innerHTML = `<strong>${state}</strong>${layerTitle}: ${valueStr}`;
}

function updateInfoBoxText(html) {
    document.getElementById('info-box').innerHTML = html;
}

function resetInfoBox() {
    const key = FILTERS.layer;
    const layerDef = LAYER_DEFS[key];
    document.getElementById('info-box').innerHTML =
        `<strong>${layerDef.title}</strong>Hover over states or markers for details.`;
}

// ---- State popup ----
function showStatePopup(state, key) {
    if (!state) return;
    const sd = APP_DATA.stateData[state];
    if (!sd) return;
    const coords = STATE_CENTROIDS[state];
    if (!coords) return;

    let html = `<div class="popup-title">${state}</div>`;
    html += `<div class="popup-subtitle">${LAYER_DEFS[key].title}</div>`;

    // Core summary rows
    html += popupRow('Subnational Policies', sd.policies_count);
    html += popupRow('FDI Count', sd.fdi_count);
    html += popupRow('FDI Total', `$${Math.round(sd.fdi_total_usd).toLocaleString()}M`);
    if (sd.fdi_linked_count > 0) {
        html += popupRow('FDI w/ Policy Links', `${sd.fdi_linked_count} <span class="badge badge-linkage">linked</span>`);
    }
    html += popupRow('Federal Programs', sd.federal_count);
    html += popupRow('Education', sd.education_count);
    html += popupRow('R&D', sd.rd_count);
    if (sd.conditionality_count > 0) {
        html += `<div class="popup-section-header">Conditionalities <span class="badge badge-conditionality">${sd.conditionality_count}</span></div>`;
        html += '<div style="font-size:11px;color:var(--gray-600);padding:2px 0;">';
        sd.conditionality_names.forEach(name => {
            const short = name.length > 55 ? name.substring(0, 53) + '...' : name;
            html += `<div class="linkage-policy-tag" title="${name}">${short}</div>`;
        });
        html += '</div>';
    }
    if (sd.planmex_count > 0) {
        html += `<div class="popup-section-header">Plan México <span class="badge badge-planmex">${sd.planmex_count}</span></div>`;
        html += '<div style="font-size:11px;color:var(--gray-600);padding:2px 0;">';
        sd.planmex_names.forEach(name => {
            const short = name.length > 55 ? name.substring(0, 53) + '...' : name;
            html += `<div class="linkage-policy-tag" title="${name}">${short}</div>`;
        });
        html += '</div>';
    }

    // Energy data
    if (sd.energy_count > 0) {
        html += `<div class="popup-section-header">Energy</div>`;
        html += popupRow('Energy Projects', sd.energy_count);
        html += popupRow('Capacity', `${sd.energy_total_mw.toLocaleString()} MW`);
        if (sd.energy_verified_capex > 0) {
            html += popupRow('Investment', `$${Math.round(sd.energy_verified_capex).toLocaleString()}M`);
        }
        if (sd.energy_linked_count > 0) {
            html += popupRow('From Federal Programs', `${sd.energy_linked_count} of ${sd.energy_count}`);
        }
    }

    // Green Manufacturing data
    if (sd.greenmfg_count > 0) {
        html += `<div class="popup-section-header">Green Manufacturing</div>`;
        html += popupRow('Facilities', sd.greenmfg_count);
        if (sd.greenmfg_investment > 0) {
            html += popupRow('Investment', `$${Math.round(sd.greenmfg_investment).toLocaleString()}M`);
        }
    }

    // Development Poles data
    if (sd.polos_count > 0) {
        html += `<div class="popup-section-header">Development Poles</div>`;
        html += popupRow('Poles', sd.polos_count);
        if (sd.polos_ciit_count > 0) {
            html += popupRow('Underway', sd.polos_ciit_count);
        }
        if (sd.polos_investment_committed > 0) {
            html += popupRow('Committed', `$${Math.round(sd.polos_investment_committed).toLocaleString()}M`);
        }
        if (sd.polos_investment_projected > 0) {
            html += popupRow('Projected', `$${Math.round(sd.polos_investment_projected).toLocaleString()}M`);
        }
    }

    // FDI-to-Policy Linkage detail (show which FDI → which policies)
    if (sd.fdi_linked_count > 0) {
        const linkedFdi = getLinkedFdiForState(state);
        if (linkedFdi.length > 0) {
            html += `<div class="popup-section-header">FDI–Policy Linkages <span style="font-weight:400;font-size:9px;color:var(--gray-400);">(same sector)</span></div>`;
            html += '<div class="linkage-list">';
            linkedFdi.forEach(f => {
                const companyName = f.company_name || 'Unknown';
                const invStr = f.investment_usd_millions ? ` · $${f.investment_usd_millions}M` : '';
                html += `<div class="linkage-item">`;
                html += `<div class="linkage-fdi"><span class="linkage-company">${companyName}</span><span class="linkage-meta">${f.sector || ''}${invStr}</span></div>`;
                html += `<div class="linkage-arrow">→</div>`;
                html += `<div class="linkage-policies">`;
                (f.linked_policy_ids || []).forEach(pid => {
                    const pName = getPolicyNameById(pid);
                    const shortName = pName.length > 50 ? pName.substring(0, 48) + '...' : pName;
                    html += `<div class="linkage-policy-tag" title="${pName}">${shortName}</div>`;
                });
                html += `</div></div>`;
            });
            html += '</div>';
        }
    }

    // Show dominant sector/HS code for those layers
    if (key === 'sectors') {
        html += popupRow('Dominant Sector', sd.sectors_data.dominant || 'None');
    } else if (key === 'hs_codes') {
        html += popupRow('Dominant HS Section', sd.hs_data.dominant || 'None');
    }

    // Breakdown only for instruments layer
    if (key === 'instruments') {
        const breakdown = sd.instruments_data.breakdown;
        if (breakdown && Object.keys(breakdown).length > 0) {
            const maxVal = Math.max(...Object.values(breakdown));
            html += '<div class="popup-breakdown"><h4>Breakdown</h4>';
            Object.entries(breakdown).sort((a,b) => b[1]-a[1]).forEach(([label, count]) => {
                const pct = Math.round(count / maxVal * 100);
                html += `<div class="popup-bar">
                    <div class="popup-bar-fill" style="width:${pct}%;"></div>
                    <span>${label}: ${count}</span>
                </div>`;
            });
            html += '</div>';
        }
    }

    L.popup({ maxWidth: 380, maxHeight: 420 })
        .setLatLng(coords)
        .setContent(html)
        .openOn(map);
}

function popupRow(label, value) {
    return `<div class="popup-row"><span class="popup-label">${label}</span><span class="popup-value">${value}</span></div>`;
}

// ---- Marker popups ----
function buildEnergyPopup(r) {
    let html = `<div class="popup-title">${r.project_name || 'Energy Project'}</div>`;
    html += `<div class="popup-subtitle">${r.state || ''}</div>`;
    if (r.developer) html += popupRow('Developer', r.developer);
    if (r.technology) html += popupRow('Technology', r.technology);
    if (r.capacity_mw) html += popupRow('Capacity', `${r.capacity_mw} MW`);
    if (r.status) html += popupRow('Status', r.status);
    if (r.year_announced) html += popupRow('Year Announced', r.year_announced);
    if (r.year_operational) html += popupRow('Year Operational', r.year_operational);
    if (r.source_program) html += popupRow('Program', r.source_program);
    if (r.investment_usd_millions) {
        html += popupRow('Investment', `$${r.investment_usd_millions}M`);
    }
    // Verified federal linkage
    if (r.linked_federal_program) {
        html += popupRow('Federal Link', r.linked_federal_program);
    }
    return html;
}

function buildGreenmfgPopup(r) {
    let html = `<div class="popup-title">${r.name || r.company || 'Facility'}</div>`;
    html += `<div class="popup-subtitle">${r.city ? r.city + ', ' : ''}${r.state || ''}</div>`;
    if (r.company) html += popupRow('Company', r.company);
    if (r.sector) html += popupRow('Sector', r.sector);
    if (r.product) html += popupRow('Product', r.product);
    if (r.investment_usd_millions) html += popupRow('Investment', `$${r.investment_usd_millions}M`);
    if (r.status) html += popupRow('Status', r.status);
    if (r.announcement_date) html += popupRow('Announced', r.announcement_date);
    return html;
}

function buildMinePopup(r) {
    let html = `<div class="popup-title">${r.property_name || 'Mine'}</div>`;
    html += `<div class="popup-subtitle">${r.municipality ? r.municipality + ', ' : ''}${r.state || ''}</div>`;
    if (r.primary_commodity) html += popupRow('Primary', r.primary_commodity);
    if (r.commodity && r.commodity !== r.primary_commodity) html += popupRow('Secondary', r.commodity);
    if (r.facility_type) html += popupRow('Type', r.facility_type);
    if (r.development_stage) html += popupRow('Stage', r.development_stage);
    if (r.capital_cost_usd_millions) html += popupRow('Capital Cost', `$${r.capital_cost_usd_millions}M`);
    if (r.status) html += popupRow('Status', r.status);
    return html;
}

function buildPoloPopup(r) {
    let html = `<div class="popup-title">${r.name || 'Development Pole'}</div>`;
    html += `<div class="popup-subtitle">${r.municipality ? r.municipality + ', ' : ''}${r.state || ''}</div>`;

    // Category badge with matching color
    const catLabel = POLOS_CATEGORY_LABELS[r.category] || r.category || '';
    const catColor = POLOS_CATEGORY_COLORS[r.category] || POLOS_CATEGORY_COLORS.default;
    html += `<div style="margin:4px 0 8px;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff;background:${catColor};">${catLabel}</span></div>`;

    if (r.status) html += popupRow('Status', r.status);
    if (r.sectors && r.sectors.length > 0) html += popupRow('Sectors', r.sectors.join(', '));
    if (r.infrastructure_type) html += popupRow('Infrastructure', r.infrastructure_type);

    // Investment section
    if (r.investment_committed_usd_millions > 0 || r.investment_projected_usd_millions > 0) {
        html += `<div class="popup-section-header">Investment</div>`;
        if (r.investment_committed_usd_millions > 0) {
            html += popupRow('Committed', `$${Math.round(r.investment_committed_usd_millions).toLocaleString()}M <span class="badge badge-committed">verified</span>`);
        }
        if (r.investment_projected_usd_millions > 0) {
            html += popupRow('Projected', `$${Math.round(r.investment_projected_usd_millions).toLocaleString()}M <span class="badge badge-projected">projected</span>`);
        }
    }

    if (r.jobs_projected) html += popupRow('Jobs (Projected)', r.jobs_projected.toLocaleString());
    if (r.area_hectares) html += popupRow('Area', `${r.area_hectares.toLocaleString()} ha`);

    // Tax incentives
    if (r.tax_incentive_active) {
        const expiry = r.incentive_expiry_year ? ` (until ${r.incentive_expiry_year})` : '';
        html += popupRow('Tax Incentive', `Active${expiry}`);
    }

    // Companies
    if (r.companies_announced && r.companies_announced.length > 0) {
        html += `<div class="popup-section-header">Companies Announced</div>`;
        html += `<div style="font-size:11px;color:var(--gray-600);padding:2px 0;">${r.companies_announced.join(', ')}</div>`;
    }

    // Cross-layer linkages
    if ((r.linked_policy_ids && r.linked_policy_ids.length > 0) || (r.linked_fdi_ids && r.linked_fdi_ids.length > 0)) {
        html += `<div class="popup-section-header">Linkages</div>`;
        if (r.linked_policy_ids && r.linked_policy_ids.length > 0) {
            html += popupRow('Linked Policies', r.linked_policy_ids.length);
        }
        if (r.linked_fdi_ids && r.linked_fdi_ids.length > 0) {
            html += popupRow('Linked FDI', r.linked_fdi_ids.length);
        }
    }

    // Former ZEE flag
    if (r.former_zee) {
        html += `<div style="margin-top:6px;padding:4px 8px;background:#FEF3C7;border-radius:4px;font-size:10px;color:#92400E;">Former ZEE: ${r.former_zee_name || 'Yes'}</div>`;
    }

    // Dates
    if (r.decree_date) html += popupRow('Decree', r.decree_date);
    if (r.announcement_date) html += popupRow('Announced', r.announcement_date);

    return html;
}

// ---- Legend ----
function updateLegend() {
    const el = document.getElementById('legend');
    const key = FILTERS.layer;
    let html = '';

    if (key === 'policies' || key === 'education' || key === 'rd') {
        html = buildSequentialLegend(LAYER_DEFS[key].title, SEQ_BREAKS, SEQ_COLORS, SEQ_LABELS);
    } else if (key === 'federal') {
        html = buildSequentialLegend('Federal Programs', FED_BREAKS, FED_COLORS, FED_LABELS);
    } else if (key === 'fdi') {
        html = buildSequentialLegend('FDI (USD Millions)', FDI_BREAKS, FDI_COLORS, FDI_LABELS);
    } else if (key === 'instruments') {
        html = buildCategoricalLegend('Dominant Instrument', INSTRUMENT_COLORS);
    } else if (key === 'sectors') {
        html = buildSectorLegend('Dominant Sector', getUniqueSectors());
    } else if (key === 'hs_codes') {
        html = buildSectorLegend('HS Section', getUniqueHsCodes());
    } else if (key === 'energy') {
        html = buildEnergyLegend();
    } else if (key === 'greenmfg') {
        html = buildColorMapLegend('Sector', getUsedGreenmfgColors(), 'circle');
    } else if (key === 'mines') {
        html = buildColorMapLegend('Commodity', getUsedMinesColors(), 'circle');
    } else if (key === 'polos') {
        html = buildPolosLegend();
    }

    el.innerHTML = html;
}

function buildSequentialLegend(title, breaks, colors, labels) {
    let html = `<h3>${title}</h3>`;
    for (let i = 0; i < breaks.length; i++) {
        const label = labels ? labels[i] : (
            i < breaks.length - 1
                ? `${breaks[i]} – ${breaks[i+1] - 1}`
                : `${breaks[i]}+`
        );
        html += `<div class="legend-item"><div class="legend-swatch" style="background:${colors[i]}"></div>${label}</div>`;
    }
    return html;
}

function buildCategoricalLegend(title, colorMap) {
    let html = `<h3>${title}</h3>`;
    for (const [label, color] of Object.entries(colorMap)) {
        html += `<div class="legend-item"><div class="legend-swatch" style="background:${color}"></div>${label}</div>`;
    }
    return html;
}

function buildSectorLegend(title, items) {
    let html = `<h3>${title}</h3>`;
    items.forEach((item, i) => {
        const color = SECTOR_PALETTE[i % SECTOR_PALETTE.length];
        html += `<div class="legend-item"><div class="legend-swatch" style="background:${color}"></div>${item}</div>`;
    });
    return html;
}

function buildColorMapLegend(title, items, shape) {
    let html = `<h3>${title}</h3>`;
    for (const [label, color] of items) {
        const shapeClass = shape === 'circle' ? 'circle' : '';
        if (shape === 'triangle') {
            html += `<div class="legend-item"><div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:14px solid ${color};flex-shrink:0;"></div>${label}</div>`;
        } else if (shape === 'diamond') {
            html += `<div class="legend-item"><div style="width:14px;height:14px;background:${color};transform:rotate(45deg);border-radius:2px;flex-shrink:0;border:1px solid rgba(0,0,0,0.1);"></div>${label}</div>`;
        } else {
            html += `<div class="legend-item"><div class="legend-swatch circle" style="background:${color}"></div>${label}</div>`;
        }
    }
    return html;
}

function buildEnergyLegend() {
    let html = '<h3>Energy Projects</h3>';

    // Shape legend by project type (only show types present in filtered data)
    html += '<div style="margin-bottom:8px; font-size:11px; font-weight:600; color:var(--gray-600);">Project Type</div>';
    const usedTypes = new Set();
    getFilteredEnergy().forEach(r => { if (r.project_type) usedTypes.add(r.project_type); });
    const allShapeEntries = [
        ['Generation', 'triangle'],
        ['Infrastructure', 'square'],
        ['Distribution', 'diamond'],
        ['Storage', 'circle']
    ];
    const shapeEntries = allShapeEntries.filter(([label]) => usedTypes.has(label));
    for (const [label, shape] of shapeEntries) {
        if (shape === 'triangle') {
            html += `<div class="legend-item"><div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid #6B7280;flex-shrink:0;"></div>${label}</div>`;
        } else if (shape === 'square') {
            html += `<div class="legend-item"><div style="width:14px;height:14px;background:#6B7280;border-radius:2px;flex-shrink:0;border:1px solid rgba(0,0,0,0.1);"></div>${label}</div>`;
        } else if (shape === 'diamond') {
            html += `<div class="legend-item"><div style="width:14px;height:14px;background:#6B7280;transform:rotate(45deg);border-radius:2px;flex-shrink:0;border:1px solid rgba(0,0,0,0.1);"></div>${label}</div>`;
        } else {
            html += `<div class="legend-item"><div class="legend-swatch circle" style="background:#6B7280"></div>${label}</div>`;
        }
    }

    // Color legend by technology
    html += '<div style="margin-top:10px; margin-bottom:8px; font-size:11px; font-weight:600; color:var(--gray-600);">Technology</div>';
    const usedColors = getUsedEnergyColors();
    for (const [tech, color] of usedColors) {
        const displayLabel = (typeof ENERGY_TECH_LABELS !== 'undefined' && ENERGY_TECH_LABELS[tech]) || tech;
        html += `<div class="legend-item"><div class="legend-swatch circle" style="background:${color}"></div>${displayLabel}</div>`;
    }

    return html;
}

function getUsedEnergyColors() {
    const infraTechs = new Set(['Grid infrastructure', 'Transmission lines']);
    const used = new Set();
    getFilteredEnergy().forEach(r => { if (r.technology && !infraTechs.has(r.technology)) used.add(r.technology); });
    return [...used].sort().map(t => [t, ENERGY_TECH_COLORS[t] || ENERGY_TECH_COLORS.default]);
}

function getUsedGreenmfgColors() {
    const used = new Set();
    getFilteredGreenmfg().forEach(r => { if (r.sector) used.add(r.sector); });
    return [...used].sort().map(t => [t, GREENMFG_COLORS[t] || GREENMFG_COLORS.default]);
}

function getUsedMinesColors() {
    const used = new Set();
    getFilteredMines().forEach(r => { if (r.primary_commodity) used.add(r.primary_commodity); });
    return [...used].sort().map(t => [t, MINES_COLORS[t] || MINES_COLORS.default]);
}

function buildPolosLegend() {
    let html = '<h3>Development Poles</h3>';

    // Single color legend by category (English labels)
    const usedCategories = new Set();
    getFilteredPolos().forEach(r => { if (r.category) usedCategories.add(r.category); });
    const catOrder = ['En marcha', 'En proceso', 'Nuevos polos', 'En evaluación'];
    catOrder.forEach(cat => {
        if (usedCategories.has(cat)) {
            const color = POLOS_CATEGORY_COLORS[cat] || POLOS_CATEGORY_COLORS.default;
            const label = POLOS_CATEGORY_LABELS[cat] || cat;
            html += `<div class="legend-item"><div class="legend-swatch circle" style="background:${color}"></div>${label}</div>`;
        }
    });

    return html;
}

// ---- Record count ----
function updateRecordCount() {
    const key = FILTERS.layer;
    let count = 0;
    switch (key) {
        case 'energy': count = getFilteredEnergy().length; break;
        case 'greenmfg': count = getFilteredGreenmfg().length; break;
        case 'mines': count = getFilteredMines().length; break;
        case 'polos': count = getFilteredPolos().length; break;
        case 'fdi': count = getFilteredFdi().length; break;
        case 'federal': count = getFilteredFederal().length; break;
        default: count = getFilteredPolicies().length;
    }
    document.getElementById('record-count').textContent = count;
}
