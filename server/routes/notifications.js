const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const auth = require('../middleware/auth');

// Get all notifications for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark a specific notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ is_read: true });
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router;
