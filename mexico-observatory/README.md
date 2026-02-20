# Mexico Green Industrial Policy Observatory - GIS Platform

Interactive mapping platform for the Mexico Subnational Industrial Policy Observatory.
Built for the **Net Zero Industrial Policy Lab** at Johns Hopkins SAIS.

## Quick Start

1. Clone or copy this folder
2. Serve with any static HTTP server:
   ```bash
   python3 -m http.server 8765
   ```
3. Open `http://localhost:8765` in your browser

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings > Pages**
3. Set source to the branch containing these files
4. The site will be available at `https://<username>.github.io/<repo>/`

## Project Structure

```
mexico-observatory/
├── index.html          # Main HTML entry point
├── css/
│   └── style.css       # All styles
├── js/
│   ├── config.js       # Constants, colors, layer definitions
│   ├── data.js         # Data loading, filtering, state aggregation
│   ├── map.js          # Leaflet map, choropleth, markers, popups, legends
│   ├── charts.js       # Chart.js visualizations
│   └── app.js          # Main controller, event listeners
├── data/
│   ├── policies.json   # Tab 1: Subnational industrial policies (220)
│   ├── federal.json    # Tab 2: Federal-state projects (23)
│   ├── fdi.json        # Tab 3: Subnational FDI investments (145)
│   ├── energy.json     # Tab 4: Energy projects (162)
│   ├── greenmfg.json   # Tab 5: Green manufacturing facilities (40)
│   ├── mines.json      # Tab 6: Mines & smelters (181)
│   └── constants.json  # State centroids, instrument map, state name map
└── README.md
```

## Features

- **11 map layers**: Policies, Instruments, Federal Programs, FDI, Sectors, HS Codes, Education, R&D, Energy Projects, Green Manufacturing, Mines
- **Choropleth maps** for state-level aggregations (sequential and categorical color scales)
- **Point markers** for geo-located assets (energy, manufacturing, mines) with shape/color coding
- **Year slider** with cumulative mode and undated record toggle
- **Status filter** (Operational, Under construction, Announced, Paused/Closed, Completed)
- **Interactive charts panel** with bar charts and doughnut charts that sync with all filters
- **Click popups** with detailed information for each state or marker
- **Hover tooltips** for quick identification
- **Responsive design** with collapsible sidebar for mobile

## Tech Stack

- **Leaflet.js 1.9.4** - Map rendering
- **Chart.js 4.4.1** - Data visualizations
- **CARTO Light** basemap tiles
- Pure HTML/CSS/JavaScript (no build tools required)

## Data Source

Data extracted from `Mex obs - Feb 26 UPDATED.xlsx` (771 total records across 6 tabs).
