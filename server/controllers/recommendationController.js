const {
  Job,
  User,
  Application,
  JobView,
  Message,
  Notification,
} = require("../models");
const contentBasedFiltering = require("../services/algorithms/contentBasedFiltering");
const collaborativeFiltering = require("../services/algorithms/collaborativeFiltering");
const kMeansClustering = require("../services/algorithms/kMeansClustering");
const skillMatcher = require("../utils/skillMatcher");

const getSystemStats = async (userId) => {
  const totalUsers = await User.count();
  let totalJobViews = 0;
  try {
    totalJobViews = await JobView.count();
  } catch (e) {
    console.warn("JobView.count failed:", e.message);
  }
  let totalApplications = 0;
  try {
    totalApplications = await Application.count();
  } catch (e) {
    console.warn("Application.count failed:", e.message);
  }
  let userJobViews = 0;
  try {
    userJobViews = await JobView.count({ where: { user_id: userId } });
  } catch (e) {
    console.warn("userJobViews.count failed:", e.message);
  }
  let userApplications = 0;
  try {
    userApplications = await Application.count({ where: { user_id: userId } });
  } catch (e) {
    console.warn("userApplications.count failed:", e.message);
  }

  return {
    totalUsers,
    totalJobViews,
    totalApplications,
    userInteractions: userJobViews + userApplications,
  };
};

