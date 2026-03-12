import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import '../styles/Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    accepted: 0,
    rejected: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const appsResponse = await api.get('/applications/user/me')
      const apps = appsResponse.data || []
      setApplications(apps)

      setStats({
        total: apps.length,
        pending: apps.filter(a => a.status === 'pending').length,
        reviewing: apps.filter(a => a.status === 'reviewing').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        rejected: apps.filter(a => a.status === 'rejected').length
      })

      try {
        const recResponse = await api.get('/recommendations/content-based')
        setRecommendedJobs((recResponse.data || []).slice(0, 6))
      } catch (err) {
        const jobsResponse = await api.get('/jobs?limit=6')
        setRecommendedJobs(jobsResponse.data.jobs || [])
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const profilePercentage = (() => {
    if (!user) return 0
    let completed = 0
    const fields = [user.name, user.email, user.phone, user.address, (user.skills?.length > 0), user.resume_url]
    fields.forEach(field => { if (field) completed++ })
    return Math.round((completed / fields.length) * 100)
  })()

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Loading your career insights...</p></div>

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        
        {/* Header Section */}
        <header className="dashboard-header">
          <div className="welcome-text">
            <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
            <p>Here is what's happening with your job search today.</p>
          </div>
        </header>

        <div className="dashboard-layout">
          
          {/* Left Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="card user-profile-card">
              <div className="user-avatar-large">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <h3>{user?.name}</h3>
              <span className="badge-role">Job Seeker</span>
              <div className="user-quick-contact">
                <p>📧 {user?.email}</p>
                <p>📍 {user?.address || 'Location not set'}</p>
              </div>
            </div>

            <div className="card completion-card">
              <h4>Profile Strength</h4>
              <div className="progress-box">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${profilePercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage">{profilePercentage}%</text>
                </svg>
              </div>
              <p>Complete your profile to unlock better recommendations.</p>
              <button onClick={() => navigate('/profile')} className="btn-secondary-outline">Update Profile</button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="dashboard-main-content">
            
            {/* Stats Grid */}
            <section className="stats-section">
              <div className="stat-box total">
                <span className="stat-val">{stats.total}</span>
                <span className="stat-label">Total Applied</span>
              </div>
              <div className="stat-box reviewing">
                <span className="stat-val">{stats.reviewing}</span>
                <span className="stat-label">Under Review</span>
              </div>
              <div className="stat-box accepted">
                <span className="stat-val">{stats.accepted}</span>
                <span className="stat-label">Shortlisted</span>
              </div>
            </section>

            {/* Recommendations Section */}
            <section className="dashboard-section">
              <div className="section-title">
                <h3>Recommended Jobs</h3>
                <Link to="/jobs" className="view-all">See All</Link>
              </div>
              <div className="rec-jobs-grid">
                {recommendedJobs.map(job => (
                  <div key={job.id} className="rec-job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <div className="job-info">
                      <h5>{job.title}</h5>
                      <p>{job.company_name}</p>
                    </div>
                    <div className="arrow-icon">→</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Applications Section */}
            <section className="dashboard-section">
              <div className="section-title">
                <h3>Recent Activity</h3>
              </div>
              <div className="activity-list">
                {applications.length === 0 ? (
                  <div className="empty-state">No recent activity found.</div>
                ) : (
                  applications.slice(0, 4).map(app => (
                    <div key={app.id} className="activity-item">
                      <div className="activity-meta">
                        <strong>{app.job?.title}</strong>
                        <span>{app.job?.company_name}</span>
                      </div>
                      <span className={`status-pill ${app.status}`}>{app.status}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  )
}

export default Dashboard