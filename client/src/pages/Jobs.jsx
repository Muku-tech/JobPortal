import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Search, MapPin, Briefcase, Filter } from "lucide-react";
import api from "../services/api";
import "../styles/Jobs.css";

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    category: searchParams.get("category") || "",
    jobType: searchParams.get("jobType") || ""
  });

  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      location: searchParams.get("location") || "",
      category: searchParams.get("category") || "",
      jobType: searchParams.get("jobType") || ""
    });
  }, [searchParams]);

  useEffect(() => {
    const loadSavedJobs = async () => {
      if (user) {
        try {
          const res = await api.get('/jobs/saved');
          setSavedJobIds(res.data.jobs.map(j => j.id));
        } catch (err) {
          console.error('Load saved error:', err);
        }
      }
    };
    loadSavedJobs();
  }, [user]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        Object.keys(filters).forEach(key => {
          if (filters[key]) query.append(key, filters[key]);
        });

        const res = await api.get(`/jobs?${query.toString()}`);
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    setSearchParams(newFilters);
  };

  return (
    <div className="jobs-view-root">
      <div className="container jobs-flex-layout">
        {/* SIDEBAR FILTERS */}
        <aside className="filters-sidebar">
          <div className="sidebar-header">
            <Filter size={20} />
            <h3>Filter Results</h3>
          </div>

          <div className="f-item">
            <label><Search size={14} /> Keywords</label>
            <input 
              name="search" 
              placeholder="Job title, skills..." 
              value={filters.search} 
              onChange={handleFilterChange} 
            />
          </div>

          <div className="f-item">
            <label><MapPin size={14} /> Location</label>
            <input 
              name="location" 
              placeholder="City (e.g. Kathmandu)" 
              value={filters.location} 
              onChange={handleFilterChange} 
            />
          </div>

          <div className="f-item">
            <label><Briefcase size={14} /> Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              <option value="IT & Software">IT & Software</option>
              <option value="Banking">Banking</option>
              <option value="Marketing">Marketing</option>
              <option value="Health Care">Health Care</option>
            </select>
          </div>

          <div className="f-item">
            <label>Job Type</label>
            <select name="jobType" value={filters.jobType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={() => navigate('/jobs')}>
            Reset All Filters
          </button>
        </aside>

        {/* MAIN JOB LISTINGS */}
        <main className="jobs-main-content">
          <div className="jobs-header-info">
            <h2>{filters.category ? `${filters.category} Roles` : "All Opportunities"}</h2>
            <p><strong>{jobs.length}</strong> positions available in Nepal</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding the best roles for you...</p>
            </div>
          ) : (
            <div className="jobs-vertical-list">
              {jobs.length > 0 ? jobs.map(job => (
                <div key={job.id} className="job-entry-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="job-entry-main">
                    <div className="job-entry-details">
                      <h4>{job.title}</h4>
                      <p className="company-tag">{job.company_name}</p>
                      <div className="job-meta-row">
                        <span><MapPin size={14} /> {job.location}</span>
                        <span className="type-pill">{job.job_type}</span>
                      </div>
                    </div>
                    <button 
                      className="save-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const toggleSave = async () => {
                          try {
                            await api.post('/jobs/save', { jobId: job.id });
                            setSavedJobIds(prev => 
                              prev.includes(job.id) 
                                ? prev.filter(id => id !== job.id)
                                : [...prev, job.id]
                            );
                          } catch (err) {
                            console.error('Save toggle error:', err);
                          }
                        };
                        toggleSave();
                      }}
                      title="Save job"
                    >
                      <Heart size={20} fill={savedJobIds.includes(job.id) ? 'var(--orange)' : 'none'} strokeWidth={savedJobIds.includes(job.id) ? 0 : 2} />
                    </button>
                    <button className="apply-btn-outline">View Details</button>
                  </div>
                </div>
              )) : (
                <div className="no-results">
                  <h3>No jobs found matching your criteria.</h3>
                  <p>Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}