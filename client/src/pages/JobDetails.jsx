import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import '../styles/JobDetails.css'

function JobDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [id, user])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/${id}`)
      setJob(response.data)

      if (user && user.role === 'jobseeker') {
        const appResponse = await api.get(`/applications/user`)
        const hasApplied = appResponse.data.some(app => app.job_id === Number(id))
        setApplied(hasApplied)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setApplying(true)

    try {
      await api.post('/applications', {
        jobId: Number(id),
        coverLetter: coverLetter
      })

      setApplied(true)
      alert('Application submitted successfully!')
      navigate('/dashboard')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  // Helper to safely parse skills
  const renderSkills = () => {
    if (!job.required_skills) return <span>No specific skills listed</span>
    
    let skillsArray = []
    try {
      skillsArray = typeof job.required_skills === 'string' 
        ? JSON.parse(job.required_skills) 
        : job.required_skills
    } catch (e) {
      skillsArray = job.required_skills.split(',') // Fallback if it's a simple comma string
    }

    return skillsArray.map((skill, index) => (
      <span key={index} className="skill-tag">{skill.trim()}</span>
    ))
  }

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>
  if (!job) return <div className="error-container"><h2>Job not found</h2><Link to="/jobs">Back to Jobs</Link></div>

  return (
    <div className="job-details-page">
      <div className="job-details-container">
        
        {/* HEADER SECTION */}
        <header className="job-details-header">
          <Link to="/jobs" className="back-link">← Back to Search</Link>
          <div className="header-main">
            <div className="header-text">
              <h1>{job.title}</h1>
              <p className="company-name">{job.company_name || job.employer?.name || "Company"}</p>
              <div className="job-meta-pills">
                <span className="pill">Location: {job.location}</span>
                <span className="pill">Type: {job.job_type}</span>
                <span className="pill">Category: {job.category}</span>
                <span className="pill">Experience: {job.experience_level}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="job-details-grid">
          {/* MAIN CONTENT */}
          <main className="job-main-content">
            <section className="detail-section">
              <h2>Job Description</h2>
              <div className="description-body">
                {job.description}
              </div>
            </section>

            <section className="detail-section">
              <h2>Required Skills</h2>
              <div className="skills-list">
                {renderSkills()}
              </div>
            </section>

            {job.salary_min && (
              <section className="detail-section">
                <h2>Salary Range</h2>
                <p className="salary-text">
                  NPR {parseInt(job.salary_min).toLocaleString()} — {parseInt(job.salary_max).toLocaleString()}
                </p>
              </section>
            )}
          </main>

          {/* SIDEBAR */}
          <aside className="job-sidebar">
            <div className="sidebar-card">
              {user?.role === 'jobseeker' && !applied && (
                <div className="apply-form">
                  <h3>Apply for this position</h3>
                  <form onSubmit={handleApply}>
                    <div className="form-group">
                      <label>Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Highlight your experience..."
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary-full" disabled={applying}>
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </form>
                </div>
              )}

              {applied && (
                <div className="status-box success">
                  <p className="status-text">✓ You have already applied</p>
                  <Link to="/dashboard" className="btn-secondary-full">Go to Dashboard</Link>
                </div>
              )}

              {!user && (
                <div className="status-box login-box">
                  <p>Interested in this job?</p>
                  <Link to="/login" className="btn-primary-full">Login to Apply</Link>
                </div>
              )}

              {user?.role === 'employer' && (
                <div className="status-box employer-box">
                  <p>You are viewing this as an employer.</p>
                  <Link to="/employer-dashboard" className="btn-secondary-full">Manage Postings</Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default JobDetails