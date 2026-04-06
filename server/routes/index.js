const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const jobRoutes = require("./jobs");
const applicationRoutes = require("./applications");
const userRoutes = require("./users");
const recommendationRoutes = require("./recommendations");
const notificationRoutes = require("./notifications");
const resumeRoutes = require("./resumes");

router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/users", userRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/resumes", resumeRoutes);

module.exports = router;
