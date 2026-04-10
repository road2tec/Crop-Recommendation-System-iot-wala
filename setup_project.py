"""
COMPLETE SETUP SCRIPT FOR CROP RECOMMENDATION SYSTEM
=====================================================
This script creates all necessary directories and files for the project.

Run this script first: python setup_project.py
"""

import os

BASE_PATH = os.path.dirname(os.path.abspath(__file__))

# =====================================================
# DIRECTORY STRUCTURE
# =====================================================
directories = [
    "ml-model",
    "backend/controllers",
    "backend/routes",
    "backend/models",
    "backend/services",
    "backend/middleware",
    "frontend/src/components",
    "frontend/src/pages",
    "frontend/src/services",
    "frontend/src/context",
    "frontend/public"
]

# =====================================================
# ML MODEL FILES
# =====================================================
ml_requirements = """fastapi==0.104.1
uvicorn==0.24.0
pandas==2.1.3
scikit-learn==1.3.2
numpy==1.26.2
python-multipart==0.0.6
"""

ml_train = '''"""
Train the Random Forest model for crop prediction
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def train_model():
    """Train the crop recommendation model"""
    
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'Crop_recommendation.csv')
    
    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    
    print(f"Dataset shape: {df.shape}")
    print(f"Unique crops: {df['label'].nunique()}")
    
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df['label']
    
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )
    
    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    print("\\nTraining Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    train_accuracy = model.score(X_train, y_train)
    test_accuracy = model.score(X_test, y_test)
    
    print(f"\\nTraining Accuracy: {train_accuracy:.4f}")
    print(f"Test Accuracy: {test_accuracy:.4f}")
    
    model_path = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
    encoder_path = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"\\nModel saved to: {model_path}")
    
    with open(encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    print(f"Label encoder saved to: {encoder_path}")
    
    return model, label_encoder

if __name__ == "__main__":
    train_model()
'''

ml_model = '''"""
FastAPI server for crop prediction
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os

app = FastAPI(
    title="Crop Recommendation ML API",
    description="Predict the best crop based on soil and climate data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'crop_model.pkl')
ENCODER_PATH = os.path.join(os.path.dirname(__file__), 'label_encoder.pkl')

model = None
label_encoder = None

def load_model():
    global model, label_encoder
    
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model file not found. Run train.py first.")
    
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    
    with open(ENCODER_PATH, 'rb') as f:
        label_encoder = pickle.load(f)
    
    print("Model loaded successfully!")

class PredictionRequest(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    similar_crops: list

@app.on_event("startup")
async def startup_event():
    try:
        load_model()
    except FileNotFoundError as e:
        print(f"Warning: {e}")

@app.get("/")
async def root():
    return {"status": "running", "model_loaded": model is not None}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
async def predict_crop(data: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        features = np.array([[
            data.N, data.P, data.K, data.temperature,
            data.humidity, data.ph, data.rainfall
        ]])
        
        prediction_encoded = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        prediction = label_encoder.inverse_transform([prediction_encoded])[0]
        confidence = float(max(probabilities))
        
        top_indices = np.argsort(probabilities)[::-1][:4]
        similar_crops = []
        
        for idx in top_indices:
            crop_name = label_encoder.inverse_transform([idx])[0]
            if crop_name != prediction:
                similar_crops.append({
                    "crop": crop_name,
                    "probability": float(probabilities[idx])
                })
        
        similar_crops = similar_crops[:3]
        
        return PredictionResponse(
            prediction=prediction,
            confidence=round(confidence, 4),
            similar_crops=similar_crops
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/crops")
async def get_crops():
    if label_encoder is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"crops": label_encoder.classes_.tolist()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
'''

# =====================================================
# BACKEND FILES
# =====================================================
backend_package_json = """{
  "name": "crop-recommendation-backend",
  "version": "1.0.0",
  "description": "Backend API for Crop Recommendation System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.2",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
"""

backend_env = """PORT=3001
MONGODB_URI=mongodb://localhost:27017/Crop_recommendation
JWT_SECRET=your_super_secret_jwt_key_change_in_production
ML_API_URL=http://localhost:5000
"""

