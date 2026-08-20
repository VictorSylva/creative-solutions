const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

// In-memory token secret that updates on server startup to secure sessions
const JWT_SECRET = process.env.JWT_SECRET || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const auth = {
  login(password) {
    const settings = db.getSettings();
    const isMatch = bcrypt.compareSync(password, settings.adminPasswordHash);
    
    if (isMatch) {
      // Create a token valid for 24 hours
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return { success: true, token };
    }
    return { success: false, error: 'Invalid password' };
  },

  updatePassword(oldPassword, newPassword) {
    const settings = db.getSettings();
    const isMatch = bcrypt.compareSync(oldPassword, settings.adminPasswordHash);
    
    if (!isMatch) {
      return { success: false, error: 'Incorrect current password' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    const adminPasswordHash = bcrypt.hashSync(newPassword, 10);
    db.updateSettings({ adminPasswordHash });
    return { success: true };
  },

  // Express middleware to verify token
  requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }
};

module.exports = auth;
