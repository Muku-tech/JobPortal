import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  Users,
} from "lucide-react";
import api from "../services/api";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/Jobs.css";

const publicApi = axios.create({
  baseURL: "http://localhost:5001/api",
});

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── Existing job listing state ───
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    jobType: searchParams.get("jobType") || "",
    sort: searchParams.get("sort") || "createdAt",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // ─── Recommendation state ───
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [activeRecTab, setActiveRecTab] = useState("smart");
  const [allRecData, setAllRecData] = useState(null);

  const recTabs = [
    { key: "smart", label: "Smart Hybrid", icon: Sparkles },
    { key: "contentBased", label: "Content-Based", icon: Target },
    { key: "collaborative", label: "Collaborative", icon: Users },
    { key: "kmeans", label: "K-Means", icon: Brain },
  ];

  // ─── Fetch recommendations ───
  useEffect(() => {
    const fetchRecs = async () => {
      setRecLoading(true);
      try {
        if (user) {
          const res = await api.get("/recommendations/all?limit=8");
          setAllRecData(res.data);
          setRecommendations(res.data.smart?.jobs || []);
        } else {
          const res = await publicApi.get("/recommendations/guest?limit=8");
          setRecommendations(res.data.jobs || []);
        }
      } catch (err) {
        console.error("Recommendations fetch failed:", err);
        setRecommendations([]);
      } finally {
        setRecLoading(false);
      }
    };
    fetchRecs();
  }, [user]);

  const handleRecTabChange = (tabKey) => {
    setActiveRecTab(tabKey);
    if (allRecData && allRecData[tabKey]) {
      setRecommendations(allRecData[tabKey].jobs || []);
    }
  };

  // Normalize match score for display (0-100%)
  const getMatchDisplay = (job, allJobs) => {
    if (!job.recommendationScore && job.recommendationScore !== 0) {
      return user ? "Recommended" : "Popular";
    }
    const scores = allJobs.map((j) => j.recommendationScore || 0);
    const maxScore = Math.max(...scores, 1);
    const normalized = Math.min(99, Math.round((job.recommendationScore / maxScore) * 100));
    return `${normalized}% Match`;
  };

  const handleRecCardClick = async (job) => {
    if (user) {
      try {
        await api.post("/recommendations/track-view", {
          jobId: job.id,
          action: "click",
        });
      } catch (e) {
        /* silent */
      }
    }
    navigate(`/jobs/${job.id}`);
  };

  // ─── Existing job listing logic ───
  const loadJobs = async (currentPage = filters.page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: currentPage,
        limit: 12,
      });
      const res = await api.get("/jobs?" + params);
      setJobs(res.data.jobs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(filters.page);
  }, [filters.search, filters.location, filters.jobType, filters.sort, filters.page]);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const sp = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) sp.set(k, String(v));
    });
    setSearchParams(sp);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    const sp = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) sp.set(k, String(v));
    });
    setSearchParams(sp);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jobTypes = [
    { value: "", label: "All Types" },
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Latest First" },
    { value: "salary_max", label: "Highest Salary" },
    { value: "relevance", label: "Relevance (Skills Match)" },
  ];

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, filters.page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="jobs-page">
      {/* Search Section */}
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
        {/* ─── Recommendations Section ─── */}
        <section className="recommendations-section">
          <div className="rec-header">
            <h2>
              {user ? (
                <>
                  <Sparkles size={22} /> Recommended For You
                </>
              ) : (
                <>
                  <TrendingUp size={22} /> Popular Jobs
                </>
              )}
            </h2>
            {user && (
              <div className="rec-tabs">
                {recTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`rec-tab ${activeRecTab === tab.key ? "active" : ""}`}
                    onClick={() => handleRecTabChange(tab.key)}
                    title={tab.label}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {recLoading ? (
            <div className="rec-loading">Finding the best matches for you...</div>
          ) : recommendations.length === 0 ? (
            <div className="rec-empty">
              {user
                ? "Add skills to your profile to get personalized recommendations."
                : "No popular jobs found."}
            </div>
          ) : (
            <div className="rec-grid">
              {recommendations.map((job, i) => (
                <motion.div
                  key={job.id}
                  className="rec-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => handleRecCardClick(job)}
                >
                  <div className="rec-card-top">
                    <span className="match-score-badge">
                      {getMatchDisplay(job, recommendations)}
                    </span>
                    {job.recommendationType && (
                      <span
                        className={`algorithm-badge ${job.recommendationType}`}
                      >
                        {job.recommendationType === "content-based"
                          ? "Content"
                          : job.recommendationType === "collaborative"
                          ? "Collab"
                          : job.recommendationType === "kmeans"
                          ? "K-Means"
                          : job.recommendationType}
                      </span>
                    )}
                  </div>
                  <h3 className="rec-title">{job.title}</h3>
                  <p className="rec-company">
                    {job.company_name || job.employer?.name || "Hiring Company"}
                  </p>
                  <div className="rec-meta">
                    <span>
                      <MapPin size={12} /> {job.location}
                    </span>
                    <span className="rec-type">{job.job_type}</span>
                  </div>
                  {job.matchReasons && job.matchReasons.length > 0 && (
                    <div className="match-reasons">
                      {job.matchReasons.slice(0, 2).map((reason, idx) => (
                        <span key={idx} className="reason-pill">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Filter Area ─── */}
        <div className="filter-area">
          <div className="type-filters">
            {jobTypes.map((type) => (
              <button
                key={type.value}
                className={
                  "type-btn " + (filters.jobType === type.value ? "active" : "")
                }
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
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ─── Job Listings ─── */}
        {loading && jobs.length === 0 ? (
          <div className="jobs-loading">Loading jobs...</div>
        ) : (
          <>
            <div className="jobs-grid">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="job-card"
                  onClick={() => navigate("/jobs/" + job.id)}
                >
                  <div className="job-banner">
                    <div className="banner-overlay">
                      <h3>{job.title}</h3>
                      <span className="banner-company">
                        {job.company_name || job.employer?.name || "Hiring Company"}
                      </span>
                    </div>
                  </div>

                  <div className="job-content">
                    <div className="card-meta">
                      <span className="meta-item">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="card-tag">{job.job_type}</span>
                    </div>
                    <button className="card-view-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => goToPage(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={
                      "pagination-btn " + (filters.page === page ? "active" : "")
                    }
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => goToPage(filters.page + 1)}
                  disabled={filters.page === totalPages}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="results-info">
              Page {filters.page} of {totalPages} &bull; {jobs.length} jobs shown
            </div>
          </>
        )}
      </div>
    </div>
  );
}

