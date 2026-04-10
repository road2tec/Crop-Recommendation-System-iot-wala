/**
 * Feedback Routes
 * Routes for user feedback submission and admin management
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const feedbackController = require('../controllers/feedbackController');

// Public routes
router.get('/approved', feedbackController.getApprovedFeedback);

// Authenticated user routes
router.post('/', auth, feedbackController.submitFeedback);
router.get('/my-feedback', auth, feedbackController.getUserFeedback);

// Admin only routes
router.get('/all', auth, adminAuth, feedbackController.getAllFeedback);
router.put('/:id/toggle-approve', auth, adminAuth, feedbackController.toggleApproveFeedback);
router.delete('/:id', auth, adminAuth, feedbackController.deleteFeedback);

module.exports = router;
