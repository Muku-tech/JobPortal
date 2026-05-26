const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const savedJobController = require("../controllers/savedJobController");
const auth = require("../middleware/auth");

// Public routes
router.get("/", jobController.getAllJobs);
router.get("/grouped", jobController.getGroupedJobs);
router.get("/top-companies", jobController.getTopCompanies);
router.get("/categories", jobController.getCategories);
router.get("/featured", jobController.getFeaturedJobs);
router.get("/category", jobController.getCategoryJobs);

// Employer routes (must come BEFORE :id)
router.get("/employer", auth.verifyToken, jobController.getEmployerJobs);

// Saved jobs (must come BEFORE :id)
router.get("/saved", auth.verifyToken, savedJobController.getSavedJobs);

// Public single job
router.get("/:id", jobController.getJobById);
router.get("/:id/skillgap", auth.verifyToken, jobController.getSkillGap);
router.get("/:id/saved-status", auth.verifyToken, savedJobController.getSavedStatus);

// Protected routes
router.post("/", auth.verifyToken, jobController.createJob);
router.post("/:id/save", auth.verifyToken, savedJobController.toggleSave);

router.put("/:id", auth.verifyToken, jobController.updateJob);
router.delete("/:id", auth.verifyToken, jobController.deleteJob);

module.exports = router;
