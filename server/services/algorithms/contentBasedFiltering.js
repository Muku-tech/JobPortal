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
   * Calculate job type match score
   */
  jobTypeScore(userPreferredType, jobType) {
    if (!userPreferredType || !jobType) return 0.5;
    return userPreferredType === jobType ? 1 : 0;
  }

  /**
   * Calculate location match score
   */
  locationScore(userPreferredLocation, jobLocation) {
    if (!userPreferredLocation || !jobLocation) return 0.5;
    return userPreferredLocation.toLowerCase() === jobLocation.toLowerCase()
      ? 1
      : 0;
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
      const userSkills = user.skills || [];
      const preferredJobType = user.preferred_job_type;
      const preferredLocation = user.preferred_location;

      // Get all active jobs (excluding those already applied)
      const jobs = await Job.findAll({
        where: { status: "active" },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });

      // Get all unique skills from jobs for vectorization
      const allSkillsSet = new Set();
      jobs.forEach((job) => {
        (job.required_skills || []).forEach((skill) => allSkillsSet.add(skill));
      });
      const allSkills = Array.from(allSkillsSet);

      // Calculate similarity scores
      const recommendations = jobs.map((job) => {
        // Skills similarity
        const userVector = this.skillsToVector(userSkills, allSkills);
        const jobVector = this.skillsToVector(
          job.required_skills || [],
          allSkills,
        );
        const skillsSimilarity = this.cosineSimilarity(userVector, jobVector);

        // Job type match
        const typeScore = this.jobTypeScore(preferredJobType, job.job_type);

        // Location match
        const locationMatch = this.locationScore(
          preferredLocation,
          job.location,
        );

        // Overall score (weighted average)
        const score =
          skillsSimilarity * 0.5 + typeScore * 0.25 + locationMatch * 0.25;

        return {
          job,
          score: Math.round(score * 100) / 100,
          details: {
            skillsSimilarity: Math.round(skillsSimilarity * 100) / 100,
            typeScore,
            locationMatch,
          },
        };
      });

      // Sort by score and return top recommendations
      recommendations.sort((a, b) => b.score - a.score);

      return recommendations.slice(0, limit).map((rec) => ({
        ...rec.job.toJSON(),
        recommendationScore: rec.score,
        matchDetails: rec.details,
      }));
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
