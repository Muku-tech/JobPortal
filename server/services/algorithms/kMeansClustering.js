const { Job, User, Application } = require("../../models");

/**
 * K-Means Clustering Algorithm
 * Clusters jobs and users to recommend jobs from matching clusters
 */

class KMeansClustering {
  constructor(k = 5) {
    this.k = k;
    this.centroids = [];
    this.jobClusters = [];
    this.userClusters = [];
  }

  /**
   * Normalize salary to 0-1 range
   */
  normalizeSalary(salary, minSalary = 0, maxSalary = 200000) {
    if (!salary) return 0;
    return Math.min(
      1,
      Math.max(0, (salary - minSalary) / (maxSalary - minSalary)),
    );
  }

  /**
   * Encode category to numerical value
   */
  encodeCategory(category, categories) {
    const index = categories.indexOf(category);
    return index >= 0 ? index / (categories.length - 1) : 0;
  }

  /**
   * Encode experience level
   */
  encodeExperience(level) {
    const levels = {
      entry: 0,
      mid: 0.25,
      senior: 0.5,
      lead: 0.75,
      executive: 1,
    };
    return levels[level] || 0;
  }

  /**
   * Encode job type
   */
  encodeJobType(type) {
    const types = {
      "full-time": 0,
      "part-time": 0.33,
      contract: 0.66,
      internship: 1,
    };
    return types[type] || 0;
  }

  /**
   * Convert job to feature vector
   */
  jobToVector(job, categories) {
    const salaryAvg = ((job.salary_min || 0) + (job.salary_max || 0)) / 2;

    return [
      this.normalizeSalary(salaryAvg),
      this.encodeCategory(job.category, categories),
      this.encodeExperience(job.experience_level),
      this.encodeJobType(job.job_type),
      job.location ? 1 : 0, // Has location
    ];
  }

