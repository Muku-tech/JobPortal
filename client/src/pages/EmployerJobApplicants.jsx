import { useState, useEffect, useParams } from 'react'
import api from '../services/api'
import EmployerApplications from './EmployerApplications'
import '../styles/EmployerApplications.css'

function EmployerJobApplicants() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`)
      setJob(response.data)
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading-state">Loading job applications...</div>
  if (!job) return <div className="empty-state">Job not found</div>

  return (
    <div className="employer-job-applicants-page">
      <header className="job-header">
        <h1>{job.title}</h1>
        <p className="job-meta">{job.company_name} - {job.location}</p>
        <p className="job-description-preview">{job.description.substring(0, 150)}...</p>
      </header>
      
      <EmployerApplications jobId={jobId} />
    </div>
  )
}

export default EmployerJobApplicants
