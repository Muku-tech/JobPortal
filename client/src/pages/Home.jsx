import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Home.css";

const sampleJobs = [
  { id: 1, title: "Software Engineer", company_name: "Nabil Bank", location: "Kathmandu", job_type: "Full-time" },
  { id: 2, title: "Marketing Manager", company_name: "Nepal Telecom", location: "Kathmandu", job_type: "Full-time" },
  { id: 3, title: "English Teacher", company_name: "British School", location: "Lalitpur", job_type: "Full-time" },
  { id: 4, title: "Accountant", company_name: "NIC Asia Bank", location: "Kathmandu", job_type: "Full-time" },
  { id: 5, title: "Customer Support", company_name: "CG Corp", location: "Birgunj", job_type: "Full-time" },
  { id: 6, title: "Civil Engineer", company_name: "BPC Limited", location: "Pokhara", job_type: "Full-time" },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobs, setJobs] = useState(sampleJobs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    setLoading(true);
    try {
      const response = await api.get("/jobs?limit=6");
      if (response.data.jobs?.length > 0) {
        setJobs(response.data.jobs);
      }
    } catch (err) {
      console.log("Using sample jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (location) params.append("location", location);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="homepage">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Your Dream Job in <span>Nepal</span></h1>
          <p className="hero-subtitle">The most trusted job portal for career growth in Nepal.</p>
          
          <form className="search-box-container" onSubmit={handleSearch}>
            <div className="input-group">
              <span className="icon">🔍</span>
              <input
                type="text"
                placeholder="Job title or company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="input-group">
              <span className="icon">📍</span>
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="hero-search-btn">Find Jobs</button>
          </form>
        </div>
      </section>

      {/* RECENT JOBS SECTION */}
      <section className="jobs-section">
        <div className="container">
          <div className="section-header">
            <h2>Recent Opportunities</h2>
            <Link to="/jobs" className="text-link">Browse all jobs →</Link>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="job-card-header">
                    <div className="company-logo-placeholder">{job.company_name?.charAt(0)}</div>
                    <span className="job-badge">{job.job_type}</span>
                  </div>
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name}</p>
                  <div className="job-card-footer">
                    <span className="location-tag">📍 {job.location}</span>
                    <button className="apply-btn-sm">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STATS SECTION (FIXED) */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <h3 className="stat-number">10k+</h3>
            <p className="stat-label">Active Jobs</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">5k+</h3>
            <p className="stat-label">Verified Companies</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">50k+</h3>
            <p className="stat-label">Happy Seekers</p>
          </div>
          <div className="stat-item">
            <h3 className="stat-number">1k+</h3>
            <p className="stat-label">Monthly Hires</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2026 <strong>JobSathi Nepal</strong>. Your career partner.</p>
        </div>
      </footer>
    </div>
  );
}