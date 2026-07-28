const { Job, User, JobView, Application } = require("../../models");

class CollaborativeFiltering {
  async buildInteractionMatrix(userId) {
    try {
      const views = await JobView.findAll({
        attributes: ["user_id", "job_id", "action_type", "view_duration", "createdAt"],
      });

      const applications = await Application.findAll({
        attributes: ["user_id", "job_id"],
      });

      const interactions = {};

      views.forEach((view) => {
        const userIdStr = view.user_id.toString();
        const jobIdStr = view.job_id.toString();
        if (!interactions[userIdStr]) interactions[userIdStr] = {};
        const weight =
          view.action_type === "apply"
            ? 5
            : view.action_type === "save" || view.action_type === "share"
              ? 2
              : 1;
        const daysAgo =
          (Date.now() - new Date(view.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        const recencyBonus = Number.isFinite(daysAgo)
          ? Math.max(0, 1 - daysAgo / 30)
          : 0;
        interactions[userIdStr][jobIdStr] =
          (interactions[userIdStr][jobIdStr] || 0) + weight + recencyBonus;
      });

      applications.forEach((app) => {
        const userIdStr = app.user_id.toString();
        const jobIdStr = app.job_id.toString();
        if (!interactions[userIdStr]) interactions[userIdStr] = {};
        interactions[userIdStr][jobIdStr] =
          (interactions[userIdStr][jobIdStr] || 0) + 10;
      });

      return interactions;
    } catch (error) {
      console.error("Error building interaction matrix:", error);
      throw error;
    }
  }

  parseSkills(skills) {
    if (typeof skills === 'string') {
      try {
        skills = JSON.parse(skills);
      } catch (e) {
        skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(skills)) return [];
    return skills
      .map((s) => (typeof s === 'string' ? s : s?.title || ''))
      .filter(Boolean);
  }

  skillOverlapScore(userSkills, jobSkills) {
    if (!userSkills.length || !jobSkills.length) return 0;
    const lowerUser = userSkills.map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) =>
      lowerUser.includes(s.toLowerCase()),
    ).length;
    const userCov = matched / userSkills.length;
    const jobCov = matched / jobSkills.length;
    return (userCov + jobCov) / 2;
  }

  calculateUserSimilarity(user1Interactions, user2Interactions) {
    const allJobs = new Set([
      ...Object.keys(user1Interactions),
      ...Object.keys(user2Interactions),
    ]);
    const vec1 = Array.from(allJobs).map(
      (jobId) => user1Interactions[jobId] || 0,
    );
    const vec2 = Array.from(allJobs).map(
      (jobId) => user2Interactions[jobId] || 0,
    );
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }

  async findSimilarUsers(userId, limit = 10) {
    try {
      const interactions = await this.buildInteractionMatrix(userId);
      const userIdStr = userId.toString();
      if (!interactions[userIdStr]) return [];
      const similarities = [];
      for (const [otherUserId, otherInteractions] of Object.entries(interactions)) {
        if (otherUserId === userIdStr) continue;
        const similarity = this.calculateUserSimilarity(
          interactions[userIdStr],
          otherInteractions,
        );
        if (similarity > 0) {
          similarities.push({ userId: parseInt(otherUserId), similarity });
        }
      }
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, limit);
    } catch (error) {
      console.error("Error finding similar users:", error);
      throw error;
    }
  }

  enforceDiversity(jobs, limit) {
    if (!jobs.length) return [];
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
      if (group && group.length > 0) {
        result.push(group.shift());
      }
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
    while (result.length < limit && remaining.length > 0) {
      result.push(remaining.shift());
    }

    return result;
  }

  isLocationMatch(preferredLocation, jobLocation) {
    return preferredLocation && jobLocation &&
      (preferredLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
       jobLocation.toLowerCase().includes(preferredLocation.toLowerCase()));
  }

