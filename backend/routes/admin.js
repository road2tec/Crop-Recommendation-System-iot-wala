/**
 * Admin Routes
 * Protected routes for admin user management and monitoring
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(auth, adminAuth);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Statistics & Monitoring
router.get('/statistics', adminController.getStatistics);
router.get('/predictions/recent', adminController.getRecentPredictions);
router.get('/users/:id/activity', adminController.getUserActivity);

module.exports = router;
