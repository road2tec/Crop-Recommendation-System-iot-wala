/**
 * Crop Data Seeder
 * Adds crop information to the database
 */

const mongoose = require('mongoose');
const Crop = require('./models/Crop');
require('dotenv').config();

const cropData = [
  {
    name: 'rice',
    displayName: 'Rice',
    description: 'A staple cereal grain grown in flooded fields. Rich in carbohydrates and essential for global food security.',
    idealConditions: {
      nitrogen: { min: 80, max: 120, optimal: 100 },
      phosphorus: { min: 40, max: 60, optimal: 50 },
      potassium: { min: 40, max: 60, optimal: 50 },
      temperature: { min: 20, max: 35, optimal: 25 },
      humidity: { min: 80, max: 95, optimal: 85 },
      ph: { min: 5.5, max: 7.0, optimal: 6.0 },
      rainfall: { min: 150, max: 300, optimal: 200 }
    },
    season: 'Kharif',
    growingPeriod: '90-120 days',
    soilType: ['Clay', 'Loamy Clay'],
    benefits: ['High in carbohydrates', 'Good source of energy', 'Gluten-free'],
    tips: ['Maintain consistent water level', 'Regular weeding', 'Use organic fertilizers']
  },
  {
    name: 'maize',
    displayName: 'Maize (Corn)',
    description: 'A versatile cereal grain used for food, feed, and industrial purposes. High yielding crop with good nutritional value.',
    idealConditions: {
      nitrogen: { min: 60, max: 100, optimal: 80 },
      phosphorus: { min: 25, max: 45, optimal: 35 },
      potassium: { min: 30, max: 50, optimal: 40 },
      temperature: { min: 18, max: 32, optimal: 25 },
      humidity: { min: 60, max: 80, optimal: 70 },
      ph: { min: 5.8, max: 7.5, optimal: 6.5 },
      rainfall: { min: 60, max: 120, optimal: 90 }
    },
    season: 'Kharif',
    growingPeriod: '75-90 days',
    soilType: ['Loamy', 'Clay Loam', 'Sandy Loam'],
    benefits: ['High in fiber', 'Rich in antioxidants', 'Good source of magnesium'],
    tips: ['Ensure proper drainage', 'Plant in rows', 'Regular irrigation during flowering']
  },
  {
    name: 'wheat',
    displayName: 'Wheat',
    description: 'A major cereal grain and staple food crop. Used to make bread, pasta, and other food products.',
    idealConditions: {
      nitrogen: { min: 100, max: 140, optimal: 120 },
      phosphorus: { min: 40, max: 60, optimal: 50 },
      potassium: { min: 30, max: 50, optimal: 40 },
      temperature: { min: 15, max: 25, optimal: 20 },
      humidity: { min: 50, max: 70, optimal: 60 },
      ph: { min: 6.0, max: 7.5, optimal: 6.5 },
      rainfall: { min: 30, max: 80, optimal: 50 }
    },
    season: 'Rabi',
    growingPeriod: '120-150 days',
    soilType: ['Loamy', 'Clay Loam'],
    benefits: ['High protein content', 'Rich in fiber', 'Source of essential minerals'],
    tips: ['Sow at optimal time', 'Regular weeding', 'Apply fertilizers in split doses']
  },
  {
    name: 'chickpea',
    displayName: 'Chickpea (Gram)',
    description: 'A protein-rich legume crop that fixes nitrogen in soil. Important pulse crop with high nutritional value.',
    idealConditions: {
      nitrogen: { min: 20, max: 40, optimal: 30 },
      phosphorus: { min: 50, max: 80, optimal: 65 },
      potassium: { min: 40, max: 60, optimal: 50 },
      temperature: { min: 15, max: 30, optimal: 22 },
      humidity: { min: 40, max: 70, optimal: 55 },
      ph: { min: 6.0, max: 8.0, optimal: 7.0 },
      rainfall: { min: 30, max: 60, optimal: 40 }
    },
    season: 'Rabi',
    growingPeriod: '90-120 days',
    soilType: ['Clay Loam', 'Sandy Loam'],
    benefits: ['High protein', 'Rich in folate', 'Good source of iron'],
    tips: ['Avoid waterlogged conditions', 'Inoculate seeds with Rhizobium', 'Harvest at proper maturity']
  },
  {
    name: 'cotton',
    displayName: 'Cotton',
    description: 'A fiber crop grown for textile production. Requires warm climate and adequate moisture during growing period.',
    idealConditions: {
      nitrogen: { min: 80, max: 120, optimal: 100 },
      phosphorus: { min: 40, max: 70, optimal: 55 },
      potassium: { min: 60, max: 100, optimal: 80 },
      temperature: { min: 21, max: 35, optimal: 28 },
      humidity: { min: 50, max: 80, optimal: 65 },
      ph: { min: 5.8, max: 8.0, optimal: 6.8 },
      rainfall: { min: 60, max: 150, optimal: 100 }
    },
    season: 'Kharif',
    growingPeriod: '180-200 days',
    soilType: ['Black Soil', 'Alluvial', 'Sandy Loam'],
    benefits: ['Economic importance', 'Employment generation', 'Export potential'],
    tips: ['Regular pest monitoring', 'Proper plant spacing', 'Timely irrigation']
  },
  {
    name: 'sugarcane',
    displayName: 'Sugarcane',
    description: 'A perennial grass cultivated for sugar production. Requires high moisture and warm climate.',
    idealConditions: {
      nitrogen: { min: 200, max: 300, optimal: 250 },
      phosphorus: { min: 60, max: 100, optimal: 80 },
      potassium: { min: 150, max: 250, optimal: 200 },
      temperature: { min: 20, max: 35, optimal: 28 },
      humidity: { min: 70, max: 90, optimal: 80 },
      ph: { min: 6.0, max: 7.5, optimal: 6.8 },
      rainfall: { min: 150, max: 250, optimal: 200 }
    },
    season: 'Perennial',
    growingPeriod: '12-18 months',
    soilType: ['Deep Alluvial', 'Black Soil', 'Red Soil'],
    benefits: ['Sugar production', 'Ethanol production', 'Bagasse for paper'],
    tips: ['Maintain soil moisture', 'Regular earthing up', 'Proper drainage during heavy rains']
  }
];

async function seedCrops() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation');
    console.log('Connected to MongoDB');

    // Clear existing crop data
    await Crop.deleteMany({});
    console.log('Cleared existing crop data');

    // Insert new crop data
    await Crop.insertMany(cropData);
    console.log(`Successfully seeded ${cropData.length} crops`);

    // Verify insertion
    const count = await Crop.countDocuments();
    console.log(`Total crops in database: ${count}`);

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding crop data:', error);
    process.exit(1);
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedCrops();
}

module.exports = seedCrops;