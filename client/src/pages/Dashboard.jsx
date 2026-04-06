import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  Briefcase, Heart, CheckCircle, MapPin, Calendar, User, Mail, Phone, ChevronRight,
  Upload, GraduationCap, Languages, Code, Filter 
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [applicationsTab, setApplicationsTab] = useState("all");
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [stats, setStats] = useState({ applied: 0, interviews: 0, saved: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [recRes, appsRes, savedRes] = await Promise.all([
        api.get('/recommendations/smart').catch(() => ({ data: [] })),
        api.get('/applications/user'),
        api.get('/jobs/saved')
      ]);

      const recData = recRes.data.jobs || recRes.data || [];
      const appsData = appsRes.data || [];
      const savedData = savedRes.data.jobs || [];

      setRecommendedJobs(recData.slice(0, 3)); // Compact: max 3
      setApplications(appsData);
      setSavedJobs(savedData);
      
      setStats({
        applied: appsData.length,
        interviews: appsData.filter(a => a.status === 'interview').length,
        saved: savedData.length
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const profilePercentage = Math.min(100, Math.round(
    ((user?.name ? 1 : 0) +
     (user?.phone ? 1 : 0) +
     (user?.address ? 1 : 0) +
     (user?.skills?.length || 0) +
     (user?.education?.trim() ? 1 : 0) +
     (user?.experience?.trim() ? 1 : 0) +
     (user?.languages?.length || 0) +
     (user?.preferred_job_type ? 1 : 0) +
     (user?.preferred_location?.trim() ? 1 : 0) +
     (user?.linkedin ? 1 : 0) +
     (user?.github ? 1 : 0) +
     (user?.salary_expectation ? 1 : 0)) / 12 * 100
  ));

  // Filter applications by status
  const getFilteredApps = () => {
    switch (applicationsTab) {
      case "pending": return applications.filter(a => a.status === 'pending');
      case "shortlisted": return applications.filter(a => a.status === 'shortlisted');
      case "rejected": return applications.filter(a => a.status === 'rejected');
      case "interview": return applications.filter(a => a.status === 'interview');
      default: return applications;
    }
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'gray' },
    shortlisted: { label: 'Shortlisted', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    interview: { label: 'Interview', color: 'blue' }
  };

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="loader-container">
          <motion.div 
            className="spinner" 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        
        {/* LEFT SIDEBAR - KEEP UNCHANGED */}
        <aside className="dash-sidebar">
          <div className="card profile-info-card">
            <div className="avatar-box">
              <User size={40} />
            </div>
            <h3>{user?.name || "Job Seeker"}</h3>
            <div className="contact-details">
              <p><MapPin size={14} /> {user?.address || "N/A"}</p>
              <p><Phone size={14} /> {user?.phone || "N/A"}</p>
              <p><Mail size={14} /> {user?.email}</p>
            </div>
          </div>

          {/* PROFILE STRENGTH - ENHANCED WITH ANIMATION + CHECKLIST */}
          <div className="card strength-card">
            <div className="chart-container">
              <motion.svg 
                viewBox="0 0 36 36" 
                className="circular-chart-ui"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: profilePercentage / 100 }}
                transition={{ duration: 1.5 }}
              >
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle-main" strokeDasharray={`${profilePercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="perc-text">{profilePercentage}%</text>
              </motion.svg>
              <h4>Profile Strength</h4>
            </div>
            <p className="hint-text">Complete your profile to 100% to increase your chances!</p>
            {/* CHECKLIST */}
            <div className="strength-checklist">
              <div className="check-item">
                <CheckCircle size={16} className={user?.skills?.length ? "complete" : ""} />
                <span>Add skills</span>
              </div>
              <div className="check-item">
                <Upload size={16} className={user?.cv_url ? "complete" : ""} />
                <span>Upload CV</span>
              </div>
              <div className="check-item">
                <GraduationCap size={16} className={user?.education?.trim() ? "complete" : ""} />
                <span>Add education</span>
              </div>
            </div>
            <button className="btn-action-orange" onClick={() => navigate('/profile')}>
              Complete Profile
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN - RESTRUCTURED */}
        <main className="dash-main-content">
          
          {/* 1. COMPACT RECOMMENDED JOBS */}
          <motion.section 
            className="recommendations-box compact-rec"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rec-header">
              <div>
                <h4>Recommended Jobs</h4>
                <p>Based on your skills</p>
              </div>
              <Link to="/jobs" className="link-text">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="compact-list">
              {recommendedJobs.length > 0 ? (
                recommendedJobs.slice(0, 3).map(job => (
                  <div key={job.id} className="compact-job" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <h5>{job.title}</h5>
                    <p>{job.company_name}</p>
                  </div>
                ))
              ) : (
                <div className="empty-rec-compact">
                  <p>Add skills like <strong>React</strong>, <strong>Node.js</strong> to get better recommendations.</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* 2. STATS CARDS WITH HOVER */}
          <motion.div 
            className="stats-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="stat-box" 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring" }}
              onClick={() => setApplicationsTab('all')}
            >
              <div className="icon-wrap orange"><Briefcase size={20} /></div>
              <div>
                <p>Applications</p>
                <h2>{stats.applied}</h2>
              </div>
            </motion.div>
            <motion.div 
              className="stat-box" 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring" }}
              onClick={() => setApplicationsTab('interview')}
            >
              <div className="icon-wrap blue"><CheckCircle size={20} /></div>
              <div>
                <p>Interviews</p>
                <h2>{stats.interviews}</h2>
              </div>
            </motion.div>
            <motion.div 
              className="stat-box" 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring" }}
              onClick={() => setApplicationsTab('saved')}
            >
              <div className="icon-wrap pink"><Heart size={20} /></div>
              <div>
                <p>Saved</p>
                <h2>{stats.saved}</h2>
              </div>
            </motion.div>
          </motion.div>

          {/* 3. APPLICATIONS - MAIN FOCUS */}
          <motion.div 
            className="applications-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="apps-header">
              <h3>Your Applications</h3>
              <div className="apps-tabs">
                <button 
                  className={`tab-btn ${applicationsTab === 'all' ? 'active' : ''}`}
                  onClick={() => setApplicationsTab('all')}
                >
                  All
                </button>
                <button 
                  className={`tab-btn ${applicationsTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setApplicationsTab('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`tab-btn ${applicationsTab === 'shortlisted' ? 'active' : ''}`}
                  onClick={() => setApplicationsTab('shortlisted')}
                >
                  Shortlisted
                </button>
                <button 
                  className={`tab-btn ${applicationsTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setApplicationsTab('rejected')}
                >
                  Rejected
                </button>
                <button 
                  className={`tab-btn ${applicationsTab === 'interview' ? 'active' : ''}`}
                  onClick={() => setApplicationsTab('interview')}
                >
                  Interview
                </button>
              </div>
            </div>

            <div className="applications-list">
              {getFilteredApps().length > 0 ? (
                getFilteredApps().map(app => (
                  <motion.div 
                    key={app.id}
                    className="app-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * app.id }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="app-left">
                      <h4>{app.job?.title || 'Title'}</h4>
                      <p className="company">{app.job?.company_name || 'Company'}</p>
                      <div className="app-meta">
                        <span><Calendar size={14} /> {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="app-right">
                      <span className={`status-badge ${app.status}`}>
                        {statusConfig[app.status]?.label || app.status}
                      </span>
                      <Link to={`/jobs/${app.job_id}`} className="view-job-btn">
                        View Job
                      </Link>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="empty-applications"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Briefcase size={64} className="empty-icon" />
                  <h4>No applications yet</h4>
                  <p>Start exploring jobs and apply to opportunities that match your skills.</p>
                  <button 
                    className="browse-btn" 
                    onClick={() => navigate('/jobs')}
                  >
                    Browse Jobs
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

