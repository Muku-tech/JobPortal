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

const getSystemStats = async (userId) => {
  const totalUsers = await User.count();
  let totalJobViews = 0;
  try { totalJobViews = await JobView.count(); } catch (e) { console.warn("JobView.count failed:", e.message); }
  let totalApplications = 0;
  try { totalApplications = await Application.count(); } catch (e) { console.warn("Application.count failed:", e.message); }
  let userJobViews = 0;
  try { userJobViews = await JobView.count({ where: { user_id: userId } }); } catch (e) { console.warn("userJobViews.count failed:", e.message); }
  let userApplications = 0;
  try { userApplications = await Application.count({ where: { user_id: userId } }); } catch (e) { console.warn("userApplications.count failed:", e.message); }

  return {
    totalUsers, totalJobViews, totalApplications,
    userInteractions: userJobViews + userApplications,
  };
};

function calcSkillOverlap(userSkills, jobSkills) {
  if (!userSkills || !userSkills.length || !jobSkills || !jobSkills.length) return 0;
  const lowerUser = userSkills.map((s) => s.toLowerCase());
  const matched = jobSkills.filter((s) => lowerUser.includes(s.toLowerCase())).length;
  const userCov = matched / userSkills.length;
  const jobCov = matched / jobSkills.length;
  return (userCov + jobCov) / 2;
}

const SKILL_OVERLAP_THRESHOLD = 0.1;

function filterBySkillOverlap(jobs, userSkills) {
  if (!userSkills || !userSkills.length) return [];
  return jobs.filter((job) => {
    const overlap = calcSkillOverlap(userSkills, job.required_skills || []);
    return overlap >= SKILL_OVERLAP_THRESHOLD;
  });
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

  while (result.length < Math.min(limit, cats.length) && categoryGroups.size > 0) {
    const cat = cats[idx % cats.length];
    const group = categoryGroups.get(cat);
    if (group && group.length > 0) result.push(group.shift());
    if (!group || group.length === 0) {
      categoryGroups.delete(cat);
      cats.splice(cats.indexOf(cat), 1);
      if (cats.length === 0) break;
      if (idx >= cats.length) idx = 0;
    } else {
      idx++;
    }
  }

  const remaining = jobs.filter(j => !result.includes(j));
  while (result.length < limit && remaining.length > 0) result.push(remaining.shift());

  return result;
}

function blendRecommendations(sources, limit, userSkills = [], userPreferredLocation = null) {
  const scoreMap = new Map();

  sources.forEach(({ jobs, weight }) => {
    if (!Array.isArray(jobs)) return;
    jobs.forEach((job, idx) => {
      const id = job.id;
      const rankScore = (limit - idx) / limit;
      const algoScore = job.recommendationScore || 0;
      const baseScore = (algoScore * 0.7 + rankScore * 0.3) * weight;

      const isLocationMatch = userPreferredLocation && job.location &&
        (userPreferredLocation.toLowerCase().includes(job.location.toLowerCase()) ||
         job.location.toLowerCase().includes(userPreferredLocation.toLowerCase()));
      const locationBonus = isLocationMatch ? 0.10 : 0;

      const combined = baseScore + locationBonus;

      if (!scoreMap.has(id)) {
        scoreMap.set(id, { job, score: combined });
      } else {
        scoreMap.get(id).score += combined;
      }
    });
  });

  const sorted = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);

  const filtered = sorted.filter((entry) => {
    const overlap = calcSkillOverlap(userSkills, entry.job.required_skills || []);
    return overlap >= SKILL_OVERLAP_THRESHOLD;
  });

  if (filtered.length === 0) return [];

  const rawMax = Math.max(filtered[0].score, 0.01);

  const diverse = enforceDiversity(
    filtered.map((s) => s.job),
    limit,
  );

  const scoreLookup = new Map(
    filtered.map((s) => [s.job.id, s.score / rawMax]),
  );

  return diverse.slice(0, limit).map((job) => {
    const plainJob = typeof job.toJSON === "function" ? job.toJSON() : job;
    return {
      ...plainJob,
      recommendationScore: Math.round((scoreLookup.get(job.id) || 0) * 100) / 100,
    };
  });
}

