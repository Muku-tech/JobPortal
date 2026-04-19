import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search, Heart, Star } from "lucide-react";
import api from "../services/api";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const publicApi = axios.create({
  baseURL: "http://localhost:5001/api",
});

import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categoryJobs, setCategoryJobs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('location');
  const [loadingCategory, setLoadingCategory] = useState(false);

  const [recommendations, setRecommendations] = useState([]);
  const [statsAnimating, setStatsAnimating] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ jobs: 0, companies: 0, users: 0 });
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

  const testimonials = [
    { quote: "Found my dream job as React Developer in just 2 weeks!", name: "Mukunda Mahat", role: "Frontend Developer", company: "Nabil Bank" },
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



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user) {
          // Authenticated user - fetch personalized recs using two algorithms
          const [contentRes, collabRes] = await Promise.all([
            publicApi.get('/recommendations/content-based?limit=4'),
            publicApi.get('/recommendations/collaborative?limit=4')
          ]);
          const contentJobs = contentRes.data.jobs || [];
          const collabJobs = collabRes.data.jobs || [];
          // Combine and dedupe
          const combined = [...contentJobs, ...collabJobs].filter((job, index, self) => 
            index === self.findIndex(j => j.id === job.id)
          ).slice(0, 8);
          setRecommendations(combined);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Recommendations fetch failed:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
        setStatsAnimating(true);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchCategoryJobs = async () => {
      setLoadingCategory(true);
      try {
        const params = new URLSearchParams({
          type: activeCategory,
          limit: 8
        });
        console.log("Fetching category jobs:", { type: activeCategory, params: params.toString() });
        const res = await publicApi.get(`/jobs/category?${params.toString()}`);
        console.log("Category jobs response:", res.data.jobs?.length || 0, "jobs");
        setCategoryJobs(res.data.jobs || []);
      } catch (err) {
        console.error('Category jobs fetch failed:', err.response?.data || err.message);
        setCategoryJobs([]);
      } finally {
        setLoadingCategory(false);
      }
    };
    fetchCategoryJobs();
    }, [activeCategory]);

  useEffect(() => {
    if (!statsAnimating) return;

    const targetStats = { jobs: 1200, companies: 450, users: 8000 };
    const duration = 2500;
    const staggerDelay = 300;

    const animateStat = (statKey, startDelay = 0) => {
      const startTime = performance.now() + startDelay;
      let rafId;
      const target = targetStats[statKey];

      const frame = (time) => {
        if (time < startTime) {
          rafId = requestAnimationFrame(frame);
          return;
        }

        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(target * eased);

        setAnimatedStats(prev => ({ ...prev, [statKey]: value }));

        if (progress < 1) {
          rafId = requestAnimationFrame(frame);
        }
      };

      rafId = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(rafId);
    };

    const jobsRaf = animateStat('jobs', 0);
    const companiesRaf = animateStat('companies', staggerDelay);
    const usersRaf = animateStat('users', staggerDelay * 2);

    return () => {
      jobsRaf();
      companiesRaf();
      usersRaf();
    };
  }, [statsAnimating]);

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

      {/* Stats */}
      <section className="stats-row">
        <div className="container stats-flex">
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : {}}>
            <div className="stat-num">{animatedStats.jobs.toLocaleString()}+</div>
            <div>Jobs</div>
          </motion.div>
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : { delay: 0.2 }}>
            <div className="stat-num">{animatedStats.companies.toLocaleString()}+</div>
            <div>Companies</div>
          </motion.div>
          <motion.div className="stat" initial={{ opacity: 0 }} animate={statsAnimating ? { opacity: 1 } : { delay: 0.4 }}>
            <div className="stat-num">{animatedStats.users.toLocaleString()}+</div>
            <div>Users</div>
          </motion.div>
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

      {/* Jobs by Category */}
      <section className="jobs-category-section">
        <div className="container">
          <div className="section-header">
            <h2>Jobs by Category</h2>
            <a href="/jobs" className="view-all">View all →</a>
          </div>

          <div className="category-tabs">
            <button className={`tab-btn ${activeCategory === 'location' ? 'active' : ''}`} onClick={() => setActiveCategory('location')}>
              Location
            </button>
            <button className={`tab-btn ${activeCategory === 'industry' ? 'active' : ''}`} onClick={() => setActiveCategory('industry')}>
              Industry
            </button>
            <button className={`tab-btn ${activeCategory === 'experience' ? 'active' : ''}`} onClick={() => setActiveCategory('experience')}>
              Experience
            </button>
          </div>

          <div className="jobs-grid">
            {loadingCategory ? (
              <div className="loading-jobs">Loading jobs...</div>
            ) : categoryJobs.length === 0 ? (
              <div className="empty-state">
                <p>No jobs found for this category</p>
              </div>
            ) : categoryJobs.map((job, i) => (
              <motion.div 
                key={job.id}
                className="job-home-card"
                whileHover={{ y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/jobs/${job.id}`)}
              >

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

      {/* Personalized Recommendations for logged-in users */}
      {user && recommendations.length > 0 && (
        <section className="rec-section">
          <div className="container">
            <div className="section-header">
              <h2>Personalized Recommendations</h2>
            </div>
            <div className="jobs-grid">
              {recommendations.slice(0, 4).map((job, i) => (
                <motion.div 
                  key={job.id}
                  className="job-home-card rec-card"
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >

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

      {/* Testimonials */}
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
