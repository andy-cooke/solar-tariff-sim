/**
 * Solar Tariff Simulator - Main Application Logic
 * 
 * Handles simulation engine, UI interactions, and local storage management
 */

// Global state
let simulationResults = null;
let energyChart = null;
let batteryChart = null;

// Initialize app on page load
$(document).ready(function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Set today's date as default
    const today = new Date();
    $('#date').val(today.toISOString().split('T')[0]);
    
    // Bind form submission
    $('#simulationForm').on('submit', function(e) {
        e.preventDefault();
        runSimulation();
    });
    
    // Bind session management buttons
    $('#saveSession').on('click', saveSession);
    $('#loadSession').on('click', loadSession);
    $('#clearSessions').on('click', clearAllSessions);
    
    // Update storage info on load
    updateStorageInfo();
}

/**
 * Run the main simulation
 */
function runSimulation() {
    const formData = {
        date: new Date($('#date').val()),
        panels: parseInt($('#panels').val()),
        inverterSize: parseFloat($('#inverterSize').val()),
        batterySize: parseFloat($('#batterySize').val()),
        baseLoad: parseFloat($('#baseLoad').val()),
        peakLoad: parseFloat($('#peakLoad').val()),
        importRate: parseFloat($('#importRate').val()),
        exportRate: parseFloat($('#exportRate').val()),
    };
    
    // Validate inputs
    if (!validateFormData(formData)) {
        return;
    }
    
    // Run simulation
    simulationResults = runDaySimulation(formData);
    
    // Display results
    displayResults(formData, simulationResults);
    
    // Show results section
    $('#resultsSection').fadeIn();
    
    // Show success message
    $('#formStatus').text('✓ Simulation complete!').fadeIn().delay(3000).fadeOut();
}

/**
 * Validate form data
 */
function validateFormData(data) {
    if (data.panels < 1 || data.panels > 100) {
        alert('Panels must be between 1 and 100');
        return false;
    }
    if (data.inverterSize < 1 || data.inverterSize > 50) {
        alert('Inverter size must be between 1 and 50 kW');
        return false;
    }
    if (data.batterySize < 0 || data.batterySize > 50) {
        alert('Battery size must be between 0 and 50 kWh');
        return false;
    }
    if (data.baseLoad < 0 || data.baseLoad > 10) {
        alert('Base load must be between 0 and 10 kW');
        return false;
    }
    if (data.peakLoad < 0 || data.peakLoad > 20) {
        alert('Peak load must be between 0 and 20 kW');
        return false;
    }
    return true;
}

/**
 * Run half-hourly simulation for a single day
 */
