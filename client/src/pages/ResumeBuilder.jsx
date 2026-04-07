import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  User, FileText, Star, Trash2, Plus, Download, Eye, Edit3, Settings
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../styles/ResumeBuilder.css';
import { 
  ModernTemplate, ClassicTemplate, CreativeTemplate, ExecutiveTemplate 
} from './ResumeTemplates';

const ResumeBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(true);
  
  // Expanded Universal State
  const [resumeData, setResumeData] = useState({
    personal_info: { 
      name: '', 
      professional_title: '', 
      email: '', 
      phone: '', 
      address: '', 
      linkedin: '', 
      portfolio: '' 
    },
    summary: '',
    experiences: [],
    educations: [],
    projects: [],
    skills: [], 
    certifications: [],
    achievements: [],
    internships: [],
    publications: [],
    volunteer_experience: [],
    leadership_experience: [],
    extracurricular: [],
    languages: [],
    interests: [],
    affiliations: [],
    conferences: [],
    template: 'modern',
    font_family: "'Inter', sans-serif",
    primary_color: '#2563eb',
    secondary_color: '#64748b'
  });
  
  const resumeRef = useRef(null);
  const [previewTemplate, setPreviewTemplate] = useState('modern');

  useEffect(() => {
    if (user) {
      setResumeData(prev => ({
        ...prev,
        personal_info: {
          ...prev.personal_info,
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
        const newArr = [...(prev[section] || [])];
        newArr[index] = { ...newArr[index], ...value };
        return { ...prev, [section]: newArr };
      });
    } else {
      setResumeData(prev => ({ ...prev, [section]: value }));
    }
  };

  const addEntry = (sectionKey) => {
    const newEntry = { 
      title: '', // Works for Job Title, Degree Name, or Project Name
      company: '', // Works for Company, School, or Organization
      description: '', 
      dates: '', 
      location: ''
    };
    setResumeData(prev => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), newEntry]
    }));
  };

  const removeEntry = (sectionKey, index) => {
    setResumeData(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index)
    }));
  };

  const handleDownloadPdf = async () => {
    if (!resumeRef.current || !resumeData.personal_info.name) {
      toast.error('Please enter your name before downloading');
      return;
    }
    setLoading(true);
    const opt = {
      margin: [0, 0], // Templates handle internal padding
      filename: `${resumeData.personal_info.name.replace(/\s+/g, '_')}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(resumeRef.current).save();
      toast.success('Resume downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'jobseeker') {
    return (
      <div className="error-container">
        <User size={48} />
        <p>Access Denied: Job Seekers Only</p>
      </div>
    );
  }

  return (
    <div className="resume-builder-page">
      <div className="header-row">
        <div className="title-area">
          <h1><FileText size={28} /> Resume Builder</h1>
          <p>Create a professional resume for any industry</p>
        </div>
        
        <div className="header-actions">
          <div className="action-group">
            <label><Settings size={14} /> Template</label>
            <select value={previewTemplate} onChange={(e) => setPreviewTemplate(e.target.value)} className="select-control">
              <option value="modern">Modern Professional</option>
              <option value="executive">Executive Sidebar</option>
              <option value="classic">Classic Formal</option>
              <option value="creative">Creative Layout</option>
            </select>
          </div>

          <div className="action-group">
            <label>Theme</label>
            <input type="color" value={resumeData.primary_color} onChange={(e) => handleDataChange('primary_color', e.target.value)} />
          </div>

          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? <><Eye size={18} /> Preview</> : <><Edit3 size={18} /> Edit</>}
          </button>
          
          <button onClick={handleDownloadPdf} disabled={loading} className="btn btn-primary">
            {loading ? 'Processing...' : <><Download size={18} /> Download PDF</>}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="form-container">
          {/* 1. Contact Information */}
          <section className="form-section">
            <div className="section-title"><User size={20} /> <h3>Contact Details</h3></div>
            <div className="form-grid">
              <div className="input-group">
                <label>Full Name</label>
                <input value={resumeData.personal_info.name} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Professional Title</label>
                <input placeholder="e.g. Dental Surgeon / Home Baker / MERN Developer" value={resumeData.personal_info.professional_title} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, professional_title: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input value={resumeData.personal_info.email} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Phone</label>
                <input value={resumeData.personal_info.phone} onChange={(e) => handleDataChange('personal_info', { ...resumeData.personal_info, phone: e.target.value })} />
              </div>
            </div>
          </section>

          {/* 2. Professional Summary */}
          <section className="form-section">
            <div className="section-title"><Star size={20} /> <h3>Summary</h3></div>
            <textarea 
              placeholder="Briefly describe your professional background and key strengths..."
              rows="4" 
              value={resumeData.summary} 
              onChange={(e) => handleDataChange('summary', e.target.value)} 
            />
          </section>

          {/* 3. ALL SECTIONS - Dynamic Form Builder */}
          {[
            { key: 'experiences', title: 'Work Experience', icon: <FileText size={20} /> },
            { key: 'internships', title: 'Internships', icon: <FileText size={20} /> },
            { key: 'educations', title: 'Education', icon: <FileText size={20} /> },
            { key: 'projects', title: 'Projects', icon: <FileText size={20} /> },
            { key: 'certifications', title: 'Certifications', icon: <FileText size={20} /> },
            { key: 'achievements', title: 'Achievements/Awards', icon: <FileText size={20} /> },
            { key: 'publications', title: 'Publications/Research', icon: <FileText size={20} /> },
            { key: 'volunteer_experience', title: 'Volunteer Experience', icon: <FileText size={20} /> },
            { key: 'leadership_experience', title: 'Leadership Experience', icon: <FileText size={20} /> },
            { key: 'extracurricular', title: 'Extracurricular Activities', icon: <FileText size={20} /> },
            { key: 'languages', title: 'Languages', icon: <FileText size={20} /> },
            { key: 'interests', title: 'Interests/Hobbies', icon: <FileText size={20} /> },
            { key: 'affiliations', title: 'Professional Affiliations', icon: <FileText size={20} /> },
            { key: 'conferences', title: 'Conferences/Workshops', icon: <FileText size={20} /> }
          ].map(({ key, title, icon }) => (
            <section key={key} className="form-section">
              <div className="section-title">
                {icon}
                <h3>{title}</h3>
              </div>
              {resumeData[key].map((entry, i) => (
                <div key={i} className="subsection-card">
                  <div className="card-header">
                    <span>Entry #{i + 1}</span>
                    <button className="btn-delete" onClick={() => removeEntry(key, i)}><Trash2 size={16} /></button>
                  </div>
                  <div className="form-grid">
                    <input placeholder="Title / Role / Degree" value={entry.title} onChange={(e) => handleDataChange(key, { title: e.target.value }, i)} />
                    <input placeholder="Company / Institution" value={entry.company} onChange={(e) => handleDataChange(key, { company: e.target.value }, i)} />
                    <input placeholder="Duration (e.g. 2022 - Present)" value={entry.dates} onChange={(e) => handleDataChange(key, { dates: e.target.value }, i)} />
                  </div>
                  <textarea 
                    placeholder="Key responsibilities or achievements (Tip: Use '•' for bullets)" 
                    value={entry.description} 
                    onChange={(e) => handleDataChange(key, { description: e.target.value }, i)} 
                  />
                </div>
              ))}
              <button onClick={() => addEntry(key)} className="btn-add"><Plus size={16} /> Add {key.slice(0, -1)}</button>
            </section>
          ))}
        </div>
      ) : (
        <div className="preview-canvas">
          <div 
            ref={resumeRef} 
            className="resume-preview-wrapper"
            style={{ '--primary-color': resumeData.primary_color }}
          >
            {previewTemplate === 'modern' && <ModernTemplate resumeData={resumeData} />}
            {previewTemplate === 'executive' && <ExecutiveTemplate resumeData={resumeData} />}
            {previewTemplate === 'classic' && <ClassicTemplate resumeData={resumeData} />}
            {previewTemplate === 'creative' && <CreativeTemplate resumeData={resumeData} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;