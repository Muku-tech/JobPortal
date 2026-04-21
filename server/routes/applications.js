const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/auth");
const messageController = require("../controllers/messageController");

// Apply for a job
router.post("/", auth.verifyToken, applicationController.applyForJob);

// FIXED: Changed from /my-applications to /user to match frontend api.get("/applications/user")
router.get("/user", auth.verifyToken, applicationController.getMyApplications);

// Get all applications for current employer
router.get(
  "/employer-all",
  auth.verifyToken,
  applicationController.getEmployerApplications,
);

// Get applications for a specific job (employer)
router.get(
  "/job/:jobId",
  auth.verifyToken,
  applicationController.getJobApplications,
);

// Action-based updates (employer)
router.post(
  "/:id/action",
  auth.verifyToken,
  require("../controllers/applicationActionController").performAction,
);

// Get messages for application
router.get(
  "/:id/messages",
  auth.verifyToken,
  require("../controllers/applicationActionController").getApplicationMessages,
);

// Get unread message count for application (for employer)
router.get(
  "/:id/messages-count",
  auth.verifyToken,
  messageController.getUnreadPerApp,
);

// Mark all messages for application as read (TEMPORARILY DISABLED due to undefined callback)
// router.put(
//   "/:id/messages/read-all",
//   auth.verifyToken,
//   messageController.markAppAllRead,
// );

module.exports = router;
