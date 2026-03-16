import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { loadData } from './dataService.js';
import searchRoutes from './routes/search.js';
import compareRoutes from './routes/compare.js';
import statsRoutes from './routes/stats.js';
import configRoutes from './routes/config.js';
import strategyRoutes from './routes/strategy.js';
import stintsRoutes from './routes/stints.js';
import simulatorRoutes from './routes/simulator.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Vercel handles the listener and port binding
// We await data load on cold boot before serving requests
let dataLoaded = false;

app.use(async (req, res, next) => {
    if (!dataLoaded) {
        console.log('Cold start initialization...');
        try {
            await loadData();
            dataLoaded = true;
        } catch (err) {
            console.error('Failed to load data:', err);
            return res.status(500).json({ error: 'Server initialization failed' });
        }
    }
    next();
});

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/stints', stintsRoutes);
app.use('/api/simulator', simulatorRoutes);

export default app;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, () => {
        console.log(`Local development server running on port ${PORT}`);
    });
}
