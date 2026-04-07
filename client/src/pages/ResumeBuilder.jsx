import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Phone, MapPin, FileText, Briefcase, GraduationCap, Code, Award, Folder, BookOpen, Heart, Globe, Star, Users2, Zap, Calendar, Trash2, Download, Plus } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../styles/ResumeBuilder.css';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(true);
  const [resumeData, setResumeData] = useState({
    personal_info: {
      name: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      portfolio: ''
    },
    summary: '',
    skills: [],
    technical_skills: [],
    experiences: [],
    educations: [],
    projects: [],
    certifications: [],
    achievements: [],
    internships: [],
    publications: [],
    volunteer_experience: [],
    leadership_experience: [],
    extracurricular_activities: [],
    languages: [],
    interests: [],
    affiliations: [],
    conferences: [],
    template: 'modern',
    font_family: 'Arial, sans-serif',
    primary_color: '#2c3e50',
    secondary_color: '#3498db'
  });
  const resumeRef = useRef(null);
  const [previewTemplate, setPreviewTemplate] = useState('modern');
  const [showSections, setShowSections] = useState({});

  useEffect(() => {
    if (user) {
      setResumeData(prev => ({
        ...prev,
        personal_info: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || ''
        }
      }));
    }
  }, [user]);

  const handleDataChange = (section, value, index = null) => {
    if (index !== null) {
      setResumeData(prev => {
        const arr = prev[section] || [];
        const newArr = [...arr];
        newArr[index] = { ...newArr[index], ...value };
        return { ...prev, [section]: newArr };
      });
    } else {
      setResumeData(prev => ({ ...prev, [section]: value }));
    }
  };

  const addEntry = (sectionKey) => {
    const newEntry = { title: '', description: '', dates: '' };
    setResumeData(prev => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), newEntry]
    }));
  };

  const removeEntry = (sectionKey, index) => {
    setResumeData(prev => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || []).filter((_, i) => i !== index)
    }));
  };

  const toggleSection = (sectionKey) => {
    setShowSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const handleDownloadPdf = async () => {
    if (!resumeRef.current || !resumeData.personal_info.name) {
      toast.error('Please fill your name and preview first');
      return;
    }
    setLoading(true);
    const opt = {
      margin: [15, 20],
      filename: `${resumeData.personal_info.name.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(resumeRef.current).save().then(() => {
      toast.success('Resume downloaded successfully!');
      setLoading(false);
    }).catch(() => {
      toast.error('PDF generation failed');
      setLoading(false);
    });
  };

  if (!user || user.role !== 'jobseeker') {
    return (
      <div className="error">
        <User size={48} />
        <p>Only Job Seekers can use Resume Builder</p>
      </div>
    );
  }

  const sections = {
    core: [
      { key: 'summary', label: 'Professional Summary', single: true },
      { key: 'skills', label: 'Skills / Core Competencies' },
      { key: 'experiences', label: 'Work Experience' },
      { key: 'educations', label: 'Education' }
    ],
    supporting: [
      { key: 'projects', label: 'Projects' },
      { key: 'certifications', label: 'Certifications / Licenses' },
      { key: 'achievements', label: 'Achievements / Awards' },
      { key: 'internships', label: 'Internships / Training' }
    ],
    optional: [
      { key: 'technical_skills', label: 'Technical Skills (IT roles)' },
      { key: 'publications', label: 'Publications / Research' },
      { key: 'volunteer_experience', label: 'Volunteer Experience' },
      { key: 'leadership_experience', label: 'Leadership Experience' },
      { key: 'extracurricular_activities', label: 'Extracurricular Activities' },
      { key: 'languages', label: 'Languages' },
      { key: 'interests', label: 'Interests / Hobbies' }
    ],
    advanced: [
      { key: 'affiliations', label: 'Professional Affiliations' },
      { key: 'conferences', label: 'Conferences / Workshops' }
    ]
  };

  const sectionKeys = Object.values(sections).flat().map(s => s.key);

  return (
    <div className="resume-builder-page">
      <div className="header-row">
        <h1><FileText size={32} /> Resume Builder</h1>
        <div className="header-actions">
          <div className="control-group">
            <label>Template</label>
            <select value={previewTemplate} onChange={(e) => setPreviewTemplate(e.target.value)} className="select-control">
              <option value="modern">Modern</option>
              <option value="classic">Classic</option>
              <option value="creative">Creative</option>
              <option value="executive">Executive</option>
            </select>
          </div>
          <input type="color" value={resumeData.primary_color} onChange={(e) => handleDataChange('primary_color', e.target.value)} title="Primary Color" />
          <input type="color" value={resumeData.secondary_color} onChange={(e) => handleDataChange('secondary_color', e.target.value)} title="Secondary Color" />
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Preview' : 'Edit'}
          </button>
          <button onClick={handleDownloadPdf} disabled={loading || !resumeData.personal_info.name} className="btn btn-primary">
            {loading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {editing ? (
        <>
          {/* Personal Info */}
          <section className="form-section">
            <div className="section-header">
              <User size={24} />
              <h3>Contact Information</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input value={resumeData.personal_info.name} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={resumeData.personal_info.email} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={resumeData.personal_info.phone} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={resumeData.personal_info.address} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input type="url" value={resumeData.personal_info.linkedin} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, linkedin: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Portfolio/GitHub</label>
                <input type="url" value={resumeData.personal_info.portfolio} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, portfolio: e.target.value })} />
              </div>
            </div>
          </section>

          {/* Core Sections */}
          <h3>Core Resume Sections</h3>
{sections.core.map(section => (
            <section key={section.key} className="form-section">
              <div className="section-header">
                <FileText size={24} />
                <h3>{section.label}</h3>
              </div>
              {section.single ? (
                <textarea 
                  value={resumeData[section.key]} 
                  onChange={(e) => handleDataChange(section.key, e.target.value)}
                  placeholder={`Enter your ${section.label.toLowerCase()}...`}
                  rows="4"
                />
              ) : (
                <>
                  {(resumeData[section.key] || []).map((entry, i) => (
                    <div key={i} className="subsection">
                      <div className="subsection-header">
                        <h4>{section.label} #{i + 1}</h4>
                        <button onClick={() => removeEntry(section.key, i)} className="btn-sm">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Title / Role</label>
                          <input value={entry.title || ''} onChange={(e) => handleDataChange(section.key, { title: e.target.value }, i)} />
                        </div>
                        <div className="form-group">
                          <label>Company / Institution</label>
                          <input value={entry.company || ''} onChange={(e) => handleDataChange(section.key, { company: e.target.value }, i)} />
                        </div>
                        <div className="form-group">
                          <label>Dates</label>
                          <input value={entry.dates || ''} onChange={(e) => handleDataChange(section.key, { dates: e.target.value }, i)} placeholder="2020 - Present" />
                        </div>
                        <textarea 
                          value={entry.description || ''} 
                          onChange={(e) => handleDataChange(section.key, { description: e.target.value }, i)}
                          placeholder="Description..."
                          rows="3"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addEntry(section.key)} className="btn btn-secondary">
                    <Plus size={16} /> Add {section.label}
                  </button>
                </>
              )}
            </section>
          ))}

          {/* Supporting Sections */}
          <h3>Supporting Sections</h3>
          {sections.supporting.map(section => (
            <section key={section.key} className="form-section">
              <div className="section-header">
                <Star size={24} />
                <h3>{section.label}</h3>
              </div>
              {(resumeData[section.key] || []).map((entry, i) => (
                <div key={i} className="subsection">
                  <div className="subsection-header">
                    <h4>{section.label} #{i + 1}</h4>
                    <button onClick={() => removeEntry(section.key, i)} className="btn-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Title</label>
                      <input value={entry.title || ''} onChange={(e) => handleDataChange(section.key, { title: e.target.value }, i)} />
                    </div>
                    <div className="form-group">
                      <label>Organization</label>
                      <input value={entry.org || ''} onChange={(e) => handleDataChange(section.key, { org: e.target.value }, i)} />
                    </div>
                    <textarea 
                      value={entry.description || ''} 
                      onChange={(e) => handleDataChange(section.key, { description: e.target.value }, i)}
                      rows="3"
                    />
                  </div>
                </div>
              ))}
              <button onClick={() => addEntry(section.key)} className="btn btn-secondary">
                <Plus size={16} /> Add {section.label}
              </button>
            </section>
          ))}

          {/* Optional & Advanced - Collapsible */}
          <h3>Optional & Advanced Sections</h3>
          {[...sections.optional, ...sections.advanced].map(section => (
            <div key={section.key} className="collapsible-section">
              <button className="section-toggle" onClick={() => toggleSection(section.key)}>
                {showSections[section.key] ? '−' : '+'} {section.label}
              </button>
              {showSections[section.key] && (
                <div className="section-content">
                  {(resumeData[section.key] || []).map((entry, i) => (
                    <div key={i} className="subsection">
                      <div className="subsection-header">
                        <h4>{section.label} #{i + 1}</h4>
                        <button onClick={() => removeEntry(section.key, i)} className="btn-sm">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Title / Name</label>
                          <input value={entry.name || entry.title || ''} onChange={(e) => handleDataChange(section.key, { title: e.target.value }, i)} />
                        </div>
                        <div className="form-group">
                          <label>Level / Proficiency</label>
                          <input value={entry.proficiency || ''} onChange={(e) => handleDataChange(section.key, { proficiency: e.target.value }, i)} />
                        </div>
                        <textarea 
                          value={entry.description || ''} 
                          onChange={(e) => handleDataChange(section.key, { description: e.target.value }, i)}
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addEntry(section.key)} className="btn btn-secondary">
                    <Plus size={16} /> Add {section.label}
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      ) : (
        <div ref={resumeRef} className={`resume-preview ${previewTemplate}`} style={{
          '--primary-color': resumeData.primary_color,
          '--secondary-color': resumeData.secondary_color,
          '--font-family': resumeData.font_family,
          fontFamily: resumeData.font_family
        }}>
          {/* Header */}
          <header className="resume-header">
            <h1>{resumeData.personal_info.name || 'Your Name'}</h1>
            <div className="contact-bar">
              {resumeData.personal_info.email && <span>{resumeData.personal_info.email}</span>}
              {resumeData.personal_info.phone && <span>{resumeData.personal_info.phone}</span>}
              {resumeData.personal_info.address && <span>{resumeData.personal_info.address}</span>}
              {resumeData.personal_info.linkedin && <a href={resumeData.personal_info.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {resumeData.personal_info.portfolio && <a href={resumeData.personal_info.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a>}
            </div>
          </header>

          {/* Dynamic Section Rendering */}
          {sectionKeys.map(key => {
            const items = resumeData[key] || [];
            if (items.length === 0) return null;
            
            const titleMap = {
              'summary': 'PROFESSIONAL SUMMARY',
              'skills': 'SKILLS',
              'experiences': 'PROFESSIONAL EXPERIENCE',
              'educations': 'EDUCATION'
            };
            
            return (
              <section key={key} className="preview-section">
                <h2 style={{ color: 'var(--primary-color)' }}>
                  {titleMap[key] || key.toUpperCase().replace(/_/g, ' ')}
                </h2>
                {items.map((item, i) => (
                  <div key={i} className="preview-entry">
                    <h3>{item.title || item.name || 'Entry'}</h3>
                    {(item.company || item.institution || item.org) && (
                      <span className="preview-meta">{item.company || item.institution || item.org}</span>
                    )}
                    {item.dates && <span className="preview-dates">{item.dates}</span>}
                    {(item.proficiency || item.level) && <span className="preview-meta">{item.proficiency || item.level}</span>}
                    {item.description && <p>{item.description}</p>}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;

