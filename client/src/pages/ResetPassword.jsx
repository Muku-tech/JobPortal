import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import '../styles/Login.css'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    if (password !== confirmPassword) {
      setIsError(true)
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setIsError(true)
      setMessage('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setIsError(true)
        setMessage(data.message || 'Unable to reset password. Please try again.')
      } else {
        setIsSuccess(true)
        setIsError(false)
        setMessage('Password has been reset successfully!')
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err) {
      setIsError(true)
      setMessage('Unable to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"></div>
          <h1>Set new password</h1>
          <p className="auth-subtitle">Enter your new password below.</p>
        </div>

        {message && (
          <div className={isError ? 'error-banner' : 'success-banner'}>
            {message}
          </div>
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="auth-footer" style={{ marginTop: 12 }}>
              <p>
                Remembered your password? <Link to="/login" className="signup-link">Back to Sign In</Link>
              </p>
            </div>
          </form>
        )}

        {isSuccess && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p>Redirecting to login page...</p>
            <Link to="/login" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 12 }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword

