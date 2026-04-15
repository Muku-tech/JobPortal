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
      {/* Search Section: Uses Navy background with overlapping search row */}
      <div className="search-section">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Job title, company, skills..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
          />
          <div className="location-wrapper">
            <input
              className="location-input"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
          <button className="search-btn">
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className="jobs-container">
        {/* Filter Bar: Positioned just below the search overlap */}
        <div className="filter-row">
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
            <option value="createdAt">Latest</option>
            <option value="salary_max">Salary High-Low</option>
          </select>
        </div>

        {/* Loading & Empty States */}
        {loading && jobs.length === 0 ? (
          <div className="loading">Gathering positions...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <h3>No positions found</h3>
            <p>Try adjusting your filters or location.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map(job => (
              <div
                key={job.id}
                className="job-card highlight-bar" 
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="job-header">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company_name}</p>
                </div>

                <div className="job-meta">
                  <span><MapPin size={14} /> {job.location}</span>
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
            {loading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}