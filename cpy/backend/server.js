import express from 'express';
import cors from 'cors';
import { loadData } from './dataService.js';
import searchRoutes from './routes/search.js';
import compareRoutes from './routes/compare.js';
import statsRoutes from './routes/stats.js';
import configRoutes from './routes/config.js';
import strategyRoutes from './routes/strategy.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/strategy', strategyRoutes);

// Load data into memory before starting server
console.log('Starting server initialization...');
loadData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to load data:', err);
    process.exit(1);
});
