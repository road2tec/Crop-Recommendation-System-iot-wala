/**
 * Admin Controller - User management and system monitoring
 */

const User = require('../models/User');
const Prediction = require('../models/Prediction');
const bcrypt = require('bcryptjs');

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(searchQuery);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new user (by admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = new User({ name, email, password, role: role || 'user' });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive !== 'undefined') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalPredictions,
      recentPredictions,
      newUsersToday,
      predictionsToday
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ lastLogin: { $gte: last24Hours } }),
      Prediction.countDocuments(),
      Prediction.countDocuments({ timestamp: { $gte: last24Hours } }),
      User.countDocuments({ createdAt: { $gte: last24Hours } }),
      Prediction.countDocuments({ timestamp: { $gte: last24Hours } })
    ]);

    // Get crop distribution
    const cropDistribution = await Prediction.aggregate([
      { $group: { _id: '$predictedCrop', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get user growth (last 7 days)
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalPredictions,
        recentPredictions,
        newUsersToday,
        predictionsToday
      },
      cropDistribution: cropDistribution.map(item => ({
        crop: item._id,
        count: item.count
      })),
      userGrowth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get recent predictions
exports.getRecentPredictions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const predictions = await Prediction.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user activity
exports.getUserActivity = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const predictions = await Prediction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    const user = await User.findById(userId).select('-password');

    res.json({
      user,
      predictions,
      stats: {
        totalPredictions: predictions.length,
        lastActivity: predictions[0]?.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
