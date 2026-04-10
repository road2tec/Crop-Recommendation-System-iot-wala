import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SensorCard from '../components/SensorCard';
import CropRecommendation from '../components/CropRecommendation';

// ─── Sensor Definitions ───────────────────────────────────────────────────────
const SENSORS = [
  {
    id: 'soil',
    name: 'Soil Sensor',
    icon: '🌍',
    color: '#10b981',
    gradient: ['#ecfdf5', '#d1fae5'],
    readings: [
      { key: 'N',  label: 'Nitrogen (N)',   unit: 'mg/kg', min: 0, max: 140, defaultValue: 40  },
      { key: 'P',  label: 'Phosphorus (P)', unit: 'mg/kg', min: 0, max: 145, defaultValue: 60  },
      { key: 'K',  label: 'Potassium (K)',  unit: 'mg/kg', min: 0, max: 205, defaultValue: 80  },
      { key: 'ph', label: 'pH Level',       unit: 'pH',    min: 4, max: 9,   defaultValue: 6.5 },
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
      { key: 'humidity',    label: 'Humidity',    unit: '%',  min: 30, max: 90, defaultValue: 65 },
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


// ─── Toast Component ──────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold
      animate-toast-slide-in flex items-center gap-2
      ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        : toast.type === 'error'  ? 'bg-gradient-to-r from-red-500  to-rose-600   text-white'
        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'}`}>
      {toast.message}
    </div>
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────
const IoTSensorPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── IoT state ──
  const [isSensorConnected,  setIsSensorConnected]  = useState(false);
  const [isWaitingForConn,   setIsWaitingForConn]   = useState(false);
  const [sensorValues,       setSensorValues]        = useState({});
  const [connectionProgress, setConnectionProgress]  = useState(0);
  const [toast,              setToast]               = useState(null);
  const [updateCount,        setUpdateCount]         = useState(0);
  const [lastUpdated,        setLastUpdated]         = useState(null);

  const updateIntervalRef = useRef(null);
  const toastRef          = useRef(null);
  const progressRef       = useRef(null);
  const isWaitingRef      = useRef(false);
  const isConnectedRef    = useRef(false);

  useEffect(() => { isWaitingRef.current  = isWaitingForConn;  }, [isWaitingForConn]);
  useEffect(() => { isConnectedRef.current = isSensorConnected; }, [isSensorConnected]);

  // ── Toast helper ──
  const showToast = useCallback((message, type = 'info') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Value generator ──
  const randomVal = (min, max, dec = 0) =>
    Number((min + Math.random() * (max - min)).toFixed(dec));

  const generateValues = useCallback(() => ({
    N:           randomVal(0,   140),
    P:           randomVal(0,   145),
    K:           randomVal(0,   205),
    temperature: randomVal(15,  40,  1),
    humidity:    randomVal(30,  90,  1),
    ph:          randomVal(4,   9,   1),
    rainfall:    randomVal(0,   300),
  }), []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONNECT / DISCONNECT
  // ─────────────────────────────────────────────────────────────────────────────
  const connectSensors = useCallback((deviceName = '') => {
    if (isConnectedRef.current) return;

    setIsWaitingForConn(false);
    setIsSensorConnected(true);
    setConnectionProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);

    const vals = generateValues();
    setSensorValues(vals);
    setUpdateCount(1);
    setLastUpdated(new Date());

    showToast('✅ IoT Sensors Connected Successfully', 'success');

    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    updateIntervalRef.current = setInterval(() => {
      setSensorValues(generateValues());
      setUpdateCount(c => c + 1);
      setLastUpdated(new Date());
    }, 900000);
  }, [generateValues, showToast]);

  const disconnectSensors = useCallback((reason = '') => {
    setIsSensorConnected(false);
    setIsWaitingForConn(false);
    setConnectionProgress(0);
    if (progressRef.current)       clearInterval(progressRef.current);
    if (updateIntervalRef.current) { clearInterval(updateIntervalRef.current); updateIntervalRef.current = null; }
    const msg = reason || 'Connection lost';
    showToast(`🔴 IoT Sensors Disconnected — ${msg}`, 'error');
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────────
  // START / STOP WAITING
  // ─────────────────────────────────────────────────────────────────────────────
  const startWaiting = useCallback(() => {
    setIsWaitingForConn(true);
    setConnectionProgress(0);
    showToast('📡 Scanning for IoT devices…', 'info');
    let p = 0;
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => { p = (p + 2) % 100; setConnectionProgress(p); }, 100);
  }, [showToast]);

  const stopWaiting = useCallback(() => {
    setIsWaitingForConn(false);
    setConnectionProgress(0);
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCAL WINDOWS WMI SERVER POLLING (Detects ANY USB device plugged in)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        // Poll the local python server running the WMI script
        const response = await fetch('http://localhost:5005/api/usb-status');
        if (!response.ok) return;
        
        const data = await response.json();
        
        // If device connected but we are currently disconnected
        if (data.connected && !isConnectedRef.current) {
          connectSensors(data.device_name || 'Hardware Sensor');
        }
        // If device disconnected but we are currently connected
        else if (!data.connected && isConnectedRef.current) {
          disconnectSensors('Device removed');
        }
      } catch (err) {
        // server might not be running yet, fail silently
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [connectSensors, disconnectSensors]);



  // ─────────────────────────────────────────────────────────────────────────────
  // TAB VISIBILITY / WINDOW BLUR → disconnect if tab is hidden
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onVis = () => { if (document.hidden && isConnectedRef.current) disconnectSensors('Session ended'); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [disconnectSensors]);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTO-START WAITING on page load so USB plug alone works immediately
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Small delay so the page finishes rendering first
    const t = setTimeout(() => startWaiting(), 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  // ── Cleanup on unmount ──
  useEffect(() => () => {
    [updateIntervalRef, toastRef, progressRef].forEach(r => {
      if (r.current) { clearInterval(r.current); clearTimeout(r.current); }
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONNECT BUTTON (manual click)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleConnectClick = () => {
    if (isSensorConnected) {
      disconnectSensors('Manually disconnected');
      return;
    }
    if (isWaitingForConn) {
      stopWaiting();
      return;
    }
    startWaiting();
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40">
      <Toast toast={toast} />

      {/* ── Navbar ── */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📡</span> IoT Sensor Panel
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Welcome, <span className="font-semibold text-gray-700">{user?.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Hero / Status Bar ── */}
        <div className={`relative overflow-hidden rounded-3xl mb-10 p-8 transition-all duration-700 ${
          isSensorConnected
            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-2xl shadow-green-500/25'
            : isWaitingForConn
              ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-2xl shadow-blue-500/20'
              : 'bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 shadow-xl'
        }`}>
          {/* Background orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white/20 backdrop-blur-sm ${isSensorConnected ? 'animate-float' : ''}`}>
                📡
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">IoT Sensor Simulation</h2>
                <p className="text-white/70 text-sm mt-1">Real-time agricultural monitoring system</p>

                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isSensorConnected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isSensorConnected ? 'bg-green-300 animate-pulse'
                        : isWaitingForConn ? 'bg-yellow-300 animate-pulse'
                        : 'bg-red-400'
                    }`} />
                    {isSensorConnected ? 'CONNECTED' : isWaitingForConn ? 'SCANNING...' : 'DISCONNECTED'}
                  </span>

                  {isSensorConnected && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white animate-badge-pop">
                      LIVE • {updateCount} updates
                    </span>
                  )}


                </div>
              </div>
            </div>

            {/* Connect / Disconnect button */}
            <button
              id="iot-connect-button"
              onClick={handleConnectClick}
              className={`shrink-0 flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-sm
                transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                isSensorConnected
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/30'
                  : isWaitingForConn
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-yellow-900/20'
                    : 'bg-white text-gray-800 hover:bg-gray-50 shadow-black/20'
              }`}
            >
              {isSensorConnected ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Disconnect
                </>
              ) : isWaitingForConn ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Stop Scanning
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Connect Sensor
                </>
              )}
            </button>
          </div>

          {/* Scanning bar */}
          {isWaitingForConn && (
            <div className="relative mt-6 animate-fade-in">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/70 rounded-full transition-all duration-100"
                  style={{ width: `${connectionProgress}%` }}
                />
              </div>
              <p className="text-white/60 text-xs mt-3 text-center animate-pulse">
                Searching for IoT devices…
              </p>
            </div>
          )}

          {/* Last updated */}
          {isSensorConnected && lastUpdated && (
            <p className="relative text-white/50 text-xs mt-4">
              Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 15 min
            </p>
          )}
        </div>

        {/* ── Sensor Cards Grid ── */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {SENSORS.map(sensor => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isConnected={isSensorConnected}
              values={sensorValues}
            />
          ))}
        </div>

        {/* ── Crop Recommendation Section ── */}
        <div className="mb-10">
          <CropRecommendation
            sensorValues={sensorValues}
            isConnected={isSensorConnected}
          />
        </div>

        {/* ── Go to Dashboard CTA when live ── */}
        {isSensorConnected && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌱</span>
              <div>
                <p className="font-bold text-green-800">Sensors are live!</p>
                <p className="text-sm text-green-600">Go to Dashboard to use sensor data for crop prediction.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="shrink-0 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md shadow-green-500/25 transition-all hover:scale-105"
            >
              Go to Dashboard →
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default IoTSensorPage;
