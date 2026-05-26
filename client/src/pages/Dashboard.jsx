import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  Briefcase, Heart, CheckCircle, MapPin, Calendar, User, Mail, Phone, ChevronRight,
  Upload, GraduationCap, Languages, Code, Filter, RefreshCw, Search, Bell, Clock, Eye, Edit3, Check, XCircle
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({ applied: 0, interviews: 0, saved: 0, messages: 0 });

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto refresh applications on refreshKey change
  useEffect(() => {
    if (refreshKey > 0) {
      fetchApplications();
    }
  }, [refreshKey]);

  // Polling for updates (only when viewing filtered tabs)
  useEffect(() => {
    const interval = setInterval(() => {
      if (applicationsTab !== 'all' && !loading && !isRefreshing) {
        fetchApplications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [applicationsTab, loading, isRefreshing]);

  // Update stats when applications change (reactive)
  useEffect(() => {
    if (applications.length > 0) {
      setStats({
        applied: applications.length,
        interviews: applications.filter(a => a.status === 'considering' && a.interview_date).length,
        saved: stats.saved,
        messages: stats.messages
      });
    }
  }, [applications]);

  const fetchApplications = async () => {
    try {
      setIsRefreshing(true);
      const appsRes = await api.get('/applications/user');
      const appsData = appsRes?.data || [];
      setApplications(appsData);
      setLastUpdated(new Date());
      
      setStats(prev => ({
        ...prev,
        applied: appsData.length,
        interviews: appsData.filter(a => a.status === 'considering' && a.interview_date).length
      }));
      if (toast && toast.success) toast.success('Applications updated!');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to refresh applications';
      console.error("Applications fetch error:", message, err);
      // toast context may be undefined during boot / provider mismatch
      if (toast?.error) toast.error(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recommendations
      const recRes = await api.get('/recommendations/smart');
      const recData = recRes?.data?.jobs || recRes?.data || [];
      setRecommendedJobs(recData.slice(0, 3));
      
      // Fetch messages count for stats
      const msgCountRes = await api.get('/messages/count');
      setStats(prev => ({ ...prev, messages: msgCountRes.data.unreadCount || 0 }));

      // Fetch saved jobs count
      const savedRes = await api.get('/jobs?saved=true');
      setStats(prev => ({ ...prev, saved: (savedRes.data?.total || 0) }));

      // Fetch applications separately (already handles its own loading/error)
      await fetchApplications();
      
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load dashboard';
      console.error("Dashboard fetch error:", message, err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) navigate(`/jobs?search=${searchTerm}`);
  };

  // Weighted Profile Strength Calculation
  const profilePercentage = Math.min(100, (
    (user?.profile_photo ? 10 : 0) +
    (user?.skills?.length > 0 ? 20 : 0) +
    (user?.education?.trim() ? 15 : 0) +
    ((user?.resume_url || user?.resume_id || applications.some(a => a.resume_id)) ? 25 : 0) +
    (user?.experience?.trim() ? 15 : 0) +
    ((user?.summary || user?.bio) ? 15 : 0)
  ));

  // Filter applications by status
  const getFilteredApps = () => {
    switch (applicationsTab) {
      case "pending": return applications.filter(a => a.status === 'applied');
      case "shortlisted": return applications.filter(a => a.status === 'considering');
      case "rejected": return applications.filter(a => a.status === 'final' && a.decision === 'rejected');
      case "interview": return applications.filter(a => a.status === 'considering' && a.interview_date);
      case "all": return applications;
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
              {user?.profile_photo ? <img src={user.profile_photo} alt="Profile" /> : <User size={40} />}
            </div>
            <h3>{user?.name || "Job Seeker"}</h3>
            <p className="user-role-title">{user?.current_company ? `Developer at ${user.current_company}` : "Aspiring Professional"}</p>
            <div className="contact-details">
              <p><MapPin size={14} /> {user?.address || "N/A"}</p>
            </div>
            <button className="btn-upload-resume" onClick={() => navigate('/resume-builder')}>
              <Upload size={14} /> Update Resume
            </button>
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
                <span>Resume uploaded (25%)</span>
              </div>
              <div className="check-item">
                <GraduationCap size={16} className={user?.education?.trim() ? "complete" : ""} />
                <span>Add education (15%)</span>
              </div>
            </div>
            <button className="btn-action-orange" onClick={() => navigate('/profile')}>
              Complete Profile
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="card quick-actions-card">
            <h4>Quick Actions</h4>
            <div className="action-btns-list">
              <button onClick={() => navigate('/jobs')}><Search size={14}/> Browse Jobs</button>
              <button onClick={() => navigate('/profile')}><Edit3 size={14}/> Edit Profile</button>
              <button onClick={() => navigate('/saved-jobs')}><Heart size={14}/> Saved Jobs</button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN - RESTRUCTURED */}
        <main className="dash-main-content">
          
          {/* QUICK SEARCH BAR */}
          <motion.div 
            className="quick-search-container"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handleQuickSearch} className="quick-search-form">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="Quick search for your next role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-search">Find Jobs</button>
            </form>
          </motion.div>

          {/* 1. COMPACT RECOMMENDED JOBS */}
          <motion.section 
            className="recommendations-box"
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
            <div className="rec-detailed-list">
              {recommendedJobs.length > 0 ? (
                recommendedJobs.slice(0, 3).map(job => (
                  <div key={job.id} className="rec-item-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <div className="rec-info">
                      <h5>{job.title}</h5>
                      <p>{job.company_name} • {job.location || 'Remote'}</p>
                      <div className="match-tags">
                        <span className="match-reason">Matches your skills</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="arrow" />
                  </div>
                ))
              ) : (
                <div className="empty-rec-compact">
                  <p>Add skills like <strong>React</strong>, <strong>Node.js</strong> to get better recommendations.</p>
                </div>
              )}
            </div>
          </motion.section>

          {/* 3. APPLICATION PIPELINE & RECENT ACTIVITY */}
          <div className="dash-grid-layout">
            <section className="pipeline-section">
              <div className="section-header">
                <h4>Recent Applications</h4>
                <Link to="/my-applications" className="link-text">Manage</Link>
              </div>
              <div className="pipeline-list">
                {applications.slice(0, 3).map(app => (
                  <div key={app.id} className="pipeline-card">
                    <div className="app-main-info">
                      <h5>{app.job?.title}</h5>
                      <p>{app.job?.company_name}</p>
                    </div>
                    <div className="app-status-flow">
                      <div className={`step active`}><span>Applied</span></div>
                      <div className="connector"></div>
                      <div className={`step ${app.status !== 'applied' || app.employer_notes ? 'active' : ''}`}><span>Viewed</span></div>
                      <div className="connector"></div>
                      <div className={`step ${['considering', 'final'].includes(app.status) ? 'active' : ''}`}><span>Shortlisted</span></div>
                      <div className="connector"></div>
                      <div className={`step ${app.interview_date || app.status === 'final' ? 'active' : ''}`}><span>Interview</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="activity-timeline">
              <h4>Activity Feed</h4>
              <div className="timeline-items">
                {applications.slice(0, 4).map((app, i) => (
                  <div key={i} className="timeline-event">
                    <div className="event-icon"><Check size={12}/></div>
                    <div className="event-desc">
                      <p>Applied to <strong>{app.job?.title}</strong> at {app.job?.company_name}</p>
                      <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                <div className="timeline-event">
                  <div className="event-icon"><Eye size={12}/></div>
                  <div className="event-desc">
                    <p>Employer viewed your profile</p>
                    <span>Yesterday</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 3. UPCOMING INTERVIEWS TIMELINE */}
          {stats.interviews > 0 && (
            <motion.section 
              className="timeline-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="section-header">
                <h4>Upcoming Interviews</h4>
              </div>
              <div className="timeline-list">
                {applications
                  .filter(a => a.status === 'considering' && a.interview_date)
                  .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date))
                  .slice(0, 2)
                  .map(app => (
                    <div key={app.id} className="timeline-item">
                      <div className="date-badge">
                        <span className="day">{new Date(app.interview_date).getDate()}</span>
                        <span className="month">{new Date(app.interview_date).toLocaleString('default', { month: 'short' })}</span>
                      </div>
                      <div className="details">
                        <h5>{app.job?.title}</h5>
                        <p>{app.job?.company_name} • {new Date(app.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}
