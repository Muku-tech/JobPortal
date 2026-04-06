const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { verifyToken } = require("../middleware/auth"); // Adjust path to your auth middleware

// 1. Static/Specific Routes (Place these first)
router.get("/grouped", jobController.getGroupedJobs);
router.get("/browse", jobController.getAllJobs); // Matches your exports.getAllJobs
router.get("/featured", jobController.getFeaturedJobs);
router.get("/categories", jobController.getCategories);

// 2. Saved Jobs Routes (Must be above /:id)
router.get("/saved", verifyToken, jobController.getSavedJobs);
router.post("/save", verifyToken, jobController.saveJob);

// 3. Dynamic Routes (Place these last)
router.get("/:id", jobController.getJobById);
router.put("/:id", verifyToken, jobController.updateJob);
router.delete("/:id", verifyToken, jobController.deleteJob);

module.exports = router;
