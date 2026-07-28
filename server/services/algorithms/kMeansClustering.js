const { Job, User, JobView, Application } = require("../../models");

class KMeansClustering {
  constructor(k = 5) {
    this.k = k;
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

  isLocationMatch(preferredLocation, jobLocation) {
    return preferredLocation && jobLocation &&
      (preferredLocation.toLowerCase().includes(jobLocation.toLowerCase()) ||
       jobLocation.toLowerCase().includes(preferredLocation.toLowerCase()));
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

  async getRecommendations(userId, limit = 10) {
    try {
      let user = await User.findByPk(userId);
      if (!user) return [];

      let userClusterId = user.cluster_id;
      if (userClusterId === null) {
        await this.assignUserClusters();
        user = await User.findByPk(userId);
        userClusterId = user?.cluster_id ?? 0;
      }

      const userSkills = this.parseSkills(user.skills);
      const preferredLocation = user.preferred_location ||
        (user.address ? user.address.split(',')[0].trim() : null);

      const clusterUsers = await User.findAll({
        where: { role: "jobseeker", cluster_id: userClusterId },
        attributes: ["id"],
      });
      const clusterUserIds = clusterUsers.map((u) => u.id);

      const userViews = await JobView.findAll({
        where: { user_id: userId },
        attributes: ["job_id"],
      });
      const userApps = await Application.findAll({
        where: { user_id: userId },
        attributes: ["job_id"],
      });
      const seenJobIds = new Set([
        ...userViews.map((v) => v.job_id),
        ...userApps.map((a) => a.job_id),
      ]);

      // Aggregate interactions from cluster peers
      const jobScores = {};
      const clusterViews = await JobView.findAll({
        where: { user_id: clusterUserIds },
        attributes: ["job_id", "action_type"],
      });
      clusterViews.forEach((v) => {
        if (seenJobIds.has(v.job_id)) return;
        const weight = v.action_type === "apply" ? 5 : v.action_type === "save" ? 2 : 1;
        jobScores[v.job_id] = (jobScores[v.job_id] || 0) + weight;
      });

      const clusterApps = await Application.findAll({
        where: { user_id: clusterUserIds },
        attributes: ["job_id"],
      });
      clusterApps.forEach((a) => {
        if (seenJobIds.has(a.job_id)) return;
        jobScores[a.job_id] = (jobScores[a.job_id] || 0) + 10;
      });

      const candidateJobIds = Object.keys(jobScores).map((id) => parseInt(id));
      let candidateJobs = await Job.findAll({
        where: { id: candidateJobIds, status: "active" },
      });

      // Fallback: no cluster interactions → skill-matched recent jobs
      if (candidateJobs.length === 0) {
        const fallbackJobs = await Job.findAll({
          where: { status: "active" },
          limit: limit * 2,
          order: [["createdAt", "DESC"]],
        });

        const scored = fallbackJobs.map((job) => {
          const skillScore = this.skillOverlapScore(userSkills, this.parseSkills(job.required_skills));
          const loc = this.isLocationMatch(preferredLocation, job.location) ? 1 : 0;
          return {
            ...job.toJSON(),
            recommendationScore: Math.round((skillScore * 0.7 + loc * 0.3) * 100) / 100,
            cluster: userClusterId,
            recommendationType: "kmeans-fallback",
            matchReasons: ["Recommended from your skill cluster"],
          };
        });

        scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

        const local = scored.filter(j => this.isLocationMatch(preferredLocation, j.location));
        const others = scored.filter(j => !this.isLocationMatch(preferredLocation, j.location));

        const diverseLocal = this.enforceDiversity(local, limit);
        const diverseOthers = this.enforceDiversity(others, limit);

        return [...diverseLocal, ...diverseOthers].slice(0, limit);
      }

      // Normalize cluster score to 0-1
      const maxScore = Math.max(0.01, ...candidateJobs.map(j => jobScores[j.id] || 0));

      const scoredJobs = candidateJobs.map((job) => {
        const clusterScore = (jobScores[job.id] || 0) / maxScore;
        const skillScore = this.skillOverlapScore(userSkills, this.parseSkills(job.required_skills));
        const loc = this.isLocationMatch(preferredLocation, job.location) ? 1 : 0;

        const combined = clusterScore * 0.25 + skillScore * 0.45 + loc * 0.30;

        const reasons = [];
        if (skillScore > 0) {
          reasons.push(`${Math.round(skillScore * 100)}% skills match`);
        }
        if (loc) {
          reasons.push("Location matches your preference");
        }
        if (clusterScore > 0) {
          reasons.push("Popular in your cluster");
        }
        if (!reasons.length) {
          reasons.push("Recommended by K-Means clustering");
        }

        return {
          ...job.toJSON(),
          recommendationScore: Math.round(combined * 100) / 100,
          cluster: userClusterId,
          recommendationType: "kmeans",
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
      console.error("K-Means Clustering Error:", error);
      throw error;
    }
  }

  async assignUserClusters() {
    try {
      const users = await User.findAll({ where: { role: "jobseeker" } });
      if (users.length === 0) return {};

      // Build skill vectors
      const allSkillsSet = new Set();
      users.forEach((u) => {
        this.parseSkills(u.skills).forEach((s) => allSkillsSet.add(s.toLowerCase()));
      });
      const allSkills = Array.from(allSkillsSet);

      const experienceMap = {
        entry: 0, mid: 0.5, senior: 1, lead: 0.75, executive: 1,
      };

      // Build location pool
      const allLocationsSet = new Set();
      users.forEach((u) => {
        const loc = u.preferred_location || (u.address ? u.address.split(',')[0].trim() : null);
        if (loc) allLocationsSet.add(loc.toLowerCase());
      });
      const allLocations = Array.from(allLocationsSet);

      // Build vectors: [skill_binary..., experience, location_binary...]
      const vectors = users.map((u) => {
        const uSkills = this.parseSkills(u.skills);
        const skillVec = allSkills.map((s) =>
          uSkills.some((us) => us.toLowerCase() === s) ? 1 : 0,
        );
        const expVal = experienceMap[u.experience_level] || 0.5;
        const uLoc = u.preferred_location || (u.address ? u.address.split(',')[0].trim() : null);
        const locVec = allLocations.map((l) =>
          uLoc && uLoc.toLowerCase() === l ? 1.5 : 0,
        );
        return [...skillVec, expVal, ...locVec];
      });

      const k = Math.min(3, users.length);
      let centroids = [];
      for (let i = 0; i < k; i++) {
        centroids.push(vectors[Math.floor(Math.random() * vectors.length)]);
      }

      let assignments = new Array(vectors.length).fill(0);
      for (let iter = 0; iter < 30; iter++) {
        let changed = false;
        for (let i = 0; i < vectors.length; i++) {
          let bestDist = Infinity;
          let bestCluster = 0;
          for (let c = 0; c < k; c++) {
            const dist = vectors[i].reduce(
              (sum, val, idx) => sum + Math.pow(val - centroids[c][idx], 2),
              0,
            );
            if (dist < bestDist) {
              bestDist = dist;
              bestCluster = c;
            }
          }
          if (assignments[i] !== bestCluster) changed = true;
          assignments[i] = bestCluster;
        }
        if (!changed) break;

        for (let c = 0; c < k; c++) {
          const clusterPoints = vectors.filter((_, i) => assignments[i] === c);
          if (clusterPoints.length === 0) continue;
          centroids[c] = clusterPoints[0].map((_, dim) =>
            clusterPoints.reduce((acc, p) => acc + p[dim], 0) / clusterPoints.length,
          );
        }
      }

      for (let i = 0; i < users.length; i++) {
        await users[i].update({ cluster_id: assignments[i] });
      }

      const stats = {};
      assignments.forEach((c) => { stats[c] = (stats[c] || 0) + 1; });
      return stats;
    } catch (error) {
      console.error("Error assigning user clusters:", error);
      throw error;
    }
  }
}

module.exports = new KMeansClustering(5);
