const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const auth = require("../middleware/auth");

// Get all messages for logged-in user (recipient)
router.get("/", auth, messageController.getMessages);

// Get unread count
router.get("/count", auth, messageController.getUnreadCount);

// Mark specific message as read
router.put("/:id/read", auth, messageController.markRead);

// Mark all messages as read
router.put("/read-all", auth, messageController.markAllRead);

// Send message to user
router.post("/", auth, messageController.sendMessage);

// One-time seed (remove after use)
router.get("/seed", messageController.seedTestMessages);

module.exports = router;
