import React, { useState, useEffect, useCallback, useRef } from 'react';
import SensorCard from './SensorCard';

// Sensor definitions
const SENSORS = [
  {
    id: 'soil',
    name: 'Soil Sensor',
    icon: '🌍',
    color: '#10b981',
    gradient: ['#ecfdf5', '#d1fae5'],
    readings: [
      { key: 'N', label: 'Nitrogen (N)', unit: 'mg/kg', min: 0, max: 140, defaultValue: 40 },
      { key: 'P', label: 'Phosphorus (P)', unit: 'mg/kg', min: 0, max: 145, defaultValue: 60 },
      { key: 'K', label: 'Potassium (K)', unit: 'mg/kg', min: 0, max: 205, defaultValue: 80 },
      { key: 'ph', label: 'pH Level', unit: 'pH', min: 4, max: 9, defaultValue: 6.5 },
    ],
  },
  {
    id: 'climate',
    name: 'Climate Sensor',
    icon: '🌡️',
    color: '#3b82f6',
    gradient: ['#eff6ff', '#dbeafe'],
    readings: [
      { key: 'temperature', label: 'Temperature', unit: '°C', min: 15, max: 40, defaultValue: 25 },
      { key: 'humidity', label: 'Humidity', unit: '%', min: 30, max: 90, defaultValue: 65 },
    ],
  },
  {
    id: 'rain',
    name: 'Rain Sensor',
    icon: '🌧️',
    color: '#6366f1',
    gradient: ['#eef2ff', '#e0e7ff'],
    readings: [
      { key: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 300, defaultValue: 100 },
    ],
  },
];

const INACTIVITY_TIMEOUT = 8000; // 8 seconds of no activity = disconnect

