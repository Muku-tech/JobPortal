import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Register.css'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker',
    phone: '',
    address: '',
    skills: ''
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        address: formData.address,
        skills: formData.skills
          ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
          : []
      }

      await register(userData)
      // Redirect based on role choice
      navigate(formData.role === 'employer' ? '/employer' : '/jobs', { replace: true })

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">JS</div>
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join the JobSathi community today</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-selector">
            <button 
              type="button" 
              className={formData.role === 'jobseeker' ? 'active' : ''} 
              onClick={() => setFormData({...formData, role: 'jobseeker'})}
            >
              Job Seeker
            </button>
            <button 
              type="button" 
              className={formData.role === 'employer' ? 'active' : ''} 
              onClick={() => setFormData({...formData, role: 'employer'})}
            >
              Employer
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="email@example.com" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          {formData.role === "jobseeker" && (
            <div className="form-group skill-input-group">
              <label>Professional Skills (comma separated)</label>
              <input 
                type="text" 
                name="skills" 
                placeholder="React, Node.js, Graphic Design" 
                value={formData.skills} 
                onChange={handleChange} 
              />
            </div>
          )}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Creating your account..." : "Get Started"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default Register