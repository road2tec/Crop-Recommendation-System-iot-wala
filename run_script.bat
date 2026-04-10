@echo off
cd /d "e:\Crop_recommandation_R2T"
echo ============================================
echo   Crop Recommendation System - Starter
echo ============================================
echo.
echo Choose an option:
echo 1. Train ML Model
echo 2. Start ML API (port 5000)
echo 3. Start Backend (port 3001)
echo 4. Start Frontend (port 3000)
echo 5. Install all dependencies
echo 6. Exit
echo.
set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" (
    echo Training ML Model...
    cd ml-model
    python train.py
    cd ..
    pause
)

if "%choice%"=="2" (
    echo Starting ML API...
    cd ml-model
    python model.py
    cd ..
)

if "%choice%"=="3" (
    echo Starting Backend...
    cd backend
    npm run dev
    cd ..
)

if "%choice%"=="4" (
    echo Starting Frontend...
    cd frontend
    npm start
    cd ..
)

if "%choice%"=="5" (
    echo Installing all dependencies...
    echo.
    echo Installing ML dependencies...
    cd ml-model
    pip install -r requirements.txt
    cd ..
    echo.
    echo Installing Backend dependencies...
    cd backend
    npm install
    cd ..
    echo.
    echo Installing Frontend dependencies...
    cd frontend
    npm install
    cd ..
    echo.
    echo All dependencies installed!
    pause
)

if "%choice%"=="6" (
    exit
)
