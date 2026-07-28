import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Login.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setMessage(data.message || 'Unable to process request. Please try again.')
      } else {
        setIsError(false)
        setMessage(data.message)
      }
    } catch (err) {
      setIsError(true)
      setMessage('Unable to process request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" ></div>
          <h1>Reset your password</h1>
          <p className="auth-subtitle">Enter your email and we’ll send reset instructions.</p>
        </div>

        {message && <div className={isError ? "error-banner" : "success-banner"}>{message}</div>}

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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <div className="auth-footer" style={{ marginTop: 12 }}>
            <p>
              Remembered your password? <Link to="/login" className="signup-link">Back to Sign In</Link>
            </p>
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
              style={{ display: 'none' }}
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword

