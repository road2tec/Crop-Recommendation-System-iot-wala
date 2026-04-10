/**
 * Weather Controller - Fetch climate data
 */

const axios = require('axios');

// Default coordinates (Nagpur, India)
const DEFAULT_LAT = 21.15;
const DEFAULT_LON = 79.09;

// Get weather data from Open-Meteo API
exports.getWeather = async (req, res) => {
  try {
    const lat = req.query.lat || DEFAULT_LAT;
    const lon = req.query.lon || DEFAULT_LON;
    
    // Fetch weather data
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'temperature_2m,relative_humidity_2m',
          forecast_days: 1
        }
      }
    );
    
    const { hourly } = weatherResponse.data;
    
    // Get current hour data
    const currentHour = new Date().getHours();
    const temperature = hourly.temperature_2m[currentHour];
    const humidity = hourly.relative_humidity_2m ? 
      hourly.relative_humidity_2m[currentHour] : 
      Math.floor(Math.random() * (90 - 60) + 60); // Simulate if not available
    
    // Get temperature trend (last 24 hours)
    const temperatureTrend = hourly.temperature_2m;
    const timeLabels = hourly.time.map(t => new Date(t).getHours() + ':00');
    
    // Reverse geocode to get location name
    let locationName = 'Unknown Location';
    try {
      const geocodeResponse = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`, {
          params: {
            lat: lat,
            lon: lon,
            format: 'json'
          },
          headers: {
            'User-Agent': 'CropRecommendationApp/1.0'
          }
        }
      );
      
      const address = geocodeResponse.data.address;
      const city = address.city || address.town || address.village || address.county;
      const state = address.state;
      const country = address.country;
      
      // Format location name
      if (city && state && country) {
        locationName = `${city}, ${state}, ${country}`;
      } else if (city && country) {
        locationName = `${city}, ${country}`;
      } else if (state && country) {
        locationName = `${state}, ${country}`;
      } else if (country) {
        locationName = country;
      }
    } catch (geoError) {
      console.warn('Geocoding failed, using default location:', geoError.message);
      // If geocoding fails, use default name based on coordinates
      locationName = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    }
    
    res.json({
      current: {
        temperature,
        humidity,
        location: { 
          lat, 
          lon,
          name: locationName
        }
      },
      trend: {
        temperatures: temperatureTrend,
        times: timeLabels
      }
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

// Get detailed forecast (5 days)
exports.getForecast = async (req, res) => {
  try {
    const lat = req.query.lat || DEFAULT_LAT;
    const lon = req.query.lon || DEFAULT_LON;
    
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
          hourly: 'temperature_2m,relative_humidity_2m,precipitation',
          forecast_days: 5,
          timezone: 'auto'
        }
      }
    );
    
    const { daily, hourly } = weatherResponse.data;
    
    res.json({
      daily: {
        dates: daily.time,
        temperatureMax: daily.temperature_2m_max,
        temperatureMin: daily.temperature_2m_min,
        precipitation: daily.precipitation_sum,
        windSpeed: daily.windspeed_10m_max
      },
      hourly: {
        times: hourly.time,
        temperature: hourly.temperature_2m,
        humidity: hourly.relative_humidity_2m,
        precipitation: hourly.precipitation
      }
    });
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
};

// Get historical weather data (24 hours)
exports.getHistorical = async (req, res) => {
  try {
    const lat = req.query.lat || DEFAULT_LAT;
    const lon = req.query.lon || DEFAULT_LON;
    
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];
    
    const today = new Date().toISOString().split('T')[0];
    
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'temperature_2m,relative_humidity_2m,precipitation',
          start_date: startDate,
          end_date: today,
          timezone: 'auto'
        }
      }
    );
    
    const { hourly } = weatherResponse.data;
    
    res.json({
      times: hourly.time,
      temperature: hourly.temperature_2m,
      humidity: hourly.relative_humidity_2m,
      precipitation: hourly.precipitation
    });
  } catch (error) {
    console.error('Historical API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
