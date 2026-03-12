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
  }, [id, user]) // Added user as dependency to re-check applied status if they log in

  const fetchJob = async () => {
    try {
      const response = await api.get(`/jobs/${id}`)
      setJob(response.data)

      if (user) {
        // Checking if user already applied
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

  if (loading) return <div className="loading">Loading...</div>
  if (!job) return <div className="error">Job not found</div>

  return (
    <div className="job-details-page">
      <div className="job-details-header">
        <Link to="/jobs" className="back-link">← Back to Jobs</Link>
        <h1>{job.title}</h1>
        <p className="company-info">{job.company_name || job.employer?.name || "Company"}</p>
        <div className="job-meta">
          <span>📍 {job.location}</span>
          <span>💼 {job.job_type}</span>
          <span>📂 {job.category}</span>
        </div>
      </div>

      <div className="job-details-content">
        <div className="job-description">
          <h2>Job Description</h2>
          <p>{job.description}</p>
          
          <h3>Required Skills</h3>
          <div className="skills-list">
            {job.required_skills ? (
               typeof job.required_skills === 'string' ? JSON.parse(job.required_skills) : job.required_skills
            ).map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            )) : <span>No specific skills listed</span>}
          </div>

          {job.salary_min && job.salary_max && (
            <div className="salary-range">
              <h3>Salary</h3>
              <p>NPR {parseInt(job.salary_min).toLocaleString()} - {parseInt(job.salary_max).toLocaleString()}</p>
            </div>
          )}

          <div className="experience-level">
            <h3>Experience Level</h3>
            <p>{job.experience_level}</p>
          </div>
        </div>

        <div className="job-sidebar">
          {user?.role === 'jobseeker' && !applied && (
            <div className="apply-form">
              <h3>Apply Now</h3>
              <form onSubmit={handleApply}>
                <div className="form-group">
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows="6"
                    placeholder="Write your cover letter..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={applying}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}

          {applied && (
            <div className="already-applied">
              <p style={{color: '#10b981', fontWeight: 'bold'}}>✓ You have applied for this job</p>
<Link to="/dashboard" className="btn btn-secondary">View Dashboard</Link>
            </div>
          )}

          {!user && (
            <div className="login-prompt">
              <p>Login to apply for this job</p>
              <Link to="/login" className="btn btn-primary">Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetails