import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../styles/MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get("/applications/user");
      // Logging data helps confirm if 'job' or 'Job' is being returned
      console.log("Applications data:", response.data);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      hired: "#10b981",
      shortlisted: "#8b5cf6",
      interviewed: "#3b82f6",
      reviewed: "#f59e0b",
      rejected: "#ef4444",
      pending: "#6b7280"
    };
    return colors[status] || "#6b7280";
  };

  const getStatusIcon = (status) => {
    const icons = {
      hired: "🎉",
      shortlisted: "⭐",
      interviewed: "📞",
      reviewed: "👀",
      rejected: "❌",
      pending: "⏳"
    };
    return icons[status] || "⏳";
  };

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter((app) => app.status === filter);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    interviewed: applications.filter((a) => a.status === "interviewed").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    hired: applications.filter((a) => a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="page-header">
        <h1>📋 My Applications</h1>
        <div className="stats-box">
          <span className="stat-number">{applications.length}</span>
          <span className="stat-label">Total Applications</span>
        </div>
      </div>

      <div className="filters">
        {Object.keys(statusCounts).map((key) => (
          <button 
            key={key}
            className={filter === key ? "active" : ""} 
            onClick={() => setFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({statusCounts[key]})
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <h3>No applications found</h3>
          <Link to="/jobs" className="browse-btn">Browse Jobs</Link>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map((app) => {
            // FIX: Sequelize handles aliases differently depending on config. 
            // This ensures we get the job data regardless of casing.
            const job = app.job || app.Job;
            const employer = job?.employer || job?.Employer;

            return (
              <div key={app.id} className="application-card">
                <div className="card-header">
                  <div>
                    <h3>
                      <Link to={`/jobs/${app.job_id}`}>
                        {job?.title || "Position Title Not Found"}
                      </Link>
                    </h3>
                    <p className="company">
                      🏢 {employer?.name || "Company Name"}
                    </p>
                  </div>
                  <div className="status" style={{ color: getStatusColor(app.status) }}>
                    {getStatusIcon(app.status)} {app.status}
                  </div>
                </div>

                <div className="card-info">
                  <span>📍 {job?.location || "N/A"}</span>
                  <span>💼 {job?.job_type || "N/A"}</span>
                  <span>📅 {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyApplications;