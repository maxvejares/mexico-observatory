# Mexico Observatory Web Platform

Public-facing static GIS platform for the Mexico Green Industrial Policy Observatory. Interactive map with filterable data layers covering subnational policies, FDI, energy projects, mining, and green manufacturing.

## Tech stack

- Leaflet.js (map library), Chart.js (dashboard charts), vanilla JavaScript
- No backend - all data embedded in JSON files for offline/static hosting
- CSS with custom styling + Leaflet assets

## Project structure

```
index.html              Entry point
js/
  app.js                Main application logic (4KB)
  map.js                Leaflet map initialization (14KB)
  charts.js             Chart.js dashboard (20KB)
  data.js               Data filtering logic (13KB)
  config.js             Configuration (8KB)
  embedded-data.js      All data compiled for offline use (960KB)
  leaflet.js            Leaflet library
  chart.umd.min.js      Chart.js library
data/
  constants.json        Layer configuration
  policies.json         Subnational policies (361KB)
  federal.json          Federal programs (35KB)
  fdi.json              Foreign direct investment (145KB)
  energy.json           Energy projects (158KB)
  greenmfg.json         Green manufacturing (43KB)
  mines.json            Mining data (125KB)
  polos.json            Polos de Bienestar (40KB)
  mexico-states.geojson State boundaries (185KB)
css/
  style.css             Platform styling
```

## Data flow

The `data/` JSON files are the source of truth. `js/embedded-data.js` is a compiled bundle of all data for offline access. When updating data, modify the individual JSON files in `data/` and regenerate `embedded-data.js`.

## Map layers

Subnational Industrial Policies, Instruments, Federal Programs, FDI, Dominant Sector, HS Code Sectors, Education Policies, R&D Policies, Energy Projects, Green Manufacturing, Mines, Development Poles (Polos de Bienestar).

## Key commands

```bash
python -m http.server    # Serve locally from project root
```

## Current state

Complete. Static site deployed. Year slider (2004-2026), status filters, hover/click details, responsive sidebar.
