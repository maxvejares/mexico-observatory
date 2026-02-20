/* ============================================================
   app.js - Main application controller
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
    // Init map
    initMap();

    // Load data
    await loadAllData();

    // Render initial state
    renderLayer();

    // Setup event listeners
    setupEventListeners();

    // Hide loading
    document.getElementById('loading').classList.add('hidden');
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
    }, 400);
});

function setupEventListeners() {
    // Layer select
    document.getElementById('layer-select').addEventListener('change', function() {
        FILTERS.layer = this.value;
        recomputeStateData();
        renderLayer();
        if (document.getElementById('chart-panel').classList.contains('visible')) {
            updateCharts();
        }
    });

    // Status filter
    document.getElementById('status-filter').addEventListener('change', function() {
        FILTERS.status = this.value;
        recomputeStateData();
        renderLayer();
        if (document.getElementById('chart-panel').classList.contains('visible')) {
            updateCharts();
        }
    });

    // Year slider
    const slider = document.getElementById('year-slider');
    const yearLabel = document.getElementById('year-label');
    slider.addEventListener('input', function() {
        FILTERS.year = parseInt(this.value);
        yearLabel.textContent = this.value;
    });
    slider.addEventListener('change', function() {
        recomputeStateData();
        renderLayer();
        if (document.getElementById('chart-panel').classList.contains('visible')) {
            updateCharts();
        }
    });

    // Cumulative mode
    document.getElementById('cumulative-mode').addEventListener('change', function() {
        FILTERS.cumulative = this.checked;
        recomputeStateData();
        renderLayer();
        if (document.getElementById('chart-panel').classList.contains('visible')) {
            updateCharts();
        }
    });

    // Show undated
    document.getElementById('show-undated').addEventListener('change', function() {
        FILTERS.showUndated = this.checked;
        recomputeStateData();
        renderLayer();
        if (document.getElementById('chart-panel').classList.contains('visible')) {
            updateCharts();
        }
    });

    // Chart panel toggle
    document.getElementById('toggle-charts').addEventListener('click', toggleCharts);
    document.getElementById('close-charts').addEventListener('click', toggleCharts);

    // Sidebar toggle (mobile)
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Close sidebar on map click (mobile)
    map.on('click', function() {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.add('collapsed');
        }
    });

    // Show sidebar toggle on mobile
    checkMobile();
    window.addEventListener('resize', checkMobile);
}

function toggleCharts() {
    const panel = document.getElementById('chart-panel');
    const btn = document.getElementById('toggle-charts');
    const isVisible = panel.classList.toggle('visible');
    document.body.classList.toggle('chart-open', isVisible);
    btn.textContent = isVisible ? 'Hide Charts' : 'Show Charts';
    btn.classList.toggle('active', isVisible);

    if (isVisible) {
        updateCharts();
    }

    // Invalidate map size after transition
    setTimeout(() => map.invalidateSize(), 300);
}

function checkMobile() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
        toggle.style.display = 'flex';
        sidebar.classList.add('collapsed');
    } else {
        toggle.style.display = 'none';
        sidebar.classList.remove('collapsed');
    }
}
