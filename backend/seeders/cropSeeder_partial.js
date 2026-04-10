/**
 * Crop Data Seeder
 * Populate database with crop information based on common Indian crops
 * Run: node backend/seeders/cropSeeder.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const cropData = [
  {
    name: 'rice',
    displayName: 'Rice',
    description: 'Rice is a staple food crop requiring high water availability. It thrives in warm, humid climates with flooded paddy fields.',
    idealConditions: {
      nitrogen: { min: 60, max: 120, optimal: 90 },
      phosphorus: { min: 35, max: 60, optimal: 45 },
      potassium: { min: 35, max: 50, optimal: 40 },
      temperature: { min: 20, max: 35, optimal: 25 },
      humidity: { min: 70, max: 95, optimal: 80 },
      ph: { min: 5.5, max: 7.0, optimal: 6.5 },
      rainfall: { min: 150, max: 300, optimal: 200 }
    },
    season: 'Kharif',
    growingPeriod: '3-6 months',
    soilType: ['Clayey', 'Loamy'],
    benefits: ['High yield', 'Staple food', 'Good market demand'],
    tips: ['Ensure proper water management', 'Control weeds regularly', 'Use disease-resistant varieties']
  },
  {
    name: 'wheat',
    displayName: 'Wheat',
    description: 'Wheat is a major cereal crop grown in cooler climates. It requires moderate rainfall and well-drained soil.',
    idealConditions: {
      nitrogen: { min: 50, max: 80, optimal: 65 },
      phosphorus: { min: 40, max: 70, optimal: 55 },
      potassium: { min: 40, max: 60, optimal: 50 },
      temperature: { min: 12, max: 25, optimal: 20 },
      humidity: { min: 50, max: 70, optimal: 60 },
      ph: { min: 6.0, max: 7.5, optimal: 6.5 },
      rainfall: { min: 50, max: 100, optimal: 75 }
    },
    season: 'Rabi',
    growingPeriod: '4-5 months',
    soilType: ['Loamy', 'Clay-loam'],
    benefits: ['High nutritional value', 'Good storage life', 'Multiple varieties available'],
    tips: ['Sow at right time', 'Ensure proper irrigation', 'Monitor for rust diseases']
  }
];

async function seedCrops() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation');
    console.log('Connected to MongoDB');
    await Crop.deleteMany({});
    console.log('Cleared existing crop data');
    await Crop.insertMany(cropData);
    console.log(`Successfully seeded ${cropData.length} crops`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding crops:', error);
    process.exit(1);
  }
}

seedCrops();
