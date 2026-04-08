import { useState, useEffect } from 'react'
import api from '../services/api'
import '../styles/EmployerApplications.css'

function EmployerApplications({ jobId }) {

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)

const atsStages = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'hired', 'rejected']

  useEffect(() => {
    fetchApplications(jobId)
  }, [jobId])

  const fetchApplications = async (currentJobId) => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = currentJobId
        ? `/applications/job/${currentJobId}`
        : `/applications/employer-all`

      console.log("Fetching from:", endpoint)

      const response = await api.get(endpoint)

      // handle different response formats safely
      const data = response.data?.applications || response.data || []

      setApplications(Array.isArray(data) ? data : [])

    } catch (error) {
      console.error('Error fetching applications:', error)
      setError(error.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId, status, notes) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status, notes })

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status, employer_notes: notes }
            : app
        )
      )

    } catch (error) {
      console.error(error)
      alert('Failed to update status')
    }
  }

  const filteredApps =
    filter === 'all'
      ? applications
      : applications.filter(app => app.status === filter)

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading applicant data...</p>
      </div>
    )
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <div className="error-state">
        <h3>Error loading applications</h3>
        <p>{error}</p>
        <button onClick={() => fetchApplications(jobId)}>Retry</button>
      </div>
    )
  }

  return (
    <div className="employer-ats-container">

      {/* HEADER */}
      <header className="ats-header">
        <div className="header-content">
          <h1>Applicant Tracking System</h1>
          <p>Manage and move candidates through your recruitment pipeline.</p>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="ats-filter-bar">

        <button
          onClick={() => setFilter('all')}
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
        >
          All Candidates ({applications.length})
        </button>

        {atsStages.map(stage => (
          <button
            key={stage}
            onClick={() => setFilter(stage)}
            className={`filter-tab ${filter === stage ? 'active' : ''}`}
          >
            {stage}
          </button>
        ))}

      </div>

      {/* APPLICATION LIST */}
      <div className="applications-feed">

        {filteredApps.length === 0 ? (

          <div className="empty-ats-state">
            <p>No candidates found in the <strong>{filter}</strong> stage.</p>
          </div>

        ) : (

          filteredApps.map(app => (

            <div key={app.id} className="candidate-card">

              {/* TOP */}
              <div className="card-top">

                <div className="candidate-info">
                  <h3 className="job-title-tag">
                    {app.job?.title || 'Job Title'}
                  </h3>

                  <h2 className="applicant-name">
                    {app.applicant?.name || 'Unknown Applicant'}
                  </h2>

                  <p className="applicant-email">
                    {app.applicant?.email || 'No Email'}
                  </p>
                </div>

                <div className={`status-pill pill-${app.status}`}>
                  {app.status}
                </div>

              </div>

              {/* COVER LETTER */}
              <div className="cover-letter-preview">
                <label>Cover Letter</label>
                <p>{app.cover_letter || 'No cover letter provided.'}</p>
              </div>

              {/* ACTIONS */}
              <div className="ats-actions-row">

                <div className="action-group">

                  <label>Status</label>

                  <div className="status-buttons">

                    {atsStages.map(stage => (

                      <button
                        key={stage}
                        className={`status-btn ${app.status === stage ? 'active' : ''}`}
                        onClick={() => updateStatus(app.id, stage, app.employer_notes)}
                      >
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </button>

                    ))}

                  </div>

                </div>

                <div className="action-group flex-grow">

                  <label>Internal Hiring Notes</label>

                  <input
                    type="text"
                    placeholder="Add feedback or interview notes..."
                    defaultValue={app.employer_notes}
                    className="ats-input"
                    onBlur={(e) => {
                      if (e.target.value !== app.employer_notes) {
                        updateStatus(app.id, app.status, e.target.value)
                      }
                    }}
                  />

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  )
}

export default EmployerApplications