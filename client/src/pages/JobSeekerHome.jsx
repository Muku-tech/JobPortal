import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/JobSeekerHome.css'

const CATEGORIES = [
  { name: 'Information Technology', icon: '', count: 120 },
  { name: 'Banking & Finance', icon: '', count: 85 },
  { name: 'Teaching & Education', icon: '', count: 45 },
  { name: 'Healthcare & Medical', icon: '', count: 60 },
  { name: 'Engineering', icon: '', count: 90 },
  { name: 'Marketing & Sales', icon: '', count: 110 },
  { name: 'Construction', icon: '', count: 35 },
  { name: 'Tourism & Hospitality', icon: '', count: 75 }
]

export default function JobSeekerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [latestJobs, setLatestJobs] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      // 1. Fetch Latest Jobs
      const latestRes = await api.get('/jobs?limit=6')
      setLatestJobs(latestRes.data.jobs || latestRes.data || [])

      // 2. Fetch Recommendations if logged in
      if (user && user.role === 'jobseeker') {
        try {
          const recRes = await api.get('/recommendations/smart')
          setRecommendedJobs(recRes.data.jobs?.slice(0, 3) || [])
        } catch (e) {
          console.log("No personal recommendations found yet.")
        }
      }
    } catch (err) {
      console.error('Error loading homepage:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate(`/jobs?search=${search}`)
  }

  // Sub-component for individual job cards
  const JobCard = ({ job, isRecommended }) => {
    const skills = Array.isArray(job.required_skills) 
      ? job.required_skills 
      : typeof job.required_skills === 'string' 
        ? JSON.parse(job.required_skills) 
        : []

    return (
      <div className={`modern-job-card ${isRecommended ? 'recommended-border' : ''}`}>
        {isRecommended && <span className="rec-badge">Best Match</span>}
        <div className="card-top">
          <div className="company-logo-box">{job.company_name?.charAt(0)}</div>
          <div className="title-area">
            <h3>{job.title}</h3>
            <span className="company-text">{job.company_name}</span>
          </div>
        </div>
        
        <div className="meta-row">
          <span>Location: {job.location}</span>
          <span>Type: {job.job_type}</span>
        </div>

        <div className="skills-row">
          {skills.slice(0, 3).map((s, i) => <span key={i} className="skill-pill">{s}</span>)}
        </div>

        <div className="card-footer">
          <span className="salary-tag">
            {job.salary_min ? `NPR ${parseInt(job.salary_min).toLocaleString()}` : 'Negotiable'}
          </span>
          <Link to={`/jobs/${job.id}`} className="view-btn">Details</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="seeker-home">
      {/* HERO */}
      <section className="seeker-hero">
        <div className="hero-content">
          <h1>Find Your Next <span className="blue-text">Career Move</span></h1>
          <p>Explore thousands of job opportunities across Nepal's top industries.</p>
          
          <form className="hero-search" onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Job title, skills, or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search Jobs</button>
          </form>
          
          <div className="trending">
            <span>Trending:</span>
            <Link to="/jobs?search=React">React</Link>
            <Link to="/jobs?search=Accountant">Accountant</Link>
            <Link to="/jobs?search=Sales">Sales</Link>
          </div>
        </div>
      </section>

      <div className="main-container">
        {/* RECOMMENDATIONS */}
        {user && recommendedJobs.length > 0 && (
          <section className="home-section">
            <div className="section-head">
              <h2>Tailored for You</h2>
              <p>Based on your profile and interests</p>
            </div>
            <div className="jobs-grid">
              {recommendedJobs.map(job => <JobCard key={job.id} job={job} isRecommended={true} />)}
            </div>
          </section>
        )}

        {/* CATEGORIES */}
        <section className="home-section">
          <div className="section-head">
            <h2>Explore Categories</h2>
          </div>
          <div className="category-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className="cat-box" onClick={() => navigate(`/jobs?category=${cat.name}`)}>
                <span className="cat-icon">{cat.icon}</span>
                <h4>{cat.name}</h4>
                <p>{cat.count}+ Vacancies</p>
              </div>
            ))}
          </div>
        </section>

        {/* LATEST JOBS */}
        <section className="home-section">
          <div className="section-head">
            <h2>Latest Vacancies</h2>
            <Link to="/jobs" className="view-all">See all jobs →</Link>
          </div>
          {loading ? (
            <div className="loader">Searching for jobs...</div>
          ) : (
            <div className="jobs-grid">
              {latestJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </section>
      </div>

      {/* CTA */}
      {!user && (
        <section className="home-cta">
          <h2>Ready to get hired?</h2>
          <p>Join 50,000+ job seekers finding their dream roles on JobSathi.</p>
          <div className="cta-btns">
            <Link to="/register" className="btn-fill">Create Account</Link>
            <Link to="/login" className="btn-outline">Log In</Link>
          </div>
        </section>
      )}
    </div>
  )
}