function calcSkillOverlap(userSkills, jobSkillsRaw) {
  if (!userSkills || userSkills.length === 0) return 0;

  let jobSkills = jobSkillsRaw || [];
  if (typeof jobSkills === "string") {
    try {
      jobSkills = JSON.parse(jobSkills);
    } catch (e) {
      jobSkills = jobSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (!Array.isArray(jobSkills) || jobSkills.length === 0) return 0;

  const matched = jobSkills.filter((js) =>
    userSkills.some((us) => skillMatcher.matchSkills(us, js))
  ).length;
  return Math.min(1, matched / Math.max(1, jobSkills.length));
}

function calcLocationScore(preferredLocation, jobLocation) {
  if (!preferredLocation || !jobLocation) return 0;
  const p = preferredLocation.toLowerCase().trim();
  const l = jobLocation.toLowerCase().trim();
  if (p === l) return 1;
  if (l.includes(p) || p.includes(l)) return 0.8;
  return 0;
}

function enforceDiversity(jobs, limit) {
  const categoryGroups = new Map();
  jobs.forEach((job) => {
    const cat = job.category || "Uncategorized";
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
    categoryGroups.get(cat).push(job);
  });

  const result = [];
  const cats = Array.from(categoryGroups.keys());
  let idx = 0;

  while (result.length < limit && categoryGroups.size > 0) {
    const cat = cats[idx % cats.length];
    const group = categoryGroups.get(cat);
    if (group && group.length > 0) {
      result.push(group.shift());
    }
    if (group.length === 0) {
      categoryGroups.delete(cat);
      cats.splice(cats.indexOf(cat), 1);
    }
    idx++;
  }
  return result;
}

function blendRecommendations(
  sources,
  limit,
  userSkills = [],
  preferredLocation = "",
) {
  const scoreMap = new Map();

  sources.forEach(({ jobs, weight }) => {
    if (!Array.isArray(jobs)) return;
    const sourceCount = jobs.length || limit;
    jobs.forEach((job, idx) => {
      const id = job.id;
      const rankScore = (sourceCount - idx) / sourceCount;
      const algoScore = job.recommendationScore || 0;
      const baseScore = (algoScore * 0.5 + rankScore * 0.5) * weight;

      const skillOverlap = calcSkillOverlap(
        userSkills,
        job.required_skills || [],
      );
      const locScore = calcLocationScore(preferredLocation, job.location);
      const combined = baseScore * (1 + skillOverlap * 0.4 + locScore * 1.5);

      if (!scoreMap.has(id)) {
        scoreMap.set(id, { job, score: combined });
      } else {
        const entry = scoreMap.get(id);
        entry.score += combined;
        if (job.matchReasons) {
          const merged = new Set([
            ...(entry.job.matchReasons || []),
            ...job.matchReasons,
          ]);
          entry.job.matchReasons = Array.from(merged);
        }
      }
    });
  });

  const sorted = Array.from(scoreMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  const rawMax = sorted.length > 0 ? sorted[0].score : 0;
  const maxBlendedScore = Math.max(rawMax, 0.8);

  const diverse = enforceDiversity(
    sorted.map((s) => s.job),
    limit,
  );

  const scoreLookup = new Map(
    sorted.map((s) => [s.job.id, s.score / maxBlendedScore]),
  );

  return diverse.slice(0, limit).map((job) => {
    const plainJob = typeof job.toJSON === "function" ? job.toJSON() : job;
    return {
      ...plainJob,
      recommendationScore:
        Math.round((scoreLookup.get(job.id) || 0) * 100) / 100,
    };
  });
}

const _getSmartRecommendationsInternal = async (userId, limit) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found for recommendations");
  }

  if (typeof user.skills === "string") {
    try {
      user.skills = JSON.parse(user.skills);
    } catch (e) {
      user.skills = user.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (!Array.isArray(user.skills)) user.skills = [];

  const stats = await getSystemStats(userId);

  let recommendations = [];
  let algorithmUsed = "";
  let stage = 0;

  if (stats.userInteractions === 0) {
    stage = 1;
    algorithmUsed = "content-based";
    const contentJobs = await contentBasedFiltering.getRecommendations(
      userId,
      Math.max(limit * 3, 30),
    );
    recommendations = blendRecommendations(
      [{ jobs: contentJobs, weight: 1.0 }],
      limit,
      user.skills || [],
      user.preferred_location || "",
    );
  } else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
    stage = 2;
    algorithmUsed = "kmeans+content";
    const kmeansJobs = await kMeansClustering.getRecommendations(
      userId,
      Math.max(limit * 2, 20),
    );
    const contentJobs = await contentBasedFiltering.getRecommendations(
      userId,
      Math.max(limit * 2, 20),
    );
    recommendations = blendRecommendations(
      [
        { jobs: kmeansJobs, weight: 0.6 },
        { jobs: contentJobs, weight: 0.4 },
      ],
      limit,
      user.skills || [],
      user.preferred_location || "",
    );
  } else {
    stage = 3;
    algorithmUsed = "hybrid";
    const collabJobs = await collaborativeFiltering.getRecommendations(
      userId,
      Math.max(limit * 2, 20),
    );
    const kmeansJobs = await kMeansClustering.getRecommendations(
      userId,
      Math.max(limit * 2, 20),
    );
    const contentJobs = await contentBasedFiltering.getRecommendations(
      userId,
      Math.max(limit * 2, 20),
    );
    recommendations = blendRecommendations(
      [
        { jobs: collabJobs, weight: 0.5 },
        { jobs: kmeansJobs, weight: 0.3 },
        { jobs: contentJobs, weight: 0.2 },
      ],
      limit,
      user.skills || [],
      user.preferred_location || "",
    );
  }

  if (recommendations.length === 0) {
    const popularJobs = await Job.findAll({
      where: { status: "active" },
      limit: limit,
      order: [["createdAt", "DESC"]],
    });
    recommendations = popularJobs.map((j) => ({
      ...j.toJSON(),
      recommendationType: "popular",
      recommendationScore: 0.5,
    }));
    algorithmUsed = algorithmUsed || "fallback-popular";
  }

  return { recommendations, user, stats, algorithmUsed, stage };
};

exports.getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const { recommendations, user, stats, algorithmUsed, stage } =
      await _getSmartRecommendationsInternal(userId, limit);

    console.log(`Stage ${stage}: ${algorithmUsed}`);

    res.json({
      jobs: recommendations,
      algorithm: algorithmUsed,
      stage,
      stats: {
        totalUsers: stats.totalUsers,
        userInteractions: stats.userInteractions,
      },
    });
  } catch (error) {
    console.error("Error in smart recommendations:", error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
};

exports.getContentBasedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await contentBasedFiltering.getRecommendations(userId, limit);

    res.json({
      jobs,
      algorithm: "content-based",
      stage: 1,
    });
  } catch (error) {
    console.error("Error in content-based recommendations:", error);
    res
      .status(500)
      .json({ message: "Error generating content-based recommendations" });
  }
};

exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await collaborativeFiltering.getRecommendations(userId, limit);

    res.json({
      jobs,
      algorithm: "collaborative",
      stage: 3,
    });
  } catch (error) {
    console.error("Error in collaborative recommendations:", error);
    res
      .status(500)
      .json({ message: "Error generating collaborative recommendations" });
  }
};

exports.getKMeansRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await kMeansClustering.getRecommendations(userId, limit);

    res.json({
      jobs,
      algorithm: "kmeans",
      stage: 2,
    });
  } catch (error) {
    console.error("Error in k-means recommendations:", error);
    res
      .status(500)
      .json({ message: "Error generating k-means recommendations" });
  }
};

