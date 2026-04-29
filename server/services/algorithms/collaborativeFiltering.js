const { Job, User, JobView, Application } = require("../../models");
class CollaborativeFiltering {
  /**
   * Build user-item interaction matrix
   */
  async buildInteractionMatrix(userId) {
    try {
      const views = await JobView.findAll({
        attributes: ["user_id", "job_id", "action_type", "view_duration"],
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
      for (const [otherUserId, otherInteractions] of Object.entries(
        interactions,
      )) {
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

  /**
   * Calculate skill overlap ratio between user and job
   * Returns 0-1 score based on how many job skills match user skills
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
    // Normalize: if at least one skill matches the category, score is decent
    return Math.min(1, 0.3 + (matched / Math.max(1, keywords.length)) * 0.7);
  }

  /**
   * Enforce diversity: ensure jobs from multiple categories are represented
   */
  enforceDiversity(jobs, userSkills, limit) {
    if (!userSkills || userSkills.length <= 1) return jobs.slice(0, limit);

    // Group jobs by inferred category
    const categoryGroups = new Map();
    jobs.forEach((job) => {
      const cat = job.category || "Uncategorized";
      if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
      categoryGroups.get(cat).push(job);
    });

    const result = [];
    const cats = Array.from(categoryGroups.keys());
    let idx = 0;

    // Round-robin pick from each category
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
   * Get job recommendations based on similar users
   */
  async getRecommendations(userId, limit = 10) {
    try {
      const userIdStr = userId.toString();
      const interactions = await this.buildInteractionMatrix(userId);

      const user = await User.findByPk(userId);
      const userSkills = user?.skills || [];

      const userJobs = new Set(Object.keys(interactions[userIdStr] || {}));
      const similarUsers = await this.findSimilarUsers(userId, 20);

      if (similarUsers.length === 0) {
        const popularJobs = await Job.findAll({
          where: { status: "active" },
          order: [["createdAt", "DESC"]],
          limit: limit * 2,
        });
        return popularJobs.map((job) => ({
          ...job.toJSON(),
          recommendationScore: 0,
          recommendationType: "popular",
          matchReasons: ["Trending job"],
        }));
      }

      const jobScores = {};

      for (const { userId: similarUserId, similarity } of similarUsers) {
        const similarUserIdStr = similarUserId.toString();
        const similarUserJobs = interactions[similarUserIdStr] || {};
        for (const [jobId, interactionScore] of Object.entries(
          similarUserJobs,
        )) {
          if (userJobs.has(jobId)) continue;
          if (!jobScores[jobId]) {
            jobScores[jobId] = { score: 0, count: 0 };
          }
          jobScores[jobId].score += similarity * interactionScore;
          jobScores[jobId].count += 1;
        }
      }

      // Fetch candidate jobs
      const candidateJobIds = Object.keys(jobScores).map((id) => parseInt(id));
      const candidateJobs = await Job.findAll({
        where: { id: candidateJobIds, status: "active" },
      });

      // Score each job with skill overlap and category relevance
      const scoredJobs = candidateJobs.map((job) => {
        const rawScore = jobScores[job.id]?.score || 0;
        const skillScore = this.calculateSkillOverlapScore(
          userSkills,
          job.required_skills || [],
        );
        const categoryScore = this.calculateCategoryRelevance(
          userSkills,
          job.category,
        );

        // Weighted combined score:
        // 40% collaborative popularity, 40% skill overlap, 20% category relevance
        const combinedScore =
          rawScore * 0.4 + skillScore * 100 * 0.4 + categoryScore * 100 * 0.2;

        return {
          ...job.toJSON(),
          recommendationScore: Math.round(combinedScore * 100) / 100,
          recommendationType: "collaborative",
          _skillScore: skillScore,
          _categoryScore: categoryScore,
        };
      });

      // Sort by combined score
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
        if (similarUsers.length > 0) {
          reasons.push("Popular among similar users");
        }
        if (reasons.length === 0) {
          reasons.push("Recommended by collaborative filtering");
        }
        job.matchReasons = reasons;
      });

      // Enforce diversity across categories
      const diverseJobs = this.enforceDiversity(scoredJobs, userSkills, limit);

      return diverseJobs.slice(0, limit);
    } catch (error) {
      console.error("Collaborative Filtering Error:", error);
      throw error;
    }
  }

  async recordInteraction(
    userId,
    jobId,
    actionType = "view",
    viewDuration = 0,
  ) {
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
