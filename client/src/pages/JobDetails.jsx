import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Heart, Briefcase, MapPin, Calendar, Download, ChevronRight, CheckCircle, FileText } from 'lucide-react'
import api, { resumeApi } from '../services/api'
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
  // Resume states
  const [resumes, setResumes] = useState([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState(null)

  useEffect(() => {
    fetchJob()
  }, [id, user])

  useEffect(() => {
    fetchRelatedJobs()
  }, [job])

  useEffect(() => {
    if (user) {
      fetchResumes()
    }
  }, [user])

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

  const fetchResumes = async () => {
    if (!user) return
    try {
      setLoadingResumes(true)
      const response = await resumeApi.getResumes()
      setResumes(response.data)
      // Auto-select default resume
      const defaultResume = response.data.find(r => r.is_default)
      if (defaultResume) {
        setSelectedResumeId(defaultResume.id)
      }
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setLoadingResumes(false)
    }
  }

  const fetchRelatedJobs = async () => {
    // Similar jobs disabled for public users
    setRelatedJobs([]);
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setApplying(true)

    try {
      await api.post('/applications', {
        jobId: Number(id),
        coverLetter,
        resumeId: selectedResumeId
      })
      setApplied(true)
      toast.success('Application submitted with resume! Check Dashboard.')
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
    if (Array.isArray(job.required_skills)) {
      skills = job.required_skills
    } else if (typeof job.required_skills === 'string') {
      try {
        skills = JSON.parse(job.required_skills)
      } catch {
        skills = job.required_skills.split(',')
      }
    }
    if (!skills.length) return <span className="no-skills">No specific skills listed</span>
    return skills.map((skill, i) => (
      <span key={i} className="skill-tag">{typeof skill === 'string' ? skill.trim() : String(skill)}</span>
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
              <h3>Benefits</h3>
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
                <label>Attach Resume <FileText size={16} /></label>
                {loadingResumes ? (
                  <div>Loading resumes...</div>
                ) : resumes.length === 0 ? (
                  <div className="no-resume">
                    <p>No resumes found. <Link to="/resume-builder">Create one</Link></p>
                  </div>
                ) : (
                  <select 
                    value={selectedResumeId || ''} 
                    onChange={(e) => setSelectedResumeId(e.target.value ? Number(e.target.value) : null)}
                    className="resume-select"
                    required
                  >
                    <option value="">Select a resume...</option>
                    {resumes.map(resume => (
                      <option key={resume.id} value={resume.id}>
                        {resume.template} Resume {resume.is_default && '(Default)'}
                      </option>
                    ))}
                  </select>
                )}
                <label>Cover Letter (Optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit..."
                  rows="4"
                />
                <motion.button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={applying || !selectedResumeId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {applying ? 'Submitting...' : 'Submit Application + Resume'}
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
                  console.log('🔍 Skill Gap Click - user:', user?.id, 'jobId:', id);
                  console.log('🔍 User skills from context:', user?.skills);
                  setLoadingGap(true);
                  try {
                    const response = await api.get(`/jobs/${id}/skillgap`);
                    console.log('✅ Skill Gap API Response:', response.data);
                    setSkillGap(response.data);
                    setShowSkillGap(true);
                  } catch (err) {
                    console.error('❌ Skill Gap Error:', err.response?.data || err.message);
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

      {/* RELATED JOBS BOTTOM - Disabled for public users */}

      {/* Skill Gap Modal */}
      {showSkillGap && skillGap && (
        <div className="skill-gap-modal">
          <div className="skill-gap-backdrop" onClick={() => setShowSkillGap(false)} />
          <div className="modal-content">
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
          </div>
        </div>
      )}
    </div>
  )
}

