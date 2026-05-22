const express = require("express");
const router = express.Router();
const { User, Job, Application, Resume } = require("../models");
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");
const recommendationController = require("../controllers/recommendationController");
const multer = require("multer");
const path = require("path");

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

router.put("/profile", auth, async (req, res) => {
  try {
    console.log("Profile update request:", req.body);

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const normalizeArray = (value, current) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string")
        return value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return current || [];
    };

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

      if (user.role === "jobseeker") {
        const defaultResume = await Resume.findOne({
          where: { user_id: user.id, is_default: true },
        });
        if (defaultResume) {
          await defaultResume.update({
            personal_info: {
              ...defaultResume.personal_info,
              name: updateData.name,
              phone: updateData.phone,
              address: updateData.address,
              linkedin: updateData.linkedin,
              portfolio: updateData.portfolio || updateData.github,
            },
            summary: updateData.summary,
            skills: (updateData.skills || []).map((s) => ({ title: s })),
          });
        }
      }
      
      const mockRes = { 
        status: function() { return this; }, 
        json: function() { return this; } 
      };
      
      recommendationController.sendRecommendationAsMessage({ user: { id: req.user.id }, query: { limit: 5 } }, mockRes)
        .catch(err => console.error("Profile-update rec error:", err.message));

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/logos/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith("image/")
      ? cb(null, true)
      : cb(new Error("Only images")),
});

router.post("/logo", auth, upload.single("logo"), userController.uploadLogo);

module.exports = router;
