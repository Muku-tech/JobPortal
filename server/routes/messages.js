const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const auth = require("../middleware/auth");

router.get("/", auth, messageController.getMessages);

router.get("/count", auth, messageController.getUnreadCount);

router.put("/:id/read", auth, messageController.markRead);

router.put("/read-all", auth, messageController.markAllRead);

router.post("/", auth, messageController.sendMessage);

router.get("/seed", messageController.seedTestMessages);

module.exports = router;
