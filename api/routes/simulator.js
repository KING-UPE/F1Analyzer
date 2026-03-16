import express from 'express';
import { getRacesData } from '../dataService.js';

const router = express.Router();

function simulateSingleRace(raceData, constants) {
    const trackTemp = raceData.race_config.track_temp;
    const basePace = raceData.race_config.base_lap_time;
    const totalLaps = raceData.race_config.total_laps;
    const pitPenalty = raceData.race_config.pit_lane_time;
    const C = constants;
    
    const drivers = Object.values(raceData.strategies).map(d => ({
        id: d.driver_id,
        currentTire: d.starting_tire,
        tireAge: 1,
        totalTime: 0,
        pitStops: d.pit_stops || [],
        nextPitIndex: 0
    }));

    drivers.forEach(d => {
        d.pitMap = {};
        d.pitStops.forEach(stop => {
            d.pitMap[stop.lap] = stop.to_tire;
        });
    });

    for (let lap = 1; lap <= totalLaps; lap++) {
        drivers.forEach(driver => {
            let speedOffset = 0; let degRate = 0; let window = 0;
            switch (driver.currentTire) {
                case 'SOFT': speedOffset = C.SOFT_SPEED; degRate = C.SOFT_DEG; window = C.SOFT_WINDOW; break;
                case 'MEDIUM': speedOffset = C.MEDIUM_SPEED; degRate = C.MEDIUM_DEG; window = C.MEDIUM_WINDOW; break;
                case 'HARD': speedOffset = C.HARD_SPEED; degRate = C.HARD_DEG; window = C.HARD_WINDOW; break;
                case 'INTERMEDIATE': speedOffset = C.INTERMEDIATE_SPEED; degRate = C.INTERMEDIATE_DEG; window = C.INTERMEDIATE_WINDOW; break;
                case 'WET': speedOffset = C.WET_SPEED; degRate = C.WET_DEG; window = C.WET_WINDOW; break;
            }

            const tempModifier = 1 + ((trackTemp - C.NOMINAL_TEMP) * C.TEMP_SENSITIVITY);
            const effectiveAge = Math.max(0, driver.tireAge - window);
            const degradationEffect = (effectiveAge * degRate) * tempModifier;
            
            const lapTime = basePace + speedOffset + degradationEffect;
            driver.totalTime += lapTime;

            if (driver.pitMap[lap]) {
                driver.totalTime += pitPenalty;
                driver.currentTire = driver.pitMap[lap];
                driver.tireAge = 1; 
            } else {
                driver.tireAge++; 
            }
        });
    }

    const predictedOrder = [...drivers].sort((a, b) => {
        if (Math.abs(a.totalTime - b.totalTime) < 0.0001) return a.id.localeCompare(b.id);
        return a.totalTime - b.totalTime;
    });

    const actualOrder = raceData.finishing_positions;
    let exactMatches = 0;
    const matchData = [];

    for (let i = 0; i < 20; i++) {
        const predId = predictedOrder[i].id;
        const actId = actualOrder[i];
        const isMatch = predId === actId;
        
        if (isMatch) exactMatches++;
        matchData.push({
            position: i + 1,
            predicted: predId,
            actual: actId,
            isMatch: isMatch,
            predictedTime: predictedOrder[i].totalTime
        });
    }

    return { exactMatches, matchData, totalDrivers: 20 };
}

/**
 * PARAMETRIC RACE SIMULATOR
 * Re-runs historic races lap-by-lap using arbitrary physics constraints.
 * Supports a single raceId or a range between raceIdStart and raceIdEnd.
 */
router.post('/', (req, res) => {
    try {
        const { raceId, raceIdStart, raceIdEnd, constants } = req.body;
        
        const start = raceIdStart || raceId;
        const end = raceIdEnd || start;

        if (!start || !constants) {
            return res.status(400).json({ error: 'Missing raceIdStart or constants payload' });
        }

        const allRaces = getRacesData();
        
        // Parse and validate range (Strip non-numeric characters like 'R')
        let startNum = parseInt(start.replace(/\D/g, ''), 10);
        let endNum = parseInt(end.replace(/\D/g, ''), 10);
        
        if (isNaN(startNum)) startNum = 1;
        if (isNaN(endNum)) endNum = startNum;
        
        // Swap if reversed
        if (startNum > endNum) {
            const temp = startNum; startNum = endNum; endNum = temp;
        }

        // Filter the requested subset in memory
        const targetRaces = allRaces.filter(r => {
            const num = parseInt(r.race_id.replace(/\D/g, ''), 10);
            return num >= startNum && num <= endNum;
        });

        if (targetRaces.length === 0) {
            return res.status(404).json({ error: 'No races found in range' });
        }

        console.time(`Simulating Range ${startNum}-${endNum}`);
        let totalExactMatches = 0;
        let totalDrivers = 0;
        let lastMatchData = null;
        const batchData = [];

        // Execute sequentially
        for (const raceData of targetRaces) {
            const simRes = simulateSingleRace(raceData, constants);
            totalExactMatches += simRes.exactMatches;
            totalDrivers += simRes.totalDrivers;
            lastMatchData = simRes.matchData;
            
            if (targetRaces.length > 1) {
                batchData.push({
                    raceId: raceData.race_id,
                    accuracy: (simRes.exactMatches / simRes.totalDrivers) * 100
                });
            }
        }
        
        console.timeEnd(`Simulating Range ${startNum}-${endNum}`);

        res.json({
            success: true,
            isRange: targetRaces.length > 1,
            raceId: targetRaces.length === 1 ? targetRaces[0].race_id : null,
            rangeStart: startNum,
            rangeEnd: endNum,
            racesCount: targetRaces.length,
            accuracy: (totalExactMatches / totalDrivers) * 100,
            results: targetRaces.length === 1 ? lastMatchData : null,
            batchData: targetRaces.length > 1 ? batchData : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Simulation server error' });
    }
});

export default router;
