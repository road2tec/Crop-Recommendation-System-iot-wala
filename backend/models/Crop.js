/**
 * Crop Model - MongoDB Schema for crop information
 * Contains ideal growing conditions and requirements for each crop
 */

const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Crop name is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  idealConditions: {
    nitrogen: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true }
    },
    phosphorus: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true }
    },
    potassium: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true }
    },
    temperature: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true },
      unit: { type: String, default: '°C' }
    },
    humidity: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true },
      unit: { type: String, default: '%' }
    },
    ph: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true }
    },
    rainfall: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      optimal: { type: Number, required: true },
      unit: { type: String, default: 'mm' }
    }
  },
  season: {
    type: String,
    enum: ['Kharif', 'Rabi', 'Zaid', 'Perennial'],
    required: true
  },
  growingPeriod: {
    type: String,
    required: true
  },
  soilType: {
    type: [String],
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  benefits: {
    type: [String],
    default: []
  },
  tips: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster searches
cropSchema.index({ name: 1 });
cropSchema.index({ season: 1 });

module.exports = mongoose.model('Crop', cropSchema);
