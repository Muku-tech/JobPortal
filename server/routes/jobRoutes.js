const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

// Existing routes
router.get("/grouped", jobController.getGroupedJobs);

// NEW: Browse Jobs with filters and search
router.get("/browse", jobController.getBrowseJobs);

module.exports = router;