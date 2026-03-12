import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const user = await login(email, password)

    // Redirect based on role
    navigate(user.role === 'employer' ? '/employer' : '/')

  } catch (err) {
    setError(err.response?.data?.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p>Dont have an account? <Link to="/register">Sign Up</Link></p>
      </div>
    </div>
  )
}

export default Login