const _getSmartRecommendationsInternal = async (userId, limit) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found for recommendations");

  if (typeof user.skills === "string") {
    try { user.skills = JSON.parse(user.skills); } catch (e) {
      user.skills = user.skills.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(user.skills)) user.skills = [];

  const preferredLocation = user.preferred_location ||
    (user.address ? user.address.split(',')[0].trim() : null);

  const stats = await getSystemStats(userId);

  let recommendations = [];
  let algorithmUsed = "";
  let stage = 0;

  if (stats.userInteractions === 0) {
    stage = 1;
    algorithmUsed = "content-based";
    recommendations = await contentBasedFiltering.getRecommendations(userId, limit);
  } else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
    stage = 2;
    algorithmUsed = "kmeans+content";
    const kmeansJobs = await kMeansClustering.getRecommendations(userId, limit);
    const contentJobs = await contentBasedFiltering.getRecommendations(userId, limit);
    recommendations = blendRecommendations(
      [
        { jobs: kmeansJobs, weight: 0.4 },
        { jobs: contentJobs, weight: 0.6 },
      ],
      limit,
      user.skills || [],
      preferredLocation,
    );
  } else {
    stage = 3;
    algorithmUsed = "content-based";
    const collabJobs = await collaborativeFiltering.getRecommendations(userId, limit);
    const kmeansJobs = await kMeansClustering.getRecommendations(userId, limit);
    const contentJobs = await contentBasedFiltering.getRecommendations(userId, limit);
    recommendations = blendRecommendations(
      [
        { jobs: collabJobs, weight: 0.30 },
        { jobs: kmeansJobs, weight: 0.20 },
        { jobs: contentJobs, weight: 0.50 },
      ],
      limit,
      user.skills || [],
      preferredLocation,
    );
  }

  if (recommendations.length === 0) {
    const { Op } = require('sequelize');
    const allJobs = await Job.findAll({
      where: { status: { [Op.in]: ["active", "draft"] } },
      order: [["createdAt", "DESC"]],
    });
    const matchingJobs = filterBySkillOverlap(allJobs, user.skills || []);
    if (matchingJobs.length > 0) {
      recommendations = matchingJobs.slice(0, limit).map((j) => ({
        ...(typeof j.toJSON === "function" ? j.toJSON() : j),
        recommendationType: "skill-matched",
        recommendationScore: calcSkillOverlap(user.skills || [], j.required_skills || []),
      }));
      algorithmUsed = algorithmUsed || "fallback-skill-matched";
    } else {
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

exports._getSmartRecommendationsInternal = _getSmartRecommendationsInternal;

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
      stats: { totalUsers: stats.totalUsers, userInteractions: stats.userInteractions },
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
    res.json({ jobs, algorithm: "content-based", stage: 1 });
  } catch (error) {
    console.error("Error in content-based recommendations:", error);
    res.status(500).json({ message: "Error generating content-based recommendations" });
  }
};

exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await collaborativeFiltering.getRecommendations(userId, limit);
    res.json({ jobs, algorithm: "collaborative", stage: 3 });
  } catch (error) {
    console.error("Error in collaborative recommendations:", error);
    res.status(500).json({ message: "Error generating collaborative recommendations" });
  }
};

exports.getKMeansRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await kMeansClustering.getRecommendations(userId, limit);
    res.json({ jobs, algorithm: "kmeans", stage: 2 });
  } catch (error) {
    console.error("Error in k-means recommendations:", error);
    res.status(500).json({ message: "Error generating k-means recommendations" });
  }
};

