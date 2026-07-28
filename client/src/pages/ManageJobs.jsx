import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import "../styles/EmployerDashboard.css";

function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs/employer");
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (jobId) => {
    setActivatingId(jobId);
    try {
      await api.put(`/jobs/${jobId}`, { status: "active" });
      setJobs(jobs.map(job => job.id === jobId ? { ...job, status: "active" } : job));
      toast.success("Job activated — it's now visible to job seekers");
    } catch (err) {
      toast.error("Failed to activate job");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm("Delete this job?")) return;
    setDeletingId(jobId);
    try {
      await api.delete(`/jobs/${jobId}`);
      setJobs(jobs.filter(job => job.id !== jobId));
      toast.success("Job deleted");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (jobId) => {
    navigate(`/employer/edit-job/${jobId}`);
  };

  if (loading) return <div className="employer-loading"><div className="spinner"></div>Loading jobs...</div>;

  return (
    <div className="employer-home-container">
      <header className="dashboard-top-bar">
        <div className="title-group">
          <h1>Manage Jobs</h1>
          <p>Edit or delete your job postings</p>
        </div>
        <Link to="/post-job" className="btn-post-job">Post New Job</Link>
      </header>

      {jobs.length === 0 ? (
        <div className="empty-jobs-state">
          <div className="empty-illustration">📭</div>
          <h3>No jobs to manage</h3>
          <p>Post your first job to get started.</p>
          <Link to="/post-job" className="btn-primary-link">Post Job</Link>
        </div>
      ) : (
        <section className="jobs-management-section">
          <div className="section-header">
            <h2>Your Job Postings ({jobs.length})</h2>
          </div>
          <div className="employer-jobs-table">
            <div className="table-header">
              <span className="col-job">Job</span>
              <span className="col-stats">Status</span>
              <span className="col-action">Actions</span>
            </div>
            {jobs.map((job) => (
              <div key={job.id} className={`employer-job-row ${job.status === 'draft' ? 'row-draft' : ''}`}>
                <div className="job-main-info">
                  <h3 className="job-row-title">{job.title}</h3>
                  <div className="job-row-meta">
                    <span className="meta-tag">{job.company_name}</span>
                    <span>{job.location}</span>
                  </div>
                  {job.status === 'draft' && (
                    <div className="draft-notice">
                      <span className="draft-icon">●</span>
                      Only visible to you — job seekers cannot see this posting
                    </div>
                  )}
                </div>
                <div className="job-row-stats">
                  <span className={`status-badge ${job.status}`}>{job.status.toUpperCase()}</span>
                </div>
                <div className="job-row-actions">
                  <button onClick={() => handleEdit(job.id)} className="btn-edit">Edit</button>
                  {job.status === 'draft' && (
                    <button
                      onClick={() => handleActivate(job.id)}
                      disabled={activatingId === job.id}
                      className="btn-activate"
                    >
                      {activatingId === job.id ? 'Activating...' : 'Activate'}
                    </button>
                  )}
                  <Link to={`/employer/jobs/${job.id}/applicants`} className="btn-applicants">
                    Applicants ({job.applications?.length || 0})
                  </Link>
                  <button 
                    onClick={() => handleDelete(job.id)} 
                    disabled={deletingId === job.id}
                    className="btn-delete"
                  >
                    {deletingId === job.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ManageJobs;