backend_server = '''/**
 * Main Express server for Crop Recommendation System
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const weatherRoutes = require('./routes/weather');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
'''

backend_user_model = '''/**
 * User Model - MongoDB Schema for users
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
'''

backend_prediction_model = '''/**
 * Prediction Model - MongoDB Schema for predictions
 */

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputData: {
    N: Number,
    P: Number,
    K: Number,
    temperature: Number,
    humidity: Number,
    ph: Number,
    rainfall: Number
  },
  predictedCrop: {
    type: String,
    required: true
  },
  confidence: Number,
  similarCrops: [{
    crop: String,
    probability: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', predictionSchema);
'''

backend_auth_middleware = '''/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
'''

backend_auth_controller = '''/**
 * Auth Controller - Handle registration and login
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user
    const user = new User({ name, email, password });
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
'''

backend_predict_controller = '''/**
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
'''

backend_weather_controller = '''/**
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
    
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'temperature_2m,relative_humidity_2m',
          forecast_days: 1
        }
      }
    );
    
    const { hourly } = response.data;
    
    // Get current hour data
    const currentHour = new Date().getHours();
    const temperature = hourly.temperature_2m[currentHour];
    const humidity = hourly.relative_humidity_2m ? 
      hourly.relative_humidity_2m[currentHour] : 
      Math.floor(Math.random() * (90 - 60) + 60); // Simulate if not available
    
    // Get temperature trend (last 24 hours)
    const temperatureTrend = hourly.temperature_2m;
    const timeLabels = hourly.time.map(t => new Date(t).getHours() + ':00');
    
    res.json({
      current: {
        temperature,
        humidity,
        location: { lat, lon }
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
'''

backend_auth_routes = '''/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me (protected)
router.get('/me', auth, authController.getMe);

module.exports = router;
'''

backend_predict_routes = '''/**
 * Prediction Routes
 */

const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');
const auth = require('../middleware/auth');

// POST /api/predict (protected)
router.post('/', auth, predictController.predict);

// GET /api/predict/history (protected)
router.get('/history', auth, predictController.getHistory);

module.exports = router;
'''

backend_weather_routes = '''/**
 * Weather Routes
 */

const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather
router.get('/', weatherController.getWeather);

module.exports = router;
'''

# =====================================================
# FRONTEND FILES
# =====================================================
frontend_package_json = """{
  "name": "crop-recommendation-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.2",
    "chart.js": "^4.4.1",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6"
  },
  "proxy": "http://localhost:3001"
}
"""

frontend_tailwind_config = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
}
"""

frontend_postcss_config = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"""

frontend_index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#22c55e" />
    <meta name="description" content="Crop Recommendation System based on Climate & Soil Data" />
    <title>Crop Recommendation System</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
"""

frontend_index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #22c55e;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #16a34a;
}
"""

frontend_index_js = """import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""

frontend_app = """import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
"""

frontend_auth_context = """import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
"""

frontend_api_service = """import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
"""

frontend_home_page = """import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600">🌱 CropAdvisor</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            Crop Recommendation System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get intelligent crop recommendations based on your soil parameters and local climate data.
            Powered by Machine Learning for accurate predictions.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🌤️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Climate Data</h3>
            <p className="text-gray-600">
              Real-time weather data integration for accurate climate-based recommendations.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🧪</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Soil Analysis</h3>
            <p className="text-gray-600">
              Input your soil parameters (NPK, pH) to get personalized crop suggestions.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">ML Powered</h3>
            <p className="text-gray-600">
              Advanced Random Forest algorithm trained on real agricultural data.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">1</div>
              <p className="mt-4 text-gray-700 font-medium">Register/Login</p>
            </div>
            <div className="hidden md:block text-4xl text-green-400">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">2</div>
              <p className="mt-4 text-gray-700 font-medium">Enter Soil Data</p>
            </div>
            <div className="hidden md:block text-4xl text-green-400">→</div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold">3</div>
              <p className="mt-4 text-gray-700 font-medium">Get Recommendation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-20 py-8">
        <div className="text-center text-gray-600">
          <p>© 2024 CropAdvisor. Built with ❤️ for farmers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
