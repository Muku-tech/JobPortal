import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  PlusCircle, Users, Briefcase, Activity, 
  MapPin, Clock, ChevronRight, Search 
} from "lucide-react";
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
    <div className="emp-dash-root">
      <div className="emp-dash-container">
        
        {/* HEADER */}
        <header className="emp-header">
          <div className="emp-welcome">
            <h1>Employer Console</h1>
            <p>Track your recruitment performance and manage vacancies.</p>
          </div>

          <div className="emp-actions">
            <Link to="/post-job" className="btn-post-main">
              <PlusCircle size={20} /> Post New Vacancy
            </Link>
          </div>
        </header>

        {/* STATS */}
        <section className="emp-stats-grid">

          <div className="emp-stat-card">
            <div className="emp-stat-icon navy"><Briefcase size={24} /></div>
            <div className="emp-stat-content">
              <h3>{stats.total}</h3>
              <p>Total Postings</p>
            </div>
          </div>

          <div className="emp-stat-card">
            <div className="emp-stat-icon orange"><Activity size={24} /></div>
            <div className="emp-stat-content">
              <h3>{stats.active}</h3>
              <p>Live Listings</p>
            </div>
          </div>

          <div className="emp-stat-card">
            <div className="emp-stat-icon green"><Users size={24} /></div>
            <div className="emp-stat-content">
              <h3>{stats.applications}</h3>
              <p>Total Applicants</p>
            </div>
          </div>

        </section>

        {/* JOB LIST */}
        <section className="emp-main-section">

          <div className="list-header">
            <h2>Active Job Listings</h2>

            <div className="search-pill">
              <Search size={16} />
              <input type="text" placeholder="Search your jobs..." />
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="emp-empty-state">
              <div className="empty-graphic">
                <Briefcase size={48} />
              </div>
              <h3>No jobs posted yet</h3>
              <p>Start your recruitment journey by posting your first vacancy.</p>
              <Link to="/post-job" className="btn-post-alt">Post a Job</Link>
            </div>
          ) : (
            <div className="job-management-list">

              {jobs.map((job) => (

                <div key={job.id} className="job-mgmt-row">

                  {/* JOB INFO */}
                  <div className="job-main-col">
                    <h3 onClick={() => navigate(`/jobs/${job.id}`)}>
                      {job.title}
                    </h3>

                    <div className="job-row-tags">
                      <span><MapPin size={14} /> {job.location}</span>
                      <span><Clock size={14} /> {job.job_type}</span>
                    </div>
                  </div>

                  {/* APPLICANTS */}
                  <div className="job-stats-col">
                    <div 
                      className="stat-pill"
                      onClick={() => navigate(`/employer/applications/${job.id}`)}
                    >
                      <Users size={16} />
                      <strong>{job.ApplicationCount || 0}</strong>
                      <span>Applicants</span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="job-btns-col">
                    <button 
                      onClick={() => navigate(`/employer/applications/${job.id}`)}
                      className="btn-review"
                    >
                      Review Candidates <ChevronRight size={18} />
                    </button>

                    <button className="btn-dots">...</button>
                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

      </div>
    </div>
  );
}

export default EmployerDashboard;