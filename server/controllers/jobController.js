const {
  Job,
  User,
  Application,
  sequelize,
  Notification,
  JobView,
} = require("../models");
const { Op } = require("sequelize");

exports.getGroupedJobs = async (req, res) => {
  try {
    const { type = "company", limit = 2 } = req.query;

    const where = { status: "active" };
    const groupField =
      type === "industry"
        ? "category"
        : type === "location"
          ? "location"
          : type === "experience"
            ? "experience_level"
            : "company_name";

    const isCompany = type === "company";
    const attributes = [
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      groupField,
    ];
    const group = [groupField];

    if (isCompany) {
      attributes.push("company_logo");
      group.push("company_logo");
    }

    const groups = await Job.findAll({
      where,
      attributes,
      group,
      having: sequelize.literal("COUNT(id) > 0"),
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 12,
    });

    const groupsWithJobs = [];

    for (const group of groups) {
      const groupValue = group.dataValues[groupField];
      const count = group.dataValues.count;
      const logo = isCompany ? group.dataValues.company_logo : null;

      const sampleJobs =
        limit > 0
          ? await Job.findAll({
              where: {
                status: "active",
                [groupField]: groupValue,
              },
              attributes: ["id", "title"],
              order: [["createdAt", "DESC"]],
              limit: parseInt(limit),
            })
          : [];

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
      sort = "createdAt",
      saved,
    } = req.query;

    const where = { status: "active" };

    const include = [
      {
        model: User,
        as: "employer",
        attributes: ["id", "name", "email"],
      },
    ];

    if (saved === "true" && req.user) {
      include.push({
        model: JobView,
        as: "job_views",
        where: { user_id: req.user.id, action_type: "save" },
        required: true,
      });
    }

    if (location) {
      where.location = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("location")),
        Op.like,
        `%${location.toLowerCase()}%`,
      );
    }
    if (jobType) {
      where.job_type = jobType;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      where[Op.or] = [
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Job.title")),
          Op.like,
          searchLower,
        ),
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Job.company_name")),
          Op.like,
          searchLower,
        ),
        sequelize.where(
          sequelize.fn("LOWER", sequelize.col("Job.required_skills")),
          Op.like,
          searchLower,
        ),
      ];
    }
    if (salaryMin) {
      where.salary_min = { [Op.gte]: parseFloat(salaryMin) };
    }
    if (salaryMax) {
      where.salary_max = { [Op.lte]: parseFloat(salaryMax) };
    }
    if (experienceLevel) {
      where.experience_level = experienceLevel;
    }

    const offset = (page - 1) * limit;

    let relevanceScores = null;
    if (sort === "relevance" && req.user) {
      const { User } = require("../models");
      const user = await User.findByPk(req.user.id);
      if (user) {
        const userSkills = (user.skills || []).map((s) => s.toLowerCase());
        const allMatchingJobs = await Job.findAll({ where });
        relevanceScores = new Map();
        allMatchingJobs.forEach((job) => {
          const jobSkills = (job.required_skills || []).map((s) =>
            s.toLowerCase(),
          );
          const matched = jobSkills.filter((s) =>
            userSkills.includes(s),
          ).length;
          const total = jobSkills.length || 1;
          const score = matched / total;
          relevanceScores.set(job.id, score);
        });
      }
    }

    let order = [[sort, "DESC"]];
    if (sort === "relevance") {
      order = [["createdAt", "DESC"]];
    }

    const { count, rows } = await Job.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    let savedJobIds = [];
    if (req.user) {
      const userSaves = await JobView.findAll({
        where: { user_id: req.user.id, action_type: "save" },
        attributes: ["job_id"],
      });
      savedJobIds = userSaves.map((s) => s.job_id);
    }

    let finalJobs = rows;
    finalJobs = rows.map((job) => ({
      ...job.toJSON(),
      isSaved: savedJobIds.includes(job.id),
      relevanceScore: relevanceScores ? (relevanceScores.get(job.id) || 0) : 0,
    }));

    if (sort === "relevance" && relevanceScores) {
      finalJobs.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    res.json({
      jobs: finalJobs,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Error fetching jobs" });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.userId;

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

    let isSaved = false;
    if (userId) {
      const savedJob = await JobView.findOne({
        where: { user_id: userId, job_id: id, action_type: "save" },
      });
      isSaved = !!savedJob;
    }

    res.json({ ...job.toJSON(), isSaved });
  } catch (error) {
    res.status(500).json({ message: "Error fetching job" });
  }
};

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

exports.getEmployerJobs = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const jobs = await Job.findAll({
      where: { employer_id: req.user.id },
      attributes: {
        include: [
          [
            sequelize.fn("COUNT", sequelize.col("applications.id")),
            "ApplicationCount",
          ],
        ],
      },
      include: [
        {
          model: Application,
          as: "applications",
          attributes: [],
          required: false,
          duplicating: false,
        },
      ],
      group: ["Job.id"],
      order: [["createdAt", "DESC"]],
    });

    const stats = {
      total: jobs.length,
      active: jobs.filter((j) => j.status === "active").length,
      applications: jobs.reduce(
        (sum, j) => sum + parseInt(j.dataValues.ApplicationCount || 0),
        0,
      ),
    };

    res.json({ jobs, stats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching employer jobs" });
  }
};

exports.getTopCompanies = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const companies = await Job.findAll({
      where: { status: "active" },
      attributes: [
        [sequelize.col("company_name"), "name"],
        [sequelize.col("company_logo"), "logo"],
        [sequelize.fn("COUNT", sequelize.col("id")), "jobCount"],
      ],
      group: ["company_name", "company_logo"],
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: parseInt(limit),
    });
    res.json(companies.map((c) => c.dataValues));
  } catch (error) {
    console.error("Error fetching top companies:", error);
    res.status(500).json({ message: "Error fetching top companies" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Job.findAll({
      where: { status: "active" },
      attributes: [
        [sequelize.col("category"), "name"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: "category",
      order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
      limit: 8,
    });
    res.json(categories.map((c) => c.dataValues));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

exports.getFeaturedJobs = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const jobs = await Job.findAll({
      where: { status: "active" },
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });
    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    res.status(500).json({ message: "Error fetching featured jobs" });
  }
};

exports.getCategoryJobs = async (req, res) => {
  try {
    const { type = "location", limit = 8 } = req.query;
    const where = { status: "active" };

    let order = [["createdAt", "DESC"]];

    if (type === "location") {
      order = [
        ["location", "ASC"],
        ["createdAt", "DESC"],
      ];
    } else if (type === "industry") {
      // Top by category count, then recent
      const categoryJobs = await Job.findAll({
        where,
        attributes: [
          "category",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: "category",
        order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
        limit: 3,
      });
      if (categoryJobs.length > 0) {
        where.category = {
          [Op.in]: categoryJobs.map((c) => c.category),
        };
      }
    } else if (type === "experience") {
      const levels = ["entry", "mid", "senior", "lead", "executive"];
      where.experience_level = { [Op.in]: levels };
      order = [
        ["experience_level", "ASC"],
        ["createdAt", "DESC"],
      ];
    }

    const jobs = await Job.findAll({
      where,
      order,
      limit: parseInt(limit),
    });

    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching category jobs:", error);
    res.status(500).json({ message: "Error fetching category jobs" });
  }
};

exports.getSkillGap = async (req, res) => {
  try {
    console.log(
      "🔍 SkillGap called - jobId:",
      req.params.id,
      "userId:",
      req.user?.id,
    );
    const { id } = req.params;
    const userId = req.user.id;

    const job = await Job.findByPk(id, {
      include: [{ model: User, as: "employer" }],
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const user = await User.findByPk(userId);
    console.log("🔍 Found user:", user?.id, "skills:", user?.skills);
    if (!user) return res.status(401).json({ message: "User not found" });

    const userSkills = user.skills || [];
    const jobSkills = job.required_skills || [];
    console.log("🔍 Parsed - userSkills:", userSkills, "jobSkills:", jobSkills);

    const userSet = new Set(userSkills.map((s) => s.toLowerCase().trim()));
    const jobSet = new Set(jobSkills.map((s) => s.toLowerCase().trim()));
    const missing = Array.from(jobSet).filter((skill) => !userSet.has(skill));

    const gapScore =
      jobSkills.length > 0
        ? Math.round(
            ((jobSkills.length - missing.length) / jobSkills.length) * 100,
          )
        : 0;

    res.json({
      gapScore,
      missingSkills: missing.slice(0, 5),
      totalMissing: missing.length,
      yourSkills: userSkills.slice(0, 5),
      jobSkillsCount: jobSkills.length,
    });
  } catch (error) {
    console.error("Skill gap error:", error);
    res.status(500).json({ message: "Error calculating skill gap" });
  }
};
