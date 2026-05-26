import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MapPin, Bookmark, BookmarkCheck, ArrowLeft, Briefcase, Clock } from "lucide-react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import "../styles/SavedJobs.css";

export default function SavedJobs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const COMPANY_COLORS = ['#4f46e5','#e11d48','#059669','#d97706','#7c3aed','#0891b2','#db2777'];
  const getCompanyColor = (name) =>
    COMPANY_COLORS[(name || 'C').charCodeAt(0) % COMPANY_COLORS.length];

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs/saved");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
      toast?.error("Failed to load saved jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (e, jobId) => {
    e.stopPropagation();
    try {
      await api.post(`/jobs/${jobId}/save`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast?.success("Job removed from saved");
    } catch (err) {
      toast?.error("Failed to remove saved job");
    }
  };

  return (
    <div className="sj-page">
      {/* Header */}
      <div className="sj-header-bar">
        <div className="sj-header-inner">
          <button className="sj-back-btn" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <div className="sj-title-row">
            <div className="sj-title-icon">
              <Heart size={22} />
            </div>
            <div>
              <h1>Saved Jobs</h1>
              <p>{jobs.length} job{jobs.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sj-container">
        {loading ? (
          <div className="sj-loading">
            <motion.div
              className="sj-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p>Loading saved jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            className="sj-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="sj-empty-icon">
              <Bookmark size={48} />
            </div>
            <h2>No saved jobs yet</h2>
            <p>Browse jobs and click the bookmark icon to save them here for later.</p>
            <button className="sj-browse-btn" onClick={() => navigate("/jobs")}>
              <Briefcase size={16} /> Browse Jobs
            </button>
          </motion.div>
        ) : (
          <div className="sj-grid">
            <AnimatePresence>
              {jobs.map((job, i) => {
                const companyName = job.company_name || job.employer?.name || "Company";
                return (
                  <motion.div
                    key={job.id}
                    className="sj-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    {/* Header */}
                    <div className="sj-card-header">
                      <div
                        className="sj-logo"
                        style={{ background: getCompanyColor(companyName) }}
                      >
                        {companyName[0]?.toUpperCase()}
                      </div>
                      <div className="sj-company-info">
                        <span className="sj-company-name">{companyName}</span>
                        <span className="sj-saved-time">
                          <Clock size={11} /> Saved {timeAgo(job.savedAt)}
                        </span>
                      </div>
                      <button
                        className="sj-unsave-btn"
                        onClick={(e) => handleUnsave(e, job.id)}
                        title="Remove from saved"
                      >
                        <BookmarkCheck size={16} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="sj-job-title">{job.title}</h3>

                    {/* Tags */}
                    <div className="sj-tags">
                      {job.job_type && <span className="sj-tag">{job.job_type}</span>}
                      {job.work_mode && <span className="sj-tag">{job.work_mode}</span>}
                      {job.experience_level && <span className="sj-tag">{job.experience_level}</span>}
                    </div>

                    {/* Footer */}
                    <div className="sj-card-footer">
                      <span className="sj-location">
                        <MapPin size={11} /> {job.location || "Remote"}
                      </span>
                      <button
                        className="sj-apply-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                      >
                        View Job
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
