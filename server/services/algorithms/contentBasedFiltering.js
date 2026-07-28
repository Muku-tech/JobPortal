const { Job, User } = require("../../models");

class ContentBasedFiltering {
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

  jobTypeScore(userPreferredType, jobType) {
    if (!userPreferredType || !jobType) return 0;
    return userPreferredType === jobType ? 1 : 0;
  }

  experienceScore(userExp, jobExp) {
    if (!userExp || !jobExp) return 0;
    const levels = { entry: 1, mid: 2, senior: 3, lead: 4, executive: 5 };
    const userVal = levels[userExp.toLowerCase()];
    const jobVal = levels[jobExp.toLowerCase()];
    if (!userVal || !jobVal) return 0;
    return userVal >= jobVal ? 1 : 0;
  }

  locationScore(userPreferredLocation, jobLocation) {
    if (!userPreferredLocation || !jobLocation) return 0;
    const u = userPreferredLocation.toLowerCase().trim();
    const j = jobLocation.toLowerCase().trim();
    return u.includes(j) || j.includes(u) ? 1 : 0;
  }

  async getRecommendations(userId, limit = 10) {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error("User not found");

      const userSkills = this.parseSkills(user.skills);
      if (!userSkills.length) return [];

      const preferredLocation = user.preferred_location ||
        (user.address ? user.address.split(',')[0].trim() : null);
      const preferredJobType = user.preferred_job_type;
      const userExperience = user.experience_level;

      const { Op } = require('sequelize');
      const jobs = await Job.findAll({
        where: { status: { [Op.in]: ["active", "draft"] } },
        order: [["createdAt", "DESC"]],
      });

      const scored = jobs.map((job) => {
        const jobSkills = this.parseSkills(job.required_skills);
        const skillScore = this.skillOverlapScore(userSkills, jobSkills);
        const typeScore = this.jobTypeScore(preferredJobType, job.job_type);
        const expScore = this.experienceScore(userExperience, job.experience_level);
        const locScore = this.locationScore(preferredLocation, job.location);

        const total =
          skillScore * 0.70 +
          locScore * 0.20 +
          expScore * 0.05 +
          typeScore * 0.05;

        return {
          job,
          score: Math.round(total * 100) / 100,
          details: {
            skillsSimilarity: Math.round(skillScore * 100) / 100,
            experienceScore: expScore,
            typeScore,
            locationMatch: locScore,
          },
        };
      });

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, limit).map((rec) => {
        const reasons = [];
        if (rec.details.skillsSimilarity > 0) {
          reasons.push(
            `${Math.round(rec.details.skillsSimilarity * 100)}% skills match`,
          );
        }
        if (rec.details.experienceScore === 1 && userExperience) {
          reasons.push("Matches your experience level");
        }
        if (rec.details.typeScore === 1) {
          reasons.push("Job type matches your preference");
        }
        if (rec.details.locationMatch === 1) {
          reasons.push("Location matches your preference");
        }
        if (!reasons.length) {
          reasons.push("Recommended based on your profile");
        }

        return {
          ...rec.job.toJSON(),
          recommendationScore: rec.score,
          matchDetails: rec.details,
          matchReasons: reasons,
          recommendationType: "content-based",
        };
      });
    } catch (error) {
      console.error("Content-Based Filtering Error:", error);
      throw error;
    }
  }

  async calculateJobSimilarity(userId, jobId) {
    try {
      const user = await User.findByPk(userId);
      const job = await Job.findByPk(jobId);
      if (!user || !job) throw new Error("User or Job not found");

      const userSkills = this.parseSkills(user.skills);
      const jobSkills = this.parseSkills(job.required_skills);

      return {
        overallScore: this.skillOverlapScore(userSkills, jobSkills),
        jobTypeMatch: this.jobTypeScore(user.preferred_job_type, job.job_type),
        locationMatch: this.locationScore(
          user.preferred_location || (user.address ? user.address.split(',')[0].trim() : null),
          job.location,
        ),
      };
    } catch (error) {
      console.error("Similarity Calculation Error:", error);
      throw error;
    }
  }
}

module.exports = new ContentBasedFiltering();
