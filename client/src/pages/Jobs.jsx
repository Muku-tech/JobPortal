import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import '../styles/Jobs.css'

function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    category: '',
    experienceLevel: '',
    educationLevel: ''
  })

  const locations = ['Kathmandu', 'Pokhara', 'Birgunj', 'Biratnagar', 'Lalitpur', 'Bhaktapur', 'Butwal', 'Dharan', 'Janakpur', 'Narayangadh']
  const jobTypes = ['full-time', 'part-time', 'contract', 'internship']
  const categories = ['Information Technology', 'Banking & Finance', 'Teaching & Education', 'Tourism & Hospitality', 'Healthcare & Medical', 'Engineering', 'Marketing & Sales', 'Administration & HR', 'Construction', 'Agriculture & Forestry']
  const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  const educationLevels = ['High School', 'Bachelors', 'Masters', 'PhD', 'Diploma', 'Certification']

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key])
      })

      const response = await api.get(`/jobs?${params}`)
      setJobs(response.data.jobs || response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const parseSkills = (skills) => {
    if (!skills) return []
    if (Array.isArray(skills)) return skills
    try {
      return JSON.parse(skills)
    } catch (e) {
      return skills.split(',').map(s => s.trim())
    }
  }

  return (
    <div className="jobs-page-container">
      <header className="jobs-page-header">
        <div className="header-content">
          <h1>Find Your Dream Job in <span>Nepal</span></h1>
          <p>Browse thousands of job openings from top Nepalese companies</p>
        </div>
      </header>

      <div className="jobs-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="sidebar-header">
            <h3>Filters</h3>
            <button className="reset-btn" onClick={() => setFilters({
              search: '', location: '', jobType: '', category: '', experienceLevel: '', educationLevel: ''
            })}>Reset</button>
          </div>

          <div className="filter-group">
            <label>Search Keyword</label>
            <input
              type="text"
              name="search"
              placeholder="e.g. Developer, Admin..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <select name="location" value={filters.location} onChange={handleFilterChange}>
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Job Type</label>
            <select name="jobType" value={filters.jobType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              {jobTypes.map(type => <option key={type} value={type} className="capitalize">{type}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience</label>
            <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange}>
              <option value="">Any Experience</option>
              {experienceLevels.map(lvl => <option key={lvl} value={lvl} className="capitalize">{lvl}</option>)}
            </select>
          </div>
        </aside>

        {/* Main Job List */}
        <main className="jobs-main-content">
          {loading ? (
            <div className="jobs-status-msg">
               <div className="spinner"></div>
               <p>Searching for best opportunities...</p>
            </div>
          ) : (
            <div className="jobs-list">
              <div className="results-count">
                Showing <strong>{jobs.length}</strong> jobs found
              </div>
              
              {jobs.length === 0 ? (
                <div className="no-results-card">
                  <h3>No matches found</h3>
                  <p>Try adjusting your filters or search keywords.</p>
                </div>
              ) : (

                jobs.map((job, index) => (
                  <motion.div 
                    key={job.id} 
                    className="job-listing-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                  >
                    <div className="job-card-top">
                      <div className="company-logo-sm">{job.company_name?.charAt(0)}</div>
                      <div className="job-title-info">
                        <motion.h3 
                          whileHover={{ scale: 1.02 }}
                        >
                          {job.title}
                        </motion.h3>
                        <span className="listing-company">{job.company_name}</span>
                      </div>
                      <motion.span 
                        className={`type-badge ${job.job_type?.toLowerCase()}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {job.job_type}
                      </motion.span>
                    </div>

                    <div className="job-card-mid">
                      <div className="meta-info">
                        <span>Location: {job.location}</span>
                        <span>Category: {job.category}</span>
                        {job.salary_min && (
                          <span className="salary-highlight">Salary: NPR {parseInt(job.salary_min).toLocaleString()} - {parseInt(job.salary_max).toLocaleString()}</span>
                        )}
                      </div>
                      <div className="job-skills-preview">
                        {parseSkills(job.required_skills).slice(0, 3).map((skill, sIndex) => (
                          <motion.span 
                            key={sIndex} 
                            className="skill-pill"
                            whileHover={{ scale: 1.1, backgroundColor: "#e0f2fe" }}
                          >
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    <motion.div 
                      className="job-card-bottom"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Link to={`/jobs/${job.id}`} className="view-job-btn">
                        <motion.span whileHover={{ scale: 1.05 }}>View Details →</motion.span>
                      </Link>
                    </motion.div>
                  </motion.div>
                ))

              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Jobs