const IoTPanel = ({ onSensorValuesChange, onConnectionChange }) => {
  const [isSensorConnected, setIsSensorConnected] = useState(false);
  const [isWaitingForConnection, setIsWaitingForConnection] = useState(false);
  const [sensorValues, setSensorValues] = useState({});
  const [toast, setToast] = useState(null);
  const [connectionProgress, setConnectionProgress] = useState(0);

  const updateIntervalRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const isWaitingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isWaitingRef.current = isWaitingForConnection;
  }, [isWaitingForConnection]);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Generate realistic random value within range (slight variation)
  const generateValue = useCallback((min, max, decimals = 0) => {
    const value = min + Math.random() * (max - min);
    return Number(value.toFixed(decimals));
  }, []);

  // Update sensor values with realistic data
  const updateSensorValues = useCallback(() => {
    const newValues = {
      N: generateValue(0, 140),
      P: generateValue(0, 145),
      K: generateValue(0, 205),
      temperature: generateValue(15, 40, 1),
      humidity: generateValue(30, 90, 1),
      ph: generateValue(4, 9, 1),
      rainfall: generateValue(0, 300),
    };
    setSensorValues(newValues);
    if (onSensorValuesChange) {
      onSensorValuesChange(newValues);
    }
  }, [generateValue, onSensorValuesChange]);

  // Connect sensors
  const connectSensors = useCallback(() => {
    setIsWaitingForConnection(false);
    setIsSensorConnected(true);
    setConnectionProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    showToast('🟢 IoT Sensor Connected Successfully!', 'success');
    if (onConnectionChange) onConnectionChange(true);

    // Initial value update
    updateSensorValues();

    // Start periodic updates
    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = setInterval(updateSensorValues, 3000);
  }, [showToast, updateSensorValues, onConnectionChange]);

  // Disconnect sensors
  const disconnectSensors = useCallback(() => {
    setIsSensorConnected(false);
    setIsWaitingForConnection(false);
    setConnectionProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    showToast('🔴 Sensor Disconnected — No device activity detected', 'error');
    if (onConnectionChange) onConnectionChange(false);

    // Stop updates
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    // Freeze last values (don't clear them)
  }, [showToast, onConnectionChange]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      disconnectSensors();
    }, INACTIVITY_TIMEOUT);
  }, [disconnectSensors]);

  // Handle device event detection (for connection)
  const handleDeviceEvent = useCallback(() => {
    if (isWaitingRef.current) {
      connectSensors();
    }
  }, [connectSensors]);

  // Handle activity events (for keeping connection alive)
  const handleActivityEvent = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Connect button click handler
  const handleConnectClick = () => {
    if (isSensorConnected) {
      // Disconnect
      disconnectSensors();
      // Remove event listeners
      window.removeEventListener('mousemove', handleActivityEvent);
      window.removeEventListener('keydown', handleActivityEvent);
      window.removeEventListener('click', handleActivityEvent);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    // Enter waiting mode
    setIsWaitingForConnection(true);
    setConnectionProgress(0);
    showToast('⏳ Waiting for device... Move mouse, press a key, or plug in a USB device', 'info');

    // Start a scanning animation progress bar
    let progress = 0;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      progress += 2;
      if (progress >= 100) progress = 0;
      setConnectionProgress(progress);
    }, 100);

    // Listen for device events
    window.addEventListener('mousemove', handleDeviceEvent, { once: true });
    window.addEventListener('keydown', handleDeviceEvent, { once: true });
    window.addEventListener('click', handleDeviceEvent, { once: true });
  };

  // Activity listeners when connected
  useEffect(() => {
    if (isSensorConnected) {
      window.addEventListener('mousemove', handleActivityEvent);
      window.addEventListener('keydown', handleActivityEvent);
      window.addEventListener('click', handleActivityEvent);
      resetInactivityTimer();

      return () => {
        window.removeEventListener('mousemove', handleActivityEvent);
        window.removeEventListener('keydown', handleActivityEvent);
        window.removeEventListener('click', handleActivityEvent);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
    }
  }, [isSensorConnected, handleActivityEvent, resetInactivityTimer]);

  // Visibility change detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isSensorConnected) {
        disconnectSensors();
      }
    };

    const handleBlur = () => {
      if (isSensorConnected) {
        disconnectSensors();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSensorConnected, disconnectSensors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold 
            transition-all duration-500 animate-toast-slide-in
            ${toast.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
              : toast.type === 'error'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header with connection strip */}
        <div className={`h-1.5 transition-all duration-700 ${
          isSensorConnected
            ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 animate-gradient-x'
            : isWaitingForConnection
              ? 'bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-gradient-x'
              : 'bg-gray-200'
        }`} />

        <div className="p-6">
          {/* Panel Title & Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                isSensorConnected
                  ? 'bg-green-100 shadow-lg shadow-green-200/50 animate-float'
                  : 'bg-gray-100'
              }`}>
                📡
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">IoT Sensor Panel</h2>
                <p className="text-xs text-gray-500">Real-time agricultural monitoring</p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-500 ${
              isSensorConnected
                ? 'bg-green-100 text-green-700 shadow-md shadow-green-500/10'
                : 'bg-red-50 text-red-500'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                isSensorConnected
                  ? 'bg-green-500 animate-pulse'
                  : isWaitingForConnection
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-red-400'
              }`} />
              {isSensorConnected ? 'CONNECTED' : isWaitingForConnection ? 'SCANNING...' : 'DISCONNECTED'}
            </div>
          </div>

          {/* Connect/Disconnect Button */}
          <button
            id="iot-connect-button"
            onClick={handleConnectClick}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 mb-6 ${
              isSensorConnected
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                : isWaitingForConnection
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/25 cursor-wait'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
            } transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-center justify-center gap-2">
              {isSensorConnected ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Disconnect Sensor
                </>
              ) : isWaitingForConnection ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning for Devices...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect Sensor
                </>
              )}
            </div>
          </button>

          {/* Waiting for Device Message */}
          {isWaitingForConnection && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-2xl animate-bounce-slow">🔌</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800">Waiting for Device Connection</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Please connect any external device (USB / Mouse / Keyboard) or move your mouse to establish a sensor link.
                  </p>
                  {/* Scanning progress bar */}
                  <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-100"
                      style={{ width: `${connectionProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sensor Cards Grid */}
          <div className="grid gap-4">
            {SENSORS.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                isConnected={isSensorConnected}
                values={sensorValues}
              />
            ))}
          </div>

          {/* Data Source Indicator */}
          <div className={`mt-5 p-3 rounded-xl text-center text-xs font-medium transition-all duration-500 ${
            isSensorConnected
              ? 'bg-green-50 text-green-700 border border-green-200/50'
              : 'bg-gray-50 text-gray-500 border border-gray-100'
          }`}>
            {isSensorConnected ? (
              <span className="flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Sensor data auto-filling prediction form • Updates every 3s
              </span>
            ) : (
              '📊 Connect sensors to auto-fill prediction values'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IoTPanel;
