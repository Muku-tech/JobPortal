const { Job, User } = require("../../models");
const skillMatcher = require("../../utils/skillMatcher");

class ContentBasedFiltering {
  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  skillsToVector(userSkills, allSkills) {
    return allSkills.map((skill) =>
      userSkills.some((us) => skillMatcher.matchSkills(us, skill)) ? 1 : 0,
    );
  }

  jobTypeScore(userPreferredType, jobType) {
    if (!userPreferredType || !jobType) return 0.5;
    return userPreferredType === jobType ? 1 : 0;
  }

  experienceScore(userExp, jobExp) {
    if (!userExp || !jobExp) return 0.5;
    return userExp.toLowerCase() === jobExp.toLowerCase() ? 1 : 0.4;
  }

  locationScore(userPreferredLocation, jobLocation) {
    if (!userPreferredLocation || !jobLocation) return 0;
    const p = userPreferredLocation.toLowerCase().trim();
    const l = jobLocation.toLowerCase().trim();
    if (p === l) return 1;
    if (l.includes(p) || p.includes(l)) return 0.8;
    return 0;
  }

  async getRecommendations(userId, limit = 10) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's skills and preferences
      let userSkills = user.skills || [];
      if (typeof userSkills === "string") {
        try {
          userSkills = JSON.parse(userSkills);
        } catch (e) {
          userSkills = userSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      if (!Array.isArray(userSkills)) userSkills = [];

      const preferredJobType = user.preferred_job_type;
      const preferredLocation = user.preferred_location;
      const userExperience = user.experience_level;

      const jobs = await Job.findAll({
        where: { status: "active" },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });

      const allSkillsSet = new Set();
      jobs.forEach((job) => {
        (job.required_skills || []).forEach((skill) => allSkillsSet.add(skill));
      });
      const allSkills = Array.from(allSkillsSet);

      const recommendations = jobs.map((job) => {
        const userVector = this.skillsToVector(userSkills, allSkills);
        const jobVector = this.skillsToVector(
          job.required_skills || [],
          allSkills,
        );
        const skillsSimilarity = this.cosineSimilarity(userVector, jobVector);

        const typeScore = this.jobTypeScore(preferredJobType, job.job_type);

        const expScore = this.experienceScore(
          userExperience,
          job.experience_level,
        );

        const locationMatch = this.locationScore(
          preferredLocation,
          job.location,
        );

        const score =
          skillsSimilarity * 0.3 +
          expScore * 0.15 +
          typeScore * 0.15 +
          locationMatch * 0.4;

        return {
          job,
          score: Math.round(score * 100) / 100,
          details: {
            skillsSimilarity: Math.round(skillsSimilarity * 100) / 100,
            experienceScore: expScore,
            typeScore,
            locationMatch,
          },
        };
      });

      recommendations.sort((a, b) => b.score - a.score);

      return recommendations.slice(0, limit).map((rec) => {
        const reasons = [];
        if (rec.details.skillsSimilarity > 0.45) {
          reasons.push(
            `${Math.round(rec.details.skillsSimilarity * 100)}% skills match`,
          );
        }
        if (rec.details.experienceScore === 1) {
          reasons.push("Matches your experience level");
        }
        if (rec.details.typeScore === 1) {
          reasons.push("Job type matches your preference");
        }
        if (rec.details.locationMatch === 1) {
          reasons.push("Location matches your preference");
        }
        if (reasons.length === 0) {
          reasons.push("Recommended based on profile");
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

      if (!user || !job) {
        throw new Error("User or Job not found");
      }

      const userSkills = user.skills || [];
      const allSkills = [
        ...new Set([...userSkills, ...(job.required_skills || [])]),
      ];

      const userVector = this.skillsToVector(userSkills, allSkills);
      const jobVector = this.skillsToVector(
        job.required_skills || [],
        allSkills,
      );

      return {
        overallScore: this.cosineSimilarity(userVector, jobVector),
        jobTypeMatch: this.jobTypeScore(user.preferred_job_type, job.job_type),
        locationMatch: this.locationScore(
          user.preferred_location,
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
