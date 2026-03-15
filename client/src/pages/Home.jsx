import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Home.css";

const sampleJobs = [
  { id: 1, title: "Software Engineer", company_name: "Nabil Bank", location: "Kathmandu", job_type: "Full Time" },
  { id: 2, title: "Marketing Manager", company_name: "Nepal Telecom", location: "Kathmandu", job_type: "Full Time" },
  { id: 3, title: "English Teacher", company_name: "British School", location: "Lalitpur", job_type: "Full Time" },
  { id: 4, title: "Accountant", company_name: "NIC Asia Bank", location: "Kathmandu", job_type: "Full Time" },
  { id: 5, title: "Customer Support", company_name: "CG Corp", location: "Birgunj", job_type: "Full Time" },
  { id: 6, title: "Civil Engineer", company_name: "BPC Limited", location: "Pokhara", job_type: "Full Time" },
];

export default function Home() {

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState(sampleJobs);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    jobs: 0,
    companies: 0,
    seekers: 0,
    hires: 0
  });

  useEffect(() => {
    fetchRecentJobs();
    startStatsCounter();
  }, []);

  const fetchRecentJobs = async () => {

    setLoading(true);

    try {
      const res = await api.get("/jobs?limit=6");

      if (res.data.jobs?.length > 0) {
        setJobs(res.data.jobs);
      }

    } catch {
      console.log("Using sample jobs");
    }

    setLoading(false);
  };

  const startStatsCounter = () => {

    const targets = {
      jobs: 10000,
      companies: 5000,
      seekers: 50000,
      hires: 1000
    };

    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;

    let current = { jobs: 0, companies: 0, seekers: 0, hires: 0 };

    const counter = setInterval(() => {

      current.jobs += targets.jobs / steps;
      current.companies += targets.companies / steps;
      current.seekers += targets.seekers / steps;
      current.hires += targets.hires / steps;

      setStats({
        jobs: Math.min(Math.floor(current.jobs), targets.jobs),
        companies: Math.min(Math.floor(current.companies), targets.companies),
        seekers: Math.min(Math.floor(current.seekers), targets.seekers),
        hires: Math.min(Math.floor(current.hires), targets.hires)
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

      {/* HERO */}

      <section className="hero">

        <div className="hero-content">

          <h1>Find Your Dream Job in <span>Nepal</span></h1>

          <p className="hero-subtitle">
            The most trusted job portal for career growth in Nepal
          </p>

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

            <button type="submit" className="hero-search-btn">
              Find Jobs
            </button>

          </form>

        </div>

      </section>


      {/* RECENT JOBS */}

      <section className="jobs-section">

        <div className="content-container">

          <div className="section-header">

            <h2>Recent Opportunities</h2>

            <Link to="/jobs" className="text-link">
              Browse all jobs →
            </Link>

          </div>

          {loading ? (

            <div className="loading-container">
              <div className="spinner"></div>
            </div>

          ) : (

            <div className="jobs-grid">

              {jobs.map((job) => (

                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >

                  <div className="job-card-header">

                    <div className="company-logo">
                      {job.company_name?.charAt(0)}
                    </div>

                    <div className="job-info">
                      <h3>{job.title}</h3>
                      <p className="company-name">{job.company_name}</p>
                    </div>

                  </div>

                  <span className="job-badge">{job.job_type}</span>

                  <div className="job-card-footer">

                    <span className="location">
                      📍 {job.location}
                    </span>

                    <button
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job.id}`);
                      }}
                    >
                      View Details
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>


      {/* STATS */}

      <section className="stats-section">

        <div className="content-container stats-grid">

          <div className="stat-item">
            <h2>{stats.jobs.toLocaleString()}+</h2>
            <p>Active Jobs</p>
          </div>

          <div className="stat-item">
            <h2>{stats.companies.toLocaleString()}+</h2>
            <p>Verified Companies</p>
          </div>

          <div className="stat-item">
            <h2>{stats.seekers.toLocaleString()}+</h2>
            <p>Happy Seekers</p>
          </div>

          <div className="stat-item">
            <h2>{stats.hires.toLocaleString()}+</h2>
            <p>Monthly Hires</p>
          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="footer">

        <p>
          © 2026 <strong>JobSathi Nepal</strong>. Your career partner
        </p>

      </footer>

    </div>
  );
}