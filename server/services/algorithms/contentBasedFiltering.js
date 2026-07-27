const { Job, User } = require("../../models");

/**
 * Content-Based Filtering Algorithm
 * Recommends jobs based on user skills and preferences matching job requirements
 */

class ContentBasedFiltering {
  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Convert skills to vector
   */
  skillsToVector(userSkills, allSkills) {
    return allSkills.map((skill) =>
      userSkills.some((s) => s.toLowerCase() === skill.toLowerCase()) ? 1 : 0,
    );
  }

  /**
   * Parse skills from DB into array of strings
   */
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

  /**
   * Calculate job type match score
   */
  jobTypeScore(userPreferredType, jobType) {
    if (!userPreferredType || !jobType) return 0;
    return userPreferredType === jobType ? 1 : 0;
  }

  /**
   * Calculate experience level match score
   */
  experienceScore(userExp, jobExp) {
    if (!userExp || !jobExp) return 0;
    const levels = {
      entry: 1,
      mid: 2,
      senior: 3,
      lead: 4,
      executive: 5,
    };
    const userVal = levels[userExp.toLowerCase()] || 2;
    const jobVal = levels[jobExp.toLowerCase()] || 2;
    // If exact match or user has higher experience than required
    return userVal >= jobVal ? 1 : 0.4;
  }

  /**
   * Calculate location match score
   */
  locationScore(userPreferredLocation, jobLocation) {
    if (!userPreferredLocation || !jobLocation) return 0;
    const u = userPreferredLocation.toLowerCase().trim();
    const j = jobLocation.toLowerCase().trim();
    return u.includes(j) || j.includes(u) ? 1 : 0;
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendations(userId, limit = 10) {
    try {
      // Get user profile
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Get user's skills and preferences
      const userSkills = this.parseSkills(user.skills);
      const preferredJobType = user.preferred_job_type;
      const preferredLocation = user.preferred_location || (user.address ? user.address.split(',')[0].trim() : null);
      const userExperience = user.experience_level || "mid";

      // Get all active jobs (excluding those already applied)
      const jobs = await Job.findAll({
        where: { status: "active" },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });

      // Get all unique skills from jobs for vectorization
      const allSkillsSet = new Set();
      jobs.forEach((job) => {
        this.parseSkills(job.required_skills).forEach((skill) => allSkillsSet.add(skill));
      });
      const allSkills = Array.from(allSkillsSet);

      // Calculate similarity scores
      const recommendations = jobs.map((job) => {
        // Skills similarity
        const jobSkills = this.parseSkills(job.required_skills);
        const userVector = this.skillsToVector(userSkills, allSkills);
        const jobVector = this.skillsToVector(
          jobSkills,
          allSkills,
        );
        const skillsSimilarity = this.cosineSimilarity(userVector, jobVector);

        // Job type match
        const typeScore = this.jobTypeScore(preferredJobType, job.job_type);

        // Experience match
        const expScore = this.experienceScore(
          userExperience,
          job.experience_level,
        );

        // Location match
        const locationMatch = this.locationScore(
          preferredLocation,
          job.location,
        );

        /**
         * New Weighted Parameters:
         * Skills Match: 60% | Experience: 5% | Job Type: 5% | Location: 30%
         */
        const score =
          skillsSimilarity * 0.6 +
          expScore * 0.05 +
          typeScore * 0.05 +
          locationMatch * 0.3;

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

      // Partition recommendations: location-matching vs others
      const locationMatching = [];
      const others = [];

      recommendations.forEach((rec) => {
        const isLocMatch = preferredLocation && rec.job.location &&
          (preferredLocation.toLowerCase().includes(rec.job.location.toLowerCase()) ||
           rec.job.location.toLowerCase().includes(preferredLocation.toLowerCase()));
        if (isLocMatch) {
          locationMatching.push(rec);
        } else {
          others.push(rec);
        }
      });

      // Sort each partition by score
      locationMatching.sort((a, b) => b.score - a.score);
      others.sort((a, b) => b.score - a.score);

      const sortedRecommendations = [...locationMatching, ...others];

      return sortedRecommendations.slice(0, limit).map((rec) => {
        const reasons = [];
        if (rec.details.skillsSimilarity > 0.3) {
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

  /**
   * Calculate similarity between a user and a single job
   */
  async calculateJobSimilarity(userId, jobId) {
    try {
      const user = await User.findByPk(userId);
      const job = await Job.findByPk(jobId);

      if (!user || !job) {
        throw new Error("User or Job not found");
      }

      const userSkills = this.parseSkills(user.skills);
      const jobSkills = this.parseSkills(job.required_skills);
      const allSkills = [
        ...new Set([...userSkills, ...jobSkills]),
      ];

      const userVector = this.skillsToVector(userSkills, allSkills);
      const jobVector = this.skillsToVector(
        jobSkills,
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
