import express from 'express';
import { getRacesData } from '../dataService.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const allRaces = getRacesData();

        console.time('StatsQuery');
        
        let totalRaces = allRaces.length;
        const tracks = new Set();
        const gridPositions = new Set();
        
        // Aggregations
        const trackDistribution = {};
        const gridPositionWins = {};
        const tireStartingPreference = {};
        let totalLapsSimulated = 0;

        for (const race of allRaces) {
            // Track Configurations
            const trackName = race.race_config.track;
            tracks.add(trackName);
            trackDistribution[trackName] = (trackDistribution[trackName] || 0) + 1;
            totalLapsSimulated += race.race_config.total_laps;

            // Drivers and Wins
            const winner = race.finishing_positions[0];
            gridPositionWins[winner] = (gridPositionWins[winner] || 0) + 1;
            
            Object.values(race.strategies).forEach(st => {
               gridPositions.add(st.driver_id);
               // Tire Prefs
               tireStartingPreference[st.starting_tire] = (tireStartingPreference[st.starting_tire] || 0) + 1;
            });
        }

        // Format outputs for Recharts
        const trackDistArray = Object.keys(trackDistribution).map(k => ({ name: k, count: trackDistribution[k] })).sort((a,b) => b.count - a.count);
        
        const topGridPositionWins = Object.keys(gridPositionWins)
            // Convert 'D001' to 'P1', etc.
            .map(k => {
                const pos = k.replace('D', 'P').replace(/^P0+/, 'P');
                return { position: pos, wins: gridPositionWins[k] };
            })
            .sort((a, b) => b.wins - a.wins);

        const tirePrefsArray = Object.keys(tireStartingPreference)
            .map(k => ({ name: k, value: tireStartingPreference[k] }));

        console.timeEnd('StatsQuery');

        res.json({
            success: true,
            overview: {
                totalRaces,
                totalPositionsTracked: gridPositions.size,
                uniqueTracks: tracks.size,
                totalLapsSimulated
            },
            charts: {
                trackDistribution: trackDistArray,
                gridLeaderboard: topGridPositionWins,
                tirePreferences: tirePrefsArray
            }
        });

    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
