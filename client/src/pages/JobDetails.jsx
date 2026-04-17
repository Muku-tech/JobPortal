import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Heart, Briefcase, MapPin, Calendar, Download, ChevronRight, CheckCircle } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useTheme } from '../context/ThemeContext'
import '../styles/JobDetails.css'

export default function JobDetails() {
  const { id } = useParams()
  const { user } = useAuth()
const { toast } = useToast()
  const { jobDetailsTheme, setJobDetailsTheme } = useTheme()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applied, setApplied] = useState(false)
  const [relatedJobs, setRelatedJobs] = useState([])
  const [showSkillGap, setShowSkillGap] = useState(false)
  const [skillGap, setSkillGap] = useState(null)
  const [loadingGap, setLoadingGap] = useState(false)


  useEffect(() => {
    fetchJob()
  }, [id, user])

  useEffect(() => {
    fetchRelatedJobs()
  }, [job])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/${id}`)
      setJob(response.data)
    } catch (jobError) {
      console.error('Error fetching job details:', jobError)
      if (jobError.response?.status === 404) {
        toast.error('Job not found')
        setLoading(false)
        return
      }
      toast.error(jobError.response?.data?.message || 'Failed to load job details')
      setLoading(false)
      return
    }

    if (user) {
      try {
        // Check applied
        const appResponse = await api.get(`/applications/user`)
        const hasApplied = appResponse.data.some(app => app.job_id === Number(id))
        setApplied(hasApplied)
      } catch (appError) {
        console.error('Error checking applications:', appError)
        // Silently fail - don't block job display
      }


    }
    setLoading(false)
  }

    const fetchRelatedJobs = async () => {
      if (!job?.category) return;
      try {
        const response = await api.get(`/jobs?category=${job.category}&limit=3`)
        setRelatedJobs(response.data.jobs?.filter(j => j.id !== Number(id)) || [])
      } catch (error) {
        console.error('Related jobs error:', error)
      }
    }

  const handleApply = async (e) => {
    e.preventDefault()
    setApplying(true)

    try {
      await api.post('/applications', {
        jobId: Number(id),
        coverLetter
      })
      setApplied(true)
      toast.success('Application submitted! Check Dashboard.')
      navigate('/dashboard')
    } catch (error) {
    toast.error(error.response?.data?.message || error.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }



  // Skills parser
  const renderSkills = () => {
    if (!job?.required_skills) return <span className="no-skills">No specific skills listed</span>
    
    let skills = []
    try {
      skills = JSON.parse(job.required_skills)
    } catch {
      if (typeof job.required_skills === 'string') {
        skills = job.required_skills.split(',')
      } else {
        skills = []
      }
    }
    return skills.map((skill, i) => (
      <span key={i} className="skill-tag">{skill.trim()}</span>
    ))
  }

  if (loading) return <div className="loading-full"><div className="spinner-large"></div></div>
  if (!job) return <div className="error-full">Job not found <Link to="/jobs">← Back</Link></div>

  return (
<div className={`job-details-page theme-${jobDetailsTheme}`}>
      {/* TOP HEADER */}
      <header className="job-header">
        <Link to="/jobs" className="back-btn">← Back to Jobs</Link>
        <div className="header-content">
          <div className="header-main">

            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="job-title"
            >
              {job.title}
            </motion.h1>
            <div className="job-meta-line">
              <span className="company">{job.company_name}</span>
              <span>•</span>
              <span><MapPin size={16} /> {job.location}</span>
              <span>•</span>
              <span className="type">{job.job_type?.replace('-', ' ')}</span>
            </div>
            <motion.button 
              className={`apply-top-btn ${applied ? 'applied' : ''}`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              disabled={applied || applying}
            >
              {applied ? '✓ Applied' : applying ? 'Applying...' : 'Apply Now'}
            </motion.button>
          </div>
        </div>
      </header>

      <div className="job-grid">
        {/* LEFT MAIN CONTENT 70% */}
        <main className="job-main">
          <section className="section">
            <h2>About the Role</h2>
            <div className="content">
              <p>{job.description}</p>
            </div>
          </section>

          <section className="section">
            <h2>Requirements</h2>
            <div className="content skills-section">
              <div className="skills-grid">
                {renderSkills()}
              </div>
            </div>
          </section>

          <section className="section">
            <h2>Responsibilities</h2>
            <div className="content list">
              {job.responsibilities ? (
                <ul>
                  {job.responsibilities.split('\n').map((resp, i) => (
                    <li key={i}>{resp.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p>No specific responsibilities listed.</p>
              )}
            </div>
          </section>

          {job.benefits && (
            <section className="section">
              <h2>Benefits</h2>
              <div className="content list">
                <ul>
                  {job.benefits.split('\n').map((benefit, i) => (
                    <li key={i}>{benefit.trim()}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </main>

        {/* RIGHT SIDEBAR 30% - STICKY */}
        <aside className="job-sidebar sticky">
          <div className="sidebar-section apply-section">
            <h3>Apply Now</h3>
            {applied ? (
              <div className="applied-status">
                <CheckCircle size={24} className="success-icon" />
                <p>You've successfully applied!</p>
                <Link to="/dashboard" className="btn btn-secondary">View Applications</Link>
              </div>
            ) : user ? (
              <form onSubmit={handleApply} className="apply-form">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit (optional)..."
                  rows="4"
                />
                <motion.button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={applying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </motion.button>
              </form>
            ) : (
              <div className="login-cta">
                <p>Login to apply</p>
                <Link to="/login" className="btn btn-primary">Login</Link>
              </div>
            )}
          </div>

          <div className="sidebar-section summary-section">
            <h3>Job Summary</h3>
            <div className="summary-item">
              <span>Location</span>
              <span>{job.location}</span>
            </div>
            <div className="summary-item">
              <span>Type</span>
              <span>{job.job_type}</span>
            </div>
            <div className="summary-item">
              <span>Experience</span>
              <span>{job.experience_level}</span>
            </div>
            {job.salary_min && (
              <div className="summary-item">
                <span>Salary</span>
                <span>NPR {parseInt(job.salary_min).toLocaleString()} - {parseInt(job.salary_max).toLocaleString()}</span>
              </div>
            )}
            <div className="summary-item">
              <span>Posted</span>
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="sidebar-section action-section">
            <h3>Skill Gap Analysis</h3>
            {user && (
              <motion.button 
                className="skill-gap-btn"
                onClick={async () => {
                  setLoadingGap(true);
                  try {
                    const response = await api.get(`/jobs/${id}/skillgap`);
                    setSkillGap(response.data);
                    setShowSkillGap(true);
                  } catch (err) {
                    toast.error('Failed to analyze skills');
                  } finally {
                    setLoadingGap(false);
                  }
                }}
                whileHover={{ scale: 1.05 }}
                disabled={loadingGap}
              >
                {loadingGap ? 'Analyzing...' : <><Brain size={18} /> Check My Skill Fit</>}
              </motion.button>
            )}
          </div>
        </aside>
      </div>

      {/* RELATED JOBS BOTTOM */}
      {relatedJobs.length > 0 && (
        <motion.section className="related-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} >
          <h2>Similar Jobs</h2>
          <div className="related-grid">
            {relatedJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="related-card">
                <h4>{job.title}</h4>
                <p>{job.company_name} • {job.location}</p>
              </Link>
            ))}
          </div>
        </motion.section>
      )}
      {/* Skill Gap Modal */}
      {showSkillGap && skillGap && (
        <motion.div 
          className="skill-gap-modal"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="modal-header">
            <h3>Skill Gap Analysis</h3>
            <button onClick={() => setShowSkillGap(false)} className="close-btn">×</button>
          </div>
          <div className="gap-score">
            <span className="score">{skillGap.gapScore}%</span>
            <span>Match Score</span>
          </div>
          <div className="gap-stats">
            <div>
              <strong>{skillGap.totalMissing}</strong> skills missing
            </div>
            <div>
              You have <strong>{skillGap.yourSkills.length}</strong> relevant skills
            </div>
          </div>
          <div className="missing-skills">
            <h4>Missing Skills ({skillGap.missingSkills.length}):</h4>
            <div className="skills-list">
              {skillGap.missingSkills.map((skill, i) => (
                <span key={i} className="gap-skill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="gap-actions">
            <button className="btn-primary" onClick={() => setShowSkillGap(false)}>
              Got it, thanks!
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

