import express from 'express';
import { getRacesData, appConfig } from '../dataService.js';

const router = express.Router();

/**
 * TIRE DEGRADATION & STINT PROFILER
 * Extracts individual tire stints from all 30,000 simulations.
 * Calculates optimal pitting windows and builds scattered plotting data 
 * against Track Temperatures.
 */
router.post('/', (req, res) => {
    try {
        const { track } = req.body;
        const allRaces = getRacesData();

        console.time('StintQuery');
        
        // Filter by track if requested
        let validRaces = allRaces;
        if (track && track !== '') {
            validRaces = validRaces.filter(r => r.race_config.track === track);
        }

        // We will store aggregated stint data categorized by compound
        // compound -> temp -> { totalLaps: X, count: Y, podiumTotalLaps: Z, podiumCount: W }
        const compoundMetrics = {
            SOFT: {},
            MEDIUM: {},
            HARD: {},
            INTERMEDIATE: {},
            WET: {}
        };

        let totalStintsAnalyzed = 0;

        validRaces.forEach(race => {
            const temp = race.race_config.track_temp;
            const totalLaps = race.race_config.total_laps;
            const drivers = Object.values(race.strategies);
            const finishingOrder = race.finishing_positions;

            drivers.forEach(driver => {
                const finishPos = finishingOrder.indexOf(driver.driver_id) + 1;
                const isPodium = finishPos <= 3;
                
                let currentLap = 1;
                let currentTire = driver.starting_tire;

                if (driver.pit_stops && driver.pit_stops.length > 0) {
                    const sortedStops = [...driver.pit_stops].sort((a,b) => a.lap - b.lap);
                    
                    sortedStops.forEach(stop => {
                        const stintLength = stop.lap - currentLap;
                        if (stintLength > 0 && compoundMetrics[currentTire]) {
                            if (!compoundMetrics[currentTire][temp]) {
                                compoundMetrics[currentTire][temp] = { totalLaps: 0, count: 0, podiumTotalLaps: 0, podiumCount: 0 };
                            }
                            compoundMetrics[currentTire][temp].totalLaps += stintLength;
                            compoundMetrics[currentTire][temp].count += 1;
                            
                            if (isPodium) {
                                compoundMetrics[currentTire][temp].podiumTotalLaps += stintLength;
                                compoundMetrics[currentTire][temp].podiumCount += 1;
                            }
                            totalStintsAnalyzed++;
                        }
                        currentLap = stop.lap;
                        currentTire = stop.to_tire;
                    });
                }
                
                // Final stint
                const finalStintLength = totalLaps - currentLap + 1;
                if (finalStintLength > 0 && compoundMetrics[currentTire]) {
                    if (!compoundMetrics[currentTire][temp]) {
                        compoundMetrics[currentTire][temp] = { totalLaps: 0, count: 0, podiumTotalLaps: 0, podiumCount: 0 };
                    }
                    compoundMetrics[currentTire][temp].totalLaps += finalStintLength;
                    compoundMetrics[currentTire][temp].count += 1;
                    
                    if (isPodium) {
                        compoundMetrics[currentTire][temp].podiumTotalLaps += finalStintLength;
                        compoundMetrics[currentTire][temp].podiumCount += 1;
                    }
                    totalStintsAnalyzed++;
                }
            });
        });

        // Format data for Recharts (Array of objects sorted by Track Temp)
        // e.g. [ { temp: 20, SOFT: 14.5, SOFT_podium: 15.2, MEDIUM: 25.1, ... }, { temp: 21, ... } ]
        
        const tempSet = new Set();
        Object.keys(compoundMetrics).forEach(compound => {
            Object.keys(compoundMetrics[compound]).forEach(t => tempSet.add(Number(t)));
        });

        const sortedTemps = Array.from(tempSet).sort((a,b) => a - b);
        
        const chartData = sortedTemps.map(temp => {
            const dataPoint = { temp };
            Object.keys(compoundMetrics).forEach(compound => {
                const metrics = compoundMetrics[compound][temp];
                if (metrics && metrics.count > 0) {
                    dataPoint[compound] = metrics.totalLaps / metrics.count;
                } else {
                    dataPoint[compound] = null;
                }
                
                if (metrics && metrics.podiumCount > 0) {
                    dataPoint[`${compound}_podium`] = metrics.podiumTotalLaps / metrics.podiumCount;
                } else {
                    dataPoint[`${compound}_podium`] = null;
                }
            });
            return dataPoint;
        });

        // Global Averages mapping
        const globalAverages = {};
        Object.keys(compoundMetrics).forEach(compound => {
             let gTotalLaps = 0;
             let gCount = 0;
             let gPodiumLaps = 0;
             let gPodiumCount = 0;
             
             Object.values(compoundMetrics[compound]).forEach(m => {
                 gTotalLaps += m.totalLaps;
                 gCount += m.count;
                 gPodiumLaps += m.podiumTotalLaps;
                 gPodiumCount += m.podiumCount;
             });
             
             globalAverages[compound] = {
                 avgLifespan: gCount > 0 ? (gTotalLaps / gCount) : 0,
                 optimalLifespan: gPodiumCount > 0 ? (gPodiumLaps / gPodiumCount) : 0,
                 sampleSize: gCount
             };
        });

        console.timeEnd('StintQuery');

        res.json({
            success: true,
            totalRacesAnalyzed: validRaces.length,
            totalStintsAnalyzed,
            chartData,
            globalAverages
        });

    } catch (err) {
        console.error('Stint Profiler error:', err);
        res.status(500).json({ error: 'Internal server error while extracting stints' });
    }
});

export default router;
