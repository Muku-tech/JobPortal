const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Register new user
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Get current user
router.get("/me", verifyToken, authController.getMe);

module.exports = router;
