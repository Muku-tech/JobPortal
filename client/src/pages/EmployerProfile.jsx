import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/EmployerProfile.css'

function EmployerProfile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
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
      const response = await api.put('/users/profile', formData)
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
              <p>{user?.email} • <span className="role-badge">Employer</span></p>
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
              <h3>Company Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
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
              <h3>Company Profile</h3>
              <div className="form-group">
                <label>About the Company</label>
                <textarea name="company_description" rows="5" value={formData.company_description} onChange={handleChange}></textarea>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Website URL</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input type="text" name="industry" value={formData.industry} onChange={handleChange} />
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
                <h3>About Us</h3>
                <p>{user?.company_description || 'No description provided.'}</p>
                <p><strong>Industry:</strong> {user?.industry}</p>
                <p><strong>Size:</strong> {user?.company_size} Employees</p>
              </section>
            </main>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployerProfile
