import express from 'express';
import { getRacesData, appConfig } from '../dataService.js';

const router = express.Router();

/**
 * Filter Engine
 * payload structure:
 * {
 *   raceConditions: [ { field, operator, value }, ... ],
 *   driverConditionsSets: [
 *     [ { field, operator, value }, ... ], // Driver 1 conditions
 *     [ { field, operator, value }, ... ]  // Driver 2 conditions
 *   ]
 * }
 */
const evaluateCondition = (dataValue, operator, queryValue) => {
    if (dataValue === undefined || dataValue === null) return false;
    
    // Attempt numeric conversion for comparisons
    const numData = Number(dataValue);
    const numQuery = Number(queryValue);
    const isNumeric = !isNaN(numData) && !isNaN(numQuery);

    switch (operator) {
        case 'equals':
            return isNumeric ? numData === numQuery : String(dataValue).toLowerCase() === String(queryValue).toLowerCase();
        case 'not_equals':
            return isNumeric ? numData !== numQuery : String(dataValue).toLowerCase() !== String(queryValue).toLowerCase();
        case 'contains':
            return String(dataValue).toLowerCase().includes(String(queryValue).toLowerCase());
        case 'greater_than':
            return isNumeric ? numData > numQuery : false;
        case 'less_than':
            return isNumeric ? numData < numQuery : false;
        default:
            return false;
    }
};

router.post('/', (req, res) => {
    try {
        const { raceConditions = [], driverConditionsSets = [], matchLogic = 'ALL' } = req.body;
        const allRaces = getRacesData();

        console.time('SearchQuery');
        
        const results = [];
        let totalMatchedRaces = 0;

        for (const race of allRaces) {
            // 1. Check Race Conditions
            let raceMatches = true;
            for (const cond of raceConditions) {
                if (!evaluateCondition(race.race_config[cond.field], cond.operator, cond.value)) {
                    raceMatches = false;
                    break;
                }
            }

            if (!raceMatches) continue;

            // 2. Check Driver Conditions Sets
            const drivers = Object.values(race.strategies);
            
            if (driverConditionsSets.length === 0) {
                 // No driver conditions, add race
                 const limit = appConfig.maxResponseLimit === 'unlimited' ? Infinity : Number(appConfig.maxResponseLimit);
                 if (results.length < limit) {
                     results.push({
                         race_id: race.race_id,
                         race_config: race.race_config,
                         matched_drivers: drivers.map(d => d.driver_id),
                         finishing_positions: race.finishing_positions
                     });
                 }
                 totalMatchedRaces++;
                 continue;
            }

            // We need to find distinct drivers that satisfy EACH condition set.
            // A simple approach is finding permutations/assignments, but we can do greedy 
            // if we assume driver sets don't overlap in requirements, or a back-tracking search 
            // for perfect matching. For performance, we'll try a greedy match:
            let satisfiedSets = 0;
            const usedDrivers = new Set();
            const raceMatchedDrivers = [];

            for (const condSet of driverConditionsSets) {
                let foundGlobal = false;
                for (const driver of drivers) {
                    if (usedDrivers.has(driver.driver_id)) continue;
                    
                    let driverMatches = true;
                    for (const cond of condSet) {
                        // Special handling for pit stops if needed: e.g. "pit_stops_count"
                        let val = driver[cond.field];
                        if (cond.field === 'pit_stops_count') {
                            val = driver.pit_stops ? driver.pit_stops.length : 0;
                        } else if (cond.field === 'pit_stop_tire') {
                            const hasTire = driver.pit_stops && driver.pit_stops.some(p => p.to_tire === cond.value);
                            val = hasTire ? cond.value : undefined;
                        } else if (cond.field === 'finishing_position') {
                            const pos = race.finishing_positions.indexOf(driver.driver_id) + 1;
                            if (!pos || !evaluateCondition(pos, cond.operator, cond.value)) {
                                driverMatches = false;
                                break;
                            }
                            continue;
                        } else if (cond.field === 'pit_stop_lap') {
                            const matchedLap = driver.pit_stops && driver.pit_stops.some(p => evaluateCondition(p.lap, cond.operator, cond.value));
                            if (!matchedLap) {
                                driverMatches = false;
                                break;
                            }
                            continue;
                        } else if (cond.field === 'pit_stop_event') {
                            const targetTire = cond.value2;
                            const matchedEvent = driver.pit_stops && driver.pit_stops.some(p => {
                                const lapMatches = evaluateCondition(p.lap, cond.operator, cond.value);
                                const tireMatches = !targetTire || p.to_tire === targetTire;
                                return lapMatches && tireMatches;
                            });
                            if (!matchedEvent) {
                                driverMatches = false;
                                break;
                            }
                            continue;
                        }

                        if (!evaluateCondition(val, cond.operator, cond.value)) {
                            driverMatches = false;
                            break;
                        }
                    }

                    if (driverMatches) {
                        usedDrivers.add(driver.driver_id);
                        raceMatchedDrivers.push(driver.driver_id);
                        satisfiedSets++;
                        foundGlobal = true;
                        break; // Move to next condition set
                    }
                }
                
                // If a required driver condition set couldn't be satisfied, this race fails if logic is ALL
                if (!foundGlobal && matchLogic === 'ALL') break;
            }

            const isValidRace = matchLogic === 'ALL'
                ? (satisfiedSets === driverConditionsSets.length)
                : (satisfiedSets > 0);

            if (isValidRace) {
                totalMatchedRaces++;
                // Limit response size slightly for extreme queries, or send full
                // Since user wants great visualization, we send a summary or top 1000
                const limit = appConfig.maxResponseLimit === 'unlimited' ? Infinity : Number(appConfig.maxResponseLimit);
                if (results.length < limit) {
                    results.push({
                        race_id: race.race_id,
                        race_config: race.race_config,
                        matched_drivers: raceMatchedDrivers, // The specific drivers that triggered the match
                        finishing_positions: race.finishing_positions
                    });
                }
            }
        }

        console.timeEnd('SearchQuery');

        res.json({
            success: true,
            totalMatchedRaces,
            returnedResults: results.length,
            data: results
        });

    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
