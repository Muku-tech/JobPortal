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

// Smart hybrid recommendation system
// Automatically selects the best algorithm based on data availability
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
    // Use Content-Based Filtering (matches user skills to job requirements)
    if (stats.userInteractions === 0) {
      stage = 1;
      algorithmUsed = "content-based";
      console.log("Stage 1: Using Content-Based Filtering (Cold Start)");
      recommendations = await contentBasedFiltering.getRecommendations(
        userId,
        limit,
      );
    }
    // STAGE 2: Some Users Available - Not enough for collaborative
    // Use K-Means Clustering (groups similar jobs and users)
    else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
      stage = 2;
      algorithmUsed = "kmeans";
      console.log("Stage 2: Using K-Means Clustering");
      recommendations = await kMeansClustering.getRecommendations(
        userId,
        limit,
      );
    }
    // STAGE 3: Enough Data - Use Collaborative Filtering
    // (recommends jobs that similar users have applied to)
    else {
      stage = 3;
      algorithmUsed = "collaborative";
      console.log("Stage 3: Using Collaborative Filtering");
      recommendations = await collaborativeFiltering.getRecommendations(
        userId,
        limit,
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
