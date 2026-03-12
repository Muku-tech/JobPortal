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

      // Redirect based on role
      navigate(formData.role === 'employer' ? '/employer' : '/jobs', { replace: true })


    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          <input type="text" name="name" placeholder="Full Name"
            value={formData.name} onChange={handleChange} required />

          <input type="email" name="email" placeholder="Email"
            value={formData.email} onChange={handleChange} required />

          <input type="password" name="password" placeholder="Password"
            value={formData.password} onChange={handleChange} required />

          <input type="password" name="confirmPassword" placeholder="Confirm Password"
            value={formData.confirmPassword} onChange={handleChange} required />

          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Employer</option>
          </select>

          {formData.role === "jobseeker" && (
            <input
              type="text"
              name="skills"
              placeholder="Skills (React, Node)"
              value={formData.skills}
              onChange={handleChange}
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  )
}

export default Register