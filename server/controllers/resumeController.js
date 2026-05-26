const { Resume, User } = require("../models");

const syncResumeToProfile = async (userId, resume) => {
  if (!resume || !resume.is_default) return;

  try {
    const user = await User.findByPk(userId);
    if (!user) return;

    const personalInfo = resume.personal_info || {};
    const skills = Array.isArray(resume.skills) ? resume.skills.map(s => s.title || s) : [];
    const experience = Array.isArray(resume.experiences)
      ? resume.experiences.map(e => `${e.title} at ${e.organization || e.company}`).join('\n')
      : '';
    const education = Array.isArray(resume.educations)
      ? resume.educations.map(e => `${e.title} from ${e.organization || e.company}`).join('\n')
      : '';

    await user.update({
      name: personalInfo.name || user.name,
      phone: personalInfo.phone || user.phone,
      address: personalInfo.address || user.address,
      skills,
      experience,
      education,
      linkedin: personalInfo.linkedin || user.linkedin,
      portfolio: personalInfo.portfolio || user.portfolio
    });
  } catch (err) {
    console.error("Error syncing resume to profile:", err);
  }
};

exports.createResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumeData = req.body;

    const existingCount = await Resume.count({ where: { user_id: userId } });
    const isDefault = existingCount === 0 || resumeData.is_default === true;

    if (isDefault) {
      await Resume.update(
        { is_default: false },
        {
          where: { user_id: userId },
        }
      );
    }

    const resume = await Resume.create({
      user_id: userId,
      ...resumeData,
      is_default: isDefault,
    });

    if (isDefault) {
      await syncResumeToProfile(userId, resume);
    }

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

    if (updateData.is_default === true) {
      await Resume.update(
        { is_default: false },
        {
          where: { user_id: userId },
        }
      );
    }

    await resume.update(updateData);

    if (resume.is_default) {
      await syncResumeToProfile(userId, resume);
    }

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
    await syncResumeToProfile(userId, resume);
    res.json({ message: "Default resume set", resume });
  } catch (error) {
    console.error("Set default resume error:", error);
    res.status(500).json({ message: "Error setting default resume" });
  }
};
