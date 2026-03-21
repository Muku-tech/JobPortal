const express = require("express");
const router = express.Router();
const { User, Job, Application } = require("../models");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const multer = require("multer");
const path = require("path");

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      skills,
      education,
      experience,
      preferred_job_type,
      preferred_location,
      languages,
      company_description,
      website,
      industry,
      company_size,
    } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
      skills: skills || user.skills,
      education: education || user.education,
      experience: experience || user.experience,
      preferred_job_type:
        preferred_job_type !== undefined
          ? preferred_job_type
          : user.preferred_job_type,
      preferred_location:
        preferred_location !== undefined
          ? preferred_location
          : user.preferred_location,
      languages: languages !== undefined ? languages : user.languages,
      company_description:
        company_description !== undefined
          ? company_description
          : user.company_description,
      website: website !== undefined ? website : user.website,
      industry: industry !== undefined ? industry : user.industry,
      company_size:
        company_size !== undefined ? company_size : user.company_size,
    });
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update resume URL
router.put("/resume", auth, async (req, res) => {
  try {
    const { resume_url } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.update({ resume_url });
    res.json({ message: "Resume updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user applications
router.get("/applications", auth, async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company_name", "location", "job_type"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/logos/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only images")),
});

// Upload logo
router.post("/logo", auth, upload.single("logo"), userController.uploadLogo);

module.exports = router;
