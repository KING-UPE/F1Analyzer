import express from 'express';
// Assuming the frontend makes two separate /api/search requests for comparing Side-by-Side.
// This route can be used later for more advanced specific comparative analytics if needed.
const router = express.Router();

router.post('/', (req, res) => {
    res.json({ message: "Use /api/search twice from frontend for side-by-side comparison." });
});

export default router;
