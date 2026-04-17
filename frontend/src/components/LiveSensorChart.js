import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LiveSensorChart = ({ sensorValues, isConnected, apiClimate }) => {
  const [chartData, setChartData] = useState({
    temperature: [],
    humidity: [],
    timestamps: []
  });
  const [maxDataPoints] = useState(20); // Show last 20 readings
  const latestValuesRef = useRef({ temperature: null, humidity: null });

  const toValidNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const climateValues = {
    temperature: toValidNumber(apiClimate?.temperature) ?? toValidNumber(sensorValues?.temperature),
    humidity: toValidNumber(apiClimate?.humidity) ?? toValidNumber(sensorValues?.humidity),
  };

  const climateSource = apiClimate?.temperature != null && apiClimate?.humidity != null
    ? 'Weather API'
    : 'IoT Sensor';

  const appendPoint = useCallback((temperature, humidity) => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });

    setChartData(prevData => {
      const newData = { ...prevData };
      
      const lastIndex = newData.timestamps.length - 1;

      // If another update arrives in the same second, refresh the latest point.
      if (lastIndex >= 0 && newData.timestamps[lastIndex] === timeLabel) {
        newData.temperature[lastIndex] = temperature;
        newData.humidity[lastIndex] = humidity;
      } else {
        newData.temperature.push(temperature);
        newData.humidity.push(humidity);
        newData.timestamps.push(timeLabel);
      }
      
      // Keep only last maxDataPoints
      if (newData.temperature.length > maxDataPoints) {
        newData.temperature = newData.temperature.slice(-maxDataPoints);
        newData.humidity = newData.humidity.slice(-maxDataPoints);
        newData.timestamps = newData.timestamps.slice(-maxDataPoints);
      }

      return newData;
    });
  }, [maxDataPoints]);

  // Keep latest value snapshot in a ref for interval-based chart updates.
  useEffect(() => {
    latestValuesRef.current = {
      temperature: climateValues.temperature,
      humidity: climateValues.humidity,
    };
  }, [climateValues.temperature, climateValues.humidity]);

  // Continuously add chart points while connected so the graph doesn't look empty/static.
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const { temperature, humidity } = latestValuesRef.current;
    if (temperature != null && humidity != null) {
      appendPoint(temperature, humidity);
    }

    const intervalId = setInterval(() => {
      const current = latestValuesRef.current;
      if (current.temperature == null || current.humidity == null) {
        return;
      }
      appendPoint(current.temperature, current.humidity);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isConnected, appendPoint]);

  // Clear data when disconnected
  useEffect(() => {
    if (!isConnected) {
      setChartData({
        temperature: [],
        humidity: [],
        timestamps: []
      });
    }
  }, [isConnected]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: '🌡️ Live Temperature & Humidity Monitor',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#374151'
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Value',
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        suggestedMin: 0,
        suggestedMax: 100
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuart'
    }
  };

  const data = {
    labels: chartData.timestamps,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: chartData.temperature,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
      {
        label: 'Humidity (%)',
        data: chartData.humidity,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      },
    ],
  };

  if (!isConnected) {
    return (
      <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-bold text-gray-700 mb-2">Live Sensor Charts</h3>
        <p className="text-sm text-gray-500">Connect sensors to view live temperature & humidity graphs</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
            📊
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Live Data Visualization</h3>
            <p className="text-sm text-gray-600">Real-time temperature & humidity tracking ({climateSource})</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
          <a
            href="http://192.168.1.4/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
              transition: 'background 0.2s, transform 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4338ca'; e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="Open IoT Sensor Dashboard at 192.168.1.4"
          >
            📡 Open IoT Dashboard
          </a>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {chartData.timestamps.length > 0 ? (
          <Line data={data} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-sm">Collecting data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Values */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌡️</span>
            <span className="text-sm font-semibold text-red-700">Temperature</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {climateValues.temperature ?? '—'}<span className="text-sm ml-1 text-red-500">°C</span>
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💧</span>
            <span className="text-sm font-semibold text-blue-700">Humidity</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {climateValues.humidity ?? '—'}<span className="text-sm ml-1 text-blue-500">%</span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Data Source: <span className="font-semibold">{climateSource}</span>
      </p>
    </div>
  );
};

export default LiveSensorChart;