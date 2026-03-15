import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/EmployerDashboard.css";

function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [location.key]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/jobs/employer");
      setJobs(response.data.jobs || []);
      setStats(response.data.stats || { total: 0, active: 0, applications: 0 });
    } catch (error) {
      console.error("Error fetching employer data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employer-loading">
        <div className="spinner"></div>
        <p>Loading your management console...</p>
      </div>
    );
  }

  return (
    <div className="employer-home-container">
      {/* HEADER SECTION */}
      <header className="dashboard-top-bar">
        <div className="title-group">
          <h1>Employer Console</h1>
          <p>Manage your job listings and track recruitment performance.</p>
        </div>
        <Link to="/post-job" className="btn-post-job">
          + Post New Job
        </Link>
      </header>

      {/* STATS OVERVIEW */}
      <section className="stats-overview-grid">
        <div className="stat-summary-card">
          <span className="stat-icon">TP</span>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Postings</p>
          </div>
        </div>

        <div className="stat-summary-card active">
          <span className="stat-icon">LL</span>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Live Listings</p>
          </div>
        </div>

        <div className="stat-summary-card apps">
          <span className="stat-icon">TA</span>
          <div className="stat-info">
            <h3>{stats.applications}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="jobs-management-section">
        <div className="section-header">
          <h2>Active Job Listings</h2>
        </div>

        {jobs.length === 0 ? (
            <div className="empty-jobs-state">
              <div className="empty-illustration">--</div>
              <h3>No jobs posted yet</h3>
              <p>Start your recruitment journey by posting your first vacancy.</p>
              <Link to="/post-job" className="btn-primary-link">Post a Job Now</Link>
            </div>
        ) : (
          <div className="employer-jobs-table">
            <div className="table-header">
              <span className="col-job">Job Details</span>
              <span className="col-stats">Activity</span>
              <span className="col-action">Management</span>
            </div>

            {jobs.map((job) => (
              <div key={job.id} className="employer-job-row">
                <div className="job-main-info">
                  <h3 className="job-row-title">{job.title}</h3>
                  <div className="job-row-meta">
                    <span className="meta-tag">{job.job_type}</span>
                    <span className="meta-loc">{job.location}</span>
                  </div>
                </div>

                <div className="job-row-stats">
                  <div className="app-count-badge">
                    <strong>{job.ApplicationCount || 0}</strong>
                    <span>Applicants</span>
                  </div>
                </div>

                <div className="job-row-actions">
                  <button 
                    onClick={() => navigate('/employer/applications')} 
                    className="btn-view-apps"
                  >
                    Review Candidates
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default EmployerDashboard;
