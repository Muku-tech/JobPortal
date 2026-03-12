import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

  const [showFilters, setShowFilters] = useState(false);

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
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      if (filters.jobType) params.append('jobType', filters.jobType)
      if (filters.category) params.append('category', filters.category)
      if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel)
      if (filters.educationLevel) params.append('educationLevel', filters.educationLevel)

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

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <h1>Find Your Dream Job in Nepal</h1>
        <p>Browse thousands of job openings from top Nepalese companies</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>

        {/* Sidebar Filters */}
        <aside className="filters-sidebar" style={{ width: '280px', flexShrink: 0, padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', color: '#1f2937' }}>Filters</h3>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Job Title or Keyword</label>
            <input
              type="text"
              name="search"
              placeholder="Search..."
              value={filters.search}
              onChange={handleFilterChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Location</label>
            <select name="location" value={filters.location} onChange={handleFilterChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Job Type</label>
            <select name="jobType" value={filters.jobType} onChange={handleFilterChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">All Job Types</option>
              {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Experience Level</label>
            <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">Any Experience</option>
              {experienceLevels.map(lvl => <option key={lvl} value={lvl} style={{ textTransform: 'capitalize' }}>{lvl}</option>)}
            </select>
          </div>

          <div className="filter-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#4b5563', fontWeight: 'bold' }}>Education Level</label>
            <select name="educationLevel" value={filters.educationLevel} onChange={handleFilterChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
              <option value="">Any Education</option>
              {educationLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
          </div>

        </aside>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>

          {loading ? (
            <div className="loading">Loading jobs...</div>
          ) : (
            <div className="jobs-list">
              {jobs.length === 0 ? (
                <div className="no-jobs">No jobs found matching your criteria</div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <h3>{job.title}</h3>
                      <span className="company-name">{job.company_name}</span>
                    </div>
                    <div className="job-card-details">
                      <span className="job-location"> {job.location}</span>
                      <span className="job-type"> {job.job_type}</span>
                      <span className="job-category"> {job.category}</span>
                    </div>
                    {job.salary_min && job.salary_max && (
                      <div className="job-salary">
                        NPR {parseInt(job.salary_min).toLocaleString()} - {parseInt(job.salary_max).toLocaleString()}
                      </div>
                    )}
                    <div className="job-skills">
                      {job.required_skills?.slice(0, 5).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                    <Link to={`/jobs/${job.id}`} className="btn btn-primary">View Details</Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Jobs

