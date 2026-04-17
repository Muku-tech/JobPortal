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
    console.log("Profile update request:", req.body);

    // Fetch user first to check role
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Normalize arrays
    const normalizeArray = (value, current) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string")
        return value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return current || [];
    };

    // Helper for ENUM fields - null if empty string
    const enumToNull = (value) => (value === "" ? null : value);

    const updateData = {
      name: req.body.name !== undefined ? req.body.name : user.name,
      phone: req.body.phone !== undefined ? req.body.phone : user.phone,
      address: req.body.address !== undefined ? req.body.address : user.address,
      skills: normalizeArray(req.body.skills, user.skills),
      education:
        req.body.education !== undefined ? req.body.education : user.education,
      experience:
        req.body.experience !== undefined
          ? req.body.experience
          : user.experience,
      preferred_job_type: enumToNull(
        req.body.preferred_job_type !== undefined
          ? req.body.preferred_job_type
          : user.preferred_job_type,
      ),

      preferred_location:
        req.body.preferred_location !== undefined
          ? req.body.preferred_location
          : user.preferred_location,
      languages: normalizeArray(req.body.languages, user.languages),
      linkedin:
        req.body.linkedin !== undefined ? req.body.linkedin : user.linkedin,
      github: req.body.github !== undefined ? req.body.github : user.github,
      portfolio:
        req.body.portfolio !== undefined ? req.body.portfolio : user.portfolio,
      salary_expectation:
        req.body.salary_expectation !== undefined &&
        req.body.salary_expectation !== ""
          ? req.body.salary_expectation
          : user.salary_expectation,
      availability_date:
        req.body.availability_date !== undefined
          ? req.body.availability_date
          : user.availability_date,
      ...(user.role === "jobseeker"
        ? {
            current_company:
              req.body.current_company !== undefined
                ? req.body.current_company
                : user.current_company,
          }
        : {
            current_company:
              req.body.current_company !== undefined
                ? req.body.current_company
                : user.current_company,
            company_description:
              req.body.company_description !== undefined
                ? req.body.company_description
                : user.company_description,
            website:
              req.body.website !== undefined ? req.body.website : user.website,
            industry:
              req.body.industry !== undefined
                ? req.body.industry
                : user.industry,
            company_size:
              req.body.company_size !== undefined
                ? req.body.company_size
                : user.company_size,
          }),
    };

    console.log("Update data:", updateData);

    try {
      await user.update(updateData);
      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      });
      res.json({ message: "Profile updated successfully", user: updatedUser });
    } catch (updateError) {
      console.error("Sequelize update error:", updateError);
      res.status(500).json({
        message: "Failed to update profile",
        details: updateError.message,
        fields: Object.keys(updateData),
      });
    }
  } catch (error) {
    console.error("Profile update error:", error);
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
