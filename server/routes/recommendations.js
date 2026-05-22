const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const auth = require("../middleware/auth");

router.get("/guest", recommendationController.getGuestRecommendations);

router.use(auth.verifyToken);

router.get("/unique-skills", recommendationController.getUniqueSkills);

router.get("/", recommendationController.getSmartRecommendations);

router.get("/smart", recommendationController.getSmartRecommendations);

router.get(
  "/content-based",
  recommendationController.getContentBasedRecommendations,
);
router.get(
  "/collaborative",
  recommendationController.getCollaborativeRecommendations,
);
router.get("/kmeans", recommendationController.getKMeansRecommendations);

router.get("/all", recommendationController.getAllAlgorithmRecommendations);

router.post(
  "/send-as-message",
  recommendationController.sendRecommendationAsMessage,
);

router.post("/track-view", recommendationController.trackJobView);

router.get("/stats", recommendationController.getRecommendationStats);

module.exports = router;
