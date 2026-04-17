import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { submitFeedback } from '../services/feedbackService';
import { getSensorStatus, generateSensorValues } from '../services/iotService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import LiveSensorChart from '../components/LiveSensorChart';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });

  const [useAutoClimate, setUseAutoClimate] = useState(true);
  
  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  
  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  // Feedback state
  const [feedbackData, setFeedbackData] = useState({ message: '', rating: 5 });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Live sensor data state
  const [liveSensorData, setLiveSensorData] = useState(null);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [sensorUpdateInterval, setSensorUpdateInterval] = useState(null);

  const validateRange = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

  // Fetch weather data on mount
  useEffect(() => {
    fetchWeatherWithLocation();
    checkLiveSensorData(); // Check for live sensor data
  }, []);

  // Monitor live sensor data
  useEffect(() => {
    const checkSensors = async () => {
      try {
        const sensorStatus = await getSensorStatus();
        if (sensorStatus.connected && !sensorConnected) {
          // Sensor just connected, start monitoring
          setSensorConnected(true);
          startLiveSensorMonitoring();
        } else if (!sensorStatus.connected && sensorConnected) {
          // Sensor disconnected
          setSensorConnected(false);
          stopLiveSensorMonitoring();
        }
      } catch (error) {
        // IoT server not running, stop monitoring
        if (sensorConnected) {
          setSensorConnected(false);
          stopLiveSensorMonitoring();
        }
      }
    };

    const interval = setInterval(checkSensors, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [sensorConnected]);

  const checkLiveSensorData = async () => {
    try {
      const sensorStatus = await getSensorStatus();
      if (sensorStatus.connected) {
        setSensorConnected(true);
        startLiveSensorMonitoring();
      }
    } catch (error) {
      // IoT server not running, no live data
    }
  };

  const startLiveSensorMonitoring = () => {
    if (sensorUpdateInterval) return; // Already monitoring

    // Generate initial data
    setLiveSensorData(generateSensorValues());

    // Update every 15 minutes like in IoT page
    const interval = setInterval(() => {
      setLiveSensorData(generateSensorValues());
    }, 900000); // 15 minutes

    setSensorUpdateInterval(interval);
  };

  const stopLiveSensorMonitoring = () => {
    if (sensorUpdateInterval) {
      clearInterval(sensorUpdateInterval);
      setSensorUpdateInterval(null);
    }
    setLiveSensorData(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveSensorMonitoring();
    };
  }, []);

  useEffect(() => {
    if (!useAutoClimate || !weather?.current) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      temperature: String(weather.current.temperature ?? ''),
      humidity: String(weather.current.humidity ?? '')
    }));
  }, [weather, useAutoClimate]);

  const fetchWeatherWithLocation = () => {
    // Check if geolocation is supported
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        // Error callback
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationError('Using default location');
          fetchWeather(); // Use default location
        },
        // Options
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    } else {
      setLocationError('Geolocation not supported');
      fetchWeather(); // Use default location
    }
  };

  const fetchWeather = async (lat = null, lon = null) => {
    try {
      const params = {};
      if (lat && lon) {
        params.lat = lat;
        params.lon = lon;
      }
      const response = await api.get('/weather', { params });
      setWeather(response.data);
      setLocationError(''); // Clear any previous error
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setLocationError('Unable to fetch weather data');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError('');
    setPredicting(true);

    try {
      const parsedN = parseFloat(formData.N);
      const parsedP = parseFloat(formData.P);
      const parsedK = parseFloat(formData.K);
      const parsedPh = parseFloat(formData.ph);
      const parsedRainfall = parseFloat(formData.rainfall);
      const temperature = useAutoClimate
        ? (weather?.current?.temperature ?? 25)
        : parseFloat(formData.temperature);
      const humidity = useAutoClimate
        ? (weather?.current?.humidity ?? 70)
        : parseFloat(formData.humidity);

      if (!validateRange(parsedN, 0, 140)) {
        setError('Nitrogen (N) must be between 0 and 140.');
        return;
      }
      if (!validateRange(parsedP, 5, 145)) {
        setError('Phosphorus (P) must be between 5 and 145.');
        return;
      }
      if (!validateRange(parsedK, 5, 205)) {
        setError('Potassium (K) must be between 5 and 205.');
        return;
      }
      if (!validateRange(parsedRainfall, 20, 300)) {
        setError('Rainfall must be between 20 and 300.');
        return;
      }
      if (!validateRange(parsedPh, 0, 14)) {
        setError('pH value must be between 0 and 14.');
        return;
      }

      const response = await api.post('/predict', {
        N: parsedN,
        P: parsedP,
        K: parsedK,
        temperature,
        humidity,
        ph: parsedPh,
        rainfall: parsedRainfall
      });
      
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess(false);
    setFeedbackSubmitting(true);

    try {
      if (feedbackData.message.length < 10) {
        setFeedbackError('Feedback must be at least 10 characters');
        return;
      }

      await submitFeedback(feedbackData);
      setFeedbackSuccess(true);
      setFeedbackData({ message: '', rating: 5 });

      // Hide success message after 3 seconds
      setTimeout(() => setFeedbackSuccess(false), 3000);
    } catch (err) {
      setFeedbackError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Chart data for temperature trend
  const temperatureChartData = {
    labels: weather?.trend?.times?.slice(0, 12) || [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: weather?.trend?.temperatures?.slice(0, 12) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Chart data for NPK
  const npkChartData = {
    labels: ['Nitrogen (N)', 'Phosphorus (P)', 'Potassium (K)'],
    datasets: [
      {
        label: 'Soil Nutrients',
        data: [
          parseFloat(formData.N) || 0,
          parseFloat(formData.P) || 0,
          parseFloat(formData.K) || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(249, 115, 22, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">🌱 CropAdvisor</h1>
          <div className="flex items-center space-x-4">
            <a
              href="http://192.168.1.4/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              title="Open IoT Sensor Dashboard (192.168.1.4) — same network required"
            >
              📡 Sensor Reading
            </a>
            <button
              onClick={() => navigate('/iot-sensor')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium flex items-center gap-2"
            >
              📡 IoT Sensors
            </button>
            <button
              onClick={() => navigate('/crop-library')}
              className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium"
            >
              📚 Crop Library
            </button>
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Weather & Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Sensor Chart */}
            {(sensorConnected && liveSensorData) || weather?.current ? (
              <div>
                <LiveSensorChart
                  sensorValues={liveSensorData || {}}
                  apiClimate={weather?.current}
                  isConnected={sensorConnected || Boolean(weather?.current)}
                />
              </div>
            ) : null}

            {/* Climate Data Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">🌤️ Current Climate Data</h2>
                {weather?.current?.location?.name && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {weather.current.location.name}
                  </div>
                )}
              </div>
              {locationError && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded">
                  ⚠️ {locationError}
                </div>
              )}
              {weatherLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : weather ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <p className="text-gray-600 text-sm">Temperature</p>
                    <p className="text-4xl font-bold text-green-600">{weather.current.temperature}°C</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <p className="text-gray-600 text-sm">Humidity</p>
                    <p className="text-4xl font-bold text-blue-600">{weather.current.humidity}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Unable to fetch weather data</p>
              )}
            </div>

            {/* Soil Input Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Soil Parameters</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handlePredict}>
                <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Climate Data Mode:</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoClimate}
                        onChange={(e) => setUseAutoClimate(e.target.checked)}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Auto-fill from current weather</span>
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {useAutoClimate
                      ? 'Temperature and humidity will be taken from live weather data.'
                      : 'Manual mode enabled. Enter temperature and humidity values below.'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nitrogen (N)
                    </label>
                    <input
                      type="number"
                      name="N"
                      value={formData.N}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="140"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0 - 140"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phosphorus (P)
                    </label>
                    <input
                      type="number"
                      name="P"
                      value={formData.P}
                      onChange={handleInputChange}
                      required
                      min="5"
                      max="145"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="5 - 145"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Potassium (K)
                    </label>
                    <input
                      type="number"
                      name="K"
                      value={formData.K}
                      onChange={handleInputChange}
                      required
                      min="5"
                      max="205"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="5 - 205"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      required={!useAutoClimate}
                      disabled={useAutoClimate}
                      min="-10"
                      max="60"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={useAutoClimate ? 'Auto from weather' : 'e.g. 27.5'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Humidity (%)
                    </label>
                    <input
                      type="number"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleInputChange}
                      required={!useAutoClimate}
                      disabled={useAutoClimate}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={useAutoClimate ? 'Auto from weather' : 'e.g. 68'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      pH Value
                    </label>
                    <input
                      type="number"
                      name="ph"
                      value={formData.ph}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="14"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0-14"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rainfall (mm)
                    </label>
                    <input
                      type="number"
                      name="rainfall"
                      value={formData.rainfall}
                      onChange={handleInputChange}
                      required
                      min="20"
                      max="300"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="20 - 300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={predicting}
                  className="mt-6 w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {predicting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    '🌾 Predict Best Crop'
                  )}
                </button>
              </form>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Temperature Trend (24h)</h3>
                <div className="h-64">
                  <Line data={temperatureChartData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Soil Nutrients (NPK)</h3>
                <div className="h-64">
                  <Bar data={npkChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Prediction Results */}
          <div className="space-y-6">
            {/* Prediction Result */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🌾 Crop Recommendation</h2>
              
              {prediction ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-6 text-white text-center">
                    <p className="text-sm opacity-80">Recommended Crop</p>
                    <p className="text-3xl font-bold capitalize mt-2">{prediction.prediction}</p>
                    <p className="text-sm mt-2 opacity-80">
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  {prediction.similarCrops && prediction.similarCrops.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Similar Crops:</h3>
                      <div className="space-y-2">
                        {prediction.similarCrops.map((crop, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                          >
                            <span className="capitalize font-medium">{crop.crop}</span>
                            <span className="text-sm text-gray-500">
                              {(crop.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">🌱</div>
                  <p>Enter soil parameters and click predict to get crop recommendation</p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">💡 Quick Tips</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  N (Nitrogen): Essential for leaf growth
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  P (Phosphorus): Helps root development
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  K (Potassium): Improves overall health
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  pH: Most crops prefer 6.0-7.0
                </li>
              </ul>
            </div>

            {/* Feedback Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">💬 Share Your Feedback</h2>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 ${
                            star <= feedbackData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={feedbackData.message}
                    onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                    placeholder="Tell us about your experience..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Success Message */}
                {feedbackSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    ✓ Thank you! Your feedback has been submitted successfully.
                  </div>
                )}

                {/* Error Message */}
                {feedbackError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {feedbackError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={feedbackSubmitting || !feedbackData.message.trim()}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