"""

frontend_login_page = """import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-green-600">🌱 CropAdvisor</Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
"""

frontend_register_page = """import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-green-600">🌱 CropAdvisor</Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create account</h2>
          <p className="mt-2 text-gray-600">Start getting crop recommendations</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
"""

frontend_dashboard_page = '''import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

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
    ph: '',
    rainfall: ''
  });
  
  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  // Prediction state
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  // Fetch weather data on mount
  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await api.get('/weather');
      setWeather(response.data);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
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
      const response = await api.post('/predict', {
        N: parseFloat(formData.N),
        P: parseFloat(formData.P),
        K: parseFloat(formData.K),
        temperature: weather?.current?.temperature || 25,
        humidity: weather?.current?.humidity || 70,
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall)
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
            {/* Climate Data Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🌤️ Current Climate Data</h2>
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
                      max="200"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0-200"
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
                      min="0"
                      max="200"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0-200"
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
                      min="0"
                      max="200"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0-200"
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
                      min="0"
                      max="500"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0-500"
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
'''

# =====================================================
# CREATE FILES
# =====================================================
def create_file(relative_path, content):
    full_path = os.path.join(BASE_PATH, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: {relative_path}")

def main():
    print("=" * 60)
    print("CROP RECOMMENDATION SYSTEM - PROJECT SETUP")
    print("=" * 60)
    
    # Create directories
    print("\nCreating directories...")
    for directory in directories:
        full_path = os.path.join(BASE_PATH, directory)
        os.makedirs(full_path, exist_ok=True)
        print(f"  Created: {directory}")
    
    # Create ML Model files
    print("\nCreating ML Model files...")
    create_file("ml-model/requirements.txt", ml_requirements)
    create_file("ml-model/train.py", ml_train)
    create_file("ml-model/model.py", ml_model)
    
    # Create Backend files
    print("\nCreating Backend files...")
    create_file("backend/package.json", backend_package_json)
    create_file("backend/.env", backend_env)
    create_file("backend/server.js", backend_server)
    create_file("backend/models/User.js", backend_user_model)
    create_file("backend/models/Prediction.js", backend_prediction_model)
    create_file("backend/middleware/auth.js", backend_auth_middleware)
    create_file("backend/controllers/authController.js", backend_auth_controller)
    create_file("backend/controllers/predictController.js", backend_predict_controller)
    create_file("backend/controllers/weatherController.js", backend_weather_controller)
    create_file("backend/routes/auth.js", backend_auth_routes)
    create_file("backend/routes/predict.js", backend_predict_routes)
    create_file("backend/routes/weather.js", backend_weather_routes)
    
    # Create Frontend files
    print("\nCreating Frontend files...")
    create_file("frontend/package.json", frontend_package_json)
    create_file("frontend/tailwind.config.js", frontend_tailwind_config)
    create_file("frontend/postcss.config.js", frontend_postcss_config)
    create_file("frontend/public/index.html", frontend_index_html)
    create_file("frontend/src/index.css", frontend_index_css)
    create_file("frontend/src/index.js", frontend_index_js)
    create_file("frontend/src/App.js", frontend_app)
    create_file("frontend/src/context/AuthContext.js", frontend_auth_context)
    create_file("frontend/src/services/api.js", frontend_api_service)
    create_file("frontend/src/pages/Home.js", frontend_home_page)
    create_file("frontend/src/pages/Login.js", frontend_login_page)
    create_file("frontend/src/pages/Register.js", frontend_register_page)
    create_file("frontend/src/pages/Dashboard.js", frontend_dashboard_page)
    
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60)
    print("""
NEXT STEPS:

1. Train the ML Model:
   cd ml-model
   pip install -r requirements.txt
   python train.py

2. Start the ML API:
   python model.py
   (runs on http://localhost:5000)

3. Start MongoDB:
   Make sure MongoDB is running on localhost:27017

4. Start the Backend:
   cd backend
   npm install
   npm run dev
   (runs on http://localhost:3001)

5. Start the Frontend:
   cd frontend
   npm install
   npm start
   (runs on http://localhost:3000)

6. Open http://localhost:3000 in your browser

Enjoy your Crop Recommendation System! 🌱
""")

if __name__ == "__main__":
    main()
