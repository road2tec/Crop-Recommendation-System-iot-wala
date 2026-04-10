/**
 * Crop Routes
 * Public routes for crop information
 */

const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');

// Get all crops (with optional filtering)
router.get('/', cropController.getAllCrops);

// Get available seasons
router.get('/seasons', cropController.getSeasons);

// Get crop catalog built from dataset (22 crops)
router.get('/catalog', cropController.getCropCatalog);

// Get one crop from catalog
router.get('/catalog/:name', cropController.getCropCatalogByName);

// Search crops
router.get('/search', cropController.searchCrops);

// Get specific crop by name
router.get('/:name', cropController.getCropByName);

module.exports = router;
