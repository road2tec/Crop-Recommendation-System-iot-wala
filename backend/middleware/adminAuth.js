/**
 * Admin Authorization Middleware
 * Checks if authenticated user has admin role
 */

const adminAuth = async (req, res, next) => {
  try {
    // Assumes regular auth middleware has already run and set req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization error' });
  }
};

module.exports = adminAuth;
