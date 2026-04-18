import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import api from "../services/api";
import "../styles/Jobs.css";

export default function Jobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    jobType: searchParams.get("jobType") || "",
    sort: searchParams.get("sort") || "createdAt",
    page: 1
  });

  const [hasMore, setHasMore] = useState(true);

  const loadJobs = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 10 });
      const res = await api.get(`/jobs?${params}`);
      setJobs(append ? [...jobs, ...res.data.jobs] : res.data.jobs);
      setHasMore(res.data.page < res.data.totalPages);
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
    setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    loadJobs(true);
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
      <div className="search-section">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Job title, company, skills..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
          />
          <div className="location-wrapper">
            <MapPin size={18} className="search-icon" />
            <input
              className="location-input"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          <button className="search-btn">
            <Search size={20} />
          </button>
        </div>
      </div>

      <div className="jobs-container">
        <div className="filter-area">
          <div className="type-filters">
            {jobTypes.map(type => (
              <button
                key={type.value}
                className={`type-btn ${filters.jobType === type.value ? "active" : ""}`}
                onClick={() => handleChange("jobType", type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={filters.sort}
            onChange={(e) => handleChange("sort", e.target.value)}
          >
            <option value="createdAt">Latest First</option>
            <option value="salary_max">Highest Salary</option>
          </select>
        </div>

        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
              {/* Single Header Section */}
              <div className="job-banner">
                <div className="banner-overlay">
                  <h3>{job.title}</h3>
{job.employer?.name || job.company_name || job.employer_id || "Hiring Company"}
                </div>
              </div>
              
              <div className="job-content">
                <div className="card-meta">
                  <span className="meta-item"><MapPin size={14} /> {job.location}</span>
                  <span className="card-tag">{job.job_type}</span>
                </div>
                <button className="card-view-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Show More Jobs"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}