import React from 'react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getApprovedFeedback } from '../services/feedbackService';

const Home = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await getApprovedFeedback(6);
        setTestimonials(response.feedbacks);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      }
    };
    fetchTestimonials();
  }, []);

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

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  
                  {/* Message */}
                  <p className="text-gray-700 mb-4 italic">"{testimonial.message}"</p>
                  
                  {/* User Name */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                      {testimonial.userId?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900 font-semibold">{testimonial.userId?.name || 'Anonymous'}</p>
                      <p className="text-gray-500 text-sm">Verified User</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
