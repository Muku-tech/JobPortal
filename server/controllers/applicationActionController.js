const { Application, Message, User, Job } = require("../models");
const { generateMessage } = require("../utils/messageGenerator");

exports.performAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, interview_date } = req.body;
    const userId = req.user.id; // Employer

    const validActions = ["shortlist", "interview", "hire", "reject"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const application = await Application.findByPk(id, {
      include: [
        { model: User, as: "applicant" },
        { model: Job, as: "job", include: [{ model: User, as: "employer" }] },
      ],
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Authorization check
    if (application.job.employer_id !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Perform action
    switch (action) {
      case "shortlist":
        application.status = "considering";
        application.is_shortlisted = true;
        break;
      case "interview":
        application.status = "considering";
        application.interview_date = interview_date;
        break;
      case "hire":
        application.status = "final";
        application.decision = "hired";
        break;
      case "reject":
        application.status = "final";
        application.decision = "rejected";
        break;
    }

    await application.save();

    // Generate and save system message
    const messageContent = generateMessage(action, {
      interviewDate: interview_date,
      jobTitle: application.job.title,
      applicantName: application.applicant.name,
    });
    await Message.create({
      application_id: id,
      sender_id: userId, // Employer (system)
      recipient_id: application.user_id,
      message: messageContent,
      type: "system",
      applicant_read: false,
    });

    res.json({
      message: "Action performed successfully",
      application,
    });
  } catch (error) {
    console.error("Action error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getApplicationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await Message.findAll({
      where: { application_id: id },
      include: [
        { model: User, as: "sender", attributes: ["id", "name"] },
        { model: User, as: "recipient", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "ASC"]],
    });
    res.json(messages);
  } catch (error) {
    console.error("Messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
