const {
  Job,
  User,
  Application,
  sequelize,
  UserSavedJob,
} = require("../models");
const { Op } = require("sequelize");

// 1. GET GROUPED JOBS (For Homepage Tabs)
exports.getGroupedJobs = async (req, res) => {
  try {
    const { type = "company", limit = 2 } = req.query; // Default 2 jobs per card

    const where = { status: "active" };
    const groupField =
      type === "industry"
        ? "category"
        : type === "location"
          ? "location"
          : "company_name";

    const groups = await Job.findAll({
      where,
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        groupField,
        "company_logo", // Include logo in the initial group fetch
      ],
      group: [groupField, "company_logo"],
      having: sequelize.fn("COUNT", sequelize.col("id")) > 0,
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 12,
    });

    const groupsWithJobs = [];

    for (const group of groups) {
      const groupValue = group.dataValues[groupField];
      const count = group.dataValues.count;
      const logo = group.dataValues.company_logo;

      const sampleJobs = await Job.findAll({
        where: {
          status: "active",
          [groupField]: groupValue,
        },
        attributes: ["id", "title"],
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit),
      });

      groupsWithJobs.push({
        name: groupValue,
        count,
        logo,
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

// 2. GET ALL JOBS (For Browse/Search Page - Optimized)
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      location,
      jobType,
      category,
      search,
      salaryMin,
      salaryMax,
      experienceLevel,
    } = req.query;

    const where = { status: "active" };

    // Use Op.iLike for case-insensitive searching in PostgreSQL/SQLite
    if (location) {
      where.location = { [Op.iLike]: `%${location}%` };
    }
    if (jobType) {
      where.job_type = jobType;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { company_name: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (salaryMin) {
      where.salary_max = { [Op.gte]: parseFloat(salaryMin) };
    }
    if (salaryMax) {
      where.salary_min = { [Op.lte]: parseFloat(salaryMax) };
    }
    if (experienceLevel) {
      where.experience_level = experienceLevel;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Job.findAndCountAll({
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
      offset: parseInt(offset),
    });

    res.json({
      jobs: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

// 3. GET SINGLE JOB BY ID
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
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job" });
  }
};

// 4. CREATE JOB
exports.createJob = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers can post jobs" });
    }
    const job = await Job.create({ ...req.body, employer_id: req.user.id });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error creating job" });
  }
};

// 5. UPDATE JOB
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.employer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await job.update(req.body);
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Error updating job" });
  }
};

// 6. DELETE JOB
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.employer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await job.destroy();
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job" });
  }
};

// Save/unsave job toggle
exports.saveJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    const [savedJob, created] = await UserSavedJob.findOrCreate({
      where: { user_id: userId, job_id: jobId },
      defaults: { user_id: userId, job_id: jobId },
    });

    if (!created) {
      await savedJob.destroy();
      return res.json({ message: "Job unsaved", saved: false });
    }

    res.json({ message: "Job saved", saved: true });
  } catch (error) {
    console.error("Save job error:", error);
    res.status(500).json({ message: "Error saving job" });
  }
};

// GET saved jobs for user
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedJobs = await UserSavedJob.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Job,
          as: "Job",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ jobs: savedJobs.map((sj) => sj.Job) });
  } catch (error) {
    console.error("Get saved jobs error:", error);
    res.status(500).json({ message: "Error fetching saved jobs" });
  }
};

// 7. GET EMPLOYER-SPECIFIC JOBS (Dashboard)
exports.getEmployerJobs = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const jobs = await Job.findAll({
      where: { employer_id: req.user.id },
      include: [{ model: Application, as: "applications", attributes: ["id"] }],
      order: [["createdAt", "DESC"]],
    });

    const stats = {
      total: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      applications: jobs.reduce(
        (sum, j) => sum + (j.applications?.length || 0),
        0,
      ),
    };

    res.json({ jobs, stats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching employer jobs" });
  }
};
