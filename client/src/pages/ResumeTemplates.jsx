import React from 'react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

// --- SHARED COMPONENTS ---
const ContactItem = ({ icon: Icon, text }) => {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '4px' }}>
      {Icon && <Icon size={14} />}
      <span>{text}</span>
    </div>
  );
};

const SectionHeader = ({ title, color, variant = 'modern' }) => {
  const styles = {
    modern: { borderBottom: `2px solid ${color || '#eee'}`, paddingBottom: '5px', marginBottom: '15px' },
    classic: { borderBottom: '1px solid #000', borderTop: '1px solid #000', padding: '5px 0', textAlign: 'center', margin: '20px 0 15px' }
  };
  
  return (
    <div style={styles[variant] || styles.modern}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: variant === 'classic' ? '#000' : (color || '#333'), letterSpacing: '1px' }}>
        {title.toUpperCase()}
      </h2>
    </div>
  );
};

const Entry = ({ item }) => (
  <div style={{ marginBottom: '15px', breakInside: 'avoid' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '14px' }}>
      <span>{item.title || item.name}</span>
      <span style={{ color: '#666', fontSize: '12px' }}>{item.dates}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', color: '#444', fontSize: '13px' }}>
      <span>{item.company || item.org || item.institution}</span>
      <span>{item.location}</span>
    </div>
    {item.description && (
      <p style={{ fontSize: '12.5px', marginTop: '5px', color: '#333', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
        {item.description}
      </p>
    )}
  </div>
);

// --- 1. MODERN TEMPLATE (Universal & Clean) ---
export const ModernTemplate = ({ resumeData }) => (
  <div style={{ padding: '40px', color: '#333', backgroundColor: '#fff' }}>
    <header style={{ marginBottom: '30px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: '#1a202c' }}>{resumeData.personal_info.name}</h1>
      <p style={{ fontSize: '18px', color: resumeData.primary_color, margin: '5px 0 15px', fontWeight: '500' }}>
        {resumeData.personal_info.professional_title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <ContactItem icon={Mail} text={resumeData.personal_info.email} />
        <ContactItem icon={Phone} text={resumeData.personal_info.phone} />
        <ContactItem icon={MapPin} text={resumeData.personal_info.address} />
<ContactItem icon={ExternalLink} text={resumeData.personal_info.linkedin} />
      </div>
    </header>
    
    {resumeData.summary && (
      <section style={{ marginBottom: '25px' }}>
        <SectionHeader title="Professional Profile" color={resumeData.primary_color} />
        <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{resumeData.summary}</p>
      </section>
    )}

    {['experiences', 'educations', 'projects', 'certifications'].map(key => (
      resumeData[key]?.length > 0 && (
        <section key={key} style={{ marginBottom: '25px' }}>
          <SectionHeader title={key} color={resumeData.primary_color} />
          {resumeData[key].map((item, i) => <Entry key={i} item={item} />)}
        </section>
      )
    ))}
  </div>
);

// --- 2. EXECUTIVE TEMPLATE (Sidebar Layout) ---
export const ExecutiveTemplate = ({ resumeData }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '1120px' }}>
    <aside style={{ backgroundColor: '#1e293b', color: 'white', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{resumeData.personal_info.name}</h1>
      <p style={{ opacity: 0.9, fontSize: '13px', marginBottom: '30px', color: resumeData.secondary_color }}>
        {resumeData.personal_info.professional_title}
      </p>
      
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '13px', borderBottom: '1px solid #334155', paddingBottom: '5px', marginBottom: '15px', color: resumeData.secondary_color }}>CONTACT</h3>
        <ContactItem icon={Mail} text={resumeData.personal_info.email} />
        <ContactItem icon={Phone} text={resumeData.personal_info.phone} />
        <ContactItem icon={MapPin} text={resumeData.personal_info.address} />
      </div>
      
      {resumeData.skills?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '13px', borderBottom: '1px solid #334155', paddingBottom: '5px', marginBottom: '15px', color: resumeData.secondary_color }}>SKILLS</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {resumeData.skills.map((s, i) => (
              <span key={i} style={{ fontSize: '11px', background: '#334155', padding: '3px 8px', borderRadius: '4px' }}>
                {s.title || s}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
    <main style={{ padding: '40px', backgroundColor: 'white' }}>
      {resumeData.summary && (
        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', borderBottom: `2px solid #e2e8f0`, paddingBottom: '5px', marginBottom: '10px' }}>EXECUTIVE SUMMARY</h2>
          <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{resumeData.summary}</p>
        </section>
      )}
      {['experiences', 'educations', 'projects'].map(key => (
        resumeData[key]?.length > 0 && (
          <section key={key} style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', borderBottom: `2px solid ${resumeData.primary_color}`, paddingBottom: '5px', marginBottom: '15px', color: '#1e293b' }}>
              {key.toUpperCase()}
            </h2>
            {resumeData[key].map((item, i) => <Entry key={i} item={item} />)}
          </section>
        )
      ))}
    </main>
  </div>
);

// --- 3. CLASSIC TEMPLATE (Formal & Academic) ---
export const ClassicTemplate = ({ resumeData }) => (
  <div style={{ padding: '50px', fontFamily: 'serif', color: '#000', backgroundColor: '#fff' }}>
    <header style={{ textAlign: 'center', marginBottom: '20px' }}>
      <h1 style={{ fontSize: '28px', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '2px' }}>{resumeData.personal_info.name}</h1>
      <div style={{ fontSize: '13px' }}>
        {resumeData.personal_info.address} | {resumeData.personal_info.phone} | {resumeData.personal_info.email}
      </div>
      {resumeData.personal_info.linkedin && <div style={{ fontSize: '12px' }}>{resumeData.personal_info.linkedin}</div>}
    </header>

    {['summary', 'experiences', 'educations', 'skills'].map(key => {
      if (!resumeData[key] || (Array.isArray(resumeData[key]) && resumeData[key].length === 0)) return null;
      return (
        <section key={key}>
          <SectionHeader title={key === 'summary' ? 'Professional Summary' : key} variant="classic" />
          {key === 'summary' ? (
            <p style={{ fontSize: '13px', textAlign: 'justify' }}>{resumeData.summary}</p>
          ) : key === 'skills' ? (
            <p style={{ fontSize: '13px' }}>{resumeData.skills.map(s => s.title || s).join(', ')}</p>
          ) : (
            resumeData[key].map((item, i) => <Entry key={i} item={item} />)
          )}
        </section>
      );
    })}
  </div>
);

// --- 4. CREATIVE TEMPLATE (Bold & Modern) ---
export const CreativeTemplate = ({ resumeData }) => (
  <div style={{ padding: '0', color: '#333', backgroundColor: '#fff' }}>
    <div style={{ backgroundColor: resumeData.primary_color, color: 'white', padding: '50px 40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '36px', margin: 0, letterSpacing: '1px' }}>{resumeData.personal_info.name}</h1>
      <div style={{ width: '50px', height: '4px', background: 'white', margin: '15px auto' }}></div>
      <p style={{ fontSize: '18px', opacity: 0.9, textTransform: 'uppercase' }}>{resumeData.personal_info.professional_title}</p>
    </div>
    
    <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
      <div className="left-col">
        <SectionHeader title="About Me" color={resumeData.primary_color} />
        <p style={{ fontSize: '13px', marginBottom: '30px' }}>{resumeData.summary}</p>
        
        <SectionHeader title="Contact" color={resumeData.primary_color} />
        <ContactItem icon={Mail} text={resumeData.personal_info.email} />
        <ContactItem icon={Phone} text={resumeData.personal_info.phone} />
        <ContactItem icon={ExternalLink} text={resumeData.personal_info.portfolio} />
      </div>
      <div className="right-col">
        {['experiences', 'educations'].map(key => (
          resumeData[key]?.length > 0 && (
            <section key={key} style={{ marginBottom: '30px' }}>
              <SectionHeader title={key} color={resumeData.primary_color} />
              {resumeData[key].map((item, i) => <Entry key={i} item={item} />)}
            </section>
          )
        ))}
      </div>
    </div>
  </div>
);