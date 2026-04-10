/**
 * Prediction Controller - Handle crop predictions
 */

const axios = require('axios');
const Prediction = require('../models/Prediction');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000';

// Get crop prediction
exports.predict = async (req, res) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = req.body;
    
    // Call ML API
    const response = await axios.post(`${ML_API_URL}/predict`, {
      N, P, K, temperature, humidity, ph, rainfall
    });
    
    const { prediction, confidence, similar_crops } = response.data;
    
    // Save prediction to database
    const predictionRecord = new Prediction({
      userId: req.user.userId,
      inputData: { N, P, K, temperature, humidity, ph, rainfall },
      predictedCrop: prediction,
      confidence,
      similarCrops: similar_crops
    });
    await predictionRecord.save();
    
    res.json({
      prediction,
      confidence,
      similarCrops: similar_crops
    });
  } catch (error) {
    console.error('Prediction error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get prediction',
      details: error.response?.data || error.message
    });
  }
};

// Get prediction history
exports.getHistory = async (req, res) => {
  try {
    const predictions = await Prediction.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
