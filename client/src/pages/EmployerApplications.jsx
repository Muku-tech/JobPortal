import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ApplicationMessages from './ApplicationMessages'
import '../styles/EmployerApplications.css'

const EmployerApplications = ({ jobId }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingAppId, setUpdatingAppId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [interviewModal, setInterviewModal] = useState({ open: false, appId: null })
  const [unreadCounts, setUnreadCounts] = useState({})
  const [interviewAppStatus, setInterviewAppStatus] = useState(null)

  const newStages = ['applied', 'considering', 'final']

  // Status-based action validation
  const isActionAllowed = (status, action) => {
    const allowed = {
      shortlist: ['applied'],
      interview: ['applied'],
      hire: ['considering'],
      reject: ['applied', 'considering']
    }
    return allowed[action]?.includes(status) || false
  }

  // Action tooltips
  const getActionTooltip = (status, action) => {
    if (isActionAllowed(status, action)) return `Click to ${action}`
    const allowedStatuses = {
      shortlist: 'applied',
      interview: 'applied',
      hire: 'considering',
      reject: 'applied or considering'
    }
    return `Only for ${allowedStatuses[action] || 'earlier stages'} (current: ${status})`
  }

  useEffect(() => {
    fetchApplications(jobId)
  }, [jobId])

  const fetchUnreadCounts = async (appIds) => {
    const counts = {}
    try {
      const validAppIds = appIds.filter(id => id != null && id !== 'undefined')
      const promises = validAppIds.map(async (appId) => {
        const response = await api.get(`/applications/${appId}/messages-count`)
        counts[appId] = response.data.unreadCount || 0
      })
      await Promise.all(promises)
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  const fetchApplications = async (currentJobId) => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = currentJobId
        ? `/applications/job/${currentJobId}`
        : `/applications/employer-all`
      const response = await api.get(endpoint)
      const data = response.data?.applications || response.data || []
      setApplications(Array.isArray(data) ? data : [])
      
      // Fetch unread counts for valid app IDs only
      const appIds = data.map(app => app.id).filter(id => id)
      if (appIds.length > 0) {
        fetchUnreadCounts(appIds)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      setError(error.response?.data?.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (appId, action, extraData = {}) => {
    try {
      setUpdatingAppId(appId)
      await api.post(`/applications/${appId}/action`, { action, ...extraData })
      // Optimistic update
      setApplications(prev =>
        prev.map(app =>
          app.id === appId
            ? { ...app, ...getActionUpdate(action, extraData) }
            : app
        )
      )
      // Optimistic unread count +1 for new status message
      setUnreadCounts(prev => ({
        ...prev,
        [appId]: (prev[appId] || 0) + 1
      }))
      // Refetch to sync with server
      await fetchApplications(jobId)
    } catch (error) {
      console.error(error)
      alert('Failed to perform action')
      // Revert optimistic on error
      await fetchApplications(jobId)
    } finally {
      setUpdatingAppId(null)
    }
  }

  const getActionUpdate = (action, data) => {
    switch (action) {
      case 'shortlist':
        return { status: 'considering', is_shortlisted: true }
      case 'interview':
        return { status: 'considering', interview_date: data.interview_date }
      case 'hire':
        return { status: 'final', decision: 'hired' }
      case 'reject':
        return { status: 'final', decision: 'rejected' }
      default:
        return {}
    }
  }

  const openInterviewModal = (appId) => {
    const app = applications.find(a => a.id === appId)
    setInterviewAppStatus(app?.status)
    setInterviewModal({ open: true, appId })
  }

  const filteredApps =
    filter === 'all'
      ? applications
      : applications.filter(app => app.status === filter)

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading applicants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error</h3>
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
          <h1>Applicant Management</h1>
          <p>Take action on candidates with one click</p>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="ats-filter-bar">
        {['all', ...newStages].map(stage => (
          <button
            key={stage}
            onClick={() => setFilter(stage)}
            className={`filter-tab ${filter === stage ? 'active' : ''}`}
          >
            {stage === 'all' ? `All (${applications.length})` : stage.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* APPLICATIONS */}
      <div className="applications-feed">
        {filteredApps.length === 0 ? (
          <div className="empty-state">
            No candidates in "{filter.replace('_', ' ')}" stage
          </div>
        ) : (
          filteredApps.map(app => (
            <div key={app.id} className="candidate-card">
              {/* HEADER */}
              <div className="card-top">
                <div className="candidate-info">
                  <h3 className="job-title">{app.job?.title}</h3>
                  <h2>{app.applicant?.name}</h2>
                  <p>{app.applicant?.email}</p>
                  {app.cover_letter && (
                    <p className="cover-preview">" {app.cover_letter.substring(0, 100)}... "</p>
                  )}
                </div>
                <div className={`status-badge status-${app.status}`}>
                  {app.status}
                </div>
                {unreadCounts[app.id] !== undefined && (
                  <div className={`message-badge ${unreadCounts[app.id] > 0 ? 'unread' : 'read'}`}>
                    {unreadCounts[app.id] > 0 ? unreadCounts[app.id] : '✓'}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="action-buttons">
                <button 
                  onClick={() => handleAction(app.id, 'shortlist')}
                  disabled={!isActionAllowed(app.status, 'shortlist') || updatingAppId === app.id}
                  className="action-btn shortlist"
                  title={getActionTooltip(app.status, 'shortlist')}
                >
                  Shortlist
                </button>
                <button 
                  onClick={() => openInterviewModal(app.id)}
                  disabled={!isActionAllowed(app.status, 'interview') || updatingAppId === app.id}
                  className="action-btn interview"
                  title={getActionTooltip(app.status, 'interview')}
                >
                  Interview
                </button>
                <button 
                  onClick={() => handleAction(app.id, 'hire')}
                  disabled={!isActionAllowed(app.status, 'hire') || updatingAppId === app.id}
                  className="action-btn hire"
                  title={getActionTooltip(app.status, 'hire')}
                >
                  Hire
                </button>
                <button 
                  onClick={() => handleAction(app.id, 'reject')}
                  disabled={!isActionAllowed(app.status, 'reject') || updatingAppId === app.id}
                  className="action-btn reject"
                  title={getActionTooltip(app.status, 'reject')}
                >
                  Reject
                </button>
                <Link to={`/applications/${app.id}/messages`} className="action-btn messages">
                  Messages
                </Link>
              </div>

              {/* NOTES */}
              <div className="notes-section">
                <label>Notes</label>
                <input
                  type="text"
                  defaultValue={app.employer_notes}
                  placeholder="Optional notes..."
                  className="notes-input"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* INTERVIEW MODAL */}
      {interviewModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Schedule Interview</h3>
            {!isActionAllowed(interviewAppStatus, 'interview') ? (
              <div className="modal-error">
                Interview not available for current status: <strong>{interviewAppStatus}</strong>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault()
                const date = e.target.date.value
                handleAction(interviewModal.appId, 'interview', { interview_date: date })
                setInterviewModal({ open: false, appId: null })
              }}>
                <input name="date" type="date" required className="date-input" />
                <div className="modal-buttons">
                  <button type="button" onClick={() => setInterviewModal({ open: false, appId: null })}>
                    Cancel
                  </button>
                  <button type="submit" disabled={updatingAppId === interviewModal.appId}>
                    Schedule
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerApplications

