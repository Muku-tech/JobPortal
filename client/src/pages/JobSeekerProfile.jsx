import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/JobSeekerProfile.css'

function JobSeekerProfile() {
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
    preferred_location: user?.preferred_location || ''
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
          <button onClick={() => setEditing(!editing)} className={`btn-edit-toggle ${editing ? 'cancel' : ''}`}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
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
              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} />
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
                  <label>Skills (comma separated)</label>
                  <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, SQL, Marketing" />
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
                <p>{user?.experience || 'No experience listed.'}</p>
              </section>
              <section className="display-section">
                <h3>Skills</h3>
                <div className="tag-container">
                  {user?.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
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