  /**
   * Convert user to feature vector
   */
  userToVector(user, categories) {
    const skillsCount = (user.skills || []).length;

    return [
      skillsCount / 50, // Normalize skills count (assuming max 50)
      this.encodeCategory(user.preferred_location ? "IT" : "", categories), // Placeholder
      this.encodeExperience(user.experience || "mid"),
      this.encodeJobType(user.preferred_job_type),
      user.preferred_location ? 1 : 0,
    ];
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  euclideanDistance(vec1, vec2) {
    return Math.sqrt(
      vec1.reduce(
        (sum, val, idx) => sum + Math.pow(val - (vec2[idx] || 0), 2),
        0,
      ),
    );
  }

  /**
   * Assign points to nearest centroid
   */
  assignToClusters(points, centroids) {
    return points.map((point) => {
      let minDistance = Infinity;
      let clusterIndex = 0;

      centroids.forEach((centroid, idx) => {
        const distance = this.euclideanDistance(point.features, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          clusterIndex = idx;
        }
      });

      return { ...point, cluster: clusterIndex, distance: minDistance };
    });
  }

  /**
   * Update centroids based on cluster points
   */
  updateCentroids(clusteredPoints, k) {
    if (clusteredPoints.length === 0) return [];

    const centroids = [];
    const dimensions = clusteredPoints[0].features.length;

    for (let i = 0; i < k; i++) {
      const clusterPoints = clusteredPoints.filter((p) => p.cluster === i);

      if (clusterPoints.length === 0) {
        // Keep random centroid if cluster is empty
        centroids.push(
          clusteredPoints[Math.floor(Math.random() * clusteredPoints.length)]
            .features,
        );
        continue;
      }

      const newCentroid = [];
      for (let d = 0; d < dimensions; d++) {
        const sum = clusterPoints.reduce((acc, p) => acc + p.features[d], 0);
        newCentroid.push(sum / clusterPoints.length);
      }
      centroids.push(newCentroid);
    }

    return centroids;
  }

  /**
   * Train K-Means on jobs
   */
  async trainJobClusters() {
    try {
      const categories = [
        "Information Technology",
        "Banking & Finance",
        "Teaching & Education",
        "Tourism & Hospitality",
        "Healthcare & Medical",
        "Engineering",
        "Marketing & Sales",
        "Administration & HR",
        "Construction & Real Estate",
        "Agriculture & Forestry",
        "Media & Communication",
        "Retail & Customer Service",
      ];

      const jobs = await Job.findAll({
        where: { status: "active" },
      });

      if (jobs.length === 0) {
        return [];
      }

      // Convert jobs to feature vectors
      const jobVectors = jobs.map((job) => ({
        id: job.id,
        features: this.jobToVector(job, categories),
      }));

      // Initialize random centroids
      this.centroids = [];
      for (let i = 0; i < Math.min(this.k, jobVectors.length); i++) {
        this.centroids.push(
          jobVectors[Math.floor(Math.random() * jobVectors.length)].features,
        );
      }

      // Run K-Means iterations
      let clusteredJobs = jobVectors;
      for (let iter = 0; iter < 20; iter++) {
        // Max 20 iterations
        clusteredJobs = this.assignToClusters(clusteredJobs, this.centroids);
        const newCentroids = this.updateCentroids(
          clusteredJobs,
          this.centroids.length,
        );

        // Check convergence
        const centroidShift = this.centroids.reduce(
          (sum, c, i) => sum + this.euclideanDistance(c, newCentroids[i]),
          0,
        );

        this.centroids = newCentroids;

        if (centroidShift < 0.001) break; // Converged
      }

      this.jobClusters = clusteredJobs;
      return this.jobClusters;
    } catch (error) {
      console.error("Error training job clusters:", error);
      throw error;
    }
  }

  /**
   * Get cluster for a user based on their preferences
   */
  getUserCluster(userId) {
    const categories = [
      "Information Technology",
      "Banking & Finance",
      "Teaching & Education",
      "Tourism & Hospitality",
      "Healthcare & Medical",
      "Engineering",
      "Marketing & Sales",
      "Administration & HR",
      "Construction & Real Estate",
      "Agriculture & Forestry",
      "Media & Communication",
      "Retail & Customer Service",
    ];

    // Find a representative job vector based on user preferences
    // This is a simplified approach - in production, you'd analyze user's history
    return {
      features: [
        0.5, // Salary preference (medium)
        0.5, // Category preference
        0.25, // Experience
        0, // Job type (full-time)
        1, // Has location preference
      ],
    };
  }

  /**
   * Get job recommendations using K-Means clustering
   */
  async getRecommendations(userId, limit = 10) {
    try {
      // Train/refresh job clusters
      await this.trainJobClusters();

      if (this.jobClusters.length === 0) {
        // No jobs available, return empty
        return [];
      }

      // Get user's preferred cluster
      const userCluster = this.getUserCluster(userId);

      // Find jobs in the same cluster (or nearby clusters)
      const recommendations = this.jobClusters.map((job) => ({
        ...job,
        distance: this.euclideanDistance(job.features, userCluster.features),
      }));

      // Sort by distance (closest first)
      recommendations.sort((a, b) => a.distance - b.distance);

      // Get job details from database
      const jobIds = recommendations.slice(0, limit * 2).map((j) => j.id);
      const jobs = await Job.findAll({
        where: {
          id: jobIds,
          status: "active",
        },
      });

      // Map distances to job objects
      const jobMap = new Map(jobs.map((job) => [job.id, job]));

      return recommendations
        .filter((j) => jobMap.has(j.id))
        .slice(0, limit)
        .map((j) => {
          const job = jobMap.get(j.id);
          return {
            ...job.toJSON(),
            recommendationScore: Math.round((1 - j.distance) * 100) / 100,
            cluster: j.cluster,
            recommendationType: "kmeans",
          };
        });
    } catch (error) {
      console.error("K-Means Clustering Error:", error);
      throw error;
    }
  }

  /**
   * Get cluster statistics
   */
  async getClusterStats() {
    try {
      if (this.jobClusters.length === 0) {
        await this.trainJobClusters();
      }

      const stats = {};
      this.jobClusters.forEach((job) => {
        if (!stats[job.cluster]) {
          stats[job.cluster] = { count: 0, jobs: [] };
        }
        stats[job.cluster].count++;
      });

      return stats;
    } catch (error) {
      console.error("Error getting cluster stats:", error);
      throw error;
    }
  }
}

module.exports = new KMeansClustering(5);
