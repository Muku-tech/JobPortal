import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../styles/PostJob.css'

function PostJob() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company_name: '',
    location: '',
    job_type: 'full-time',
    category: '',
    salary_min: '',
    salary_max: '',
    required_skills: '',
    experience_level: 'mid',
    education_level: '',
    benefits: '',
    vacancy: 1,
    deadline: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const locations = ['Kathmandu', 'Pokhara', 'Birgunj', 'Biratnagar', 'Lalitpur', 'Bhaktapur', 'Butwal', 'Dharan', 'Janakpur', 'Narayangadh']
  const jobTypes = ['full-time', 'part-time', 'contract', 'internship']
  const categories = ['Information Technology', 'Banking & Finance', 'Teaching & Education', 'Tourism & Hospitality', 'Healthcare & Medical', 'Engineering', 'Marketing & Sales', 'Administration & HR', 'Construction', 'Agriculture & Forestry']
  const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive']
  const educationLevels = ['High School', 'Bachelors', 'Masters', 'PhD', 'Diploma', 'Certification']

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const jobData = {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        vacancy: parseInt(formData.vacancy),
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(s => s)
      }
      await api.post('/jobs', jobData)
      alert('Job posted successfully!')
      navigate('/employer', { state: { refresh: Date.now() } })

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-job-page">
      <h1>Post a New Job</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-group">
          <label>Job Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Location</label>
          <select name="location" value={formData.location} onChange={handleChange} required>
            <option value="">Select Location</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Job Type</label>
          <select name="job_type" value={formData.job_type} onChange={handleChange}>
            {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Experience Level</label>
            <select name="experience_level" value={formData.experience_level} onChange={handleChange}>
              {experienceLevels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Education Level</label>
            <select name="education_level" value={formData.education_level} onChange={handleChange}>
              <option value="">Any Education</option>
              {educationLevels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Minimum Salary (NPR)</label>
            <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Maximum Salary (NPR)</label>
            <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Required Skills (comma separated)</label>
          <input type="text" name="required_skills" value={formData.required_skills} onChange={handleChange} placeholder="JavaScript, React, Node.js" />
        </div>
        <div className="form-group">
          <label>Job Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="6" required />
        </div>
        <div className="form-group">
          <label>Benefits</label>
          <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows="4" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Vacancy</label>
            <input type="number" name="vacancy" value={formData.vacancy} onChange={handleChange} min="1" />
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Posting...' : 'Post Job'}
        </button>
      </form>
    </div>
  )
}

export default PostJob

