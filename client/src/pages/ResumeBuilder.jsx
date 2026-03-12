import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import html2pdf from 'html2pdf.js';
import '../styles/ResumeBuilder.css';

function ResumeBuilder() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const resumeRef = useRef(null);

    const handleDownloadPdf = () => {
        if (!resumeRef.current) return;

        setLoading(true);
        const element = resumeRef.current;
        const opt = {
            margin: 10,
            filename: `${user?.name?.replace(/\s+/g, '_')}_Resume.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setLoading(false);
        });
    };

    if (user?.role !== 'jobseeker') {
        return <div className="loading">Only Job Seekers can build resumes.</div>;
    }

    return (
        <div className="resume-builder-page" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Resume Builder</h1>
                <button
                    onClick={handleDownloadPdf}
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Generating PDF...' : 'Download as PDF'}
                </button>
            </div>

            {/* The Printable Resume Area */}
            <div
                ref={resumeRef}
                style={{
                    background: 'white',
                    padding: '40px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: '#333',
                    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                }}
            >
                {/* Header */}
                <div style={{ borderBottom: '2px solid #e63946', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h1 style={{ color: '#e63946', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{user?.name || 'Your Name'}</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', color: '#666' }}>
                        {user?.email && <span>📧 {user.email}</span>}
                        {user?.phone && <span>📱 {user.phone}</span>}
                        {user?.address && <span>📍 {user.address}</span>}
                    </div>
                </div>

                {/* Professional Summary */}
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ color: '#1d3557', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Professional Summary</h2>
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {user?.experience || 'No experience summary provided. Please update your profile.'}
                    </p>
                </div>

                {/* Education */}
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ color: '#1d3557', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Education</h2>
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {user?.education || 'No education history provided. Please update your profile.'}
                    </p>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ color: '#1d3557', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Skills</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {user?.skills?.length > 0 ? (
                            user.skills.map((skill, i) => (
                                <span key={i} style={{ background: '#f1f5f9', padding: '5px 12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    {skill}
                                </span>
                            ))
                        ) : (
                            <p>No skills provided.</p>
                        )}
                    </div>
                </div>

                {/* Languages */}
                {user?.languages?.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <h2 style={{ color: '#1d3557', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Languages</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {user.languages.map((lang, i) => (
                                <span key={i} style={{ background: '#e0e7ff', color: '#3730a3', padding: '5px 12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fffbeb', color: '#b45309', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <strong>Note:</strong> To update the information generated on this resume, please go to the <strong>Edit Profile</strong> section on your Profile page.
            </div>
        </div>
    );
}

export default ResumeBuilder;
