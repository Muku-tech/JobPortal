import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Briefcase, Heart, CheckCircle, MapPin, 
  Calendar, User, Mail, Phone 
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading ] = useState(true);
  const [activeTab, setActiveTab] = useState("applied"); 
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
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

      setRecommendedJobs(recData);
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
    ((user.name ? 1 : 0) +
     (user.phone ? 1 : 0) +
     (user.address ? 1 : 0) +
     (user.skills?.length || 0) +
     (user.education?.trim() ? 1 : 0) +
     (user.experience?.trim() ? 1 : 0) +
     (user.languages?.length || 0) +
     (user.preferred_job_type ? 1 : 0) +
     (user.preferred_location?.trim() ? 1 : 0) +
     (user.linkedin ? 1 : 0) +
     (user.github ? 1 : 0) +
     (user.salary_expectation ? 1 : 0)) / 12 * 100
  ));

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        
        {/* SIDEBAR */}
        <aside className="dash-sidebar">
          <div className="card profile-info-card">
            <div className="avatar-box">
              <User size={40} />
            </div>
            <h3>{user?.name || "Mukunda"}</h3>
            <div className="contact-details">
              <p><MapPin size={14} /> {user?.address || "N/A"}</p>
              <p><Phone size={14} /> {user?.phone || "9762870120"}</p>
              <p><Mail size={14} /> {user?.email}</p>
            </div>
          </div>

          <div className="card strength-card">
            <div className="chart-container">
              <svg viewBox="0 0 36 36" className="circular-chart-ui">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="circle-main" strokeDasharray={`${profilePercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" className="perc-text">{profilePercentage}%</text>
              </svg>
              <h4>Profile Strength</h4>
            </div>
            <p className="hint-text">Complete your profile to 100% to increase your chances!</p>
            <button className="btn-action-orange" onClick={() => navigate('/profile')}>
              Complete Your Profile
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <main className="dash-main-content">
          
          {/* RECOMMENDATIONS */}
          <section className="recommendations-box">
            <div className="rec-header">
              <div>
                <h4>Recommended Jobs</h4>
                <p>Based On Your Skills Only</p>
              </div>
              <Link to="/jobs" className="link-text">Explore Job</Link>
            </div>
            
            <div className="carousel-wrapper">
              {recommendedJobs.length > 0 ? (
                recommendedJobs.map(job => (
                  <div key={job.id} className="job-rec-card" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <h5>{job.title}</h5>
                    <p className="comp-name">{job.company_name}</p>
                    <div className="meta">
                      <Calendar size={12} /> {new Date(job.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-rec">
                  <p>No matches found. Try adding <strong>React</strong> or <strong>Node.js</strong> to your profile.</p>
                </div>
              )}
            </div>
          </section>

          {/* STATS CARDS */}
          <div className="stats-grid">
            <div className={`stat-box orange ${activeTab === 'applied' ? 'active' : ''}`} onClick={() => setActiveTab('applied')}>
              <div className="icon-wrap"><Briefcase size={20} /></div>
              <div>
                <p>Application Sent</p>
                <h2>{stats.applied}</h2>
              </div>
            </div>
            <div className={`stat-box orange ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => setActiveTab('interviews')}>
              <div className="icon-wrap"><CheckCircle size={20} /></div>
              <div>
                <p>Interview Jobs</p>
                <h2>{stats.interviews}</h2>
              </div>
            </div>
            <div className={`stat-box orange ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
              <div className="icon-wrap"><Heart size={20} /></div>
              <div>
                <p>Saved Jobs</p>
                <h2>{stats.saved}</h2>
              </div>
            </div>
          </div>

          {/* LIST VIEW */}
          <div className="activity-box">
            {activeTab === 'applied' && (
              <div className="list-container">
                {applications.length > 0 ? applications.map(app => (
                  <div key={app.id} className="list-item">
                    <div>
                      <h5>{app.job?.title}</h5>
                      <p>{app.job?.company_name}</p>
                    </div>
                    <span className={`pill ${app.status}`}>{app.status}</span>
                  </div>
                )) : (
                  <div className="empty-center">
                    <Briefcase size={40} />
                    <p>You have not applied for any jobs.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'interviews' && (
              <div className="list-container">
                {applications.filter(a => a.status === 'interview').length > 0 ? applications.filter(a => a.status === 'interview').map(app => (
                  <div key={app.id} className="list-item">
                    <div>
                      <h5>{app.job?.title}</h5>
                      <p>{app.job?.company_name}</p>
                    </div>
                    <span className="pill interview">Interview</span>
                  </div>
                )) : (
                  <div className="empty-center">
                    <CheckCircle size={40} />
                    <p>No interviews scheduled.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'saved' && (
              <div className="list-container">
                {savedJobs.length > 0 ? savedJobs.map(job => (
                  <div key={job.id} className="list-item">
                    <div>
                      <h5>{job.title}</h5>
                      <p>{job.company_name}</p>
                    </div>
                    <span className="pill saved">Saved</span>
                  </div>
                )) : (
                  <div className="empty-center">
                    <Heart size={40} />
                    <p>No saved jobs.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
