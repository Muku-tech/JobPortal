const { Application, Job, User } = require("../models");

exports.applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const userId = req.user.id;
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
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
    const { status, notes } = req.body;
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
