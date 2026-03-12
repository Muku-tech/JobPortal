const fs = require("fs");
const path = require("path");

const content = `const { Job, User, Application, JobView } = require('../models');
const contentBasedFiltering = require('../services/algorithms/contentBasedFiltering');
const collaborativeFiltering = require('../services/algorithms/collaborativeFiltering');
const kMeansClustering = require('../services/algorithms/kMeansClustering');

const getSystemStats = async (userId) => {
  const totalUsers = await User.count();
  const totalJobViews = await JobView.count();
  const totalApplications = await Application.count();
  const userJobViews = await JobView.count({ where: { user_id: userId } });
  const userApplications = await Application.count({ where: { user_id: userId } });
  return { totalUsers, totalJobViews, totalApplications, userInteractions: userJobViews + userApplications };
};

exports.getSmartRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const stats = await getSystemStats(userId);
    let recommendations = [], algorithmUsed = '', stage = 0;
    if (stats.userInteractions === 0) {
      stage = 1; algorithmUsed = 'content-based';
      console.log('Stage 1: Using Content-Based Filtering (Cold Start)');
      recommendations = await contentBasedFiltering.getRecommendations(userId, limit);
    } else if (stats.totalUsers < 10 || stats.userInteractions < 5) {
      stage = 2; algorithmUsed = 'kmeans';
      console.log('Stage 2: Using K-Means Clustering');
      recommendations = await kMeansClustering.getRecommendations(userId, limit);
    } else {
      stage = 3; algorithmUsed = 'collaborative';
      console.log('Stage 3: Using Collaborative Filtering');
      recommendations = await collaborativeFiltering.getRecommendations(userId, limit);
    }
    res.json({ jobs: recommendations, algorithm: algorithmUsed, stage, stats: { totalUsers: stats.totalUsers, userInteractions: stats.userInteractions } });
  } catch (error) {
    console.error('Error in smart recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations' });
  }
};

exports.getContentBasedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await contentBasedFiltering.getRecommendations(userId, limit);
    res.json({ jobs, algorithm: 'content-based', stage: 1 });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.getCollaborativeRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await collaborativeFiltering.getRecommendations(userId, limit);
    res.json({ jobs, algorithm: 'collaborative', stage: 3 });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.getKMeansRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await kMeansClustering.getRecommendations(userId, limit);
    res.json({ jobs, algorithm: 'kmeans', stage: 2 });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.trackJobView = async (req, res) => {
  try {
    const { jobId, duration, action } = req.body;
    const userId = req.user.id;
    await JobView.create({ user_id: userId, job_id: jobId, view_duration: duration || 0, action_type: action || 'view' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: 'Error tracking view' }); }
};
`;

fs.writeFileSync(path.join(__dirname, "recommendationController.js"), content);
console.log("File written successfully");