exports.trackJobView = async (req, res) => {
  try {
    const { jobId, duration, action } = req.body;
    const jobIdNum = parseInt(jobId);
    const userId = req.user.id;

    if (isNaN(jobIdNum))
      return res.status(400).json({ message: "Invalid jobId" });

    if (action === "save") {
      const existingSave = await JobView.findOne({
        where: { user_id: userId, job_id: jobIdNum, action_type: "save" },
      });

      if (existingSave) {
        await existingSave.destroy();
        return res.json({
          success: true,
          message: "Job unsaved",
          saved: false,
        });
      } else {
      }
    }

    const existingInteraction = await JobView.findOne({
      where: { user_id: userId, job_id: jobIdNum },
    });

    if (existingInteraction) {
      await existingInteraction.update({
        action_type: action || existingInteraction.action_type,
        view_duration:
          (duration || 0) + (existingInteraction.view_duration || 0),
      });
    } else {
      await JobView.create({
        user_id: userId,
        job_id: jobIdNum,
        view_duration: duration || 0,
        action_type: action || "view",
      });
    }

    if (action === "click" || action === "save" || action === "apply") {
      const lastMessage = await Message.findOne({
        where: { recipient_id: userId, type: "system" },
        order: [["createdAt", "DESC"]],
      });

      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (!lastMessage || lastMessage.createdAt < fifteenMinsAgo) {
        const mockRes = {
          status: function () {
            return this;
          },
          json: function () {
            return this;
          },
        };
        exports
          .sendRecommendationAsMessage(
            { user: { id: userId }, query: { limit: 5 } },
            mockRes,
          )
          .catch((err) =>
            console.error("Auto-recommendation error:", err.message),
          );
      }
    }

    res.json({
      success: true,
      message: action === "save" ? "Job saved" : "Job view tracked",
      saved: action === "save" ? true : undefined,
    });
  } catch (error) {
    console.error("Error tracking job view:", error);
    res.status(500).json({ message: "Error tracking view" });
  }
};

exports.getGuestRecommendations = async (req, res) => {
  try {
    const { Job, JobView, Application, sequelize } = require("../models");
    const limit = parseInt(req.query.limit) || 8;

    const topJobs = await Job.findAll({
      where: { status: "active" },
      attributes: [
        "id",
        "title",
        "company_name",
        "location",
        "job_type",
        "salary_min",
        "salary_max",
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM job_views WHERE job_views.job_id = Job.id)",
          ),
          "view_count",
        ],
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM applications WHERE applications.job_id = Job.id)",
          ),
          "application_count",
        ],
      ],
      order: [
        sequelize.literal("view_count + COALESCE(application_count, 0) DESC"),
        ["createdAt", "DESC"],
      ],
      limit,
      raw: true,
    });

    res.json({
      jobs: topJobs,
      algorithm: "popularity",
      stage: "guest",
      message: "Top popular jobs for guests",
    });
  } catch (error) {
    console.error("Error in guest recommendations:", error);
    const { Job } = require("../models");
    const fallback = await Job.findAll({
      where: { status: "active" },
      limit: 8,
      order: [["createdAt", "DESC"]],
    });
    res.json({ jobs: fallback, algorithm: "recent", stage: "guest" });
  }
};

exports.getRecommendationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getSystemStats(userId);

    let recommendedStage = "content-based";
    if (stats.userInteractions > 5 && stats.totalUsers >= 10) {
      recommendedStage = "collaborative";
    } else if (stats.userInteractions > 0) {
      recommendedStage = "kmeans";
    }

    res.json({
      stats,
      recommendedAlgorithm: recommendedStage,
      explanation: {
        1: "Content-Based: For new users with no interactions",
        2: "K-Means: When there are few users or interactions",
        3: "Collaborative: When enough user data is available",
      },
    });
  } catch (error) {
    console.error("Error getting recommendation stats:", error);
    res.status(500).json({ message: "Error getting stats" });
  }
};