function runDaySimulation(config) {
    const solarProduction = getSolarProduction(config.date, config.panels);
    const results = [];
    
    let batteryCharge = config.batterySize * 0.5; // Start at 50% charge
    let totalCost = 0;
    let totalProduction = 0;
    let totalConsumption = 0;
    let totalImport = 0;
    let totalExport = 0;
    let totalSelfConsumed = 0;
    
    for (let slot = 0; slot < 48; slot++) {
        const hourOfDay = Math.floor(slot / 2);
        const isHalfHour = slot % 2 === 1;
        
        // Calculate load for this half-hour
        const isPeakHours = hourOfDay >= 7 && hourOfDay < 22;
        const load = (config.baseLoad + (isPeakHours ? config.peakLoad : 0)) * 0.5; // *0.5 for 30 mins
        
        // Get solar production for this slot (convert from kW to kWh for half-hour)
        const solarKWh = solarProduction[slot] * 0.5;
        
        // Energy balance calculation
        let gridImport = 0;
        let gridExport = 0;
        let batteryChargeDelta = 0;
        let selfConsumed = 0;
        
        const availableEnergy = solarKWh + batteryCharge;
        
        if (solarKWh >= load) {
            // Solar production exceeds load
            const surplus = solarKWh - load;
            selfConsumed = load;
            
            // Try to charge battery with surplus
            const maxBatteryCharge = config.batterySize - batteryCharge;
            const toCharge = Math.min(surplus, maxBatteryCharge);
            batteryChargeDelta = toCharge;
            
            // Export remainder to grid
            gridExport = surplus - toCharge;
        } else {
            // Load exceeds solar production
            selfConsumed = solarKWh;
            const deficit = load - solarKWh;
            
            // Try to discharge battery
            const availableBattery = batteryCharge;
            const fromBattery = Math.min(deficit, availableBattery);
            batteryChargeDelta = -fromBattery;
            
            // Import remainder from grid
            gridImport = deficit - fromBattery;
        }
        
        // Apply inverter limit
        gridImport = Math.min(gridImport, config.inverterSize * 0.5); // Half-hour limit
        gridExport = Math.min(gridExport, config.inverterSize * 0.5);
        
        // Update battery charge
        batteryCharge += batteryChargeDelta;
        batteryCharge = Math.max(0, Math.min(config.batterySize, batteryCharge));
        
        // Calculate costs
        const import_cost = gridImport * config.importRate;
        const export_credit = gridExport * config.exportRate;
        const netCost = import_cost - export_credit;
        
        // Accumulate totals
        totalProduction += solarKWh;
        totalConsumption += load;
        totalImport += gridImport;
        totalExport += gridExport;
        totalCost += netCost;
        totalSelfConsumed += selfConsumed;
        
        // Store result for this half-hour
        const time = `${String(hourOfDay).padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;
        results.push({
            time: time,
            slot: slot,
            solar: solarKWh,
            load: load,
            battery: batteryCharge,
            gridImport: gridImport,
            gridExport: gridExport,
            cost: netCost
        });
    }
    
    return {
        results: results,
        summary: {
            totalProduction: totalProduction,
            totalConsumption: totalConsumption,
            totalImport: totalImport,
            totalExport: totalExport,
            totalCost: totalCost,
            selfConsumptionRate: totalProduction > 0 ? (totalSelfConsumed / totalProduction) * 100 : 0
        }
    };
}

/**
 * Display simulation results on page
 */
function displayResults(config, data) {
    const summary = data.summary;
    
    // Update summary cards
    $('#totalProduction').text(summary.totalProduction.toFixed(2));
    $('#totalConsumption').text(summary.totalConsumption.toFixed(2));
    $('#gridImport').text(summary.totalImport.toFixed(2));
    $('#gridExport').text(summary.totalExport.toFixed(2));
    $('#totalCost').text('£' + summary.totalCost.toFixed(2));
    $('#selfConsumption').text(summary.selfConsumptionRate.toFixed(1) + '%');
    
    // Update detailed table
    const tbody = $('#detailTable');
    tbody.empty();
    
    data.results.forEach(result => {
        const row = `
            <tr>
                <td>${result.time}</td>
                <td>${result.solar.toFixed(3)}</td>
                <td>${result.load.toFixed(3)}</td>
                <td>${result.battery.toFixed(3)}</td>
                <td>${result.gridImport.toFixed(3)}</td>
                <td>${result.gridExport.toFixed(3)}</td>
                <td>£${result.cost.toFixed(3)}</td>
            </tr>
        `;
        tbody.append(row);
    });
    
    // Update charts
    updateCharts(data);
}

/**
 * Update charts with simulation data
 */
function updateCharts(data) {
    const slots = data.results.map((_, i) => {
        const hour = Math.floor(i / 2);
        const min = (i % 2) * 30;
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    });
    
    const solarData = data.results.map(r => (r.solar * 1000).toFixed(0)); // Convert to Wh for better scale
    const loadData = data.results.map(r => (r.load * 1000).toFixed(0));
    const batteryData = data.results.map(r => r.battery.toFixed(2));
    const gridImportData = data.results.map(r => (r.gridImport * 1000).toFixed(0));
    const gridExportData = data.results.map(r => (r.gridExport * 1000).toFixed(0));
    
    // Destroy existing charts if they exist
    if (energyChart) energyChart.destroy();
    if (batteryChart) batteryChart.destroy();
    
    // Energy flow chart
    const energyCtx = document.getElementById('energyChart').getContext('2d');
    energyChart = new Chart(energyCtx, {
        type: 'bar',
        data: {
            labels: slots,
            datasets: [
                {
                    label: 'Solar Production (Wh)',
                    data: solarData,
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.5)',
                    borderRadius: 0,
                    borderSkipped: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Load (Wh)',
                    data: loadData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    borderRadius: 0,
                    borderSkipped: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Grid Import (Wh)',
                    data: gridImportData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    borderRadius: 0,
                    borderSkipped: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Grid Export (Wh)',
                    data: gridExportData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.3)',
                    borderRadius: 0,
                    borderSkipped: false,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Energy (Wh)'
                    }
                }
            }
        }
    });
    
    // Battery & Grid chart
    const batteryCtx = document.getElementById('batteryChart').getContext('2d');
    batteryChart = new Chart(batteryCtx, {
        type: 'line',
        data: {
            labels: slots,
            datasets: [
                {
                    label: 'Battery Charge (kWh)',
                    data: batteryData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Battery Charge (kWh)'
                    },
                    min: 0
                }
            }
        }
    });
}

/**
 * Session Management Functions
 */

/**
 * Save current simulation to local storage
 */
function saveSession() {
    if (!simulationResults) {
        alert('No simulation to save. Please run a simulation first.');
        return;
    }
    
    const sessionName = prompt('Enter session name:', `Session ${new Date().toLocaleString()}`);
    if (!sessionName) return;
    
    const sessionData = {
        name: sessionName,
        timestamp: new Date().toISOString(),
        date: $('#date').val(),
        panels: parseInt($('#panels').val()),
        inverterSize: parseFloat($('#inverterSize').val()),
        batterySize: parseFloat($('#batterySize').val()),
        baseLoad: parseFloat($('#baseLoad').val()),
        peakLoad: parseFloat($('#peakLoad').val()),
        importRate: parseFloat($('#importRate').val()),
        exportRate: parseFloat($('#exportRate').val()),
        results: simulationResults
    };
    
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push(sessionData);
    localStorage.setItem('sessions', JSON.stringify(sessions));
    
    updateStorageInfo();
    alert('Session saved successfully!');
}

/**
 * Load a session from local storage
 */
function loadSession() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    
    if (sessions.length === 0) {
        alert('No saved sessions found.');
        return;
    }
    
    let sessionList = 'Available sessions:\n\n';
    sessions.forEach((session, index) => {
        sessionList += `${index + 1}. ${session.name} (${new Date(session.timestamp).toLocaleDateString()})\n`;
    });
    sessionList += '\nEnter session number (1-' + sessions.length + '):';
    
    const choice = prompt(sessionList);
    const sessionIndex = parseInt(choice) - 1;
    
    if (isNaN(sessionIndex) || sessionIndex < 0 || sessionIndex >= sessions.length) {
        alert('Invalid selection.');
        return;
    }
    
    const session = sessions[sessionIndex];
    
    // Restore form values
    $('#date').val(session.date);
    $('#panels').val(session.panels);
    $('#inverterSize').val(session.inverterSize);
    $('#batterySize').val(session.batterySize);
    $('#baseLoad').val(session.baseLoad);
    $('#peakLoad').val(session.peakLoad);
    $('#importRate').val(session.importRate);
    $('#exportRate').val(session.exportRate);
    
    // Restore results
    simulationResults = session.results;
    displayResults({
        date: new Date(session.date),
        panels: session.panels,
        inverterSize: session.inverterSize,
        batterySize: session.batterySize,
        baseLoad: session.baseLoad,
        peakLoad: session.peakLoad,
        importRate: session.importRate,
        exportRate: session.exportRate
    }, simulationResults);
    
    $('#resultsSection').fadeIn();
    alert('Session loaded successfully!');
}

/**
 * Clear all sessions
 */
function clearAllSessions() {
    if (confirm('Are you sure you want to delete all saved sessions? This cannot be undone.')) {
        localStorage.removeItem('sessions');
        updateStorageInfo();
        alert('All sessions cleared.');
    }
}

/**
 * Update storage information display
 */
function updateStorageInfo() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const sessionCount = sessions.length;
    
    // Estimate storage used
    const sessionDataStr = localStorage.getItem('sessions') || '';
    const storageUsedKB = (new TextEncoder().encode(sessionDataStr).length / 1024).toFixed(2);
    
    $('#sessionCount').text(sessionCount);
    $('#storageUsed').text(storageUsedKB);
    
    if (sessionCount > 0) {
        const sessionList = sessions.map((s, i) => 
            `${i + 1}. ${s.name} (${new Date(s.timestamp).toLocaleDateString()})`
        ).join(' | ');
        $('#sessionList').text(sessionList);
    } else {
        $('#sessionList').text('No sessions saved yet');
    }
}