exports.trackJobView = async (req, res) => {
  try {
    const { jobId, duration, action } = req.body;
    const userId = req.user.id;

    const existing = await JobView.findOne({ where: { user_id: userId, job_id: jobId } });

    if (existing) {
      await existing.update({
        view_duration: (existing.view_duration || 0) + (duration || 0),
        action_type: action || existing.action_type || "view",
      });
    } else {
      await JobView.create({
        user_id: userId, job_id: jobId,
        view_duration: duration || 0, action_type: action || "view",
      });
    }

    if (action === "click" || action === "save" || action === "apply") {
      const lastMessage = await Message.findOne({
        where: { recipient_id: userId, type: "system" },
        order: [["createdAt", "DESC"]],
      });
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (!lastMessage || lastMessage.createdAt < fifteenMinsAgo) {
        exports.sendRecommendationAsMessage(
          { user: { id: userId }, query: { limit: 5 } },
          { json: () => {} },
        ).catch((err) => console.error("Auto-recommendation error:", err.message));
      }
    }

    res.json({ success: true, message: "Job view tracked" });
  } catch (error) {
    console.error("Error tracking job view:", error);
    res.status(500).json({ message: "Error tracking view" });
  }
};

exports.getGuestRecommendations = async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const limit = parseInt(req.query.limit) || 8;

    const topJobs = await Job.findAll({
      attributes: [
        "id", "title", "company_name", "location", "job_type", "salary_min", "salary_max",
        [sequelize.literal("(SELECT COUNT(*) FROM job_views WHERE job_views.job_id = Job.id)"), "view_count"],
        [sequelize.literal("(SELECT COUNT(*) FROM applications WHERE applications.job_id = Job.id)"), "application_count"],
      ],
      order: [sequelize.literal("view_count + COALESCE(application_count, 0) DESC"), ["createdAt", "DESC"]],
      limit, raw: true,
    });

    res.json({ jobs: topJobs, algorithm: "popularity", stage: "guest", message: "Top popular jobs for guests" });
  } catch (error) {
    console.error("Error in guest recommendations:", error);
    const { Job } = require("../models");
    const fallback = await Job.findAll({ limit: 8, order: [["createdAt", "DESC"]] });
    res.json({ jobs: fallback, algorithm: "recent", stage: "guest" });
  }
};

exports.getRecommendationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getSystemStats(userId);

    let recommendedStage = "content-based";
    if (stats.userInteractions > 5 && stats.totalUsers >= 10) recommendedStage = "collaborative";
    else if (stats.userInteractions > 0) recommendedStage = "kmeans";

    res.json({
      stats, recommendedAlgorithm: recommendedStage,
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
      return res.json({ message: "Profile too empty to send meaningful recommendations.", jobs: [] });
    }

    if (recommendations.length === 0) {
      return res.json({
        message: "No recommendations found for this user at this time.",
        count: 0, jobs: [], algorithm: algorithmUsed, stage,
      });
    }

    const messageData = {
      title: "Your Personalized Job Recommendations",
      text: `Hi ${user.name}! We found ${recommendations.length} jobs that match your profile based on your skills and preferences.`,
      jobs: recommendations.map((job) => ({
        id: job.id, title: job.title, company: job.company_name,
        location: job.location || "Nepal", job_type: job.job_type || "Full-time",
      })),
      algorithm: algorithmUsed,
      footer: `Generated using the ${algorithmUsed} matching system.`,
    };

    const nabinUser = await User.findOne({ where: { name: "Nabin Gautam" } });
    const senderId = nabinUser ? nabinUser.id : 1;

    await Message.create({
      sender_id: senderId, recipient_id: userId,
      message: JSON.stringify(messageData), type: "system", read: false,
    });

    try {
      await Notification.create({
        user_id: userId, from_user_id: senderId,
        title: "New Job Recommendations",
        message: `We found ${recommendations.length} new jobs that match your profile!`,
        type: "system", read: false,
      });
    } catch (nErr) { console.warn("Notification create failed (non-fatal):", nErr?.message || nErr); }

    console.log(`Sent ${recommendations.length} job recommendations as message to user ${userId} using ${algorithmUsed} (Stage ${stage})`);

    res.json({
      message: "Recommendations sent as message", count: recommendations.length,
      jobs: recommendations, algorithm: algorithmUsed, stage,
    });
  } catch (error) {
    console.error("Error sending recommendation as message:", error);
    res.status(500).json({ message: "Error sending recommendations", error: error?.message });
  }
};

