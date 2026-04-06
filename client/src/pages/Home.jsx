import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search, Heart, Briefcase, Code2, Star } from "lucide-react";
import api from "../services/api";
import "../styles/Home.css";

export default function Home() {
  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [statsAnimating, setStatsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");

  const quickTags = [
    { name: 'IT Jobs', param: 'category=IT & Software' },
    { name: 'Remote', param: 'jobType=remote' },
    { name: 'Internship', param: 'jobType=internship' },
    { name: 'Full Time', param: 'jobType=full-time' },
    { name: 'React', param: 'search=React' },
    { name: 'Backend', param: 'search=Node' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, recRes] = await Promise.all([
          api.get('/jobs/featured?limit=12'),
          api.get('/recommendations/smart').catch(() => ({ data: { jobs: [] } }))
        ]);
        setJobs(jobsRes.data.jobs || []);
        setRecommendations(recRes.data.jobs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setStatsAnimating(true);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('location', location);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleQuickTag = (param) => {
    navigate(`/jobs?${param}`);
  };

  const stats = { jobs: 1200, companies: 450, users: 8000 };
  
  const testimonials = [
    { quote: "Found my dream job as React Developer in just 2 weeks!", name: "Sita R.", role: "Frontend Developer", company: "Nabil Bank" },
    { quote: "Hired 5 developers through JobSathi this month!", name: "Raj K.", role: "Employer", company: "TechCorp" },
    { quote: "Easy to use and great matches!", name: "Anil M.", role: "Backend Engineer", company: "Freelancer" }
  ];
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-minimal">

      {/* Hero */}
      <section className="hero-min">

        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Find Jobs in Nepal
          </motion.h1>
          <p className="hero-lead">Search and apply to opportunities that match your skills</p>
          
          <form className="search-hero" onSubmit={handleSearch}>
            <input 
              placeholder="Job title or skill" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
            />
            <input 
              placeholder="Location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit">
              <Search size={20} />
            </button>
          </form>
        </div>
      </section>

      {/* Quick Tags */}
      <section className="quick-tags-section">
        <div className="container">
          <h3>Quick Search</h3>
          <div className="tags-grid">
            {quickTags.map((tag, i) => (
              <motion.button
                key={tag.name}
                className="tag-btn"
                onClick={() => handleQuickTag(tag.param)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {tag.name}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-row">
        <div className="container stats-flex">
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : {}}>
            <div className="stat-num">{stats.jobs.toLocaleString()}+</div>
            <div>Jobs</div>
          </motion.div>
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : { delay: 0.2 }}>
            <div className="stat-num">{stats.companies}+</div>
            <div>Companies</div>
          </motion.div>
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : { delay: 0.4 }}>
            <div className="stat-num">{stats.users.toLocaleString()}+</div>
            <div>Users</div>
          </motion.div>
        </div>
      </section>

      {/* Job List */}
      <section className="jobs-home-section">
        <div className="container">
          <div className="section-header">
            <h2>Latest Jobs</h2>
            <a href="/jobs" className="view-all">View all →</a>
          </div>
          <div className="jobs-grid">
            {loading ? (
              <div className="loading-jobs">Loading jobs...</div>
            ) : jobs.map((job, i) => (
              <motion.div 
                key={job.id}
                className="job-home-card"
                layout
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="job-head">
                  <div className="job-logo-wrap">
                    <div className="logo-initial">
                      {job.company_name ? job.company_name[0].toUpperCase() : 'J'}
                    </div>
                  </div>
                  <button 
                    className="home-save-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Reuse Jobs toggle logic - call api directly
                      api.post('/jobs/save', { jobId: job.id }).then(() => {
                        // Toggle optimistically
                        e.currentTarget.style.opacity = '0.7';
                      }).catch(() => {
                        toast.error('Save failed');
                      });
                    }}
                  >
                    <Heart size={16} fill="none" strokeWidth={2} />
                  </button>
                </div>
                <h3 className="job-title-small">{job.title}</h3>
                <p className="job-company-small">{job.company_name || job.employer?.name}</p>
                <div className="job-foot">
                  <span className="location-small">
                    <MapPin size={14} /> {job.location}
                  </span>
                  <span className="type-small">{job.job_type}</span>
                  {job.salary_min && (
                    <span className="salary-small">
                      NPR {job.salary_min.toLocaleString()}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="rec-section">
          <div className="container">
            <div className="section-header">
              <h2>Recommended for you</h2>
            </div>
            <div className="jobs-grid">
              {recommendations.slice(0, 4).map((job, i) => (
                <motion.div 
                  key={job.id}
                  className="job-home-card rec-card"
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="job-head">
                    <div className="logo-initial">
                      {job.company_name ? job.company_name[0].toUpperCase() : 'J'}
                    </div>
                    <Star className="ai-badge" size={16} />
                  </div>
                  <h3>{job.title}</h3>
                  <p>{job.company_name}</p>
                  <div className="job-foot">
                    <span><MapPin size={14} /> {job.location}</span>
                    <span>{job.job_type}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Bottom */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What users say</h2>
          </div>
          <div className="testimonials-container">
            <motion.div 
              key={currentTestimonial}
              className="testimonial-card"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <p className="testimonial-quote">"{testimonials[currentTestimonial].quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonials[currentTestimonial].name[0]}
                </div>
                <div>
                  <div className="author-name">{testimonials[currentTestimonial].name}</div>
                  <div className="author-role">{testimonials[currentTestimonial].role}</div>
                  <div className="author-company">{testimonials[currentTestimonial].company}</div>
                </div>
              </div>
            </motion.div>
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={i === currentTestimonial ? 'dot active' : 'dot'}
                  onClick={() => setCurrentTestimonial(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-min">

        <div className="container">
          <p>© JobPortal. Find your next opportunity.</p>
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
