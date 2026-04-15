const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");

// Get all notifications for logged-in user (with sender)
router.get("/", auth, notificationController.getNotifications);

// Get unread count
router.get("/count", auth, notificationController.getUnreadCount);

// Mark a specific notification as read
router.put("/:id/read", auth, notificationController.markRead);

// Mark all notifications as read
router.put("/read-all", auth, notificationController.markAllRead);

// Send message/notification to applicant (employer)
router.post("/", auth, notificationController.sendMessage);

module.exports = router;
