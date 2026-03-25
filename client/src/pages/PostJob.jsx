import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Briefcase, MapPin, DollarSign, List, 
  Calendar, Users, Info, ArrowLeft, Send 
} from 'lucide-react'
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
  const [success, setSuccess] = useState('')

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
      setSuccess('Job vacancy posted successfully!')
      setTimeout(() => navigate('/employer'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="post-job-root">
      <div className="post-job-container">
        
        <button onClick={() => navigate('/employer')} className="btn-back">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="post-job-card">
          <header className="form-header">
            <div className="header-icon"><Briefcase size={32} /></div>
            <div>
              <h1>Post a New Vacancy</h1>
              <p>Find the right talent across Nepal with JobSathi</p>
            </div>
          </header>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <form onSubmit={handleSubmit} className="job-post-form">
            
            {/* SECTION 1: CORE INFO */}
            <div className="form-section">
              <h3 className="section-title"><Info size={20} /> Basic Information</h3>
              <div className="input-group">
                <label>Job Title*</label>
                <input type="text" name="title" placeholder="e.g. Senior React Developer" value={formData.title} onChange={handleChange} required />
              </div>
              
              <div className="input-grid">
                <div className="input-group">
                  <label>Location*</label>
                  <select name="location" value={formData.location} onChange={handleChange} required>
                    <option value="">Select City</option>
                    {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Category*</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: REQUIREMENTS */}
            <div className="form-section">
              <h3 className="section-title"><List size={20} /> Requirements & Pay</h3>
              <div className="input-grid">
                <div className="input-group">
                  <label>Job Type</label>
                  <select name="job_type" value={formData.job_type} onChange={handleChange}>
                    {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Experience Level</label>
                  <select name="experience_level" value={formData.experience_level} onChange={handleChange}>
                    {experienceLevels.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-grid">
                <div className="input-group">
                  <label>Min Salary (NPR)</label>
                  <div className="price-input">
                    <span className="unit">Rs.</span>
                    <input type="number" name="salary_min" value={formData.salary_min} onChange={handleChange} placeholder="0" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Max Salary (NPR)</label>
                  <div className="price-input">
                    <span className="unit">Rs.</span>
                    <input type="number" name="salary_max" value={formData.salary_max} onChange={handleChange} placeholder="Any" />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Required Skills (Comma separated)</label>
                <input type="text" name="required_skills" value={formData.required_skills} onChange={handleChange} placeholder="React, Node.js, SQL" />
                <small>Separate skills with commas (e.g. Photoshop, Figma)</small>
              </div>
            </div>

            {/* SECTION 3: DETAILS */}
            <div className="form-section">
              <h3 className="section-title"><Calendar size={20} /> Final Details</h3>
              <div className="input-group">
                <label>Job Description*</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Key responsibilities..." required />
              </div>
              
              <div className="input-grid">
                <div className="input-group">
                  <label>Vacancies</label>
                  <input type="number" name="vacancy" value={formData.vacancy} onChange={handleChange} min="1" />
                </div>
                <div className="input-group">
                  <label>Deadline</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-publish" disabled={loading}>
                {loading ? 'Publishing...' : <><Send size={18} /> Publish Vacancy</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PostJob