import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ApplicationMessages from './ApplicationMessages'
import { 
  ModernTemplate, ClassicTemplate, CreativeTemplate, ExecutiveTemplate 
} from './ResumeTemplates'
import { X, Printer } from 'lucide-react'
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
  const [resumePreview, setResumePreview] = useState({ open: false, data: null })
  const [sortMode, setSortMode] = useState('default') // 'default' | 'top-candidates'

  const newStages = ['applied', 'considering', 'final']

  // Status-based action validation
  const isActionAllowed = (status, action) => {
    const allowed = {
      shortlist: ['applied'],
      interview: ['applied', 'considering'],
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
      interview: 'applied or considering',
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

  const handleViewResume = async (url, resumeData = null) => {
    if (resumeData && !url.endsWith('.pdf')) {
      // Open the interactive preview modal instead of raw JSON
      setResumePreview({ open: true, data: resumeData });
      return;
    }

    // If it's an API endpoint (structured resume), we must fetch with our auth headers
    if (url.includes('/api/resumes/')) {
      try {
        // Use the full URL to bypass potentially incorrect baseURL settings
        // while still using the authenticated axios instance to send the token.
        const response = await api.get(url);
        
        // Create a temporary JSON blob to display the structured data
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (err) {
        console.error('Error viewing resume:', err);
        alert('Failed to load resume. Your session may have expired.');
      }
    } else {
      // For static files (uploaded PDFs), we can attempt a direct open
      window.open(url, '_blank');
    }
  };

  const openInterviewModal = (appId) => {
    const app = applications.find(a => a.id === appId)
    setInterviewAppStatus(app?.status)
    setInterviewModal({ open: true, appId })
  }

  let displayApps =
    filter === 'all'
      ? applications
      : applications.filter(app => app.status === filter)

  // Sort by match score when Top Candidates mode is active
  if (sortMode === 'top-candidates') {
    displayApps = [...displayApps].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  }

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
        <button
          onClick={() => setSortMode(prev => prev === 'top-candidates' ? 'default' : 'top-candidates')}
          className={`filter-tab ${sortMode === 'top-candidates' ? 'active' : ''}`}
          style={{ marginLeft: 'auto', background: sortMode === 'top-candidates' ? '#dbeafe' : undefined }}
        >
          Top Candidates
        </button>
      </div>

      {/* APPLICATIONS */}
      <div className="applications-feed">
        {displayApps.length === 0 ? (
          <div className="empty-state">
            No candidates in "{filter.replace('_', ' ')}" stage
          </div>
        ) : (
          displayApps.map(app => (
            <div key={app.id} className="candidate-card">
              {/* HEADER */}
              <div className="card-top">
                <div className="candidate-info">
                  <h3 className="job-title">{app.job?.title}</h3>
                  <h2>{app.applicant?.name}</h2>
                  <p>{app.applicant?.email}</p>

                  {/* Resume PDF (if available from resume record) */}
                  {(() => {
                    // Prioritize the specific resume linked to this application, fallback to first profile resume
                    const resume = app.resume || (Array.isArray(app.applicant?.resumes) ? app.applicant.resumes[0] : null)
                    
                    const derivedResumeUrl = resume?.id
                      ? `/resumes/${resume.id}`
                      : null

                    const serverBase = 'http://localhost:5001'
                    const resumeUrl = 
                      (app.resume_pdf_url ? `${serverBase}${app.resume_pdf_url}` : null) || 
                      (resume?.resume_url ? `${serverBase}${resume.resume_url}` : null) || 
                      resume?.file_url || 
                      resume?.pdf_url || 
                      (derivedResumeUrl ? `${serverBase}/api${derivedResumeUrl}` : null)

                    return app.cover_letter ? (
                      <>
                        <p className="cover-preview">" {app.cover_letter.substring(0, 100)}... "</p>
                        {resumeUrl && (
                          <button 
                            onClick={() => handleViewResume(resumeUrl, resume)} 
                            className="resume-view-link"
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, textDecoration: 'underline', font: 'inherit', textAlign: 'left' }}
                          >
                            View Resume
                          </button>
                        )}
                      </>
                    ) : (
                      resumeUrl && (
                        <button 
                          onClick={() => handleViewResume(resumeUrl, resume)} 
                          className="resume-view-link"
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, textDecoration: 'underline', font: 'inherit', textAlign: 'left' }}
                        >
                          View Resume
                        </button>
                      )
                    )
                  })()}
                </div>
                <div className={`status-badge status-${app.status}`}>
                  {app.status}
                </div>
                {app.clusterMatch !== undefined && (
                  <div className="cluster-badge" title={`Cluster ${app.clusterMatch}`}>
                    C{app.clusterMatch}
                  </div>
                )}
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

      {/* RESUME PREVIEW MODAL */}
      {resumePreview.open && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal resume-preview-modal" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
              <h3>Resume Preview - {resumePreview.data.personal_info?.name}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.print()} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '14px' }}>
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={() => setResumePreview({ open: false, data: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', padding: '20px', backgroundColor: '#f3f4f6' }}>
              <div className="resume-paper-shadow" style={{ backgroundColor: 'white', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', minHeight: '1000px' }}>
                {resumePreview.data.template === 'modern' && <ModernTemplate resumeData={resumePreview.data} />}
                {resumePreview.data.template === 'executive' && <ExecutiveTemplate resumeData={resumePreview.data} />}
                {resumePreview.data.template === 'classic' && <ClassicTemplate resumeData={resumePreview.data} />}
                {resumePreview.data.template === 'creative' && <CreativeTemplate resumeData={resumePreview.data} />}
                {(!resumePreview.data.template || !['modern', 'executive', 'classic', 'creative'].includes(resumePreview.data.template)) && (
                  <ModernTemplate resumeData={resumePreview.data} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerApplications
