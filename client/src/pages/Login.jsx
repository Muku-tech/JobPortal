import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'jobseeker';

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)

      // Strategic redirection based on role
      if (user.role === 'employer') {
        navigate('/employer')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error('Login Error:', err)
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" ></div>
          <h1>{role === 'employer' ? 'Employer Login' : 'Job Seeker Login'}</h1>
          <p className="auth-subtitle">Log in as {role === 'employer' ? 'an employer' : 'a job seeker'} to your JobSathi account</p>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" id="forgot-link">Forgot password?</Link>
            </div>
            <input 
              id="password"
              type="password" 
              placeholder="Enter your password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="loader-dots">Authenticating...</span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>New to JobSathi? <Link to={`/register?role=${role}`} className="signup-link">Create an account</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login