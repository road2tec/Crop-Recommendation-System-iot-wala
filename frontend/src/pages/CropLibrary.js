import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // Use the configured API service instead of raw axios

const CropLibrary = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [catalogCrops, setCatalogCrops] = useState([]);
  const [selectedCatalogCropName, setSelectedCatalogCropName] = useState('');
  const [selectedCatalogCrop, setSelectedCatalogCrop] = useState(null);

  useEffect(() => {
    fetchCrops();
    fetchSeasons();
    fetchCatalogCrops();
  }, []);

  useEffect(() => {
    filterCrops();
  }, [search, selectedSeason, crops]);

  const fetchCrops = async () => {
    try {
      const response = await api.get('/crops');
      setCrops(response.data.crops || []); // Handle potential undefined
      setFilteredCrops(response.data.crops || []);
    } catch (error) {
      console.error('Failed to fetch crops:', error);
      // Set empty array as fallback
      setCrops([]);
      setFilteredCrops([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await api.get('/crops/seasons');
      setSeasons(response.data.seasons || []);
    } catch (error) {
      console.error('Failed to fetch seasons:', error);
      setSeasons(['Kharif', 'Rabi', 'Zaid', 'Perennial']); // Fallback seasons
    }
  };

  const fetchCatalogCrops = async () => {
    try {
      const response = await api.get('/crops/catalog');
      setCatalogCrops(response.data.crops || []);
    } catch (error) {
      console.error('Failed to fetch crop catalog:', error);
      setCatalogCrops([]);
    }
  };

  const handleCatalogCropChange = async (event) => {
    const cropName = event.target.value;
    setSelectedCatalogCropName(cropName);

    if (!cropName) {
      setSelectedCatalogCrop(null);
      return;
    }

    try {
      const response = await api.get(`/crops/catalog/${cropName}`);
      setSelectedCatalogCrop(response.data.crop || null);
    } catch (error) {
      console.error('Failed to fetch selected crop catalog info:', error);
      setSelectedCatalogCrop(null);
    }
  };

  const filterCrops = () => {
    let filtered = crops;

    if (search) {
      filtered = filtered.filter(crop =>
        crop.displayName.toLowerCase().includes(search.toLowerCase()) ||
        crop.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedSeason) {
      filtered = filtered.filter(crop => crop.season === selectedSeason);
    }

    setFilteredCrops(filtered);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getCropIcon = (cropName) => {
    const icons = {
      rice: '🌾',
      wheat: '🌾',
      cotton: '🌱',
      maize: '🌽',
      sugarcane: '🎋',
      chickpea: '🫘',
      kidneybeans: '🫘',
      jute: '🌿',
      coconut: '🥥',
      papaya: '🥭'
    };
    return icons[cropName] || '🌱';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-green-600">📚 Crop Library</h1>
              <p className="text-sm text-gray-500 mt-1">Browse available crops and their ideal growing conditions</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium"
              >
                ← Back to Dashboard
              </button>
              <span className="text-gray-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Crops
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Season Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Season
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Seasons</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>

            {/* 22 Crop Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Crop (22 List)
              </label>
              <select
                value={selectedCatalogCropName}
                onChange={handleCatalogCropChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose crop</option>
                {catalogCrops.map(crop => (
                  <option key={crop.name} value={crop.name}>{crop.displayName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Crop Info from 22-crop dropdown */}
        {selectedCatalogCrop && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-900">
                {selectedCatalogCrop.displayName} - Climate Snapshot
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                Dataset Based
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.temperature}°C</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Humidity</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.humidity}%</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">pH</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.ph}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Rainfall</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.rainfall} mm</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Nitrogen (N)</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.nitrogen}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Phosphorus (P)</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.phosphorus}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Potassium (K)</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.climate.potassium}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-500">Samples</p>
                <p className="text-lg font-bold text-gray-800">{selectedCatalogCrop.sampleCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Crops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <div
              key={crop._id}
              onClick={() => setSelectedCrop(crop)}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-4xl mr-3">{getCropIcon(crop.name)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{crop.displayName}</h3>
                    <span className="text-sm text-gray-500">{crop.season}</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{crop.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Temperature:</span>
                  <span className="font-medium">{crop.idealConditions.temperature.optimal}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">pH Range:</span>
                  <span className="font-medium">
                    {crop.idealConditions.ph.min} - {crop.idealConditions.ph.max}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{crop.growingPeriod}</span>
                </div>
              </div>

              <button className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                View Details
              </button>
            </div>
          ))}
        </div>

        {filteredCrops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No crops found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <span className="text-5xl mr-4">{getCropIcon(selectedCrop.name)}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">{selectedCrop.displayName}</h2>
                    <p className="text-gray-500">{selectedCrop.season} Season • {selectedCrop.growingPeriod}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCrop(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-700 mb-6">{selectedCrop.description}</p>

              {/* Ideal Conditions */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Ideal Growing Conditions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Nitrogen (N)</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.nitrogen.optimal} kg/ha
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.nitrogen.min} - {selectedCrop.idealConditions.nitrogen.max}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Phosphorus (P)</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.phosphorus.optimal} kg/ha
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.phosphorus.min} - {selectedCrop.idealConditions.phosphorus.max}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Potassium (K)</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.potassium.optimal} kg/ha
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.potassium.min} - {selectedCrop.idealConditions.potassium.max}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.temperature.optimal}°C
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.temperature.min}°C - {selectedCrop.idealConditions.temperature.max}°C
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Humidity</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.humidity.optimal}%
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.humidity.min}% - {selectedCrop.idealConditions.humidity.max}%
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">pH Level</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.ph.optimal}
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.ph.min} - {selectedCrop.idealConditions.ph.max}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Rainfall</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedCrop.idealConditions.rainfall.optimal}mm
                    </p>
                    <p className="text-xs text-gray-400">
                      Range: {selectedCrop.idealConditions.rainfall.min}mm - {selectedCrop.idealConditions.rainfall.max}mm
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Soil Types</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedCrop.soilType.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits & Tips */}
              <div className="grid md:grid-cols-2 gap-6">
                {selectedCrop.benefits && selectedCrop.benefits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Benefits</h3>
                    <ul className="space-y-2">
                      {selectedCrop.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedCrop.tips && selectedCrop.tips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Growing Tips</h3>
                    <ul className="space-y-2">
                      {selectedCrop.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">💡</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropLibrary;
