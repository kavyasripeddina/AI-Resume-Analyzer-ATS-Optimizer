import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { analysisService } from '../services/services';

const defaultData = {
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
  summary: '',
  experience: [{ id: Date.now(), company: '', role: '', startDate: '', endDate: '', description: '' }],
  education: [{ id: Date.now() + 1, institution: '', degree: '', year: '', gpa: '' }],
  skills: '',
  projects: [{ id: Date.now() + 2, name: '', description: '', link: '', tech: '' }]
};

const BuilderPage = () => {
  // --- Profile Management State ---
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('ats_resume_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse profiles");
      }
    }
    // Default to one basic profile
    return [{ id: 'default-1', title: 'My Base Resume', data: defaultData }];
  });

  const [activeProfileId, setActiveProfileId] = useState(profiles[0]?.id || 'default-1');
  const [activeSegment, setActiveSegment] = useState('personal');
  const [templateTheme, setTemplateTheme] = useState(() => localStorage.getItem('ats_builder_theme') || 'classic');

  useEffect(() => {
    localStorage.setItem('ats_builder_theme', templateTheme);
  }, [templateTheme]);

  // Sync profiles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ats_resume_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Derived active profile
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const data = activeProfile.data;

  // --- Profile Actions ---
  const handleCreateProfile = () => {
    const newId = `profile-${Date.now()}`;
    setProfiles(prev => [
      ...prev,
      { id: newId, title: 'New Targeted Resume', data: defaultData }
    ]);
    setActiveProfileId(newId);
    toast.success('New blank resume created');
  };

  const handleDuplicateProfile = () => {
    const newId = `profile-${Date.now()}`;
    setProfiles(prev => [
      ...prev,
      { id: newId, title: `${activeProfile.title} (Copy)`, data: JSON.parse(JSON.stringify(activeProfile.data)) }
    ]);
    setActiveProfileId(newId);
    toast.success('Resume duplicated for tailoring!');
  };

  const handleDeleteProfile = () => {
    if (profiles.length <= 1) {
      toast.error('You must have at least one resume profile.');
      return;
    }
    if (window.confirm('Delete this resume profile? This cannot be undone.')) {
      const newProfiles = profiles.filter(p => p.id !== activeProfileId);
      setProfiles(newProfiles);
      setActiveProfileId(newProfiles[0].id);
      toast.success('Resume deleted');
    }
  };

  const handleRenameProfile = (e) => {
    const newTitle = e.target.value;
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, title: newTitle } : p));
  };

  const [isTailoring, setIsTailoring] = useState(false);

  const handleAutoTailor = async () => {
    if (!activeProfile.title || activeProfile.title.toLowerCase().includes('base')) {
      toast.error('Please rename your profile to the target job title (e.g., "Software Developer") first!');
      return;
    }
    
    setIsTailoring(true);
    const toastId = toast.loading('AI is tailoring your resume to match the role: ' + activeProfile.title + '...');
    
    try {
      const res = await analysisService.tailorBuilder(data, activeProfile.title);
      
      setProfiles(prev => prev.map(p => {
        if (p.id !== activeProfileId) return p;
        return { ...p, data: res.tailoredData };
      }));
      
      toast.success('Resume successfully tailored for ' + activeProfile.title + '! 🎉', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to auto-tailor resume. Ensure AI is online.', { id: toastId });
    } finally {
      setIsTailoring(false);
    }
  };

  // --- Data Editing Actions ---
  const updateData = (newDataOrUpdater) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      const newData = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(p.data) : newDataOrUpdater;
      return { ...p, data: newData };
    }));
  };

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    updateData(prev => ({ ...prev, personal: { ...prev.personal, [name]: value } }));
  };

  const handleArrayChange = (field, id, e) => {
    const { name, value } = e.target;
    updateData(prev => ({
      ...prev,
      [field]: prev[field].map(item => item.id === id ? { ...item, [name]: value } : item)
    }));
  };

  const addArrayItem = (field, template) => {
    updateData(prev => ({
      ...prev,
      [field]: [...prev[field], { id: Date.now(), ...template }]
    }));
  };

  const removeArrayItem = (field, id) => {
    updateData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item.id !== id)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const themeConfig = {
    classic: {
      fontMain: "'Times New Roman', Times, serif",
      fontHeader: "Arial, sans-serif",
      headerAlign: "center",
      borderColor: "#000",
      borderStyle: "1px solid #000"
    },
    modern: {
      fontMain: "Arial, Helvetica, sans-serif",
      fontHeader: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      headerAlign: "left",
      borderColor: "#333",
      borderStyle: "2px solid #333"
    },
    executive: {
      fontMain: "Georgia, serif",
      fontHeader: "Georgia, serif",
      headerAlign: "center",
      borderColor: "#666",
      borderStyle: "1px solid #666"
    }
  };
  const activeStyles = themeConfig[templateTheme] || themeConfig.classic;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }} className="builder-layout">
      
      {/* LEFT PANE: Editor (Hidden on print) */}
      <div className="no-print" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        borderRight: '1px solid var(--color-border)',
        padding: '24px',
        maxWidth: '520px',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: '800' }}>
            ATS Builder
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              className="input-field" 
              value={templateTheme} 
              onChange={(e) => setTemplateTheme(e.target.value)}
              style={{ padding: '8px', fontSize: '0.85rem', width: '130px', cursor: 'pointer' }}
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="executive">Executive</option>
            </select>
            <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🖨️ Export PDF
            </button>
          </div>
        </div>

        {/* Profile Manager */}
        <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
          <label className="input-label" style={{ fontSize: '0.75rem' }}>Current Target Role / Profile</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <select 
              className="input-field" 
              value={activeProfileId} 
              onChange={(e) => setActiveProfileId(e.target.value)}
              style={{ flex: 1, padding: '8px', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          
          <input 
            className="input-field" 
            value={activeProfile.title} 
            onChange={handleRenameProfile}
            placeholder="E.g. Frontend Engineer Version"
            style={{ marginBottom: '12px', padding: '8px', fontSize: '0.85rem' }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCreateProfile} className="btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
              New
            </button>
            <button onClick={handleDuplicateProfile} className="btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
              📋 Copy
            </button>
            <button onClick={handleAutoTailor} disabled={isTailoring} className="btn-primary" style={{ flex: 1, padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}>
              {isTailoring ? '⏳ Wait...' : '✨ AI Tailor'}
            </button>
            <button onClick={handleDeleteProfile} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              🗑
            </button>
          </div>
        </div>

        {/* Sections Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
          {['personal', 'summary', 'experience', 'education', 'skills', 'projects'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSegment(tab)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: activeSegment === tab ? 'var(--gradient-primary)' : 'var(--color-surface-2)',
                color: activeSegment === tab ? 'white' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
                fontWeight: activeSegment === tab ? '600' : '500'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Context-aware Form Rendering */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PERSONAL INFO */}
          {activeSegment === 'personal' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="input-label">Full Name</label>
                <input name="name" value={data.personal.name} onChange={handlePersonalChange} className="input-field" placeholder="John Doe" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Email</label>
                  <input name="email" value={data.personal.email} onChange={handlePersonalChange} className="input-field" placeholder="john@example.com" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Phone</label>
                  <input name="phone" value={data.personal.phone} onChange={handlePersonalChange} className="input-field" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <label className="input-label">Location</label>
                <input name="location" value={data.personal.location} onChange={handlePersonalChange} className="input-field" placeholder="San Francisco, CA" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">LinkedIn</label>
                  <input name="linkedin" value={data.personal.linkedin} onChange={handlePersonalChange} className="input-field" placeholder="linkedin.com/in/johndoe" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">GitHub/Portfolio</label>
                  <input name="github" value={data.personal.github} onChange={handlePersonalChange} className="input-field" placeholder="github.com/johndoe" />
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY */}
          {activeSegment === 'summary' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="input-label">Professional Summary</label>
              </div>
              <textarea 
                value={data.summary} 
                onChange={(e) => updateData(prev => ({...prev, summary: e.target.value}))} 
                className="input-field" 
                rows="8" 
                placeholder="Brief overview of your professional background, goals, and core strengths... Tailor this to the specific job role!"
                style={{ resize: 'vertical' }}
              />
            </div>
          )}

          {/* EXPERIENCE */}
          {activeSegment === 'experience' && (
            <div className="animate-fade-in">
              {data.experience.map((exp, i) => (
                <div key={exp.id} className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-primary)' }}>Experience #{i + 1}</h4>
                    <button onClick={() => removeArrayItem('experience', exp.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><input name="company" value={exp.company} onChange={(e) => handleArrayChange('experience', exp.id, e)} className="input-field" placeholder="Company Name" style={{ padding: '10px' }} /></div>
                    <div style={{ flex: 1 }}><input name="role" value={exp.role} onChange={(e) => handleArrayChange('experience', exp.id, e)} className="input-field" placeholder="Job Title" style={{ padding: '10px' }} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><input name="startDate" value={exp.startDate} onChange={(e) => handleArrayChange('experience', exp.id, e)} className="input-field" placeholder="Start (e.g. Jan 2020)" style={{ padding: '10px' }} /></div>
                    <div style={{ flex: 1 }}><input name="endDate" value={exp.endDate} onChange={(e) => handleArrayChange('experience', exp.id, e)} className="input-field" placeholder="End (e.g. Present)" style={{ padding: '10px' }} /></div>
                  </div>
                  <div>
                    <textarea name="description" value={exp.description} onChange={(e) => handleArrayChange('experience', exp.id, e)} className="input-field" rows="5" placeholder="- Developed scalable backend services...&#10;- Improved application performance by..." style={{ resize: 'vertical', padding: '10px' }} />
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('experience', { company: '', role: '', startDate: '', endDate: '', description: '' })} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>+ Add Experience</button>
            </div>
          )}

          {/* EDUCATION */}
          {activeSegment === 'education' && (
            <div className="animate-fade-in">
              {data.education.map((edu, i) => (
                <div key={edu.id} className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-primary)' }}>Education #{i + 1}</h4>
                    <button onClick={() => removeArrayItem('education', edu.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                  <input name="institution" value={edu.institution} onChange={(e) => handleArrayChange('education', edu.id, e)} className="input-field" placeholder="University/Institution" style={{ padding: '10px' }} />
                  <input name="degree" value={edu.degree} onChange={(e) => handleArrayChange('education', edu.id, e)} className="input-field" placeholder="Degree (e.g. B.S. Computer Science)" style={{ padding: '10px' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><input name="year" value={edu.year} onChange={(e) => handleArrayChange('education', edu.id, e)} className="input-field" placeholder="Graduation Year" style={{ padding: '10px' }} /></div>
                    <div style={{ flex: 1 }}><input name="gpa" value={edu.gpa} onChange={(e) => handleArrayChange('education', edu.id, e)} className="input-field" placeholder="GPA (Optional)" style={{ padding: '10px' }} /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem('education', { institution: '', degree: '', year: '', gpa: '' })} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>+ Add Education</button>
            </div>
          )}

          {/* SKILLS */}
          {activeSegment === 'skills' && (
            <div className="animate-fade-in">
               <label className="input-label">Technical & Core Skills</label>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                 Make sure to include exact keywords requested in the job description!
               </p>
               <textarea 
                  value={data.skills} 
                  onChange={(e) => updateData(prev => ({...prev, skills: e.target.value}))} 
                  className="input-field" 
                  rows="8" 
                  placeholder="Languages: JavaScript, Python, Java&#10;Frontend: React, Vue, HTML/CSS&#10;Backend: Node.js, Express, MongoDB&#10;Tools: Git, Docker, CI/CD"
                  style={{ resize: 'vertical', fontFamily: 'monospace' }}
                />
            </div>
          )}

          {/* PROJECTS */}
          {activeSegment === 'projects' && (
            <div className="animate-fade-in">
              {data.projects.map((proj, i) => (
                <div key={proj.id} className="glass-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-primary)' }}>Project #{i + 1}</h4>
                    <button onClick={() => removeArrayItem('projects', proj.id)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}><input name="name" value={proj.name} onChange={(e) => handleArrayChange('projects', proj.id, e)} className="input-field" placeholder="Project Name" style={{ padding: '10px' }} /></div>
                    <div style={{ flex: 1 }}><input name="link" value={proj.link} onChange={(e) => handleArrayChange('projects', proj.id, e)} className="input-field" placeholder="Project Link" style={{ padding: '10px' }} /></div>
                  </div>
                  <input name="tech" value={proj.tech} onChange={(e) => handleArrayChange('projects', proj.id, e)} className="input-field" placeholder="Technologies used (e.g. React, Node.js, AWS)" style={{ padding: '10px' }} />
                  <textarea name="description" value={proj.description} onChange={(e) => handleArrayChange('projects', proj.id, e)} className="input-field" rows="4" placeholder="- What did you build and why?&#10;- Solved X problem using Y..." style={{ resize: 'vertical', padding: '10px' }} />
                </div>
              ))}
              <button onClick={() => addArrayItem('projects', { name: '', description: '', link: '', tech: '' })} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>+ Add Project</button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Live Preview (Prints strictly standard) */}
      <div className="preview-pane-scroll" style={{ 
        flex: 1, 
        padding: '32px', 
        overflowY: 'auto',
        background: 'var(--color-bg)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}>
        {/* Actual A4 Resume Card */}
        <div className="resume-print-card animate-fade-in" style={{
            background: 'white',
            color: 'black',
            width: '100%',
            maxWidth: '850px',
            minHeight: '1100px',
            padding: '48px',
            boxShadow: 'var(--shadow-lg)',
            fontFamily: activeStyles.fontMain,
            lineHeight: '1.5',
            borderRadius: '4px'
        }}>
          {/* Header */}
          <div style={{ textAlign: activeStyles.headerAlign, borderBottom: activeStyles.borderStyle, paddingBottom: '12px', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: activeStyles.fontHeader }}>
              {data.personal.name || 'YOUR NAME'}
            </h1>
            <div style={{ fontSize: '11pt', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
              {data.personal.email && <span>{data.personal.email}</span>}
              {data.personal.email && data.personal.phone && <span>|</span>}
              {data.personal.phone && <span>{data.personal.phone}</span>}
              {(data.personal.email || data.personal.phone) && data.personal.location && <span>|</span>}
              {data.personal.location && <span>{data.personal.location}</span>}
            </div>
            <div style={{ fontSize: '11pt', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {data.personal.linkedin && <span>{data.personal.linkedin}</span>}
              {data.personal.linkedin && data.personal.github && <span>|</span>}
              {data.personal.github && <span>{data.personal.github}</span>}
            </div>
          </div>

          {/* Summary */}
          {data.summary && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: activeStyles.borderStyle, margin: '0 0 8px 0', paddingBottom: '2px', fontFamily: activeStyles.fontHeader }}>
                Professional Summary
              </h2>
              <p style={{ fontSize: '11pt', margin: 0, whiteSpace: 'pre-wrap' }}>{data.summary}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: activeStyles.borderStyle, margin: '0 0 8px 0', paddingBottom: '2px', fontFamily: activeStyles.fontHeader }}>
                Technical Skills
              </h2>
              <div style={{ fontSize: '11pt', whiteSpace: 'pre-wrap' }}>{data.skills}</div>
            </div>
          )}

          {/* Experience */}
          {data.experience.some(exp => exp.company || exp.role) && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: activeStyles.borderStyle, margin: '0 0 8px 0', paddingBottom: '2px', fontFamily: activeStyles.fontHeader }}>
                Experience
              </h2>
              {data.experience.map(exp => (
                <div key={exp.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', fontFamily: activeStyles.fontHeader }}>{exp.company}</div>
                    <div style={{ fontSize: '11pt', fontWeight: 'normal' }}>
                      {exp.startDate} {exp.startDate && exp.endDate ? '–' : ''} {exp.endDate}
                    </div>
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt', marginBottom: '4px' }}>{exp.role}</div>
                  {exp.description && (
                    <div style={{ fontSize: '11pt', paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
                      {exp.description.split('\n').map((line, i) => line.trim() ? (
                        <div key={i} style={{ display: 'flex', marginBottom: '2px' }}>
                          <span style={{ marginRight: '6px' }}>•</span>
                          <span>{line.replace(/^[-•]/,'').trim()}</span>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {data.education.some(edu => edu.institution || edu.degree) && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: activeStyles.borderStyle, margin: '0 0 8px 0', paddingBottom: '2px', fontFamily: activeStyles.fontHeader }}>
                Education
              </h2>
              {data.education.map(edu => (
                <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', fontFamily: activeStyles.fontHeader }}>{edu.institution}</div>
                    <div style={{ fontSize: '11pt' }}>{edu.degree} {edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</div>
                  </div>
                  <div style={{ fontSize: '11pt' }}>{edu.year}</div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {data.projects.some(proj => proj.name || proj.description) && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: activeStyles.borderStyle, margin: '0 0 8px 0', paddingBottom: '2px', fontFamily: activeStyles.fontHeader }}>
                Projects
              </h2>
              {data.projects.map(proj => (
                <div key={proj.id} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', fontFamily: activeStyles.fontHeader }}>
                      {proj.name} {proj.link && <span style={{ fontWeight: 'normal', fontSize: '10pt', fontFamily: activeStyles.fontMain }}> | {proj.link}</span>}
                    </div>
                  </div>
                  {proj.tech && <div style={{ fontSize: '10pt', fontStyle: 'italic', marginBottom: '4px' }}>Technologies: {proj.tech}</div>}
                  {proj.description && (
                    <div style={{ fontSize: '11pt', paddingLeft: '16px', whiteSpace: 'pre-wrap' }}>
                      {proj.description.split('\n').map((line, i) => line.trim() ? (
                        <div key={i} style={{ display: 'flex', marginBottom: '2px' }}>
                          <span style={{ marginRight: '6px' }}>•</span>
                          <span>{line.replace(/^[-•]/,'').trim()}</span>
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default BuilderPage;
