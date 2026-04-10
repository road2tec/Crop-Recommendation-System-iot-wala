import React from 'react';

const SensorCard = ({ sensor, isConnected, values }) => {
  const { name, icon, color, gradient, readings } = sensor;

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
      isConnected 
        ? 'border-green-300/50 shadow-lg shadow-green-500/10' 
        : 'border-gray-200 shadow-md'
    }`}
    style={{
      background: isConnected
        ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`
        : 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    }}
    >
      {/* Animated background pulse when connected */}
      {isConnected && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 animate-pulse-slow"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${color}33, transparent 70%)`
            }}
          />
        </div>
      )}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-500 ${
              isConnected ? 'animate-float' : ''
            }`}
            style={{
              background: isConnected ? `${color}20` : '#e2e8f0',
            }}
            >
              {icon}
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isConnected ? 'text-gray-800' : 'text-gray-500'}`}>
                {name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'
                }`} />
                <span className={`text-xs font-medium ${
                  isConnected ? 'text-green-700' : 'text-red-400'
                }`}>
                  {isConnected ? 'Active' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Badge */}
          {isConnected && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white animate-badge-pop">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[10px] font-bold tracking-wider">LIVE</span>
            </div>
          )}
        </div>

        {/* Readings Grid */}
        <div className={`grid gap-3 ${readings.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {readings.map((reading, idx) => {
            const value = values?.[reading.key];
            return (
              <div
                key={reading.key}
                className={`rounded-xl p-3 transition-all duration-500 ${
                  isConnected
                    ? 'bg-white/60 backdrop-blur-sm'
                    : 'bg-white/40'
                }`}
              >
                <p className={`text-[11px] font-medium mb-1 ${
                  isConnected ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {reading.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold tabular-nums transition-all duration-300 ${
                    isConnected ? 'text-gray-800' : 'text-gray-400'
                  } ${isConnected ? 'sensor-value-update' : ''}`}>
                    {value !== undefined ? value : reading.defaultValue}
                  </span>
                  <span className={`text-xs ${isConnected ? 'text-gray-500' : 'text-gray-400'}`}>
                    {reading.unit}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="mt-2 h-1.5 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(((value !== undefined ? value : reading.defaultValue) / reading.max) * 100, 100)}%`,
                      background: isConnected
                        ? `linear-gradient(90deg, ${color}, ${color}aa)`
                        : '#cbd5e1',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
