import express from 'express';
import { getRacesData, appConfig } from '../dataService.js';

const router = express.Router();

/**
 * STRATEGY ANALYZER ENGINE
 * Parses thousands of simulations to determine exact Strategy Signatures (Tire 1 -> L(x) Tire 2)
 * and ranks them by Win Rate and Average Finish Position. 
 */
router.post('/', (req, res) => {
    try {
        const { track, maxLaps, minLaps } = req.body;
        const allRaces = getRacesData();

        console.time('StrategyQuery');
        
        // 1. Filter races for the exact scenario 
        // e.g., "Suzuka runs where total_laps is 50"
        let validRaces = allRaces;
        if (track && track !== '') {
            validRaces = validRaces.filter(r => r.race_config.track === track);
        }
        if (maxLaps) {
            validRaces = validRaces.filter(r => r.race_config.total_laps <= maxLaps);
        }
        if (minLaps) {
            validRaces = validRaces.filter(r => r.race_config.total_laps >= minLaps);
        }

        const strategyMetrics = {};
        let totalGridSlotsAnalyzed = 0;

        // 2. Build the Strategy Signature for every single car in those valid races
        validRaces.forEach(race => {
            const drivers = Object.values(race.strategies);
            const finishingOrder = race.finishing_positions;

            drivers.forEach(driver => {
                totalGridSlotsAnalyzed++;
                
                // Determine their exact finish position (1-indexed)
                const finishPos = finishingOrder.indexOf(driver.driver_id) + 1;
                const isWin = finishPos === 1;
                const isTop5 = finishPos <= 5;

                // Build Signature string: "START:SOFT -> L14:MEDIUM"
                let signature = `START:${driver.starting_tire}`;
                if (driver.pit_stops && driver.pit_stops.length > 0) {
                     // Sort pit stops chronologically by lap
                     const sortedStops = [...driver.pit_stops].sort((a,b) => a.lap - b.lap);
                     sortedStops.forEach(stop => {
                         signature += ` -> L${stop.lap}:${stop.to_tire}`;
                     });
                }

                // Create a strict scenario hash so we only compare identical race conditions
                const { track, total_laps, track_temp, base_lap_time } = race.race_config;
                const scenarioHash = `${track}_${total_laps}_${track_temp}_${base_lap_time}`;
                const groupingKey = `${scenarioHash}:::${signature}`;

                // Initialize or aggregate metrics for this unique scenario+signature
                if (!strategyMetrics[groupingKey]) {
                    strategyMetrics[groupingKey] = {
                        signature: signature,
                        scenario: race.race_config,
                        raceIds: new Set(),
                        timesUsed: 0,
                        wins: 0,
                        top5s: 0,
                        totalFinishPositions: 0
                    };
                }

                const s = strategyMetrics[groupingKey];
                s.timesUsed += 1;
                s.raceIds.add(race.race_id);
                if (isWin) s.wins += 1;
                if (isTop5) s.top5s += 1;
                s.totalFinishPositions += finishPos;
            });
        });

        // 3. Calculate final rates and sort to find the "Dominant" strategy
        const leaderboard = Object.values(strategyMetrics).map(s => {
            return {
                signature: s.signature,
                scenario: s.scenario,
                raceIds: Array.from(s.raceIds),
                timesUsed: s.timesUsed,
                useRate: (s.timesUsed / totalGridSlotsAnalyzed) * 100,
                wins: s.wins,
                winRate: s.timesUsed > 0 ? (s.wins / s.timesUsed) * 100 : 0,
                top5Rate: s.timesUsed > 0 ? (s.top5s / s.timesUsed) * 100 : 0,
                avgFinish: s.timesUsed > 0 ? (s.totalFinishPositions / s.timesUsed) : 20 
            };
        });

        // Sort primarily by Win Rate, then by Average Finish, prioritizing reliability
        leaderboard.sort((a, b) => {
             if (b.winRate !== a.winRate) return b.winRate - a.winRate;
             if (b.timesUsed !== a.timesUsed) return b.timesUsed - a.timesUsed; 
             return a.avgFinish - b.avgFinish;
        });

        console.timeEnd('StrategyQuery');

        // Apply config limits to stop huge DOM payloads if there are thousands of unique 1-off strategies
        const limit = appConfig.maxResponseLimit === 'unlimited' ? Infinity : Number(appConfig.maxResponseLimit);
        const returnedLeaderboard = leaderboard.slice(0, Math.max(limit, 100)); // guarantee at least top 100

        res.json({
            success: true,
            totalRacesAnalyzed: validRaces.length,
            totalGridSlotsAnalyzed,
            uniqueStrategiesFound: leaderboard.length,
            leaderboard: returnedLeaderboard
        });

    } catch (err) {
        console.error('Strategy Analyzer error:', err);
        res.status(500).json({ error: 'Internal server error while ranking strategies' });
    }
});

router.post('/drilldown', (req, res) => {
    try {
        const { raceIds } = req.body;
        if (!raceIds || !Array.isArray(raceIds)) {
            return res.status(400).json({ error: 'Invalid or missing raceIds array' });
        }
        const allRaces = getRacesData();
        const races = allRaces.filter(r => raceIds.includes(r.race_id));
        res.json({ success: true, races });
    } catch (err) {
        console.error('Drilldown error:', err);
        res.status(500).json({ error: 'Internal server error during drilldown' });
    }
});

export default router;
