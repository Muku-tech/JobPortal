const { Application, Job, User, Message, Resume } = require("../models");

exports.applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, resumeId } = req.body;
    const jobIdNum = jobId ? Number(jobId) : null;
    const resumeIdNum = resumeId ? Number(resumeId) : null;
    const userId = req.user.id; // Assuming req.user is populated by auth middleware

    const job = await Job.findByPk(jobIdNum);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Auto-select default resume if none provided
    let finalResumeId = resumeIdNum;
    if (!finalResumeId) {
      const defaultResume = await Resume.findOne({
        where: { user_id: userId, is_default: true },
      });
      finalResumeId = defaultResume?.id;
    }

    let resumePdfUrl = null;
    if (req.file) {
      resumePdfUrl = `/resumes/${req.file.filename}`;
    }

    const existingApplication = await Application.findOne({
      where: { job_id: jobIdNum, user_id: userId },
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }
    const application = await Application.create(
      {
        job_id: jobIdNum,
        user_id: userId,
        cover_letter: coverLetter,
        resume_id: finalResumeId,
        resume_pdf_url: resumePdfUrl,
        status: "applied",
      },
      {
        fields: [
          "job_id",
          "user_id",
          "cover_letter",
          "resume_id",
          "resume_pdf_url",
          "status",
        ],
      },
    );
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
      attributes: [
        "id",
        "job_id",
        "user_id",
        "cover_letter",
        "resume_id",
        "resume_pdf_url",
        "status",
        "createdAt",
        "updatedAt",
      ],
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
        {
          model: Resume,
          as: "resume",
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

exports.getEmployerApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await Application.findAll({
      attributes: [
        "id",
        "job_id",
        "user_id",
        "cover_letter",
        "resume_id",
        "resume_pdf_url",
        "status",
        "createdAt",
        "updatedAt",
      ],
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
          include: [{ model: Resume, as: "resumes" }],
        },
        {
          model: Resume,
          as: "resume",
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
      attributes: [
        "id",
        "job_id",
        "user_id",
        "cover_letter",
        "resume_id",
        "resume_pdf_url",
        "status",
        "createdAt",
        "updatedAt",
      ],
      include: [
        {
          model: User,
          as: "applicant",
          attributes: [
            "id",
            "name",
            "email",
            "skills",
            "resume_url",
            "cluster_id",
            "experience_level",
          ],
          include: [{ model: Resume, as: "resumes" }], // Include structured resumes
        },
        {
          model: Resume,
          as: "resume",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // DEBUG (temporary): verify cover_letter present in API response
    try {
      const first = applications?.[0];
      console.log(
        "[getJobApplications debug] first application cover_letter:",
        first?.cover_letter,
      );
      console.log(
        "[getJobApplications debug] first application resume_id:",
        first?.resume_id,
      );
    } catch (e) {
      console.log(
        "[getJobApplications debug] unable to log first application",
        e?.message,
      );
    }

    // Compute matchScore for each applicant based on skill overlap
    const jobSkills = (job.required_skills || []).map((s) =>
      s.toLowerCase().trim(),
    );
    const enrichedApplications = applications.map((app) => {
      const appJson = app.toJSON();
      const applicantSkills = (appJson.applicant?.skills || []).map((s) =>
        s.toLowerCase().trim(),
      );
      const matched = jobSkills.filter((s) =>
        applicantSkills.includes(s),
      ).length;
      const total = jobSkills.length || 1;
      appJson.matchScore = Math.round((matched / total) * 100);
      appJson.clusterMatch = appJson.applicant?.cluster_id;
      // The resume_pdf_url is already part of appJson from the Application model
      return appJson;
    });

    res.json(enrichedApplications);
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

    // DB ENUM: applied | considering | final
    const validStatuses = ["applied", "considering", "final"];

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

    // Send internal notification to applicant on meaningful status changes
    if (["considering", "final"].includes(status)) {
      const applicant = await User.findByPk(application.user_id);
      if (applicant) {
        try {
          const statusTemplates = {
            considering: {
              title: "🎉 Application Update",
              message: `Hello ${applicant.name}, your application for "${application.job.title}" is now under consideration.`,
            },
            final: {
              title: "📋 Final Decision",
              message: `Hello ${applicant.name}, a final decision has been made on your application for "${application.job.title}".`,
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
