const express = require('express');
const router = express.Router();
const { User, Job, Application } = require('../models');
const auth = require('../middleware/auth');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, skills, education, experience, preferred_job_type, preferred_location, languages, company_description, website, industry, company_size } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address,
      skills: skills || user.skills,
      education: education || user.education,
      experience: experience || user.experience,
      preferred_job_type: preferred_job_type !== undefined ? preferred_job_type : user.preferred_job_type,
      preferred_location: preferred_location !== undefined ? preferred_location : user.preferred_location,
      languages: languages !== undefined ? languages : user.languages,
      company_description: company_description !== undefined ? company_description : user.company_description,
      website: website !== undefined ? website : user.website,
      industry: industry !== undefined ? industry : user.industry,
      company_size: company_size !== undefined ? company_size : user.company_size
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update resume URL
router.put('/resume', auth, async (req, res) => {
  try {
    const { resume_url } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ resume_url });
    res.json({ message: 'Resume updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user applications
router.get('/applications', auth, async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'company_name', 'location', 'job_type']
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
