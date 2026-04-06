const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");
const auth = require("../middleware/auth");

// Get all resumes for user
router.get("/", auth.verifyToken, resumeController.getResumes);

// Get single resume
router.get("/:id", auth.verifyToken, resumeController.getResume);

// Create new resume
router.post("/", auth.verifyToken, resumeController.createResume);

// Update resume
router.put("/:id", auth.verifyToken, resumeController.updateResume);

// Delete resume
router.delete("/:id", auth.verifyToken, resumeController.deleteResume);

// Set default resume
router.patch(
  "/:id/default",
  auth.verifyToken,
  resumeController.setDefaultResume,
);

module.exports = router;
