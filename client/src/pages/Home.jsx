import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState(""); 
  const [location, setLocation] = useState("");
  
  const [stats, setStats] = useState({ jobs: 0, companies: 0, seekers: 0, hires: 0 });
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'employer') {
      navigate('/employer', { replace: true });
      return;
    }
    startStatsCounter();
    fetchFeaturedJobs();
  }, [user, navigate]); 

  const fetchFeaturedJobs = async () => {
    setFeaturedLoading(true);
    try {
      const res = await api.get('/jobs?limit=8');
      setFeaturedJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Featured jobs error:", err);
      setFeaturedJobs([]);
    }
    setFeaturedLoading(false);
  };

  const startStatsCounter = () => {
    const targets = { jobs: 10000, companies: 5000, seekers: 50000, hires: 1000 };
    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;
    let current = { jobs: 0, companies: 0, seekers: 0, hires: 0 };

    const counter = setInterval(() => {
      current.jobs += targets.jobs / steps;
      current.companies += targets.companies / steps;
      current.seekers += targets.seekers / steps;
      current.hires += targets.hires / steps;

      setStats({
        jobs: Math.min(Math.floor(current.jobs), targets.jobs),
        companies: Math.floor(current.companies),
        seekers: Math.floor(current.seekers),
        hires: Math.floor(current.hires)
      });
    }, interval);
    setTimeout(() => clearInterval(counter), duration);
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
        <div className="content-container">
          <h1>Find Your Dream Job in <span>Nepal</span></h1>
          <p className="hero-subtitle">The most trusted job portal for career growth in Nepal</p>

          <form className="search-box-container" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Job title or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">Find Jobs</button>
          </form>
        </div>
      </section>

      {/* STATS SECTION - MOVED UP */}
      <section className="stats-section">
        <div className="content-container stats-grid">
          <div className="stat-item">
            <h2>{stats.jobs.toLocaleString()}+</h2>
            <p>ACTIVE JOBS</p>
          </div>
          <div className="stat-item">
            <h2>{stats.companies.toLocaleString()}+</h2>
            <p>VERIFIED COMPANIES</p>
          </div>
          <div className="stat-item">
            <h2>{stats.seekers.toLocaleString()}+</h2>
            <p>HAPPY SEEKERS</p>
          </div>
          <div className="stat-item">
            <h2>{stats.hires.toLocaleString()}+</h2>
            <p>MONTHLY HIRES</p>
          </div>
        </div>
      </section>

      {/* FEATURED JOBS SECTION */}
      <section className="featured-section">
        <div className="content-container">
          <h2 className="section-title">Featured Jobs</h2>
          {featuredLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="featured-grid">
              {featuredJobs.map((job) => (
                <Link to={`/jobs/${job.id}`} className="job-card featured-badge">
                  <span className="featured-label">Featured</span>
                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company_name}</p>
                  <p className="job-location">{job.location}</p>
                  <p className="job-type">{job.job_type}</p>
                </Link>
              ))}
            </div>
          )}
          <div className="section-cta">
            <button className="view-all-btn" onClick={() => navigate('/jobs')}>
              View All Jobs
            </button>
          </div>
        </div>
      </section>



      {/* HOW IT WORKS */}
      <section className="howitworks-section">
        <div className="content-container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-icon">🔍</div>
              <h3>Search Jobs</h3>
              <p>Find jobs that match your skills and experience.</p>
            </div>
            <div className="step-item">
              <div className="step-icon">📄</div>
              <h3>Build Resume</h3>
              <p>Create professional resumes with our builder tool.</p>
            </div>
            <div className="step-item">
              <div className="step-icon">✅</div>
              <h3>Apply & Get Hired</h3>
              <p>Apply easily and get hired by top companies.</p>
            </div>
          </div>
        </div>
      </section>



      <footer className="footer">
        <p>© 2024 <strong>JobSathi Nepal</strong>. Your career partner</p>
      </footer>
    </div>
  );
}

