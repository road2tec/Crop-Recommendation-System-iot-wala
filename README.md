# 🌱 Crop Recommendation System

A full-stack web application that recommends the best crops to plant based on soil parameters and climate data, powered by Machine Learning.

## 🏗️ Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **ML Model**: Python (FastAPI + RandomForest)

## 📁 Project Structure

```
Crop_recommandation_R2T/
├── ml-model/                 # Python ML microservice
│   ├── train.py             # Model training script
│   ├── model.py             # FastAPI server
│   └── requirements.txt     # Python dependencies
├── backend/                  # Node.js Express API
│   ├── controllers/         # Route handlers
│   ├── routes/              # API routes
│   ├── models/              # MongoDB schemas
│   ├── middleware/          # Auth middleware
│   ├── server.js            # Express server
│   └── package.json
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/           # React pages
│   │   ├── context/         # Auth context
│   │   └── services/        # API service
│   └── package.json
├── Crop_recommendation.csv   # Training dataset
└── run_script.bat           # Windows starter script
```

## 🚀 Quick Start (Windows)

### Option 1: Use the Batch Script
Double-click `run_script.bat` and follow the menu options.

### Option 2: Manual Setup

#### Step 1: Install Dependencies

```bash
# ML Model
cd ml-model
pip install -r requirements.txt

# Backend
cd ../backend
npm install

# Frontend
cd ../frontend
npm install
```

#### Step 2: Train the ML Model

```bash
cd ml-model
python train.py
```

#### Step 3: Start MongoDB
Make sure MongoDB is running on `localhost:27017`

#### Step 4: Start All Services (3 terminals)

**Terminal 1 - ML API:**
```bash
cd ml-model
python model.py
```
Server runs on http://localhost:5000

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on http://localhost:3001

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```
App runs on http://localhost:3000

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Prediction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Get crop prediction |
| GET | `/api/predict/history` | Get prediction history |

### Weather
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather` | Get current weather data |

## 📊 ML Model

The system uses a **Random Forest Classifier** trained on agricultural data with these features:

- **N**: Nitrogen content in soil (0-200)
- **P**: Phosphorus content in soil (0-200)
- **K**: Potassium content in soil (0-200)
- **temperature**: Temperature in Celsius
- **humidity**: Relative humidity percentage
- **ph**: pH value of soil (0-14)
- **rainfall**: Rainfall in mm

### Prediction API Example

```json
// Request
POST /predict
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 22,
  "humidity": 80,
  "ph": 6.5,
  "rainfall": 200
}

// Response
{
  "prediction": "rice",
  "confidence": 0.95,
  "similar_crops": [
    {"crop": "maize", "probability": 0.03},
    {"crop": "wheat", "probability": 0.01}
  ]
}
```

## 🎨 Features

### User Features
- ✅ User registration and login
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Protected dashboard
- ✅ Role-based access control (User/Admin)

### Dashboard Features
- ✅ Real-time weather data (Open-Meteo API)
- ✅ Geolocation detection for current location
- ✅ Location display with reverse geocoding
- ✅ Soil parameter input form
- ✅ Crop prediction with confidence score
- ✅ Similar crop suggestions
- ✅ Temperature trend chart
- ✅ NPK bar chart

### Admin Features 🆕
- ✅ User management (CRUD operations)
- ✅ System statistics dashboard
- ✅ Prediction monitoring
- ✅ Crop distribution analytics
- ✅ User activity tracking
- ✅ Search and pagination
- ✅ Account activation/deactivation

### Technical Features
- ✅ Clean UI with Tailwind CSS
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ MongoDB integration
- ✅ Prediction history storage

## 🔧 Environment Variables

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/Crop_recommendation
JWT_SECRET=your_super_secret_jwt_key_change_in_production
ML_API_URL=http://localhost:5000
```

## 🖼️ Pages

1. **Home Page** - Introduction with Login/Register buttons
2. **Login Page** - User authentication
3. **Register Page** - New user registration
4. **Dashboard** - Main application with:
   - Climate data display (with geolocation)
   - Soil parameter form
   - Prediction results
   - Interactive charts
5. **Admin Dashboard** - 🆕 Admin panel with:
   - System statistics and monitoring
   - User management (CRUD operations)
   - Prediction analytics
   - Crop distribution charts

## 👨‍💼 Admin Panel

### Features
- **User Management**:
  - View all users with pagination & search
  - Create, edit, delete users
  - Activate/Deactivate accounts
  - Role management (User/Admin)
- **System Monitoring**:
  - Total users, active users, predictions
  - Crop distribution charts
  - User growth analytics
  - Recent activity tracking

### Access
- Login with admin credentials at `/login`
- Automatically redirected to `/admin`
- User management at `/admin/users`

### Create First Admin
```javascript
// MongoDB Shell
use Crop_recommendation
db.users.updateOne(
  { email: "your_email@example.com" },
  { $set: { role: "admin", isActive: true } }
)
```

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for session management
- Protected API routes
- Input validation

---

Built with ❤️ for farmers and agriculture enthusiasts.
