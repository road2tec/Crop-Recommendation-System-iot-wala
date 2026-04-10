/**
 * Feedback Controller - Handle user feedback operations
 */

const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Submit feedback (authenticated users)
exports.submitFeedback = async (req, res) => {
  try {
    const { message, rating } = req.body;
    const userId = req.user.userId || req.user.id; // Support both formats

    // Validate input
    if (!message || !rating) {
      return res.status(400).json({ error: 'Message and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Create feedback
    const feedback = new Feedback({
      userId,
      message,
      rating
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        _id: feedback._id,
        message: feedback.message,
        rating: feedback.rating,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all feedback (admin only)
exports.getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments();

    res.json({
      feedbacks,
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

// Get approved feedback (public)
exports.getApprovedFeedback = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const feedbacks = await Feedback.find({ isApproved: true })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('message rating userId createdAt');

    res.json({ feedbacks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve/Unapprove feedback (admin only)
exports.toggleApproveFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    feedback.isApproved = !feedback.isApproved;
    await feedback.save();

    res.json({
      message: `Feedback ${feedback.isApproved ? 'approved' : 'unapproved'} successfully`,
      feedback: {
        _id: feedback._id,
        isApproved: feedback.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete feedback (admin only)
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's own feedback
exports.getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id; // Support both formats

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const feedbacks = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .select('message rating isApproved createdAt');

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ error: error.message });
  }
};