exports.getAllAlgorithmRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 8;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const stats = await getSystemStats(userId);
    const preferredLocation = user.preferred_location ||
      (user.address ? user.address.split(',')[0].trim() : null);

    const [contentJobs, kmeansJobs, collabJobs] = await Promise.all([
      contentBasedFiltering.getRecommendations(userId, limit),
      kMeansClustering.getRecommendations(userId, limit),
      collaborativeFiltering.getRecommendations(userId, limit).catch(() => []),
    ]);

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
        [{ jobs: kmeansJobs, weight: 0.4 }, { jobs: contentJobs, weight: 0.6 }],
        limit, user.skills || [], preferredLocation,
      );
    } else {
      stage = 3;
      algorithmUsed = "content-based";
      smartJobs = blendRecommendations(
        [
          { jobs: collabJobs, weight: 0.30 },
          { jobs: kmeansJobs, weight: 0.20 },
          { jobs: contentJobs, weight: 0.50 },
        ],
        limit, user.skills || [], preferredLocation,
      );
    }

    // Fallback: same as _getSmartRecommendationsInternal
    if (smartJobs.length === 0) {
      const { Op } = require('sequelize');
      const allJobs = await Job.findAll({
        where: { status: { [Op.in]: ["active", "draft"] } },
        order: [["createdAt", "DESC"]],
      });
      const matchingJobs = filterBySkillOverlap(allJobs, user.skills || []);
      if (matchingJobs.length > 0) {
        smartJobs = matchingJobs.slice(0, limit).map((j) => ({
          ...(typeof j.toJSON === "function" ? j.toJSON() : j),
          recommendationType: "skill-matched",
          recommendationScore: calcSkillOverlap(user.skills || [], j.required_skills || []),
        }));
        algorithmUsed = algorithmUsed || "fallback-skill-matched";
      } else {
        smartJobs = allJobs.slice(0, limit).map((j) => ({
          ...(typeof j.toJSON === "function" ? j.toJSON() : j),
          recommendationType: "popular", recommendationScore: 0.1,
        }));
        algorithmUsed = algorithmUsed || "fallback-popular";
      }
    }

    res.json({
      smart: { jobs: smartJobs, algorithm: algorithmUsed, stage },
      contentBased: { jobs: contentJobs, algorithm: "content-based", stage: 1 },
      collaborative: { jobs: collabJobs, algorithm: "collaborative", stage: 3 },
      kmeans: { jobs: kmeansJobs, algorithm: "kmeans", stage: 2 },
      stats: { totalUsers: stats.totalUsers, userInteractions: stats.userInteractions },
    });
  } catch (error) {
    console.error("Error in all-algorithm recommendations:", error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
};

exports.getUniqueSkills = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      attributes: ["required_skills"],
      where: { status: ["active", "draft"] },
    });

    const skillsSet = new Set();
    jobs.forEach((job) => {
      let skills = job.required_skills;
      if (typeof skills === "string") {
        try { skills = JSON.parse(skills); } catch { skills = skills.split(","); }
      }
      if (Array.isArray(skills)) {
        skills.forEach((s) => {
          const skillName = typeof s === "string" ? s : s?.title;
          if (skillName) skillsSet.add(skillName.trim());
        });
      }
    });

    res.json(Array.from(skillsSet).sort());
  } catch (error) {
    console.error("Error fetching unique skills from DB:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
};
