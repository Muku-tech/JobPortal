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
  if (!userSkills || userSkills.length === 0) return 0;
  if (!jobSkills || jobSkills.length === 0) return 0;
  const lowerUser = userSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((s) =>
    lowerUser.includes(s.toLowerCase()),
  ).length;
  return Math.min(1, matched / Math.max(1, jobSkills.length));
}

// Minimum skill overlap threshold — jobs below this are considered irrelevant
const SKILL_OVERLAP_THRESHOLD = 0.1;

// Filter jobs below the minimum skill overlap threshold.
// Only keeps jobs where at least SKILL_OVERLAP_THRESHOLD fraction of required skills match the user.
function filterBySkillOverlap(jobs, userSkills) {
  if (!userSkills || userSkills.length === 0) return [];
  return jobs.filter((job) => {
    const overlap = calcSkillOverlap(userSkills, job.required_skills || []);
    return overlap >= SKILL_OVERLAP_THRESHOLD;
  });
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

  // Filter out jobs that have insufficient skill overlap with the user.
  // This prevents recommending jobs from unrelated categories.
  const filtered = sorted.filter((entry) => {
    const overlap = calcSkillOverlap(
      userSkills,
      entry.job.required_skills || [],
    );
    return overlap >= SKILL_OVERLAP_THRESHOLD;
  });

  // If filtering removed everything, return empty so fallback can handle it
  if (filtered.length === 0) return [];

  // Normalize scores to a 0-1 scale using only the real max (no artificial floor).
  // Low-scoring jobs will naturally show a low match percentage.
  const rawMax = filtered.length > 0 ? filtered[0].score : 0;
  const maxBlendedScore = Math.max(rawMax, 0.01); // Only floor at 0.01 to avoid div-by-zero

  // Enforce diversity so jobs from multiple categories appear
  const diverse = enforceDiversity(
    filtered.map((s) => s.job),
    limit,
  );

  // Re-attach scores
  // We divide by maxBlendedScore — no artificial floor means weak matches stay weak
  const scoreLookup = new Map(
    filtered.map((s) => [s.job.id, s.score / maxBlendedScore]),
  );

  return diverse.slice(0, limit).map((job) => {
    // Ensure we are working with a plain object, not a Sequelize instance
    const plainJob = typeof job.toJSON === "function" ? job.toJSON() : job;
    return {
      ...plainJob,
      recommendationScore:
        Math.round((scoreLookup.get(job.id) || 0) * 100) / 100,
    };
  });
}

// Internal helper to get smart recommendations without Express context
const _getSmartRecommendationsInternal = async (userId, limit) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found for recommendations");
  }

  // Data Sanitization: Ensure skills is an array even if DB returns a string
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

  // STAGE 1: Cold Start - No user interactions yet
  if (stats.userInteractions === 0) {
    stage = 1;
    algorithmUsed = "content-based";
    recommendations = await contentBasedFiltering.getRecommendations(
      userId,
      limit,
    );
  }
  // STAGE 2: Few interactions - blend K-Means + Content-Based
  else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
    stage = 2;
    algorithmUsed = "kmeans+content";
    const kmeansJobs = await kMeansClustering.getRecommendations(userId, limit);
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
    const collabJobs = await collaborativeFiltering.getRecommendations(
      userId,
      limit,
    );
    const kmeansJobs = await kMeansClustering.getRecommendations(userId, limit);
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

  // FALLBACK: If no recommendations found, search for jobs with ANY skill overlap
  if (recommendations.length === 0) {
    const allJobs = await Job.findAll({
      where: { status: "active" },
      limit: 50,
      order: [["createdAt", "DESC"]],
    });
    // Filter to only jobs that have at least some skill overlap with the user
    const matchingJobs = filterBySkillOverlap(allJobs, user.skills || []);
    if (matchingJobs.length > 0) {
      recommendations = matchingJobs.slice(0, limit).map((j) => ({
        ...(typeof j.toJSON === "function" ? j.toJSON() : j),
        recommendationType: "skill-matched",
        recommendationScore: calcSkillOverlap(
          user.skills || [],
          j.required_skills || [],
        ),
      }));
      algorithmUsed = algorithmUsed || "fallback-skill-matched";
    } else {
      // Absolute last resort: recent jobs
      recommendations = allJobs.slice(0, limit).map((j) => ({
        ...(typeof j.toJSON === "function" ? j.toJSON() : j),
        recommendationType: "popular",
        recommendationScore: 0.1,
      }));
      algorithmUsed = algorithmUsed || "fallback-popular";
    }
  }

  return { recommendations, user, stats, algorithmUsed, stage };
};

