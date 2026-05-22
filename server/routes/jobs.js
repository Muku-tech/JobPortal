const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const auth = require("../middleware/auth");

router.get("/", jobController.getAllJobs);
router.get("/grouped", jobController.getGroupedJobs);
router.get("/top-companies", jobController.getTopCompanies);
router.get("/categories", jobController.getCategories);
router.get("/featured", jobController.getFeaturedJobs);
router.get("/category", jobController.getCategoryJobs);

router.get("/employer", auth.verifyToken, jobController.getEmployerJobs);

router.get("/:id", jobController.getJobById);
router.get("/:id/skillgap", auth.verifyToken, jobController.getSkillGap);

router.post("/", auth.verifyToken, jobController.createJob);

router.put("/:id", auth.verifyToken, jobController.updateJob);
router.delete("/:id", auth.verifyToken, jobController.deleteJob);

module.exports = router;
