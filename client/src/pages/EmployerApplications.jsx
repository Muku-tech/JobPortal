import { useState, useEffect } from 'react'
import api from '../services/api'
import '../styles/EmployerApplications.css'

const EmployerApplications = ({ jobId }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingAppId, setUpdatingAppId] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModalAppId, setMessageModalAppId] = useState(null)
  const [messageText, setMessageText] = useState('')
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

      const data = response.data?.applications || response.data || []

      setApplications(Array.isArray(data) ? data : [])

    } catch (error) {
      console.error('Error fetching applications:', error)
      setError(error.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (applicationId, status, notes, interviewDate) => {
    try {
      setUpdatingAppId(applicationId)
      await api.put(`/applications/${applicationId}/status`, { status, notes, interviewDate })

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status, employer_notes: notes, interview_date: interviewDate }
            : app
        )
      )

    } catch (error) {
      console.error(error)
      alert('Failed to update status')
    } finally {
      setUpdatingAppId(null)
    }
  }

  const filteredApps =
    filter === 'all'
      ? applications
      : applications.filter(app => app.status === filter)

  const sendMessage = async () => {
    if (!messageText.trim()) return alert('Message cannot be empty');
    
    try {
      await api.post('/notifications', {  // Fixed endpoint to match routes
        applicantId: messageModalAppId,
        message: messageText.trim()
      });
      setShowMessageModal(false);
      setMessageText('');
      alert('Message sent successfully!');
      fetchApplications(jobId);  // Refresh list
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading applicant data...</p>
      </div>
    )
  }

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
    <>
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
              {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* APPLICATION LIST */}
        <div className="applications-feed">
          {filteredApps.length === 0 ? (
            <div className="empty-ats-state">
              <p>No candidates found in the <strong>{filter.replace('_', ' ')}</strong> stage.</p>
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
                    {app.status?.replace('_', ' ')}
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
                          className={`status-btn ${app.status === stage ? 'active' : ''} ${updatingAppId === app.id ? 'loading' : ''}`}
                          onClick={() => {
                            const applicantName = app.applicant?.name || 'applicant';
                            const jobTitle = app.job?.title || 'this position';
                            const stageName = stage.replace('_', ' ');
                            if (confirm(`Send "${stageName}" notification to ${applicantName} for ${jobTitle}?`)) {
                              if (stage === 'interview_scheduled') {
                                const interviewDate = prompt('Enter interview date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                                if (interviewDate) {
                                  updateStatus(app.id, stage, app.employer_notes, interviewDate);
                                  return;
                                }
                              }
                              updateStatus(app.id, stage, app.employer_notes);
                            }
                          }}

                          disabled={updatingAppId === app.id}
                        >
                          {updatingAppId === app.id ? '...' : stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

                  <div className="action-group">
                    <button 
                      className="btn-message" 
                      onClick={() => {
                        setMessageModalAppId(app.id)
                        setMessageText('')
                        setShowMessageModal(true)
                      }}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MESSAGE MODAL - INSIDE RETURN */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Message</h3>
            <textarea 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your message or instructions..."
              rows="6"
              className="message-textarea"
            />
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowMessageModal(false)}>
                Cancel
              </button>
              <button className="btn-send" onClick={sendMessage}>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmployerApplications
