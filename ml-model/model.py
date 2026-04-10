"""
FastAPI server for crop prediction
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import os
import subprocess

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
        iot_script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'start_iot_sensor.py')
        if os.path.exists(iot_script_path):
            subprocess.Popen(['python', 'start_iot_sensor.py'], cwd=os.path.dirname(os.path.dirname(__file__)))
            print("IoT sensor script auto-started.")
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