  async getRecommendations(userId, limit = 10) {
    try {
      const interactions = await this.buildInteractionMatrix(userId);
      const user = await User.findByPk(userId);
      if (!user) return [];

      const userSkills = this.parseSkills(user.skills);
      const preferredLocation = user.preferred_location ||
        (user.address ? user.address.split(',')[0].trim() : null);

      const userIdStr = userId.toString();
      const userJobs = new Set(Object.keys(interactions[userIdStr] || {}));
      const similarUsers = await this.findSimilarUsers(userId, 20);

      // No similar users → return popular jobs ranked by skill match
      if (similarUsers.length === 0) {
        const popularJobs = await Job.findAll({
          where: { status: "active" },
          order: [["createdAt", "DESC"]],
          limit: limit * 2,
        });

        const scored = popularJobs.map((job) => {
          const skillScore = this.skillOverlapScore(userSkills, this.parseSkills(job.required_skills));
          const loc = this.isLocationMatch(preferredLocation, job.location) ? 1 : 0;
          return {
            ...job.toJSON(),
            recommendationScore: Math.round((skillScore * 0.7 + loc * 0.3) * 100) / 100,
            recommendationType: "popular",
            matchReasons: ["Trending job"],
          };
        });

        scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
        return scored.slice(0, limit);
      }

      // Score unseen jobs from similar users
      const jobScores = {};
      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserIdStr = similarUserId.toString();
        const similarUserJobs = interactions[similarUserIdStr] || {};
        for (const [jobId, interactionScore] of Object.entries(similarUserJobs)) {
          if (userJobs.has(jobId)) continue;
          if (!jobScores[jobId]) jobScores[jobId] = { score: 0, count: 0 };
          jobScores[jobId].score += similarity * interactionScore;
          jobScores[jobId].count += 1;
        }
      }

      const candidateJobIds = Object.keys(jobScores).map((id) => parseInt(id));
      let candidateJobs = await Job.findAll({
        where: { id: candidateJobIds, status: "active" },
      });

      if (candidateJobs.length === 0) {
        candidateJobs = await Job.findAll({
          where: { status: "active" },
          order: [["createdAt", "DESC"]],
          limit: limit * 2,
        });

        const scored = candidateJobs.map((job) => {
          const skillScore = this.skillOverlapScore(userSkills, this.parseSkills(job.required_skills));
          const loc = this.isLocationMatch(preferredLocation, job.location) ? 1 : 0;
          return {
            ...job.toJSON(),
            recommendationScore: Math.round((skillScore * 0.7 + loc * 0.3) * 100) / 100,
            recommendationType: "popular",
            matchReasons: ["Trending job"],
          };
        });

        scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
        return scored.slice(0, limit);
      }

      // Normalize rawScore to 0-1
      const maxRaw = Math.max(0.01, ...candidateJobs.map(j => jobScores[j.id]?.score || 0));

      const scoredJobs = candidateJobs.map((job) => {
        const rawScore = (jobScores[job.id]?.score || 0) / maxRaw;
        const skillScore = this.skillOverlapScore(userSkills, this.parseSkills(job.required_skills));
        const loc = this.isLocationMatch(preferredLocation, job.location) ? 1 : 0;

        const combined = rawScore * 0.25 + skillScore * 0.45 + loc * 0.30;

        const reasons = [];
        if (skillScore > 0) {
          reasons.push(`${Math.round(skillScore * 100)}% skills match`);
        }
        if (loc) {
          reasons.push("Location matches your preference");
        }
        reasons.push("Popular among similar users");

        return {
          ...job.toJSON(),
          recommendationScore: Math.round(combined * 100) / 100,
          recommendationType: "collaborative",
          _skillScore: skillScore,
          _locationScore: loc,
          matchReasons: reasons,
        };
      });

      scoredJobs.sort((a, b) => b.recommendationScore - a.recommendationScore);

      const locationMatchingJobs = scoredJobs.filter(j => j._locationScore);
      const otherJobs = scoredJobs.filter(j => !j._locationScore);

      const diverseLocal = this.enforceDiversity(locationMatchingJobs, limit);
      const diverseOthers = this.enforceDiversity(otherJobs, limit);

      return [...diverseLocal, ...diverseOthers].slice(0, limit);
    } catch (error) {
      console.error("Collaborative Filtering Error:", error);
      throw error;
    }
  }

  async recordInteraction(userId, jobId, actionType = "view", viewDuration = 0) {
    try {
      const existingView = await JobView.findOne({
        where: { user_id: userId, job_id: jobId },
      });
      if (existingView) {
        await existingView.update({
          action_type: actionType,
          view_duration: viewDuration + existingView.view_duration,
        });
      } else {
        await JobView.create({
          user_id: userId,
          job_id: jobId,
          action_type: actionType,
          view_duration: viewDuration,
        });
      }
      return true;
    } catch (error) {
      console.error("Error recording interaction:", error);
      throw error;
    }
  }
}

module.exports = new CollaborativeFiltering();
