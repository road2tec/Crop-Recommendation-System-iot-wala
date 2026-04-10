import React, { useState, useEffect } from 'react';
import { getCropPrediction, getPredictionHistory } from '../services/predictionService';

const CropRecommendation = ({ sensorValues, isConnected }) => {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    if (isConnected) {
      loadHistory();
    }
  }, [isConnected]);

  const loadHistory = async () => {
    try {
      const data = await getPredictionHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleGetRecommendation = async () => {
    if (!sensorValues || Object.keys(sensorValues).length === 0) {
      setError('No sensor data available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getCropPrediction(sensorValues);
      setPrediction(result);
      await loadHistory(); // Refresh history after new prediction
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 text-center">
        <div className="text-6xl mb-4">🌾</div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">Crop Recommendation</h3>
        <p className="text-sm text-gray-500">Connect sensors to get crop recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Prediction Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/60 shadow-xl">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-green-500/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-emerald-500/5 translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl shadow-lg shadow-green-500/30 animate-float">
                🌾
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Crop Recommendation</h2>
                <p className="text-sm text-gray-600 mt-1">AI-powered crop prediction based on sensor data</p>
              </div>
            </div>
            
            <button
              onClick={handleGetRecommendation}
              disabled={loading || !isConnected}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 active:scale-95 shadow-green-500/30'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Get Recommendation
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-red-800 text-sm">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Prediction Result */}
          {prediction && (
            <div className="space-y-4 animate-fade-in">
              {/* Main Prediction */}
              <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-green-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Recommended Crop</h3>
                  <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                    {Math.round(prediction.confidence * 100)}% Confidence
                  </span>
                </div>
                <p className="text-4xl font-bold text-green-600 capitalize">{prediction.prediction}</p>
              </div>

              {/* Similar Crops */}
              {prediction.similarCrops && prediction.similarCrops.length > 0 && (
                <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-green-100">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Alternative Crops</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {prediction.similarCrops.map((crop, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                        <p className="font-bold text-gray-700 capitalize mb-1">{crop.crop}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.round(crop.probability * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">
                            {Math.round(crop.probability * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensor Values Used */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <details className="cursor-pointer">
                  <summary className="text-sm font-semibold text-blue-700 mb-2 select-none">
                    📊 Sensor Data Used
                  </summary>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {Object.entries(sensorValues).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-gray-500 uppercase">{key}:</span>
                        <span className="ml-1 font-semibold text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📜</span>
              <div className="text-left">
                <h3 className="font-bold text-gray-800">Prediction History</h3>
                <p className="text-sm text-gray-500">{history.length} predictions saved</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHistory && (
            <div className="border-t border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {history.map((item, idx) => (
                <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-green-600 capitalize">{item.predictedCrop}</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          {Math.round((item.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                        View Data
                      </summary>
                      <div className="mt-2 p-3 rounded-lg bg-gray-100 space-y-1 min-w-[200px]">
                        {item.inputData && Object.entries(item.inputData).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 uppercase">{key}:</span>
                            <span className="font-semibold text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;
