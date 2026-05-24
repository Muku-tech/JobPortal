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
      console.log("Applications data:", response.data);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    // Backend statuses:
    // - applied
    // - considering
    // - final
    // Map them to existing CSS classes used by the UI.
    const statusMap = {
      applied: "status-pending",
      considering: "status-shortlisted",
      final: "status-reviewed",
    };

    // Fallback to keep UI from breaking.
    return statusMap[status] || "status-pending";
  };

  const getStatusIcon = (status) => status.charAt(0).toUpperCase() + status.slice(1);

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter((app) => app.status === filter);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "applied").length,
    shortlisted: applications.filter((a) => a.status === "considering").length,
    interviewed: applications.filter((a) => a.status === "considering" && a.interview_date).length,
    hired: applications.filter((a) => a.status === "final" && a.decision === "hired").length,
    rejected: applications.filter((a) => a.status === "final" && a.decision === "rejected").length,
  };

  if (loading) {
    return (
      <div className="apps-loader-container">
        <div className="spinner"></div>
        <p>Updating your application status...</p>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <div className="header-text">
          <h1>My Applications</h1>
          <p>Track your progress with Nepalese top employers</p>
        </div>
        <div className="overall-stats">
          <div className="stat-pill">
            <span className="count">{applications.length}</span>
            <span className="label">Applied</span>
          </div>
        </div>
      </div>

      <div className="status-tabs">
        {Object.keys(statusCounts).map((key) => (
          <button 
            key={key}
            className={`tab-btn ${filter === key ? "active" : ""}`} 
            onClick={() => setFilter(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} 
            <span className="tab-count">{statusCounts[key]}</span>
          </button>
        ))}
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty-applications">
          <div className="empty-icon">📋</div>
          <h3>No {filter !== 'all' ? filter : ''} applications yet</h3>
          <p>Start your journey by applying to active vacancies.</p>
          <Link to="/jobs" className="find-jobs-btn">Find Jobs</Link>
        </div>
      ) : (
        <div className="applications-grid">
          {filteredApplications.map((app) => {
            // Handle both 'job' and 'Job' aliases from backend
            const job = app.job || app.Job;
            const companyName = job?.company_name || job?.employer?.name || "Company Name";

            const attachedResume = app.resume || app.Resume;
            const resumeName =
              attachedResume?.personal_info?.name ||
              attachedResume?.personal_info?.summary_name ||
              attachedResume?.personal_info?.email ||
              "Resume";

            // When backend supports resume uploads, show a link. For now we display the attached resume content/name.
            const resumeUrl = app.resume_url || attachedResume?.resume_url || attachedResume?.file_url || null;


            const resumeTemplate = attachedResume?.template
              ? `${attachedResume.template.charAt(0).toUpperCase()}${attachedResume.template.slice(1)}`
              : "Selected";

            return (
              <div key={app.id} className="app-card">
                <div className="app-card-top">
                  <div className="app-title-group">
                    <Link to={`/jobs/${app.job_id}`} className="app-job-title">
                      {job?.title || "Position Title"}
                    </Link>
                    <p className="app-company-name">{companyName}</p>
                  </div>
                  <div className={`status-badge ${getStatusClass(app.status)}`}>
                    {getStatusIcon(app.status)}
                  </div>
                </div>

                <div className="app-card-meta">
                  <span>Location: {job?.location || "Nepal"}</span>
                  <span>Type: {job?.job_type || "Full Time"}</span>
                  <span>Date: {new Date(app.createdAt).toLocaleDateString()}</span>
                  {attachedResume ? (
                    <span>
                      Attached Resume: {resumeTemplate} ({resumeName})
                      {resumeUrl ? (
                        <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8 }}>
                          View CV/Resume
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    <span>Attached Resume: Not provided</span>
                  )}
                </div>
                
                <div className="app-card-actions">
                  <Link to={`/jobs/${app.job_id}`} className="btn-view-job">View Vacancy</Link>
                  {app.status === 'pending' && <span className="wait-msg">Awaiting Review</span>}
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