const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const auth = require("../middleware/auth");

// Apply for a job
router.post("/", auth.verifyToken, applicationController.applyForJob);

// FIXED: Changed from /my-applications to /user to match frontend api.get("/applications/user")
router.get(
  "/user",
  auth.verifyToken,
  applicationController.getMyApplications
);

// Get all applications for current employer
router.get(
  "/employer-all",
  auth.verifyToken,
  applicationController.getEmployerApplications
);

// Get applications for a specific job (employer)
router.get(
  "/job/:jobId",
  auth.verifyToken,
  applicationController.getJobApplications
);

// Update application status (employer)
router.put(
  "/:id/status",
  auth.verifyToken,
  applicationController.updateApplicationStatus
);

module.exports = router;