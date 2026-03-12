import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import '../styles/JobSeekerHome.css'

const CATEGORIES = [
  { name: 'Information Technology', icon: '💻', jobs: 120 },
  { name: 'Banking & Finance', icon: '🏦', jobs: 85 },
  { name: 'Teaching & Education', icon: '📚', jobs: 45 },
  { name: 'Healthcare & Medical', icon: '🏥', jobs: 60 },
  { name: 'Engineering', icon: '⚙️', jobs: 90 },
  { name: 'Marketing & Sales', icon: '📈', jobs: 110 },
  { name: 'Construction', icon: '🏗️', jobs: 35 },
  { name: 'Tourism & Hospitality', icon: '🏨', jobs: 75 }
]

const TOP_COMPANIES = [
  'F1Soft International',
  'Esewa',
  'Ncell',
  'Khalti',
  'Leapfrog Technology',
  'Nabil Bank'
]

export default function JobSeekerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [latestJobs, setLatestJobs] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchParams, setSearchParams] = useState({
    search: '',
    category: '',
    location: ''
  })

  useEffect(() => {
    fetchHomepageData()
  }, [user])

  const fetchHomepageData = async () => {
    try {
      setLoading(true)
      // Fetch latest jobs
      const jobsRes = await api.get('/jobs?limit=6')
      setLatestJobs(jobsRes.data.slice(0, 6) || [])

      // Fetch recommended jobs if logged in as jobseeker
      if (user && user.role === 'jobseeker') {
        try {
          const recRes = await api.get('/recommendations/smart')
          setRecommendedJobs(recRes.data.jobs?.slice(0, 3) || [])
        } catch (e) {
          console.error("Recommendations not available yet", e)
        }
      }
    } catch (err) {
      console.error('Error fetching homepage data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const query = new URLSearchParams()
    if (searchParams.search) query.append('search', searchParams.search)
    if (searchParams.category) query.append('category', searchParams.category)
    if (searchParams.location) query.append('location', searchParams.location)
    navigate(`/jobs?${query.toString()}`)
  }

  const JobCard = ({ job }) => (
    <div key={job.id} className="modern-job-card">
      <div className="card-top">
        <div className="company-logo-placeholder">
          {job.company_name.charAt(0)}
        </div>
        <div className="job-basic-info">
          <h3>{job.title}</h3>
          <span className="company-name">{job.company_name}</span>
        </div>
      </div>
      <div className="job-meta-tags">
        <span className="meta-tag"><i className="icon-loc">📍</i> {job.location}</span>
        <span className="meta-tag"><i className="icon-type">💼</i> {job.job_type}</span>
      </div>
      <div className="job-skills">
        {job.required_skills?.slice(0, 3).map((skill, idx) => (
          <span key={idx} className="skill-chip">{skill}</span>
        ))}
      </div>
      <div className="card-bottom">
        {job.salary_min ? (
          <span className="salary-range">NPR {job.salary_min} - {job.salary_max}</span>
        ) : (
          <span className="salary-range">Negotiable</span>
        )}
        <Link to={`/jobs/${job.id}`} className="btn btn-outline-primary btn-sm">View Details</Link>
      </div>
    </div>
  )

  return (
    <div className="portal-homepage">

      {/* Hero Section */}
      <section className="portal-hero">
        <div className="hero-content">
          <span className="hero-badge">Over 10,000+ Active Jobs in Nepal</span>
          <h1 className="hero-title">Find Your Next <span className="highlight">Dream Job</span> Today</h1>
          <p className="hero-subtitle">Connect with top employers and discover opportunities that match your skills.</p>

          <form className="hero-search-bar" onSubmit={handleSearch}>
            <div className="search-input-group">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchParams.search}
                onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
              />
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <span className="search-icon">📍</span>
              <input
                type="text"
                placeholder="City or location"
                value={searchParams.location}
                onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary search-btn">Find Jobs</button>
          </form>

          <div className="popular-searches">
            <span>Popular:</span>
            <Link to="/jobs?category=Information Technology">IT</Link>
            <Link to="/jobs?category=Banking & Finance">Banking</Link>
            <Link to="/jobs?category=Healthcare & Medical">Healthcare</Link>
            <Link to="/jobs?location=Kathmandu">Kathmandu</Link>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="portal-section bg-light">
        <div className="section-container">
          <div className="section-header">
            <h2>Explore by Category</h2>
            <Link to="/jobs" className="view-all-link">All Categories &rarr;</Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className="category-card" onClick={() => navigate(`/jobs?category=${cat.name}`)}>
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-info">
                  <h3>{cat.name}</h3>
                  <span>{cat.jobs}+ Jobs Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Jobs (If logged in) */}
      {user && user.role === 'jobseeker' && recommendedJobs.length > 0 && (
        <section className="portal-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Recommended For You</h2>
              <p>Based on your profile skills and experience</p>
            </div>
            <div className="jobs-list-grid">
              {recommendedJobs.map(job => <JobCard key={`rec-${job.id}`} job={job} />)}
            </div>
          </div>
        </section>
      )}

      {/* Latest Jobs */}
      <section className="portal-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Latest Job Openings</h2>
            <Link to="/jobs" className="view-all-link">View All Jobs &rarr;</Link>
          </div>
          {loading ? (
            <div className="loading-spinner">Loading latest jobs...</div>
          ) : (
            <div className="jobs-list-grid">
              {latestJobs.map(job => <JobCard key={`latest-${job.id}`} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies */}
      <section className="portal-section bg-light">
        <div className="section-container text-center">
          <h2>Top Hiring Companies</h2>
          <p className="section-desc">Join the fast-growing companies in the country</p>
          <div className="companies-marquee">
            {TOP_COMPANIES.map((company, i) => (
              <div key={i} className="company-logo-box">
                <div className="logo-placeholder">{company.charAt(0)}</div>
                <span>{company}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="portal-cta">
          <div className="cta-content">
            <h2>Ready to level up your career?</h2>
            <p>Create a free account, build your rich profile, and get headhunted by top employers.</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">Log In</Link>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}