const { Job, User, Application, sequelize } = require("../models");

const { Op } = require("sequelize");

exports.getGroupedJobs = async (req, res) => {
  try {
    const { type = "company", limit = 4 } = req.query;

    const where = { status: "active" };

    const groups = await Job.findAll({
      where,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        type === "company"
          ? "company_name"
          : type === "industry"
            ? "category"
            : "location",
      ],
      group:
        type === "company"
          ? "company_name"
          : type === "industry"
            ? "category"
            : "location",
      having: sequelize.fn("COUNT", sequelize.col("id")) > 0,
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 6,
    });

    const groupsWithJobs = [];

    for (const group of groups) {
      const groupValue =
        group.dataValues[
          type === "company"
            ? "company_name"
            : type === "industry"
              ? "category"
              : "location"
        ];
      const count = group.dataValues.count;

      const sampleJobs = await Job.findAll({
        where: {
          ...where,
          [type === "company"
            ? "company_name"
            : type === "industry"
              ? "category"
              : "location"]: groupValue,
        },
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
      });

      groupsWithJobs.push({
        name: groupValue,
        count,
        jobs: sampleJobs,
      });
    }

    res.json({
      type,
      groups: groupsWithJobs,
    });
  } catch (error) {
    console.error("Error fetching grouped jobs:", error);
    res.status(500).json({ message: "Error fetching grouped jobs" });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      location,
      jobType,
      category,
      search,
      salaryMin,
      salaryMax,
      experienceLevel,
      educationLevel,
    } = req.query;

    const where = { status: "active" };

    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }
    if (jobType) {
      where.job_type = jobType;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }
    if (salaryMin) {
      where.salary_max = { [Op.gte]: parseInt(salaryMin) };
    }
    if (salaryMax) {
      where.salary_min = { [Op.lte]: parseInt(salaryMax) };
    }
    if (experienceLevel) {
      where.experience_level = experienceLevel;
    }
    if (educationLevel) {
      where.education_level = educationLevel;
    }

    const offset = (page - 1) * limit;

    const jobs = await Job.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "employer",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      jobs: jobs.rows,
      total: jobs.count,
      page: parseInt(page),
      totalPages: Math.ceil(jobs.count / limit),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id, {
      include: [
        {
          model: User,
          as: "employer",
          attributes: ["id", "name", "email"],
        },
      ],
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ message: "Error fetching job" });
  }
};

exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers can post jobs" });
    }
    const jobData = { ...req.body, employer_id: req.user.id };
    const job = await Job.create(jobData);
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Error creating job" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.employer_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }
    await job.update(req.body);
    res.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Error updating job" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    if (job.employer_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }
    await job.destroy();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Error deleting job" });
  }
};

exports.getEmployerJobs = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only employers can view their jobs" });
    }
    const jobs = await Job.findAll({
      where: { employer_id: req.user.id },
      include: [
        {
          model: Application,
          as: "applications",
          attributes: ["id"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate stats
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === "active").length;
    const totalApplications = jobs.reduce(
      (sum, job) => sum + (job.applications?.length || 0),
      0,
    );

    // Add application count to each job
    const jobsWithCount = jobs.map((job) => ({
      ...job.toJSON(),
      ApplicationCount: job.applications?.length || 0,
    }));

    res.json({
      jobs: jobsWithCount,
      stats: {
        total: totalJobs,
        active: activeJobs,
        applications: totalApplications,
      },
    });
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};
