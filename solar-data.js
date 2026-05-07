/**
 * Solar Tariff Simulator - Solar Production Data
 * 
 * Hardcoded London sun availability data with interpolation
 * Can be replaced with external API later (weather service, real data, etc.)
 */

// Typical daily solar irradiance patterns for London
// 12 reference days (monthly) with 48 half-hourly slots
// Values represent average irradiance in W/m² (350W panels typically receive ~180-200 W/m² at peak)

const londonSolarData = {
    // January - Low sun angle
    1: [
        0, 0, 0, 0, 0, 0, 0, 5, 25, 50, 80, 100, 110, 100, 80, 50, 25, 5, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 5, 25, 50, 80, 100, 110, 100, 80, 50, 25, 5, 0, 0, 0, 0, 0, 0
    ],
    // February - Improving
    2: [
        0, 0, 0, 0, 0, 0, 0, 10, 35, 70, 110, 140, 160, 140, 110, 70, 35, 10, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 10, 35, 70, 110, 140, 160, 140, 110, 70, 35, 10, 0, 0, 0, 0, 0, 0
    ],
    // March - Spring equinox
    3: [
        0, 0, 0, 0, 0, 0, 5, 30, 80, 140, 180, 210, 220, 210, 180, 140, 80, 30, 5, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 5, 30, 80, 140, 180, 210, 220, 210, 180, 140, 80, 30, 5, 0, 0, 0, 0, 0
    ],
    // April - Good spring sun
    4: [
        0, 0, 0, 0, 0, 0, 10, 50, 110, 170, 220, 260, 280, 260, 220, 170, 110, 50, 10, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 10, 50, 110, 170, 220, 260, 280, 260, 220, 170, 110, 50, 10, 0, 0, 0, 0, 0
    ],
    // May - High sun angle
    5: [
        0, 0, 0, 0, 0, 5, 30, 80, 140, 200, 250, 290, 310, 290, 250, 200, 140, 80, 30, 5, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 5, 30, 80, 140, 200, 250, 290, 310, 290, 250, 200, 140, 80, 30, 5, 0, 0, 0, 0
    ],
    // June - Summer solstice (longest day)
    6: [
        0, 0, 0, 0, 0, 20, 60, 120, 180, 240, 290, 330, 350, 330, 290, 240, 180, 120, 60, 20, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 20, 60, 120, 180, 240, 290, 330, 350, 330, 290, 240, 180, 120, 60, 20, 0, 0, 0, 0
    ],
    // July - Still high
    7: [
        0, 0, 0, 0, 0, 15, 55, 115, 175, 235, 280, 320, 340, 320, 280, 235, 175, 115, 55, 15, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 15, 55, 115, 175, 235, 280, 320, 340, 320, 280, 235, 175, 115, 55, 15, 0, 0, 0, 0
    ],
    // August - Descending summer
    8: [
        0, 0, 0, 0, 0, 10, 45, 100, 155, 210, 260, 300, 320, 300, 260, 210, 155, 100, 45, 10, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 10, 45, 100, 155, 210, 260, 300, 320, 300, 260, 210, 155, 100, 45, 10, 0, 0, 0, 0
    ],
    // September - Autumn equinox
    9: [
        0, 0, 0, 0, 0, 0, 25, 70, 120, 170, 210, 240, 250, 240, 210, 170, 120, 70, 25, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 25, 70, 120, 170, 210, 240, 250, 240, 210, 170, 120, 70, 25, 0, 0, 0, 0, 0
    ],
    // October - Declining autumn
    10: [
        0, 0, 0, 0, 0, 0, 10, 45, 90, 135, 165, 185, 190, 185, 165, 135, 90, 45, 10, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 10, 45, 90, 135, 165, 185, 190, 185, 165, 135, 90, 45, 10, 0, 0, 0, 0, 0
    ],
    // November - Winter approaching
    11: [
        0, 0, 0, 0, 0, 0, 0, 15, 50, 85, 120, 140, 145, 140, 120, 85, 50, 15, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 15, 50, 85, 120, 140, 145, 140, 120, 85, 50, 15, 0, 0, 0, 0, 0, 0
    ],
    // December - Winter solstice (shortest day)
    12: [
        0, 0, 0, 0, 0, 0, 0, 5, 20, 40, 65, 80, 85, 80, 65, 40, 20, 5, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 5, 20, 40, 65, 80, 85, 80, 65, 40, 20, 5, 0, 0, 0, 0, 0, 0
    ]
};

/**
 * Get solar production for a specific date
 * Scales based on number of panels (each panel = 350W)
 * 
 * @param {Date} date - The date to get solar data for
 * @param {number} panelCount - Number of 350W panels
 * @returns {Array} Array of 48 half-hourly solar production values in kW
 */
function getSolarProduction(date, panelCount) {
    const month = date.getMonth() + 1; // 1-12
    const dayOfMonth = date.getDate();
    
    // Get reference months before and after
    const monthBefore = month === 1 ? 12 : month - 1;
    const monthAfter = month === 12 ? 1 : month + 1;
    
    // Get data for interpolation (reference days are 1st, 8th, 15th, 22nd of each month)
    const dataBefore = londonSolarData[monthBefore];
    const dataAfter = londonSolarData[monthAfter];
    
    // Simple interpolation: treat each month as 30 days
    // Day 1-15 interpolates between previous and current month
    // Day 16-30 interpolates between current and next month
    
    let baseData;
    let interpolationFactor;
    
    if (dayOfMonth <= 15) {
        // Interpolate between previous month and current month
        baseData = londonSolarData[monthBefore];
        const nextData = londonSolarData[month];
        interpolationFactor = dayOfMonth / 15; // 0 = full prev month, 1 = full curr month
        
        // Linear interpolation between two datasets
        baseData = baseData.map((val, i) => {
            return val + (nextData[i] - val) * interpolationFactor;
        });
    } else {
        // Interpolate between current month and next month
        baseData = londonSolarData[month];
        const nextData = londonSolarData[monthAfter];
        interpolationFactor = (dayOfMonth - 15) / 15; // 0 = full curr month, 1 = full next month
        
        // Linear interpolation between two datasets
        baseData = baseData.map((val, i) => {
            return val + (nextData[i] - val) * interpolationFactor;
        });
    }
    
    // Convert from W/m² to kW for the panel array
    // Typical 350W panel in full sun produces 350W
    // We scale by irradiance and number of panels
    // Divide by 1000 to convert to kW, multiply by panel count, divide by 1000 W per full panel
    const panelPowerKW = panelCount * 0.35; // Each panel is 350W = 0.35kW
    
    // Scale irradiance data (normalized to ~1000 W/m² at peak) to actual power output
    // Peak irradiance in our data is ~350 W/m², so we scale by panelPowerKW / 350 * 1000 / 1000
    const scaleFactor = panelPowerKW / 350; // Convert normalized irradiance to actual kW
    
    // Apply scale factor and add weather variation (optional - can add random variation here)
    const production = baseData.map(irradiance => (irradiance * scaleFactor) / 1000);
    
    return production;
}

/**
 * Optional: Add weather variation (clouds, etc.)
 * This could be replaced with real weather API data
 * 
 * @param {Date} date - The date
 * @returns {number} Weather factor (0.5 = cloudy, 1.0 = clear skies)
 */
function getWeatherFactor(date) {
    // Placeholder: return clear skies
    // In future, call weather API to get actual cloud cover
    return 1.0;
}
