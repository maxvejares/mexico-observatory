/* ============================================================
   config.js - Constants, colors, layer definitions
   ============================================================ */

const CONFIG = {
    MAP_CENTER: [23.6345, -102.5528],
    MAP_ZOOM: 5,
    MAP_MIN_ZOOM: 4,
    MAP_MAX_ZOOM: 12,
    TILE_URL: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    TILE_ATTR: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    GEOJSON_URLS: [
        'data/mexico-states.geojson',
        'https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json',
        'https://raw.githubusercontent.com/strotgen/mexico-leaflet/master/states.geojson'
    ]
};

const STATE_CENTROIDS = {
    "Aguascalientes": [21.88, -102.29], "Baja California": [30.84, -115.28],
    "Baja California Sur": [26.04, -111.66], "Campeche": [19.83, -90.53],
    "Chiapas": [16.75, -93.13], "Chihuahua": [28.63, -106.09],
    "Ciudad de México": [19.43, -99.13], "Coahuila": [27.06, -101.71],
    "Colima": [19.24, -103.72], "Durango": [24.02, -104.66],
    "Estado de México": [19.49, -99.87], "Guanajuato": [21.02, -101.26],
    "Guerrero": [17.44, -99.55], "Hidalgo": [20.47, -98.99],
    "Jalisco": [20.66, -103.35], "Michoacán": [19.57, -101.71],
    "Morelos": [18.68, -99.23], "Nayarit": [21.75, -104.85],
    "Nuevo León": [25.59, -99.99], "Oaxaca": [17.07, -96.73],
    "Puebla": [19.04, -98.21], "Querétaro": [20.59, -100.39],
    "Quintana Roo": [19.18, -88.48], "San Luis Potosí": [22.15, -100.98],
    "Sinaloa": [24.81, -107.39], "Sonora": [29.07, -110.96],
    "Tabasco": [17.99, -92.93], "Tamaulipas": [24.27, -98.84],
    "Tlaxcala": [19.32, -98.24], "Veracruz": [19.18, -96.14],
    "Yucatán": [20.97, -89.62], "Zacatecas": [22.77, -102.58]
};

const INSTRUMENT_MAP = {
    "1": "Grant", "2": "Loan", "3": "Tax relief", "4": "Subsidy/Support",
    "5": "Loan guarantee", "6": "Joint venture", "7": "Public procurement",
    "8": "Infrastructure", "9": "Coordination mechanism", "10": "FDI measures",
    "11": "Workforce development"
};

const STATE_NAME_MAP = {
    "Coahuila de Zaragoza": "Coahuila",
    "Distrito Federal": "Ciudad de México",
    "México": "Estado de México",
    "Mexico": "Estado de México",
    "Mexico City": "Ciudad de México",
    "Michoacán de Ocampo": "Michoacán",
    "Veracruz de Ignacio de la Llave": "Veracruz"
};

// ---- Color scales ----

// Sequential blue (policy count) — 0 = white, 1+ = colored
const SEQ_COLORS = ['#ffffff', '#d4e6f1', '#a9cce3', '#7fb3d3', '#5499c7', '#2e86c1', '#1a5276', '#0b2545'];
const SEQ_BREAKS = [0, 1, 3, 5, 8, 12, 18, 25];
const SEQ_LABELS = ['0', '1 – 2', '3 – 4', '5 – 7', '8 – 11', '12 – 17', '18 – 24', '25+'];

// Federal (purple scale) — 0 = white, 1+ = colored
const FED_COLORS = ['#ffffff', '#e8d5e8', '#d4a9d4', '#c07ec0', '#a855a8', '#8e3090', '#6d1a6d', '#4a0e4a'];
const FED_BREAKS = [0, 1, 3, 5, 8, 10, 12, 14];
const FED_LABELS = ['0', '1 – 2', '3 – 4', '5 – 7', '8 – 9', '10 – 11', '12 – 13', '14+'];

// FDI (orange-red scale, USD millions) — 0 = white, >0 = colored
const FDI_COLORS = ['#ffffff', '#fde0c5', '#facba6', '#f8b58b', '#f09c6b', '#e8784a', '#d4532e', '#b71c1c', '#670d1e'];
const FDI_BREAKS = [0, 1, 200, 500, 1000, 2500, 5000, 10000, 20000];
const FDI_LABELS = ['$0', '$1 – 199M', '$200 – 499M', '$500 – 999M', '$1,000 – 2,499M', '$2,500 – 4,999M', '$5,000 – 9,999M', '$10,000 – 19,999M', '$20,000M+'];