// Smart hybrid recommendation system
// Blends algorithms based on data availability with fallback enrichment
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

    // job_views has a unique constraint on (user_id, job_id)
    // so we must avoid duplicate inserts for repeated views/clicks.
    const existing = await JobView.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (existing) {
      await existing.update({
        // Option A: accumulate view duration
        view_duration: (existing.view_duration || 0) + (duration || 0),
        action_type: action || existing.action_type || "view",
      });
    } else {
      await JobView.create({
        user_id: userId,
        job_id: jobId,
        view_duration: duration || 0,
        action_type: action || "view",
      });
    }

    // Trigger automated recommendation message on significant interaction
    // Throttled to once every 15 minutes to avoid spamming the user
    if (action === "click" || action === "save" || action === "apply") {
      const lastMessage = await Message.findOne({
        where: { recipient_id: userId, type: "system" },
        order: [["createdAt", "DESC"]],
      });

      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (!lastMessage || lastMessage.createdAt < fifteenMinsAgo) {
        // Fire and forget internal call to send message
        exports
          .sendRecommendationAsMessage(
            { user: { id: userId }, query: { limit: 5 } },
            { json: () => {} },
          )
          .catch((err) =>
            console.error("Auto-recommendation error:", err.message),
          );
      }
    }

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

// Send personalized job recommendations as a message to the user
exports.sendRecommendationAsMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const { recommendations, user, stats, algorithmUsed, stage } =
      await _getSmartRecommendationsInternal(userId, limit);

    // Check for empty profile (Cold Start + No Skills)
    const hasNoSkills = !Array.isArray(user.skills) || user.skills.length === 0;
    if (stage === 1 && hasNoSkills && stats.userInteractions === 0) {
      return res.json({
        message: "Profile too empty to send meaningful recommendations.",
        jobs: [],
      });
    }

    if (recommendations.length === 0) {
      // If no recommendations are found, return a 200 with a message, not 404,
      // as it's not an error, just no recommendations at this time.
      return res.json({
        message: "No recommendations found for this user at this time.",
        count: 0,
        jobs: [],
        algorithm: algorithmUsed,
        stage,
      });
    }

    // Create structured data for the UI to render clickable elements
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

    // Automated recommendations use the system persona (Nabin Gautam)
    // We default to ID 1 (System Admin) if the persona user isn't found
    const nabinUser = await User.findOne({ where: { name: "Nabin Gautam" } });
    const senderId = nabinUser ? nabinUser.id : 1;

    // Send as a system message to the user
    // NOTE: Message.type in your DB is ENUM('system','user')
    const message = await Message.create({
      sender_id: senderId,
      recipient_id: userId,
      message: JSON.stringify(messageData),
      type: "system",
      read: false,
    });

    // Also create a notification (best-effort)
    // If notifications table/DB isn't present, we don't block recommendations.
    try {
      await Notification.create({
        user_id: userId,
        from_user_id: senderId,
        title: "New Job Recommendations",
        message: `We found ${recommendations.length} new jobs that match your profile!`,
        // Notification.type ENUM does NOT include 'message'
        // Use a safe default that exists in DB model.
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
    // Log the full error object for debugging
    console.error("Error details:", error?.message, error?.stack);
    res.status(500).json({
      message: "Error sending recommendations",
      error: error?.message,
      // Helps frontend/debugging without needing server logs
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

// Get all unique skills present in the Jobs table for autocomplete
exports.getUniqueSkills = async (req, res) => {
  try {
    // Fetch all active jobs but only the required_skills column
    const jobs = await Job.findAll({
      attributes: ["required_skills"],
      where: { status: ["active", "draft"] }, // Include drafts to populate more skills
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
