import React, { useState, useEffect } from "react";
import api from "../services/api";
import "../styles/Jobs.css";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    jobType: "",
    category: "",
    experienceLevel: "",
    salaryMin: "",
    page: 1,
    limit: 10
  });

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) queryParams.append(key, filters[key]);
        });

        const res = await api.get(`/jobs?${queryParams.toString()}`);
        setJobs(res.data.jobs);
        setTotalJobs(res.data.total);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
      setLoading(false);
    };
    fetchJobs();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      location: "",
      jobType: "",
      category: "",
      experienceLevel: "",
      salaryMin: "",
      page: 1,
      limit: 10
    });
  };

  return (
    <div className="jobs-browse-container">
      <div className="search-header-bg">
        <div className="content-limit">
          <div className="search-bar-white">
            <div className="search-input-wrapper">
              <input 
                type="text" 
                name="search"
                placeholder="Job title or company..." 
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="search-input-wrapper">
              <input 
                type="text" 
                name="location"
                placeholder="Location (e.g. Kathmandu)" 
                value={filters.location}
                onChange={handleFilterChange}
              />
            </div>
            <button className="find-jobs-btn">Find Jobs</button>
          </div>
        </div>
      </div>

      <div className="content-limit main-grid">
        <aside className="jobs-sidebar">
          <div className="filter-box">
            <h3>Filter Results</h3>
            
            <div className="filter-unit">
              <label>Job Type</label>
              <select name="jobType" value={filters.jobType} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <div className="filter-unit">
              <label>Industry</label>
              <select name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All Industries</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Banking">Banking</option>
                <option value="Education">Education</option>
                <option value="Marketing">Marketing</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>

            <div className="filter-unit">
              <label>Experience</label>
              <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange}>
                <option value="">Any Level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            <div className="filter-unit">
              <label>Min Salary (NPR)</label>
              <select name="salaryMin" value={filters.salaryMin} onChange={handleFilterChange}>
                <option value="">Any Salary</option>
                <option value="20000">20,000+</option>
                <option value="50000">50,000+</option>
                <option value="80000">80,000+</option>
                <option value="100000">100,000+</option>
              </select>
            </div>

            <button className="reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </aside>

        <main className="jobs-list-section">
          <p className="results-text">Found <strong>{totalJobs}</strong> opportunities</p>
          
          {loading ? (
            <div className="jobs-loader">Updating job list...</div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="job-entry-card">
                <div className="job-card-content">
                  <div className="job-logo-area">
                    {job.company_logo ? (
                      <img src={job.company_logo} alt="Company" />
                    ) : (
                      <div className="placeholder-logo">Job</div>
                    )}
                  </div>
                  <div className="job-text-area">
                    <h4>{job.title}</h4>
                    <p className="job-company-name">{job.company_name}</p>
                    <div className="job-tags">
                      <span className="location-tag">{job.location || "Nepal"}</span>
                      <span className={`type-badge-style ${job.job_type}`}>{job.job_type}</span>
                    </div>
                  </div>
                </div>
                <div className="job-card-right">
                  <button 
                    className="view-details-btn"
                    onClick={() => window.location.href=`/jobs/${job.id}`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-jobs-found">
              <h4>No jobs found</h4>
              <p>Try changing your search terms or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}