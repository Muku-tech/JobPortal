const { Job, User, Application, JobView } = require("../../models");

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

  normalizeSalary(salary, minSalary = 0, maxSalary = 200000) {
    if (!salary) return 0;
    return Math.min(
      1,
      Math.max(0, (salary - minSalary) / (maxSalary - minSalary)),
    );
  }

  encodeCategory(category, categories) {
    const index = categories.indexOf(category);
    return index >= 0 ? index / (categories.length - 1) : 0;
  }

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

  encodeJobType(type) {
    const types = {
      "full-time": 0,
      "part-time": 0.33,
      contract: 0.66,
      internship: 1,
    };
    return types[type] || 0;
  }

  jobToVector(job, categories) {
    const salaryAvg = ((job.salary_min || 0) + (job.salary_max || 0)) / 2;
    return [
      this.normalizeSalary(salaryAvg),
      this.encodeCategory(job.category, categories),
      this.encodeExperience(job.experience_level),
      this.encodeJobType(job.job_type),
      job.location ? 1 : 0,
    ];
  }

  userToVector(user, categories) {
    const skillsCount = (user.skills || []).length;
    return [
      skillsCount / 50,
      this.encodeCategory(user.preferred_location ? "IT" : "", categories),
      this.encodeExperience(user.experience || "mid"),
      this.encodeJobType(user.preferred_job_type),
      user.preferred_location ? 1 : 0,
    ];
  }

  euclideanDistance(vec1, vec2) {
    return Math.sqrt(
      vec1.reduce(
        (sum, val, idx) => sum + Math.pow(val - (vec2[idx] || 0), 2),
        0,
      ),
    );
  }

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

  updateCentroids(clusteredPoints, k) {
    if (clusteredPoints.length === 0) return [];
    const centroids = [];
    const dimensions = clusteredPoints[0].features.length;
    for (let i = 0; i < k; i++) {
      const clusterPoints = clusteredPoints.filter((p) => p.cluster === i);
      if (clusterPoints.length === 0) {
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
      if (jobs.length === 0) return [];

      const jobVectors = jobs.map((job) => ({
        id: job.id,
        features: this.jobToVector(job, categories),
      }));

      this.centroids = [];
      for (let i = 0; i < Math.min(this.k, jobVectors.length); i++) {
        this.centroids.push(
          jobVectors[Math.floor(Math.random() * jobVectors.length)].features,
        );
      }

      let clusteredJobs = jobVectors;
      for (let iter = 0; iter < 20; iter++) {
        clusteredJobs = this.assignToClusters(clusteredJobs, this.centroids);
        const newCentroids = this.updateCentroids(
          clusteredJobs,
          this.centroids.length,
        );
        const centroidShift = this.centroids.reduce(
          (sum, c, i) => sum + this.euclideanDistance(c, newCentroids[i]),
          0,
        );
        this.centroids = newCentroids;
        if (centroidShift < 0.001) break;
      }

      this.jobClusters = clusteredJobs;
      return this.jobClusters;
    } catch (error) {
      console.error("Error training job clusters:", error);
      throw error;
    }
  }

  /**
   * Calculate skill overlap ratio between user and job
   */
  calculateSkillOverlapScore(userSkills, jobSkills) {
    if (!userSkills || userSkills.length === 0) return 0.3;
    if (!jobSkills || jobSkills.length === 0) return 0.3;
    const lowerUser = userSkills.map((s) => s.toLowerCase());
    const matched = jobSkills.filter((s) =>
      lowerUser.includes(s.toLowerCase()),
    ).length;
    return Math.min(1, matched / Math.max(1, jobSkills.length));
  }

  /**
   * Calculate category relevance score based on user's skills
   */
  calculateCategoryRelevance(userSkills, jobCategory) {
    if (!userSkills || userSkills.length === 0 || !jobCategory) return 0.3;

    const categorySkillMap = {
      "Information Technology": [
        "react",
        "node.js",
        "python",
        "javascript",
        "html",
        "css",
        "mongodb",
        "sql",
        "aws",
        "docker",
        "kubernetes",
        "git",
        "devops",
        "java",
        "php",
        "laravel",
        "angular",
        "vue.js",
        "flutter",
        "kotlin",
        "swift",
        "typescript",
        "linux",
        "ci/cd",
        "postgresql",
        "mysql",
        "firebase",
        "spring boot",
        "express.js",
        "next.js",
        "rest api",
        "graphql",
        "cybersecurity",
        "network administration",
        "cloud computing",
        "ui/ux design",
        "figma",
        "mern",
        "frontend",
        "backend",
        "fullstack",
      ],
      "Banking & Finance": [
        "accounting",
        "financial analysis",
        "excel",
        "tally",
        "banking operations",
        "risk assessment",
        "auditing",
        "taxation",
        "investment analysis",
        "loan processing",
        "risk management",
        "compliance auditing",
      ],
      "Teaching & Education": [
        "teaching",
        "curriculum design",
        "classroom management",
        "subject matter expertise",
        "educational psychology",
        "e-learning",
        "student counseling",
        "child development",
      ],
      "Tourism & Hospitality": [
        "hospitality management",
        "tour guiding",
        "event planning",
        "customer service",
        "reservation systems",
        "travel operations",
        "hotel management",
        "culinary arts",
        "food safety",
      ],
      "Healthcare & Medical": [
        "nursing",
        "patient care",
        "medical coding",
        "pharmacy",
        "clinical research",
        "medical lab technology",
        "dental care",
        "physiotherapy",
        "radiology",
        "surgery assistance",
        "healthcare it",
        "laboratory techniques",
      ],
      Engineering: [
        "autocad",
        "civil engineering",
        "structural analysis",
        "project management",
        "electrical engineering",
        "mechanical engineering",
        "surveying",
        "water resource engineering",
        "geotechnical engineering",
        "quantity surveying",
        "construction planning",
        "site management",
        "hydro power engineering",
        "environmental engineering",
        "building codes",
        "quality control",
      ],
      "Marketing & Sales": [
        "digital marketing",
        "seo",
        "content writing",
        "social media",
        "sales",
        "brand management",
        "market research",
        "advertising",
        "public relations",
        "google ads",
        "analytics",
      ],
      "Administration & HR": [
        "recruitment",
        "hr management",
        "payroll",
        "office administration",
        "labor law compliance",
        "training & development",
        "interviewing",
      ],
      "Construction & Real Estate": [
        "safety management",
        "risk assessment",
        "blueprint reading",
        "material management",
      ],
      "Agriculture & Forestry": [
        "agronomy",
        "livestock management",
        "irrigation systems",
        "food processing",
        "agri-business",
        "sustainable farming",
        "soil science",
        "crop management",
        "agricultural extension",
      ],
      "Media & Communication": [
        "video editing",
        "photography",
        "journalism",
        "broadcasting",
        "script writing",
        "media production",
        "adobe premiere",
        "adobe photoshop",
        "adobe illustrator",
      ],
      "Design & Creative": [
        "graphic design",
        "creativity",
        "storytelling",
        "motion graphics",
      ],
      "Legal & Compliance": [
        "monitoring & evaluation",
        "grant writing",
        "community development",
        "project proposal",
        "livelihood analysis",
        "wash programs",
        "capacity building",
        "baseline survey",
        "field operations",
        "donor relations",
        "legal research",
        "contract drafting",
        "corporate law",
        "intellectual property",
        "labor law",
        "policy development",
        "negotiation",
      ],
      "Data Science & Analytics": [
        "data analysis",
        "data visualization",
        "power bi",
        "tableau",
        "statistical analysis",
        "machine learning",
        "python for data science",
        "business intelligence",
        "research",
      ],
    };

    const lowerUser = userSkills.map((s) => s.toLowerCase());
    const keywords = categorySkillMap[jobCategory] || [];
    const matched = keywords.filter((k) => lowerUser.includes(k)).length;
    return Math.min(1, 0.3 + (matched / Math.max(1, keywords.length)) * 0.7);
  }

  /**
   * Enforce diversity: round-robin pick from different categories
   */
  enforceDiversity(jobs, userSkills, limit) {
    if (!userSkills || userSkills.length <= 1) return jobs.slice(0, limit);

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

  /**
   * Get job recommendations using K-Means clustering with continuous scoring
   */
  async getRecommendations(userId, limit = 10) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return [];
      const userSkills = user.skills || [];
      const userClusterId = user.cluster_id ?? 0;

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

      const jobScores = {};

      const clusterViews = await JobView.findAll({
        where: { user_id: clusterUserIds },
        attributes: ["job_id", "action_type"],
      });
      clusterViews.forEach((v) => {
        if (seenJobIds.has(v.job_id)) return;
        const weight =
          v.action_type === "apply" ? 5 : v.action_type === "save" ? 2 : 1;
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
      const candidateJobs = await Job.findAll({
        where: { id: candidateJobIds, status: "active" },
      });

      // Score each job with continuous skill and category relevance
      const scoredJobs = candidateJobs.map((job) => {
        const clusterScore = jobScores[job.id] || 0;
        const skillScore = this.calculateSkillOverlapScore(
          userSkills,
          job.required_skills || [],
        );
        const categoryScore = this.calculateCategoryRelevance(
          userSkills,
          job.category,
        );

        // Combined: 40% cluster popularity, 40% skill overlap, 20% category fit
        const combinedScore =
          clusterScore * 0.4 +
          skillScore * 100 * 0.4 +
          categoryScore * 100 * 0.2;

        return {
          ...job.toJSON(),
          recommendationScore: Math.round(combinedScore * 100) / 100,
          cluster: userClusterId,
          recommendationType: "kmeans",
          _skillScore: skillScore,
          _categoryScore: categoryScore,
        };
      });

      scoredJobs.sort((a, b) => b.recommendationScore - a.recommendationScore);

      // Add match reasons for explainability
      scoredJobs.forEach((job) => {
        const reasons = [];
        if (job._skillScore > 0.5) {
          reasons.push(`${Math.round(job._skillScore * 100)}% skills match`);
        } else if (job._skillScore > 0) {
          reasons.push("Some skills match");
        }
        if (job._categoryScore > 0.6) {
          reasons.push("Strong category fit");
        }
        reasons.push(`From cluster ${job.cluster}`);
        if (reasons.length === 0) {
          reasons.push("Recommended by K-Means clustering");
        }
        job.matchReasons = reasons;
      });

      // Enforce diversity across categories
      const diverseJobs = this.enforceDiversity(scoredJobs, userSkills, limit);

      return diverseJobs.slice(0, limit);
    } catch (error) {
      console.error("K-Means Clustering Error:", error);
      throw error;
    }
  }

  async assignUserClusters() {
    try {
      const { User } = require("../../models");
      const users = await User.findAll({ where: { role: "jobseeker" } });
      if (users.length === 0) return {};

      const allSkillsSet = new Set();
      users.forEach((u) =>
        (u.skills || []).forEach((s) => allSkillsSet.add(s.toLowerCase())),
      );
      const allSkills = Array.from(allSkillsSet);

      const experienceMap = {
        entry: 0,
        mid: 0.5,
        senior: 1,
        lead: 0.75,
        executive: 1,
      };

      const vectors = users.map((u) => {
        const skillVec = allSkills.map((s) =>
          (u.skills || []).some((us) => us.toLowerCase() === s) ? 1 : 0,
        );
        const expVal = experienceMap[u.experience_level] || 0.5;
        return [...skillVec, expVal];
      });

      const k = 3;
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
          const newCentroid = clusterPoints[0].map((_, dim) => {
            const sum = clusterPoints.reduce((acc, p) => acc + p[dim], 0);
            return sum / clusterPoints.length;
          });
          centroids[c] = newCentroid;
        }
      }

      for (let i = 0; i < users.length; i++) {
        await users[i].update({ cluster_id: assignments[i] });
      }

      const stats = {};
      assignments.forEach((c) => {
        stats[c] = (stats[c] || 0) + 1;
      });
      return stats;
    } catch (error) {
      console.error("Error assigning user clusters:", error);
      throw error;
    }
  }

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