exports.sendRecommendationAsMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const { recommendations, user, stats, algorithmUsed, stage } =
      await _getSmartRecommendationsInternal(userId, limit);

    const hasNoSkills = !Array.isArray(user.skills) || user.skills.length === 0;
    if (stage === 1 && hasNoSkills && stats.userInteractions === 0) {
      return res.json({
        message: "Profile too empty to send meaningful recommendations.",
        jobs: [],
      });
    }

    if (recommendations.length === 0) {
      return res.json({
        message: "No recommendations found for this user at this time.",
        count: 0,
        jobs: [],
        algorithm: algorithmUsed,
        stage,
      });
    }

    const messageData = {
      title: "Your Personalized Job Recommendations",
      text: `Hi ${user.name}! We found ${recommendations.length} jobs that match your profile based on your skills and preferences.`,
      jobs: recommendations.map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company_name,
        location: job.location || "Nepal",
        job_type: job.job_type || "Full-time",
      })),
      algorithm: algorithmUsed,
      footer: `Generated using the ${algorithmUsed} matching system.`,
    };

    const nabinUser = await User.findOne({ where: { name: "Nabin Gautam" } });
    const senderId = nabinUser ? nabinUser.id : 1;

    const message = await Message.create({
      sender_id: senderId,
      recipient_id: userId,
      message: JSON.stringify(messageData),
      type: "system",
      read: false,
    });

    try {
      await Notification.create({
        user_id: userId,
        from_user_id: senderId,
        title: "New Job Recommendations",
        message: `We found ${recommendations.length} new jobs that match your profile!`,
        type: "system",
        read: false,
      });
    } catch (nErr) {
      console.warn(
        "Notification create failed (non-fatal):",
        nErr?.message || nErr,
      );
    }

    console.log(
      `✅ Sent ${recommendations.length} job recommendations as message to user ${userId} using ${algorithmUsed} (Stage ${stage})`,
    );

    res.json({
      message: "Recommendations sent as message",
      count: recommendations.length,
      jobs: recommendations,
      algorithm: algorithmUsed,
      stage,
    });
  } catch (error) {
    console.error("❌ Error sending recommendation as message:", error);
    console.error("Error details:", error?.message, error?.stack);
    res.status(500).json({
      message: "Error sending recommendations",
      error: error?.message,
      name: error?.name,
    });
  }
};

// Get recommendations from ALL algorithms at once
exports.getAllAlgorithmRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 8;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await getSystemStats(userId);

    // Run all algorithms in parallel for speed
    const [contentJobs, kmeansJobs, collabJobs] = await Promise.all([
      contentBasedFiltering.getRecommendations(userId, limit),
      kMeansClustering.getRecommendations(userId, limit),
      collaborativeFiltering.getRecommendations(userId, limit).catch(() => []),
    ]);

    // Build smart blend based on data availability
    let smartJobs = [];
    let algorithmUsed = "";
    let stage = 0;

    if (stats.userInteractions === 0) {
      stage = 1;
      algorithmUsed = "content-based";
      smartJobs = contentJobs;
    } else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
      stage = 2;
      algorithmUsed = "kmeans+content";
      smartJobs = blendRecommendations(
        [
          { jobs: kmeansJobs, weight: 0.6 },
          { jobs: contentJobs, weight: 0.4 },
        ],
        limit,
        user.skills || [],
        user.preferred_location || "",
      );
    } else {
      stage = 3;
      algorithmUsed = "hybrid";
      smartJobs = blendRecommendations(
        [
          { jobs: collabJobs, weight: 0.5 },
          { jobs: kmeansJobs, weight: 0.3 },
          { jobs: contentJobs, weight: 0.2 },
        ],
        limit,
        user.skills || [],
        user.preferred_location || "",
      );
    }

    res.json({
      smart: {
        jobs: smartJobs,
        algorithm: algorithmUsed,
        stage,
      },
      contentBased: {
        jobs: contentJobs,
        algorithm: "content-based",
        stage: 1,
      },
      collaborative: {
        jobs: collabJobs,
        algorithm: "collaborative",
        stage: 3,
      },
      kmeans: {
        jobs: kmeansJobs,
        algorithm: "kmeans",
        stage: 2,
      },
      stats: {
        totalUsers: stats.totalUsers,
        userInteractions: stats.userInteractions,
      },
    });
  } catch (error) {
    console.error("Error in all-algorithm recommendations:", error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
};

// Get all unique skills present in the Jobs table for autocomplete
exports.getUniqueSkills = async (req, res) => {
  try {
    // Fetch all active jobs but only the required_skills column
    const jobs = await Job.findAll({
      attributes: ["required_skills"],
      where: { status: "active" },
    });

    const skillsSet = new Set();
    jobs.forEach((job) => {
      let skills = job.required_skills;
      // Handle potential string vs array storage in DB
      if (typeof skills === "string") {
        try {
          skills = JSON.parse(skills);
        } catch {
          skills = skills.split(",");
        }
      }

      if (Array.isArray(skills)) {
        skills.forEach((s) => {
          const skillName = typeof s === "string" ? s : s?.title;
          if (skillName) skillsSet.add(skillName.trim());
        });
      }
    });

    // Return sorted array for better UX in dropdowns
    res.json(Array.from(skillsSet).sort());
  } catch (error) {
    console.error("Error fetching unique skills from DB:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
};
