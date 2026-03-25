import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Building2, MapPin, Globe, Phone, Mail, Edit3, Save, X, Users } from 'lucide-react'
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
    } catch (error) {
      setErrorMsg('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="emp-profile-root">
      <div className="emp-profile-container">
        
        {/* BRAND HEADER */}
        <header className="emp-profile-header">
          <div className="emp-brand-flex">
            <div className="emp-logo-box">
              {user?.name?.charAt(0) || <Building2 size={32} />}
            </div>
            <div className="emp-title-meta">
              <h1>{user?.name}</h1>
              <p><span className="role-tag">Verified Employer</span> • {user?.industry || 'General Industry'}</p>
            </div>
          </div>
          <button 
            onClick={() => setEditing(!editing)} 
            className={`btn-edit-toggle ${editing ? 'is-cancel' : ''}`}
          >
            {editing ? <><X size={18} /> Cancel</> : <><Edit3 size={18} /> Edit Profile</>}
          </button>
        </header>

        {errorMsg && <div className="profile-alert-error">{errorMsg}</div>}

        <div className="emp-profile-grid">
          {editing ? (
            <form onSubmit={handleSubmit} className="emp-edit-form">
              <div className="form-card">
                <h3><Building2 size={20} /> Basic Company Details</h3>
                <div className="input-grid">
                  <div className="input-field">
                    <label>Company Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="input-field">
                    <label>Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="input-field">
                  <label>Headquarters Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="form-card">
                <h3><Globe size={20} /> Online Presence & Scale</h3>
                <div className="input-grid">
                  <div className="input-field">
                    <label>Website URL</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
                  </div>
                  <div className="input-field">
                    <label>Industry</label>
                    <input type="text" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. IT, Banking" />
                  </div>
                </div>
                <div className="input-field">
                    <label>Company Size</label>
                    <select name="company_size" value={formData.company_size} onChange={handleChange}>
                        <option value="">Select Size</option>
                        <option value="1-10">1-10 Employees</option>
                        <option value="11-50">11-50 Employees</option>
                        <option value="51-200">51-200 Employees</option>
                        <option value="201-500">201-500 Employees</option>
                        <option value="500+">500+ Employees</option>
                    </select>
                </div>
                <div className="input-field">
                  <label>About Us (Company Description)</label>
                  <textarea name="company_description" rows="6" value={formData.company_description} onChange={handleChange}></textarea>
                </div>
              </div>

              <div className="form-submit-area">
                <button type="submit" className="btn-save-changes" disabled={loading}>
                  {loading ? 'Saving...' : <><Save size={18} /> Update Brand Profile</>}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* VIEW MODE: SIDEBAR */}
              <aside className="emp-sidebar">
                <div className="contact-card">
                  <h4>Contact Information</h4>
                  <div className="contact-row">
                    <Phone size={16} /> <span>{user?.phone || 'Not provided'}</span>
                  </div>
                  <div className="contact-row">
                    <MapPin size={16} /> <span>{user?.address || 'Not provided'}</span>
                  </div>
                  <div className="contact-row">
                    <Mail size={16} /> <span>{user?.email}</span>
                  </div>
                  {user?.website && (
                    <div className="contact-row">
                      <Globe size={16} /> <a href={user.website} target="_blank" rel="noreferrer">Visit Website</a>
                    </div>
                  )}
                </div>

                <div className="stats-mini-card">
                    <div className="mini-stat">
                        <Users size={16} />
                        <div>
                            <strong>{user?.company_size || 'N/A'}</strong>
                            <span>Company Size</span>
                        </div>
                    </div>
                </div>
              </aside>

              {/* VIEW MODE: MAIN */}
              <main className="emp-main-content">
                <section className="about-section">
                  <h3>About Our Company</h3>
                  <p className="description-text">
                    {user?.company_description || 'Write a compelling description of your company to attract the best candidates in Nepal.'}
                  </p>
                </section>

                <section className="meta-section">
                    <div className="meta-pill"><strong>Industry:</strong> {user?.industry || 'Not specified'}</div>
                </section>
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployerProfile