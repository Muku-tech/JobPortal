const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const auth = require("../middleware/auth");

// Guest recommendations (public)
router.get("/guest", recommendationController.getGuestRecommendations);

// All other recommendation routes require authentication
router.use(auth.verifyToken);

// Default route - redirects to smart recommendations
router.get("/", recommendationController.getSmartRecommendations);

// Smart recommendations - automatically selects best algorithm
router.get("/smart", recommendationController.getSmartRecommendations);

// Individual algorithm endpoints
router.get(
  "/content-based",
  recommendationController.getContentBasedRecommendations,
);
router.get(
  "/collaborative",
  recommendationController.getCollaborativeRecommendations,
);
router.get("/kmeans", recommendationController.getKMeansRecommendations);

// Track job views for collaborative filtering
router.post("/track-view", recommendationController.trackJobView);

// Get recommendation system stats
router.get("/stats", recommendationController.getRecommendationStats);

module.exports = router;
