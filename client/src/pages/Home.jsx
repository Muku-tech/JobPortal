import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  
  const [stats, setStats] = useState({ jobs: 0, companies: 0, seekers: 0, hires: 0 });
  const [groupedJobs, setGroupedJobs] = useState({ groups: [] });
  const [groupType, setGroupType] = useState('company'); // 'company', 'industry', 'location'
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    startStatsCounter();
    fetchGroupedJobs();
  }, [groupType]);

  const fetchGroupedJobs = async () => {
    setGroupLoading(true);
    try {
      const res = await api.get(`/jobs/grouped?type=${groupType}`);
      setGroupedJobs(res.data);
    } catch (err) {
      console.error("API Error: Falling back to empty state");
      setGroupedJobs({ groups: [] });
    }
    setGroupLoading(false);
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

      {/* TABBED CATEGORY SECTION */}
      <section className="category-section">
        <div className="content-container">
          <div className="tab-navigation">
            <button 
              className={groupType === 'company' ? 'active' : ''} 
              onClick={() => setGroupType('company')}
            >
              Jobs By Company
            </button>
            <button 
              className={groupType === 'industry' ? 'active' : ''} 
              onClick={() => setGroupType('industry')}
            >
              Jobs By Industry
            </button>
            <button 
              className={groupType === 'location' ? 'active' : ''} 
              onClick={() => setGroupType('location')}
            >
              Jobs By Location
            </button>
          </div>

          {groupLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : (
            <div className="category-grid">
              {groupedJobs.groups?.map((group) => (
                <div 
                  key={group.name} 
                  className="category-card" 
                  onClick={() => navigate(`/jobs?${groupType}=${encodeURIComponent(group.name)}`)}
                >
                  <div className="category-logo">
                    {group.logo ? (
                      <img src={group.logo} alt={group.name} />
                    ) : (
                      <div className="building-icon">🏢</div>
                    )}
                  </div>
                  <div className="category-info">
                    <h3>{group.name}</h3>
                    <ul className="mini-job-list">
                      {group.jobs?.slice(0, 2).map((job) => (
                        <li key={job.id}>• {job.title}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* STATS SECTION (Placed Below Categories) */}
      <section className="stats-footer-section">
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

      <footer className="footer">
        <p>© 2026 <strong>JobSathi Nepal</strong>. Your career partner</p>
      </footer>
    </div>
  );
}