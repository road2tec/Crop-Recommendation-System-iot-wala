import api from './api';

/**
 * Prediction Service - API calls for crop recommendations
 */

// Get crop prediction based on sensor data
export const getCropPrediction = async (sensorData) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = sensorData;
    const response = await api.post('/predict', {
      N,
      P,
      K,
      temperature,
      humidity,
      ph,
      rainfall
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get crop prediction');
  }
};

// Get prediction history for current user
export const getPredictionHistory = async () => {
  try {
    const response = await api.get('/predict/history');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch prediction history');
  }
};
