/**
 * Prediction Routes
 */

const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');
const auth = require('../middleware/auth');

// POST /api/predict (protected)
router.post('/', auth, predictController.predict);

// GET /api/predict/history (protected)
router.get('/history', auth, predictController.getHistory);

module.exports = router;
