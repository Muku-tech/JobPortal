import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart, MapPin, Search, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/Jobs.css";
import { useToast } from "../context/ToastContext";

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    jobType: searchParams.get("jobType") || "",
    sort: searchParams.get("sort") || "createdAt",
    page: 1
  });

  const [hasMore, setHasMore] = useState(true);

  // Load saved jobs
  useEffect(() => {
    if (user) {
      api.get('/jobs/saved').then(res => {
        setSavedJobIds(res.data.jobs.map(j => j.id));
      }).catch(() => {}); // Silent fail
    }
  }, [user]);

  const loadJobs = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 10 });
      const res = await api.get(`/jobs?${params}`);
      setJobs(append ? [...jobs, ...res.data.jobs] : res.data.jobs);
      setHasMore(res.data.page < res.data.totalPages);
      setFilters(prev => ({ ...prev, page: res.data.page }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(false);
  }, [filters.search, filters.location, filters.jobType, filters.sort]);

  const handleChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
    setSearchParams({ [key]: value, page: 1 });
  };

  const loadMore = () => {
    const newFilters = { ...filters, page: filters.page + 1 };
    loadJobs(true);
  };

const { toast } = useToast();

const fetchSavedJobIds = async () => {
    if (!user) return;
    try {
      const res = await api.get('/jobs/saved');
      setSavedJobIds(res.data.jobs.map(j => j.id));
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    }
  };

const toggleSave = async (jobId) => {
    try {
      await api.post('/jobs/save', { jobId });
      await fetchSavedJobIds(); // Refetch real state
      toast(!savedJobIds.includes(jobId) ? 'Job saved ✅' : 'Job unsaved');
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const jobTypes = [
    { value: "", label: "All Types" },
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" }
  ];

  return (
    <div className="jobs-page">
      {/* Compact Search */}
      <div className="search-section">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Job title, company, skills..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
          />
          <input
            className="location-input"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleChange("location", e.target.value)}
          />
          <button className="search-btn">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* Filter + Sort Row */}
      <div className="filter-row">
        <div className="type-filters">
          {jobTypes.map(type => (
            <button
              key={type.value}
              className={`type-btn ${filters.jobType === type.value ? 'active' : ''}`}
              onClick={() => handleChange("jobType", type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="sort-container">
          <select 
            className="sort-select"
            value={filters.sort}
            onChange={(e) => handleChange("sort", e.target.value)}
          >
            <option value="createdAt">Latest</option>
            <option value="salary_max">Salary High-Low</option>
          </select>
        </div>
      </div>

      {/* Jobs */}
      <div className="jobs-container">
        {loading && jobs.length === 0 ? (
          <div className="loading">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No jobs found</h3>
            <p>Try different search or filters</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(job => (
              <div 
                key={job.id}
                className="job-card"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="job-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company">{job.company_name}</p>
                  </div>
                  <button 
                    className="save-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(job.id);
                    }}
                  >
                    <Heart 
                      size={20}
                      fill={savedJobIds.includes(job.id) ? '#ff6b35' : 'none'}
                      strokeWidth={2}
                    />
                  </button>
                </div>
                <div className="job-meta">
                  <span><MapPin size={16} /> {job.location}</span>
                  <span className="job-type">{job.job_type}</span>
                </div>
                <div className="job-footer">
                  <button className="view-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMore && (
          <button className="load-more-btn" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More Jobs'}
          </button>
        )}
      </div>
    </div>
  );
}

