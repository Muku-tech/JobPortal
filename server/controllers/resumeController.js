const { Resume } = require("../models");

exports.createResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeData = req.body;

    const resume = await Resume.create({
      user_id: userId,
      ...resumeData,
      is_default: false,
    });

    res.status(201).json({
      message: "Resume created successfully",
      resume,
    });
  } catch (error) {
    console.error("Create resume error:", error);
    res.status(500).json({ message: "Error creating resume" });
  }
};

exports.getResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const resume = await Resume.findOne({
      where: { id, user_id: userId },
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.json(resume);
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({ message: "Error fetching resume" });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.findAll({
      where: { user_id: userId },
      order: [["updatedAt", "DESC"]],
    });
    res.json(resumes);
  } catch (error) {
    console.error("Get resumes error:", error);
    res.status(500).json({ message: "Error fetching resumes" });
  }
};

exports.updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const resume = await Resume.findOne({
      where: { id, user_id: userId },
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    await resume.update(updateData);
    res.json({
      message: "Resume updated successfully",
      resume,
    });
  } catch (error) {
    console.error("Update resume error:", error);
    res.status(500).json({ message: "Error updating resume" });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resume = await Resume.findOne({
      where: { id, user_id: userId },
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    await resume.destroy();
    res.json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Delete resume error:", error);
    res.status(500).json({ message: "Error deleting resume" });
  }
};

exports.setDefaultResume = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Resume.update(
      { is_default: false },
      {
        where: { user_id: userId },
      },
    );

    const resume = await Resume.findOne({
      where: { id, user_id: userId },
    });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    await resume.update({ is_default: true });
    res.json({ message: "Default resume set", resume });
  } catch (error) {
    console.error("Set default resume error:", error);
    res.status(500).json({ message: "Error setting default resume" });
  }
};
