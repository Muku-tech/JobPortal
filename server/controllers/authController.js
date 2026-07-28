const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { generateToken } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../utils/emailService");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, skills } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const validRoles = ["jobseeker", "employer"];
    const userRole = validRoles.includes(role) ? role : "jobseeker";
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      skills: skills || [],
    });
    const token = generateToken(user.id);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = generateToken(user.id);
    res.json({
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ message: "Error getting user" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    // Always return the same response regardless of whether user exists (security best practice)
    if (!user) {
      return res.json({
        message:
          "If an account exists for this email, password reset instructions will be sent.",
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (so the raw token is only in the email link)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Store hashed token with 1-hour expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send email with the raw (unhashed) token in the link
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      message:
        "If an account exists for this email, password reset instructions will be sent.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res
      .status(500)
      .json({ message: "Error processing password reset request" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the provided token to find matching user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require("sequelize").Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
