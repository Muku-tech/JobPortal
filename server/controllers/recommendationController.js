const { Job, User, Application, JobView } = require("../models");
const contentBasedFiltering = require("../services/algorithms/contentBasedFiltering");
const collaborativeFiltering = require("../services/algorithms/collaborativeFiltering");
const kMeansClustering = require("../services/algorithms/kMeansClustering");

// Helper function to get system stats
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

// Calculate skill overlap ratio (0-1)
function calcSkillOverlap(userSkills, jobSkills) {
  if (!userSkills || userSkills.length === 0) return 0.3;
  if (!jobSkills || jobSkills.length === 0) return 0.3;
  const lowerUser = userSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((s) =>
    lowerUser.includes(s.toLowerCase()),
  ).length;
  return Math.min(1, matched / Math.max(1, jobSkills.length));
}

// Enforce diversity: round-robin pick from different categories
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

// Blend recommendations from multiple algorithms
// sources = [{ jobs: [...], weight: 0.5 }, ...]
function blendRecommendations(sources, limit, userSkills = []) {
  const scoreMap = new Map();

  sources.forEach(({ jobs, weight }) => {
    if (!Array.isArray(jobs)) return;
    jobs.forEach((job, idx) => {
      const id = job.id;
      const rankScore = (limit - idx) / limit; // 1.0 for first, decreasing
      const algoScore = job.recommendationScore || 0;
      const baseScore = (algoScore * 0.5 + rankScore * 0.5) * weight;

      // Continuous skill bonus: more overlapping skills = higher score
      const skillOverlap = calcSkillOverlap(
        userSkills,
        job.required_skills || [],
      );
      // Blend base score with skill overlap (max 30% boost for full overlap)
      const combined = baseScore * (1 + skillOverlap * 0.3);

      if (!scoreMap.has(id)) {
        scoreMap.set(id, { job, score: combined });
      } else {
        scoreMap.get(id).score += combined;
      }
    });
  });

  // Sort by score
  const sorted = Array.from(scoreMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  // Enforce diversity so jobs from multiple categories appear
  const diverse = enforceDiversity(
    sorted.map((s) => s.job),
    limit,
  );

  // Re-attach scores
  const scoreLookup = new Map(sorted.map((s) => [s.job.id, s.score]));

  return diverse.slice(0, limit).map((job) => ({
    ...job,
    recommendationScore: Math.round((scoreLookup.get(job.id) || 0) * 100) / 100,
  }));
}

// Smart hybrid recommendation system
// Blends algorithms based on data availability with fallback enrichment
exports.getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = await getSystemStats(userId);

    let recommendations = [];
    let algorithmUsed = "";
    let stage = 0;

    // STAGE 1: Cold Start - No user interactions yet
    if (stats.userInteractions === 0) {
      stage = 1;
      algorithmUsed = "content-based";
      console.log("Stage 1: Content-Based (Cold Start)");
      recommendations = await contentBasedFiltering.getRecommendations(
        userId,
        limit,
      );
    }
    // STAGE 2: Few interactions - blend K-Means + Content-Based
    else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
      stage = 2;
      algorithmUsed = "kmeans+content";
      console.log("Stage 2: K-Means + Content-Based");
      const kmeansJobs = await kMeansClustering.getRecommendations(
        userId,
        limit,
      );
      const contentJobs = await contentBasedFiltering.getRecommendations(
        userId,
        limit,
      );
      recommendations = blendRecommendations(
        [
          { jobs: kmeansJobs, weight: 0.6 },
          { jobs: contentJobs, weight: 0.4 },
        ],
        limit,
        user.skills || [],
      );
    }
    // STAGE 3: Enough data - blend Collaborative + K-Means + Content-Based
    else {
      stage = 3;
      algorithmUsed = "hybrid";
      console.log("Stage 3: Hybrid (Collaborative + K-Means + Content-Based)");
      const collabJobs = await collaborativeFiltering.getRecommendations(
        userId,
        limit,
      );
      const kmeansJobs = await kMeansClustering.getRecommendations(
        userId,
        limit,
      );
      const contentJobs = await contentBasedFiltering.getRecommendations(
        userId,
        limit,
      );
      recommendations = blendRecommendations(
        [
          { jobs: collabJobs, weight: 0.5 },
          { jobs: kmeansJobs, weight: 0.3 },
          { jobs: contentJobs, weight: 0.2 },
        ],
        limit,
        user.skills || [],
      );
    }

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

// Get Content-Based Filtering recommendations specifically
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

// Get Collaborative Filtering recommendations specifically
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

// Get K-Means Clustering recommendations specifically
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

// Track job view for collaborative filtering
exports.trackJobView = async (req, res) => {
  try {
    const { jobId, duration, action } = req.body;
    const userId = req.user.id;

    await JobView.create({
      user_id: userId,
      job_id: jobId,
      view_duration: duration || 0,
      action_type: action || "view",
    });

    res.json({ success: true, message: "Job view tracked" });
  } catch (error) {
    console.error("Error tracking job view:", error);
    res.status(500).json({ message: "Error tracking view" });
  }
};

// Guest recommendations - top jobs for non-logged in users
exports.getGuestRecommendations = async (req, res) => {
  try {
    const { Job, JobView, Application, sequelize } = require("../models");
    const limit = parseInt(req.query.limit) || 8;

    // Get top jobs by views + applications (popularity score)
    const topJobs = await Job.findAll({
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
    // Fallback to recent jobs
    const { Job } = require("../models");
    const fallback = await Job.findAll({
      limit: 8,
      order: [["createdAt", "DESC"]],
    });
    res.json({ jobs: fallback, algorithm: "recent", stage: "guest" });
  }
};

// Get recommendation system status
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