// Instrument colors (categorical)
const INSTRUMENT_COLORS = {
    "Grant": "#1565C0",
    "Loan": "#6A1B9A",
    "Tax relief": "#2E7D32",
    "Subsidy/Support": "#00838F",
    "Loan guarantee": "#AD1457",
    "Joint venture": "#F57F17",
    "Public procurement": "#00695C",
    "Infrastructure": "#BF360C",
    "Coordination mechanism": "#283593",
    "FDI measures": "#7B1FA2",
    "Workforce development": "#0277BD"
};

// Sector palette (Set3-ish)
const SECTOR_PALETTE = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];

// Energy technology colors
// Note: "Grid infrastructure" and "Transmission lines" are infrastructure types, not generation
// technologies. They are kept here for color mapping but labeled distinctly in the legend.
const ENERGY_TECH_COLORS = {
    "Solar PV": "#F59E0B",
    "Wind": "#2563EB",
    "Hydroelectric": "#06B6D4",
    "Combined Cycle": "#DC2626",
    "Combined Cycle Gas": "#DC2626",
    "Geothermal": "#7C3AED",
    "Nuclear": "#BE185D",
    "Battery (Li-ion)": "#059669",
    "Grid infrastructure": "#92400E",
    "Solar PV + Storage": "#CA8A04",
    "Solar PV (rooftop)": "#D97706",
    "Transmission lines": "#92400E",
    "Renewable + clean (mixed)": "#16A34A",
    "Wind + Solar PV": "#0891B2",
    "Conventional Thermal": "#78350F",
    "Coal": "#374151",
    "Cogeneration": "#9D174D",
    "Internal Combustion": "#7F1D1D",
    "Combined Cycle / Internal Combustion": "#991B1B",
    "Multiple Fossil Fuels": "#44403C",
    "default": "#6B7280"
};

// Technology display labels (reclassify infrastructure types)
const ENERGY_TECH_LABELS = {
    "Grid infrastructure": "Grid infrastructure (T&D)",
    "Transmission lines": "Transmission lines (T&D)"
};

// Green manufacturing colors
const GREENMFG_COLORS = {
    "Batteries": "#F97316",
    "Wind": "#2563EB",
    "EVs": "#16A34A",
    "Solar": "#EAB308",
    "default": "#94A3B8"
};

// Mine commodity colors
const MINES_COLORS = {
    "Gold": "#EAB308",
    "Silver": "#9CA3AF",
    "Copper": "#C2410C",
    "Zinc": "#6B7280",
    "Lithium": "#06B6D4",
    "Iron": "#7C2D12",
    "Lead": "#475569",
    "Molybdenum": "#4B5563",
    "Manganese": "#78716C",
    "default": "#94A3B8"
};

// ---- Layer definitions ----
const LAYER_DEFS = {
    policies:    { title: 'Subnational Industrial Policies', type: 'choropleth', colorType: 'sequential' },
    instruments: { title: 'Instruments',           type: 'choropleth', colorType: 'categorical' },
    federal:     { title: 'Federal Programs',      type: 'choropleth', colorType: 'sequential' },
    fdi:         { title: 'Foreign Direct Investment (FDI)', type: 'choropleth', colorType: 'sequential' },
    sectors:     { title: 'Dominant Sector',       type: 'choropleth', colorType: 'categorical' },
    hs_codes:    { title: 'HS Code Sectors',       type: 'choropleth', colorType: 'categorical' },
    education:   { title: 'Education Policies',    type: 'choropleth', colorType: 'sequential' },
    rd:          { title: 'R&D Policies',          type: 'choropleth', colorType: 'sequential' },
    energy:      { title: 'Energy Projects',       type: 'markers' },
    greenmfg:    { title: 'Green Manufacturing',   type: 'markers' },
    mines:       { title: 'Mines',                 type: 'markers' },
    polos:       { title: 'Development Poles (Polos de Bienestar)', type: 'markers' }
};

// Polo category colors (single encoding: color = category)
const POLOS_CATEGORY_COLORS = {
    "En marcha": "#16A34A",
    "En proceso": "#F59E0B",
    "Nuevos polos": "#2563EB",
    "En evaluación": "#9CA3AF",
    "default": "#94A3B8"
};

// English display labels for polo categories
// Pipeline: Under Evaluation → Approved → In Procurement → Concessions Awarded
// "En marcha" = bidding completed, private concessions awarded to operators
// "En proceso" = land being secured and/or bidding process opening
// "Nuevos polos" = approved by Intersecretarial Committee, pending procurement
// "En evaluación" = feasibility assessment in progress
const POLOS_CATEGORY_LABELS = {
    "En marcha": "Concessions Awarded",
    "En proceso": "In Procurement",
    "Nuevos polos": "Approved",
    "En evaluación": "Under Evaluation"
};

// Energy marker shapes
const ENERGY_SHAPES = {
    'Generation': 'triangle',
    'Infrastructure': 'square',
    'Transmission': 'square',
    'Distribution': 'diamond',
    'Storage': 'circle'
};
