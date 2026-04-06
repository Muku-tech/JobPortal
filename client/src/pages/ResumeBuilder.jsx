import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, MapPin, Users, Hash, FileText, Briefcase, GraduationCap } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../styles/ResumeBuilder.css';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    github: '',
    summary: '',
    experienceTitle: '',
    experienceCompany: '',
    experienceDates: '',
    experienceDescription: '',
    educationDegree: '',
    educationInstitution: '',
    educationYear: '',
    educationDescription: '',
    skills: '',
    template: 'modern',
    fontFamily: 'Arial',
    primaryColor: '#2c3e50',
    secondaryColor: '#3498db'
  });
  const [previewTemplate, setPreviewTemplate] = useState('modern');
  const [editing, setEditing] = useState(true);
  const resumeRef = useRef(null);

  useEffect(() => {
    if (user) {
      setResumeData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      }));
    }
  }, [user]);

  const handleDownloadPdf = async () => {
    if (!resumeRef.current || !resumeData.name) {
      toast.error('Please fill your name and preview first');
      return;
    }

    setLoading(true);
    const element = resumeRef.current;
    const opt = {
      margin: [15, 20, 15, 20],
      filename: `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true 
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setLoading(false);
      toast.success('Resume downloaded successfully!');
    }).catch((err) => {
      setLoading(false);
      toast.error('PDF generation failed');
      console.error(err);
    });
  };

  if (!user || user.role !== 'jobseeker') {
    return (
      <div className="error">
        <User className="icon" size={48} />
        <p>Only Job Seekers can build resumes.</p>
      </div>
    );
  }

  return (
    <div className="resume-builder-page">
      <div className="header-row">
        <h1>
          <FileText className="header-icon" size={32} />
          Resume Builder
        </h1>
        <div className="header-actions">
          <div className="control-group">
            <label htmlFor="template-select">Template</label>
            <select 
              id="template-select"
              name="template"
              value={previewTemplate} 
              onChange={(e) => setPreviewTemplate(e.target.value)}
              className="select-control"
            >
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="creative">Creative</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="fontFamily">Font</label>
            <select 
              id="fontFamily"
              name="fontFamily"
              value={resumeData.fontFamily}
              onChange={(e) => setResumeData(p => ({...p, fontFamily: e.target.value}))}
              className="select-control"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica Neue</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="'Georgia', serif">Georgia</option>
              <option value="'Roboto', sans-serif">Roboto</option>
            </select>
          </div>

          <div className="control-group">
            <label>Primary</label>
            <input 
              type="color" 
              id="primaryColor"
              name="primaryColor"
              value={resumeData.primaryColor}
              onChange={(e) => setResumeData(p => ({...p, primaryColor: e.target.value}))}
              className="color-control"
              title="Primary Color"
            />
          </div>

          <div className="control-group">
            <label>Secondary</label>
            <input 
              type="color" 
              id="secondaryColor"
              name="secondaryColor"
              value={resumeData.secondaryColor}
              onChange={(e) => setResumeData(p => ({...p, secondaryColor: e.target.value}))}
              className="color-control"
              title="Secondary Color"
            />
          </div>

          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Preview' : 'Edit'}
          </button>
          <button onClick={handleDownloadPdf} className="btn btn-primary" disabled={loading || !resumeData.name}>
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="edit-mode">
          <section className="form-section">
            <div className="section-header">
              <User className="section-icon" size={24} />
              <h3>Personal Information</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  id="name"
                  name="name"
                  type="text"
                  value={resumeData.name}
                  onChange={(e) => setResumeData(p => ({...p, name: e.target.value}))}
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  id="email"
                  name="email"
                  type="email"
                  value={resumeData.email}
                  onChange={(e) => setResumeData(p => ({...p, email: e.target.value}))}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input 
                  id="phone"
                  name="tel"
                  type="tel"
                  value={resumeData.phone}
                  onChange={(e) => setResumeData(p => ({...p, phone: e.target.value}))}
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Location</label>
                <input 
                  id="address"
                  name="street-address"
                  type="text"
                  value={resumeData.address}
                  onChange={(e) => setResumeData(p => ({...p, address: e.target.value}))}
                  autoComplete="street-address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="linkedin">LinkedIn</label>
                <input 
                  id="linkedin"
                  name="url-linkedin"
                  type="url"
                  value={resumeData.linkedin}
                  onChange={(e) => setResumeData(p => ({...p, linkedin: e.target.value}))}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-header">
              <Hash className="section-icon" size={24} />
              <h3>Skills</h3>
            </div>
            <div className="form-group">
              <label htmlFor="skills">Skills (comma separated)</label>
              <input 
                id="skills"
                name="skills"
                type="text"
                value={resumeData.skills}
                onChange={(e) => setResumeData(p => ({...p, skills: e.target.value}))}
                placeholder="React, Node.js, JavaScript..."
              />
            </div>
          </section>

          <section className="form-section">
            <div className="section-header">
              <FileText className="section-icon" size={24} />
              <h3>Summary</h3>
            </div>
            <div className="form-group">
              <label htmlFor="summary">Professional Summary</label>
              <textarea 
                id="summary"
                name="summary"
                value={resumeData.summary}
                onChange={(e) => setResumeData(p => ({...p, summary: e.target.value}))}
                rows="4"
              />
            </div>
          </section>

          <section className="form-section">
            <div className="section-header">
              <Briefcase className="section-icon" size={24} />
              <h3>Experience</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="experienceTitle">Job Title</label>
                <input 
                  id="experienceTitle"
                  name="experienceTitle"
                  value={resumeData.experienceTitle}
                  onChange={(e) => setResumeData(p => ({...p, experienceTitle: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="experienceCompany">Company</label>
                <input 
                  id="experienceCompany"
                  name="experienceCompany"
                  value={resumeData.experienceCompany}
                  onChange={(e) => setResumeData(p => ({...p, experienceCompany: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="experienceDates">Dates</label>
                <input 
                  id="experienceDates"
                  name="experienceDates"
                  value={resumeData.experienceDates}
                  onChange={(e) => setResumeData(p => ({...p, experienceDates: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="experienceDescription">Description</label>
                <textarea 
                  id="experienceDescription"
                  name="experienceDescription"
                  value={resumeData.experienceDescription}
                  onChange={(e) => setResumeData(p => ({...p, experienceDescription: e.target.value}))}
                  rows="4"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-header">
              <GraduationCap className="section-icon" size={24} />
              <h3>Education</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="educationDegree">Degree</label>
                <input 
                  id="educationDegree"
                  name="educationDegree"
                  value={resumeData.educationDegree}
                  onChange={(e) => setResumeData(p => ({...p, educationDegree: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="educationInstitution">Institution</label>
                <input 
                  id="educationInstitution"
                  name="educationInstitution"
                  value={resumeData.educationInstitution}
                  onChange={(e) => setResumeData(p => ({...p, educationInstitution: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="educationYear">Year</label>
                <input 
                  id="educationYear"
                  name="educationYear"
                  value={resumeData.educationYear}
                  onChange={(e) => setResumeData(p => ({...p, educationYear: e.target.value}))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="educationDescription">Description</label>
                <textarea 
                  id="educationDescription"
                  name="educationDescription"
                  value={resumeData.educationDescription}
                  onChange={(e) => setResumeData(p => ({...p, educationDescription: e.target.value}))}
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button onClick={() => setEditing(false)} className="btn btn-primary">
              Preview Resume
            </button>
          </div>
        </div>
      ) : (
        <div ref={resumeRef} className={`resume-preview ${previewTemplate}`} style={{
          '--primary-color': resumeData.primaryColor,
          '--secondary-color': resumeData.secondaryColor,
          '--font-family': resumeData.fontFamily,
          fontFamily: resumeData.fontFamily
        }}>
          <header className="resume-header">
            <h1>{resumeData.name || 'Your Name'}</h1>
            <div className="contact-bar">
              {resumeData.email && <a href={`mailto:${resumeData.email}`} className="contact-link">{resumeData.email}</a>}
              {resumeData.phone && <span className="contact-link">{resumeData.phone}</span>}
              {resumeData.address && <span className="contact-link">{resumeData.address}</span>}
              {resumeData.linkedin && <a href={resumeData.linkedin} className="contact-link" target="_blank" rel="noopener noreferrer">LinkedIn</a>}
            </div>
          </header>

          {resumeData.summary && (
            <section className="summary-section">
              <h2 style={{ color: 'var(--primary-color)' }}>PROFESSIONAL SUMMARY</h2>
              <p>{resumeData.summary}</p>
            </section>
          )}

          {resumeData.skills && (
            <section className="skills-section">
              <h2 style={{ color: 'var(--primary-color)' }}>SKILLS</h2>
              <div className="skills-container">
                {resumeData.skills.split(',').filter(Boolean).map((skill, i) => (
                  <span key={i} className="skill-badge">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {resumeData.experienceTitle && (
            <section className="experience-section">
              <h2 style={{ color: 'var(--primary-color)' }}>EXPERIENCE</h2>
              <div className="job-entry">
                <div className="job-title-row">
                  <h3>{resumeData.experienceTitle}</h3>
                  <span className="job-company">{resumeData.experienceCompany}</span>
                </div>
                <div className="job-dates">{resumeData.experienceDates}</div>
                <div className="job-description">
                  {resumeData.experienceDescription.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </section>
          )}

          {resumeData.educationDegree && (
            <section className="education-section">
              <h2 style={{ color: 'var(--primary-color)' }}>EDUCATION</h2>
              <div className="education-entry">
                <div className="education-title-row">
                  <h3>{resumeData.educationDegree}</h3>
                  <span className="education-institution">{resumeData.educationInstitution}</span>
                </div>
                <div className="education-dates">{resumeData.educationYear}</div>
                <div className="education-description">
                  {resumeData.educationDescription.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;

