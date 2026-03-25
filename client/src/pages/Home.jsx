import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Code2, 
  Building2, 
  BarChart3, 
  Stethoscope 
} from "lucide-react";
import api from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState([]);
  
  // High-impact stats for JobSathi
  const [stats] = useState({ 
    jobs: "1,200", 
    companies: "450", 
    users: "8,000", 
    hires: "250" 
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/jobs?limit=4&featured=true');
        setFeaturedJobs(res.data.jobs || []);
      } catch (err) {
        console.error("Home data error:", err);
      }
    };
    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.append("search", search.trim());
    if (location.trim()) query.append("location", location.trim());
    navigate(`/jobs?${query.toString()}`);
  };

  const categories = [
    { name: 'IT & Software', icon: <Code2 size={28} />, bg: '#ebf5ff', color: '#3b82f6' },
    { name: 'Banking', icon: <Building2 size={28} />, bg: '#fef3f2', color: '#f43f5e' },
    { name: 'Marketing', icon: <BarChart3 size={28} />, bg: '#f0fdf4', color: '#22c55e' },
    { name: 'Health Care', icon: <Stethoscope size={28} />, bg: '#fff7ed', color: '#f97316' }
  ];

  return (
    <div className="homepage-root">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1>Find Your Dream Job in <span>Nepal</span></h1>
            <p className="hero-sub">The most trusted job portal for career growth in Nepal</p>

            <form className="main-search-bar" onSubmit={handleSearch}>
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
          </motion.div>
        </div>
      </section>

      {/* 2. STATS OVERLAY (Dark Navy) */}
      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-item">
            <h3>{stats.jobs}+</h3>
            <p>Active Jobs</p>
          </div>
          <div className="stat-item">
            <h3>{stats.companies}+</h3>
            <p>Verified Companies</p>
          </div>
          <div className="stat-item">
            <h3>{stats.users}+</h3>
            <p>Happy Seekers</p>
          </div>
          <div className="stat-item">
            <h3>{stats.hires}+</h3>
            <p>Monthly Hires</p>
          </div>
        </div>
      </section>

      {/* 3. TRUST STRIP */}
      <section className="trust-strip">
        <div className="container">
          <div className="logo-cloud">
            <span>Nabil Bank</span>
            <span>CG Corp</span>
            <span>Daraz</span>
            <span>Pathao</span>
            <span>Nepal Telecom</span>
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES (Centered Blocks) */}
      <section className="section-padding">
        <div className="container">
          <h2 className="section-title">Job Categories</h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <div key={cat.name} className="cat-card" onClick={() => navigate(`/jobs?category=${cat.name}`)}>
                <div className="cat-icon-box" style={{ backgroundColor: cat.bg, color: cat.color }}>
                  {cat.icon}
                </div>
                <h4>{cat.name}</h4>
                <p>Explore Openings</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED JOBS (Modern Grid) */}
      <section className="section-padding bg-light">
        <div className="container">
          <h2 className="section-title">Featured Jobs</h2>
          <div className="featured-grid">
            {featuredJobs.map(job => (
              <div key={job.id} className="job-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                <span className="feat-badge">Featured</span>
                <h3>{job.title}</h3>
                <p className="company-name">{job.company_name}</p>
                <div className="job-card-footer">
                  <span>{job.location}</span>
                  <span className="job-type-pill">{job.job_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SKILLS SECTION */}
      <section className="section-padding bg-navy text-white">
        <div className="container text-center">
          <h3 className="mb-4">Trending Skills</h3>
          <div className="skill-cloud">
            {['React', 'Node.js', 'SQL', 'Accounting', 'Graphic Design'].map(skill => (
              <span key={skill} onClick={() => navigate(`/jobs?search=${skill}`)} className="skill-pill">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA BANNER */}
      <section className="section-padding">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h2>Ready to take the next step?</h2>
              <p>Upload your CV and let top employers find you.</p>
            </div>
            <div className="cta-buttons">
              <button className="btn-white" onClick={() => navigate('/profile')}>Upload Resume</button>
              <button className="btn-outline" onClick={() => navigate('/register')}>Join Now</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer-simple">
        <p>&copy; 2026 <strong>JobSathi Nepal</strong>. Your Career Partner.</p>
      </footer>
    </div>
  );
}