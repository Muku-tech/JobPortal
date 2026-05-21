import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { resumeApi } from '../services/api'
import { RefreshCw, FileEdit } from 'lucide-react'
import '../styles/JobSeekerProfile.css'

function JobSeekerProfile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [skillSuggestions, setSkillSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [dbSkills, setDbSkills] = useState([])

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    portfolio: user?.portfolio || '',
    salary_expectation: user?.salary_expectation || '',
    current_company: user?.current_company || '',
    availability_date: user?.availability_date || '',
    skills: user?.skills?.map(s => typeof s === 'object' ? s.title : s).join(', ') || '',
    education: user?.education || '',
    experience: user?.experience || '',
    languages: user?.languages?.map(l => typeof l === 'object' ? l.title : l).join(', ') || '',
    preferred_job_type: user?.preferred_job_type || '',
    preferred_location: user?.preferred_location || ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch unique skills from database on mount
  useEffect(() => {
    const fetchDbSkills = async () => {
      try {
        const res = await api.get('/recommendations/unique-skills');
        setDbSkills(res.data || []);
      } catch (err) {
        console.error('Failed to fetch skills from database', err);
      }
    };
    fetchDbSkills();
  }, []);

  const handleSyncFromResume = async () => {
    setLoading(true);
    try {
      const response = await resumeApi.getResumes();
      if (response.data && response.data.length > 0) {
        const resume = response.data.find(r => r.is_default) || response.data[0];
        setFormData({
          ...formData,
          name: resume.personal_info?.name || formData.name,
          phone: resume.personal_info?.phone || formData.phone,
          address: resume.personal_info?.address || formData.address,
          skills: Array.isArray(resume.skills) ? resume.skills.map(s => s.title || s).join(', ') : formData.skills,
          experience: Array.isArray(resume.experiences) ? resume.experiences.map(e => `${e.title} at ${e.organization || e.company}`).join('\n') : formData.experience,
          education: Array.isArray(resume.educations) ? resume.educations.map(e => `${e.title} from ${e.organization || e.company}`).join('\n') : formData.education
        });
        setErrorMsg('Data loaded from your resume. Don\'t forget to save!');
      } else {
        setErrorMsg('No resume found to sync from. Create one in the Resume Builder first.');
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, skills: value });

    // Get the part currently being typed (after the last comma)
    const parts = value.split(',');
    const currentPart = parts[parts.length - 1].trim();

    if (currentPart.length >= 2) {
      const matches = dbSkills.filter(skill => 
        skill.toLowerCase().includes(currentPart.toLowerCase()) &&
        !parts.some(p => p.trim().toLowerCase() === skill.toLowerCase())
      ).slice(0, 5); // Limit to top 5 matches

      setSkillSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  const selectSkill = (skill) => {
    const parts = formData.skills.split(',');
    parts[parts.length - 1] = ` ${skill}`; // Replace partial with full skill
    setFormData({ ...formData, skills: parts.join(',').trim() + ', ' });
    setShowSuggestions(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const updatedData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(s => s) : []
      }
      const response = await api.put('/users/profile', updatedData)
      updateUser(response.data.user)
      setEditing(false)
      // Toast notification
      const notification = document.createElement('div');
      notification.textContent = 'Profile updated successfully! 🎉';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: 600;
        font-size: 1rem;
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    } catch (error) {
      setErrorMsg('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header-card">
          <div className="user-meta">
            <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
            <div>
              <h1>{user?.name}</h1>
              <p>{user?.email} • <span className="role-badge">Job Seeker</span></p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {editing && (
              <button type="button" onClick={handleSyncFromResume} className="btn-edit-toggle" style={{ backgroundColor: '#f97316' }}>
                <RefreshCw size={16} /> Sync from Resume
              </button>
            )}
            <button onClick={() => setEditing(!editing)} className={`btn-edit-toggle ${editing ? 'cancel' : ''}`}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </header>

        {errorMsg && <div className="profile-error">{errorMsg}</div>}

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>General Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>GitHub</label>
                  <input type="url" name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/yourusername" />
                </div>
                <div className="form-group">
                  <label>Portfolio</label>
                  <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://yourportfolio.com" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Resume Details</h3>
              <div className="form-group">
                <label>Professional Experience</label>
                <textarea name="experience" rows="4" value={formData.experience} onChange={handleChange} placeholder="Past roles and responsibilities..."></textarea>
              </div>
              <div className="form-group">
                <label>Education</label>
                <textarea name="education" rows="3" value={formData.education} onChange={handleChange}></textarea>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Current Company</label>
                  <input type="text" name="current_company" value={formData.current_company} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Salary Expectation</label>
                  <input type="text" name="salary_expectation" value={formData.salary_expectation} onChange={handleChange} placeholder="NPR 50,000 - 80,000" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Available From</label>
                  <input type="date" name="availability_date" value={formData.availability_date} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Job Preference</label>
                  <select name="preferred_job_type" value={formData.preferred_job_type} onChange={handleChange}>
                    <option value="">Any</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Skills (comma separated)</label>
                  <input 
                    type="text" 
                    name="skills" 
                    value={formData.skills} 
                    onChange={handleSkillsChange} 
                    placeholder="React, SQL, Marketing"
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div className="skill-autocomplete-dropdown" style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, 
                      backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px', overflow: 'hidden'
                    }}>
                      {skillSuggestions.map((skill, index) => (
                        <div key={index} onClick={() => selectSkill(skill)} style={{
                          padding: '10px 15px', cursor: 'pointer', borderBottom: index !== skillSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }} onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}>
                          {skill}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        ) : (
          <div className="profile-view-grid">
            <aside className="profile-sidebar">
              <div className="info-card">
                <h4>Contact Info</h4>
                <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {user?.address || 'Not provided'}</p>
              </div>
            </aside>

            <main className="profile-main-content">
              <section className="display-section">
                <h3>Professional Experience</h3>
                <div className="text-display">
                  {user?.experience ? (
                    typeof user.experience === 'string' ? (
                      user.experience.split('\n').map((line, i) => <p key={i}>{line}</p>)
                    ) : Array.isArray(user.experience) ? (
                      user.experience.map((e, i) => <p key={i}><strong>{e.title}</strong> at {e.organization || e.company}</p>)
                    ) : <p>{user.experience}</p>
                  ) : <p>No experience listed.</p>}
                </div>
              </section>
              <section className="display-section">
                <h3>Education</h3>
                <div className="text-display">
                  {typeof user?.education === 'string' 
                    ? user.education.split('\n').map((line, i) => <p key={i}>{line}</p>) 
                    : <p>{user?.education || 'No education listed.'}</p>}
                </div>
              </section>
              <section className="display-section">
                <h3>Skills</h3>
                <div className="tag-container">
                  {user?.skills?.map((s, i) => (
                    <span key={i} className="skill-tag">
                      {typeof s === 'object' ? s.title : s}
                    </span>
                  ))}
                </div>
              </section>
            </main>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobSeekerProfile
