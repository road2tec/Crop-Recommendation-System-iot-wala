/**
 * Crop Controller - Handle crop information requests
 */

const Crop = require('../models/Crop');
const fs = require('fs');
const path = require('path');

const DATASET_PATH = path.join(__dirname, '..', '..', 'Crop_recommendation.csv');

const formatDisplayName = (name) => {
  if (!name) return '';
  if (name.toLowerCase() === 'kidneybeans') return 'Kidney Beans';
  if (name.toLowerCase() === 'mothbeans') return 'Moth Beans';
  if (name.toLowerCase() === 'mungbean') return 'Mung Bean';
  if (name.toLowerCase() === 'pigeonpeas') return 'Pigeon Peas';
  if (name.toLowerCase() === 'blackgram') return 'Black Gram';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const buildCatalogFromDataset = () => {
  const raw = fs.readFileSync(DATASET_PATH, 'utf-8').trim();
  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const idx = {
    N: header.indexOf('N'),
    P: header.indexOf('P'),
    K: header.indexOf('K'),
    temperature: header.indexOf('temperature'),
    humidity: header.indexOf('humidity'),
    ph: header.indexOf('ph'),
    rainfall: header.indexOf('rainfall'),
    label: header.indexOf('label')
  };

  const grouped = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(',').map((v) => v.trim());
    const label = row[idx.label];
    if (!label) continue;

    if (!grouped.has(label)) {
      grouped.set(label, {
        count: 0,
        N: 0,
        P: 0,
        K: 0,
        temperature: 0,
        humidity: 0,
        ph: 0,
        rainfall: 0
      });
    }

    const item = grouped.get(label);
    item.count += 1;
    item.N += Number(row[idx.N]) || 0;
    item.P += Number(row[idx.P]) || 0;
    item.K += Number(row[idx.K]) || 0;
    item.temperature += Number(row[idx.temperature]) || 0;
    item.humidity += Number(row[idx.humidity]) || 0;
    item.ph += Number(row[idx.ph]) || 0;
    item.rainfall += Number(row[idx.rainfall]) || 0;
  }

  return Array.from(grouped.entries())
    .map(([name, sums]) => ({
      name,
      displayName: formatDisplayName(name),
      source: 'dataset',
      sampleCount: sums.count,
      climate: {
        nitrogen: Number((sums.N / sums.count).toFixed(1)),
        phosphorus: Number((sums.P / sums.count).toFixed(1)),
        potassium: Number((sums.K / sums.count).toFixed(1)),
        temperature: Number((sums.temperature / sums.count).toFixed(1)),
        humidity: Number((sums.humidity / sums.count).toFixed(1)),
        ph: Number((sums.ph / sums.count).toFixed(2)),
        rainfall: Number((sums.rainfall / sums.count).toFixed(1))
      }
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

// Get all crops with optional filtering
exports.getAllCrops = async (req, res) => {
  try {
    const { season, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (season) {
      query.season = season;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const crops = await Crop.find(query)
      .sort({ displayName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Crop.countDocuments(query);

    res.json({
      crops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get crop by name
exports.getCropByName = async (req, res) => {
  try {
    const { name } = req.params;
    const crop = await Crop.findOne({ name: name.toLowerCase() });

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    res.json({ crop });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search crops
exports.searchCrops = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const crops = await Crop.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json({ crops });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get crop seasons
exports.getSeasons = async (req, res) => {
  try {
    const seasons = await Crop.distinct('season');
    res.json({ seasons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get full crop list from ML dataset (22 crops) for dropdown use
exports.getCropCatalog = async (req, res) => {
  try {
    const crops = buildCatalogFromDataset();
    res.json({ crops, total: crops.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to build crop catalog' });
  }
};

// Get one crop climate snapshot from dataset
exports.getCropCatalogByName = async (req, res) => {
  try {
    const { name } = req.params;
    const normalized = String(name || '').toLowerCase();
    const crops = buildCatalogFromDataset();
    const crop = crops.find((item) => item.name.toLowerCase() === normalized);

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found in catalog' });
    }

    res.json({ crop });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crop from catalog' });
  }
};
