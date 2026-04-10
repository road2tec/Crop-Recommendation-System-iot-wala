/**
 * Weather Routes
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather - Current weather
router.get('/', weatherController.getWeather);

// GET /api/weather/forecast - 5-day forecast
router.get('/forecast', weatherController.getForecast);

// GET /api/weather/historical - 24h historical data
router.get('/historical', weatherController.getHistorical);

module.exports = router;
