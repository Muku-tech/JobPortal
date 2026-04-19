const { Application, Job, User, Message, Resume } = require("../models");

exports.applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, resumeId } = req.body;
    const userId = req.user.id;
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Auto-select default resume if none provided
    let finalResumeId = resumeId;
    if (!finalResumeId) {
      const defaultResume = await Resume.findOne({
        where: { user_id: userId, is_default: true },
      });
      finalResumeId = defaultResume?.id;
    }

    const existingApplication = await Application.findOne({
      where: { job_id: jobId, user_id: userId },
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }
    const application = await Application.create({
      job_id: jobId,
      user_id: userId,
      cover_letter: coverLetter,
      resume_id: finalResumeId,
      status: "applied",
    });
    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Error in applyForJob:", error);
    res.status(500).json({ message: "Error submitting application" });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await Application.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Job,
          as: "job",
          include: [
            {
              model: User,
              as: "employer",
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error) {
    console.error("Error in getMyApplications:", error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.findAll({
      where: { job_id: jobId },
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "name", "email", "skills"],
        },
        { model: Job, as: "job", attributes: ["title", "company_name"] },
      ],
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job applications" });
  }
};

exports.getEmployerApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await Application.findAll({
      include: [
        {
          model: Job,
          as: "job",
          where: { employer_id: userId },
        },
        {
          model: User,
          as: "applicant",
          attributes: ["id", "name", "email", "skills"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error) {
    console.error("Error in getEmployerApplications:", error);
    res.status(500).json({ message: "Error fetching employer applications" });
  }
};

exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.employer_id !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these applications" });
    }
    const applications = await Application.findAll({
      where: { job_id: jobId },
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "name", "email", "skills", "resume_url"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(applications);
  } catch (error) {
    console.error("Error in getJobApplications:", error);
    res.status(500).json({ message: "Error fetching applications" });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    console.log("=== STATUS UPDATE DEBUG START ===");
    console.log("App ID:", req.params.id);
    console.log("Body:", req.body);
    console.log("User ID:", req.user.id);
    console.log("User role:", req.user.role);

    const { id } = req.params;
    const { status, notes, interviewDate } = req.body;
    const userId = req.user.id;

    console.log("Finding application ID:", id);
    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "employer_id"],
        },
      ],
    });
    console.log("Found application:", !!application);
    if (application) {
      console.log("App job_id:", application.job_id);
      console.log(
        "App job:",
        application.job
          ? { id: application.job.id, employer_id: application.job.employer_id }
          : "NO JOB",
      );
    }

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (!application.job) {
      return res.status(400).json({ message: "Job relation missing" });
    }

    if (application.job.employer_id !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this application" });
    }

    const validStatuses = [
      "applied",
      "under_review",
      "shortlisted",
      "interview_scheduled",
      "hired",
      "rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    console.log("Setting status to:", status, "notes provided:", !!notes);
    application.status = status;

    if (notes !== undefined) {
      application.employer_notes = notes;
    }

    console.log("Saving application...");
    await application.save();

    console.log("Save successful!");

    // Send internal notification to applicant if trigger status
    if (
      ["shortlisted", "interview_scheduled", "hired", "rejected"].includes(
        status,
      )
    ) {
      const applicant = await User.findByPk(application.user_id);
      if (applicant) {
        try {
          const statusTemplates = {
            shortlisted: {
              title: "🎉 Shortlisted for Job!",
              message: `Congratulations ${applicant.name}! You have been shortlisted for "${application.job.title}". Next steps coming soon!`,
            },
            interview_scheduled: {
              title: "📅 Interview Scheduled",
              message: interviewDate
                ? `Hello ${applicant.name}, an interview has been scheduled for "${application.job.title}" on **${interviewDate}**. Please confirm availability or reply to reschedule.`
                : `Hello ${applicant.name}, an interview has been scheduled for "${application.job.title}". Check details or reply to confirm.`,
            },
            hired: {
              title: "🎊 You're Hired!",
              message: `Congratulations ${applicant.name}! You have been hired for "${application.job.title}". Welcome aboard!`,
            },
            rejected: {
              title: "Application Update",
              message: `Thank you ${applicant.name} for applying to "${application.job.title}". We will keep your profile for future opportunities.`,
            },
          };
          const template = statusTemplates[status];
          await Message.create({
            application_id: parseInt(id),
            sender_id: req.user.id,
            recipient_id: applicant.id,
            message: `${template.title}\n\n${template.message}`,
            type: "status_update",
          });
          console.log("✅ Status message sent to", applicant.name);
        } catch (notifError) {
          console.error(
            "⚠️ Notification failed but status saved:",
            notifError.message,
          );
        }
      }
    }

    res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("=== STATUS UPDATE ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.name === "SequelizeValidationError") {
      console.error("Validation errors:", error.errors);
    }
    console.error("========================");
    res.status(500).json({
      message: "Error updating application",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
