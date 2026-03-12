import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/Profile.css'

function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    skills: user?.skills?.join(', ') || '',
    education: user?.education || '',
    experience: user?.experience || '',
    languages: user?.languages?.join(', ') || '',
    preferred_job_type: user?.preferred_job_type || '',
    preferred_location: user?.preferred_location || '',
    company_description: user?.company_description || '',
    website: user?.website || '',
    industry: user?.industry || '',
    company_size: user?.company_size || ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      alert('Profile updated successfully!')
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <h1>{user?.role === 'employer' ? 'Company Profile' : 'My Resume & Profile'}</h1>
      <div className="profile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <span className="status-badge active" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{user?.role}</span>
        </div>
        <button onClick={() => setEditing(!editing)} className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`}>
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {errorMsg && <div className="error-message">{errorMsg}</div>}

      {editing ? (
        <form onSubmit={handleSubmit} className="profile-form form-row">
          <div className="form-section" style={{ gridColumn: '1 / -1' }}>
            <h3>Basic Information</h3>
            <div className="form-group">
              <label>Name / Company Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Address / Location</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} />
            </div>
          </div>

          {user?.role === 'jobseeker' && (
            <div className="form-section" style={{ gridColumn: '1 / -1' }}>
              <h3>Professional Details</h3>
              <div className="form-group">
                <label>Professional Experience (Describe your past roles)</label>
                <textarea name="experience" rows="4" value={formData.experience} onChange={handleChange} placeholder="e.g. Software Engineer at Tech Corp (2020-2023)..."></textarea>
              </div>
              <div className="form-group">
                <label>Education Background</label>
                <textarea name="education" rows="3" value={formData.education} onChange={handleChange} placeholder="e.g. BSc Computer Science from TU..."></textarea>
              </div>
              <div className="form-group">
                <label>Skills (comma separated)</label>
                <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Project Management" />
              </div>
              <div className="form-group">
                <label>Languages (comma separated)</label>
                <input type="text" name="languages" value={formData.languages} onChange={handleChange} placeholder="Nepali, English, Hindi" />
              </div>
              <div className="form-group">
                <label>Preferred Job Type</label>
                <select name="preferred_job_type" value={formData.preferred_job_type} onChange={handleChange}>
                  <option value="">Select preferences...</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Working Location</label>
                <input type="text" name="preferred_location" value={formData.preferred_location} onChange={handleChange} placeholder="e.g. Kathmandu or Remote" />
              </div>
            </div>
          )}

          {user?.role === 'employer' && (
            <div className="form-section" style={{ gridColumn: '1 / -1' }}>
              <h3>Company Details</h3>
              <div className="form-group">
                <label>Company Description</label>
                <textarea name="company_description" rows="5" value={formData.company_description} onChange={handleChange} placeholder="What does your company do?"></textarea>
              </div>
              <div className="form-group">
                <label>Website URL</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.example.com" />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Information Technology" />
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select name="company_size" value={formData.company_size} onChange={handleChange}>
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details" style={{ display: 'grid', gap: '2rem' }}>

          <div className="detail-card" style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Contact Information</h3>
            <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
            <p><strong>Address:</strong> {user?.address || 'Not provided'}</p>
          </div>

          {user?.role === 'jobseeker' && (
            <>
              <div className="detail-card" style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Professional Summary</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Experience:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{user?.experience || 'No experience details added.'}</p>
                </div>
                <div>
                  <strong>Education:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{user?.education || 'No education details added.'}</p>
                </div>
              </div>

              <div className="detail-card" style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Skills & Languages</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Skills:</strong>
                  <div className="skills-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {user?.skills?.length > 0 ? user.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    )) : <span>No skills added</span>}
                  </div>
                </div>
                <div>
                  <strong>Languages:</strong>
                  <div className="skills-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {user?.languages?.length > 0 ? user.languages.map((lang, index) => (
                      <span key={index} className="skill-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>{lang}</span>
                    )) : <span>No languages added</span>}
                  </div>
                </div>
              </div>

              <div className="detail-card" style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Preferences</h3>
                <p><strong>Job Type:</strong> {user?.preferred_job_type ? user.preferred_job_type.replace('-', ' ') : 'Any'}</p>
                <p><strong>Location:</strong> {user?.preferred_location || 'Any'}</p>
              </div>
            </>
          )}

          {user?.role === 'employer' && (
            <div className="detail-card" style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Company Overview</h3>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>{user?.company_description || 'No company description provided.'}</p>
              <p><strong>Website:</strong> {user?.website ? <a href={user.website} target="_blank" rel="noreferrer">{user.website}</a> : 'Not provided'}</p>
              <p><strong>Industry:</strong> {user?.industry || 'Not provided'}</p>
              <p><strong>Company Size:</strong> {user?.company_size || 'Not provided'}</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default Profile


