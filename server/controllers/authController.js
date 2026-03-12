const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, skills } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const validRoles = ['jobseeker', 'employer'];
    const userRole = validRoles.includes(role) ? role : 'jobseeker';
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      skills: skills || []
    });
    const token = generateToken(user.id);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user.id);
    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Error getting user' });
  }
};
