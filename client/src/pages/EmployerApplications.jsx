import { useState, useEffect } from 'react'
import api from '../services/api'
import '../styles/EmployerApplications.css'

function EmployerApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const atsStages = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'];

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/applications/employer-all')
      setApplications(response.data)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId, status, notes) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { status, notes })
      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status, employer_notes: notes } : app
      ))
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter)

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading applicant data...</p>
    </div>
  )

  return (
    <div className="employer-ats-container">
      <header className="ats-header">
        <div className="header-content">
          <h1>Applicant Tracking System</h1>
          <p>Manage and move candidates through your recruitment pipeline.</p>
        </div>
      </header>

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

      <div className="applications-feed">
        {filteredApps.length === 0 ? (
          <div className="empty-ats-state">
            <p>No candidates found in the <strong>{filter}</strong> stage.</p>
          </div>
        ) : (
          filteredApps.map(app => (
            <div key={app.id} className="candidate-card">
              <div className="card-top">
                <div className="candidate-info">
                  <h3 className="job-title-tag">{app.job?.title}</h3>
                  <h2 className="applicant-name">{app.applicant?.name}</h2>
                  <p className="applicant-email">📧 {app.applicant?.email}</p>
                </div>
                <div className={`status-pill pill-${app.status}`}>
                  {app.status}
                </div>
              </div>

              <div className="cover-letter-preview">
                <label>Cover Letter</label>
                <p>{app.cover_letter || 'No cover letter provided.'}</p>
              </div>

              <div className="ats-actions-row">
                <div className="action-group">
                  <label>Change Stage</label>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value, app.employer_notes)}
                    className="ats-select"
                  >
                    {atsStages.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1)}
                      </option>
                    ))}
                  </select>
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