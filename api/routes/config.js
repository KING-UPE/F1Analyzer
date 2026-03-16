import express from 'express';
import { appConfig, updateConfig, flushCache } from '../dataService.js';

const router = express.Router();

// GET current configuration
router.get('/', (req, res) => {
    res.json({
        success: true,
        config: appConfig
    });
});

// POST to update configuration
router.post('/', (req, res) => {
    try {
        const { maxResponseLimit } = req.body;
        
        if (maxResponseLimit) {
            updateConfig({ maxResponseLimit });
        }

        res.json({
            success: true,
            config: appConfig,
            message: 'Configuration updated successfully'
        });
    } catch (err) {
        console.error('Config update error:', err);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// POST to flush memory cache
router.post('/flush', async (req, res) => {
    try {
        await flushCache();
        res.json({
            success: true,
            message: 'Memory cache flushed and reloaded successfully'
        });
    } catch (err) {
        console.error('Cache flush error:', err);
        res.status(500).json({ error: 'Failed to flush cache' });
    }
});

export default router;
