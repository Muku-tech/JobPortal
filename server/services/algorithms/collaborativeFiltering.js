const { Job, User, JobView, Application } = require("../../models");

/**
 * Collaborative Filtering Algorithm
 * Recommends jobs based on similar users' behavior
 */

class CollaborativeFiltering {
  /**
   * Build user-item interaction matrix
   */
  async buildInteractionMatrix(userId) {
    try {
      // Get all users' interactions (views and applications)
      const views = await JobView.findAll({
        attributes: ["user_id", "job_id", "action_type", "view_duration"],
      });

      const applications = await Application.findAll({
        attributes: ["user_id", "job_id"],
      });

      // Create user-job interaction map
      const interactions = {};

      // Process views
      views.forEach((view) => {
        const userIdStr = view.user_id.toString();
        const jobIdStr = view.job_id.toString();

        if (!interactions[userIdStr]) {
          interactions[userIdStr] = {};
        }

        // Weight: view = 1, save = 2, share = 2, apply = 5
        const weight =
          view.action_type === "apply"
            ? 5
            : view.action_type === "save" || view.action_type === "share"
              ? 2
              : 1;

        // Add time-based bonus (recent views get higher weight)
        const daysAgo =
          (Date.now() - new Date(view.viewed_at).getTime()) /
          (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 1 - daysAgo / 30); // Bonus for views within 30 days

        interactions[userIdStr][jobIdStr] =
          (interactions[userIdStr][jobIdStr] || 0) + weight + recencyBonus;
      });

      // Process applications (higher weight)
      applications.forEach((app) => {
        const userIdStr = app.user_id.toString();
        const jobIdStr = app.job_id.toString();

        if (!interactions[userIdStr]) {
          interactions[userIdStr] = {};
        }

        interactions[userIdStr][jobIdStr] =
          (interactions[userIdStr][jobIdStr] || 0) + 10;
      });

      return interactions;
    } catch (error) {
      console.error("Error building interaction matrix:", error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two users
   */
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

  /**
   * Find similar users based on their job interactions
   */
  async findSimilarUsers(userId, limit = 10) {
    try {
      const interactions = await this.buildInteractionMatrix(userId);
      const userIdStr = userId.toString();

      if (!interactions[userIdStr]) {
        // User has no interactions, return empty
        return [];
      }

      const similarities = [];

      for (const [otherUserId, otherInteractions] of Object.entries(
        interactions,
      )) {
        if (otherUserId === userIdStr) continue;

        const similarity = this.calculateUserSimilarity(
          interactions[userIdStr],
          otherInteractions,
        );

        if (similarity > 0) {
          similarities.push({
            userId: parseInt(otherUserId),
            similarity,
          });
        }
      }

      // Sort by similarity and return top similar users
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, limit);
    } catch (error) {
      console.error("Error finding similar users:", error);
      throw error;
    }
  }

  /**
   * Get job recommendations based on similar users
   */
  async getRecommendations(userId, limit = 10) {
    try {
      const userIdStr = userId.toString();
      const interactions = await this.buildInteractionMatrix(userId);

      // Get jobs the user has already interacted with
      const userJobs = new Set(Object.keys(interactions[userIdStr] || {}));

      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, 20);

      if (similarUsers.length === 0) {
        // No similar users found, return popular jobs
        const popularJobs = await Job.findAll({
          where: { status: "active" },
          order: [["createdAt", "DESC"]],
          limit,
        });
        return popularJobs.map((job) => ({
          ...job.toJSON(),
          recommendationScore: 0,
          recommendationType: "popular",
        }));
      }

      // Aggregate job scores from similar users
      const jobScores = {};

      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserIdStr = similarUserId.toString();
        const similarUserJobs = interactions[similarUserIdStr] || {};

        for (const [jobId, interactionScore] of Object.entries(
          similarUserJobs,
        )) {
          // Skip jobs user already interacted with
          if (userJobs.has(jobId)) continue;

          if (!jobScores[jobId]) {
            jobScores[jobId] = { score: 0, count: 0 };
          }

          // Weight by similarity
          jobScores[jobId].score += similarity * interactionScore;
          jobScores[jobId].count += 1;
        }
      }

      // Sort jobs by score
      const sortedJobs = Object.entries(jobScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, limit * 2);

      // Get job details
      const jobIds = sortedJobs.map(([jobId]) => parseInt(jobId));
      const jobs = await Job.findAll({
        where: {
          id: jobIds,
          status: "active",
        },
      });

      // Map scores to job objects
      const jobMap = new Map(jobs.map((job) => [job.id, job]));

      const recommendations = sortedJobs
        .filter(([jobId]) => jobMap.has(parseInt(jobId)))
        .slice(0, limit)
        .map(([jobId, { score }]) => {
          const job = jobMap.get(parseInt(jobId));
          return {
            ...job.toJSON(),
            recommendationScore: Math.round(score * 100) / 100,
            recommendationType: "collaborative",
          };
        });

      return recommendations;
    } catch (error) {
      console.error("Collaborative Filtering Error:", error);
      throw error;
    }
  }

  /**
   * Record a user interaction (view/apply/save)
   */
  async recordInteraction(
    userId,
    jobId,
    actionType = "view",
    viewDuration = 0,
  ) {
    try {
      // Check if interaction already exists
      const existingView = await JobView.findOne({
        where: { user_id: userId, job_id: jobId },
      });

      if (existingView) {
        // Update existing view
        await existingView.update({
          action_type: actionType,
          view_duration: viewDuration + existingView.view_duration,
        });
      } else {
        // Create new view
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
