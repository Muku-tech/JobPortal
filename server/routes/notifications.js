const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middleware/auth");

router.get("/", auth, notificationController.getNotifications);

router.get("/count", auth, notificationController.getUnreadCount);

router.put("/:id/read", auth, notificationController.markRead);

router.put("/read-all", auth, notificationController.markAllRead);

router.post("/", auth, notificationController.sendMessage);

module.exports = router;
