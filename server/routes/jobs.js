const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

// Public routes
router.get("/", jobController.getAllJobs);
router.get("/grouped", jobController.getGroupedJobs);
router.get("/top-companies", jobController.getTopCompanies);
router.get("/categories", jobController.getCategories);
router.get("/featured", jobController.getFeaturedJobs);

// Employer routes (must come BEFORE :id)
router.get("/employer", auth.verifyToken, jobController.getEmployerJobs);

// Public single job
router.get("/:id", jobController.getJobById);

// Protected routes
router.post("/", auth.verifyToken, jobController.createJob);
router.post("/save", auth.verifyToken, jobController.saveJob);
router.get("/saved", auth.verifyToken, jobController.getSavedJobs);
router.put("/:id", auth.verifyToken, jobController.updateJob);
router.delete("/:id", auth.verifyToken, jobController.deleteJob);

module.exports = router;
