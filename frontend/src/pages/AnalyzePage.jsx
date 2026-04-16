import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ResumeDropzone from '../components/analysis/ResumeDropzone';
import { resumeService, analysisService } from '../services/services';

const MAX_JD_LENGTH = 20000;
const MIN_JD_LENGTH = 50;

const AnalyzePage = () => {
  const navigate = useNavigate();

  // Step management
  const [step, setStep] = useState(1); // 1: Upload, 2: JD Input, 3: Analyzing

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [savedResumes, setSavedResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // JD state
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdError, setJdError] = useState('');

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load existing resumes
  useEffect(() => {
    const load = async () => {
      try {
        const res = await resumeService.getAll(1, 20);
        setSavedResumes(res.data?.resumes || []);
      } catch {
        // Silently fail — user can still upload
      }
    };
    load();
  }, []);

  const handleFileAccepted = async (file) => {
    setResumeFile(file);
    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await resumeService.upload(file, (pct) => setUploadProgress(pct));
      const resume = res.data.resume;
      setUploadedResume(resume);
      setSelectedResumeId(resume._id);
      setSavedResumes((prev) => [resume, ...prev.filter(r => r._id !== resume._id)]);
      toast.success(`✅ Resume parsed: ${resume.wordCount} words extracted`);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload resume. Please try again.';
      setUploadError(msg);
      toast.error(msg);
      setResumeFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const validateJD = () => {
    if (!jobDescription.trim()) {
      setJdError('Job description is required.');
      return false;
    }
    if (jobDescription.trim().length < MIN_JD_LENGTH) {
      setJdError(`Job description must be at least ${MIN_JD_LENGTH} characters. Currently: ${jobDescription.trim().length}`);
      return false;
    }
    if (jobDescription.trim().length > MAX_JD_LENGTH) {
      setJdError(`Job description is too long. Max ${MAX_JD_LENGTH.toLocaleString()} characters.`);
      return false;
    }
    setJdError('');
    return true;
  };

  const handleRunAnalysis = async () => {
    if (!validateJD()) return;
    if (!selectedResumeId) {
      toast.error('Please upload or select a resume first.');
      setStep(1);
      return;
    }

    setIsAnalyzing(true);
    setStep(3);

    try {
      const res = await analysisService.run({
        resumeId: selectedResumeId,
        jobTitle: jobTitle.trim(),
        jobCompany: jobCompany.trim(),
        jobDescription: jobDescription.trim(),
      });

      toast.success('Analysis complete! 🎉');
      navigate(`/history/${res.data.analysisId}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed. Please try again.';
      toast.error(msg);
      setIsAnalyzing(false);
      setStep(2);
    }
  };

  const jdCharCount = jobDescription.length;
  const jdRemaining = MAX_JD_LENGTH - jdCharCount;

  const stepLabels = ['Upload Resume', 'Job Description', 'Analyzing'];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
          ⚡ New ATS Analysis
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Upload your resume and paste a job description to get your ATS score and AI improvements
        </p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <div key={num} style={{ display: 'flex', alignItems: 'center', flex: num < stepLabels.length ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  background: done ? 'var(--color-success)' : active ? 'var(--gradient-primary)' : 'var(--color-surface-2)',
                  color: (done || active) ? 'white' : 'var(--color-text-muted)',
                  border: active ? 'none' : `1px solid var(--color-border)`,
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: active ? '700' : '500',
                  color: active ? 'var(--color-text)' : done ? 'var(--color-success)' : 'var(--color-text-muted)',
                  display: 'none',
                }}>{label}</span>
              </div>
              {num < stepLabels.length && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: done ? 'var(--color-success)' : 'var(--color-surface-3)',
                  margin: '0 8px',
                  borderRadius: '2px',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Resume Upload */}
      {step === 1 && (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>Step 1: Upload Your Resume</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Supported formats: PDF and DOCX (max 10MB)
            </p>

            <ResumeDropzone
              onFileAccepted={handleFileAccepted}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
            />

            {uploadError && (
              <div style={{
                marginTop: '16px', padding: '12px 16px',
                background: 'var(--color-danger-light)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                color: 'var(--color-danger)', fontSize: '0.875rem',
              }}>
                ❌ {uploadError}
              </div>
            )}

            {/* Previously uploaded resumes */}
            {savedResumes.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div className="divider" style={{ margin: '20px 0' }} />
                <p style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  OR select a previously uploaded resume:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedResumes.slice(0, 5).map((r) => (
                    <button
                      key={r._id}
                      onClick={() => { setSelectedResumeId(r._id); setUploadedResume(r); setStep(2); }}
                      style={{
                        padding: '10px 14px',
                        background: selectedResumeId === r._id ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                        border: `1px solid ${selectedResumeId === r._id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{r.fileType === 'pdf' ? '📄' : '📝'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{r.originalName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {r.wordCount} words · {(r.fileSize / 1024).toFixed(0)}KB
                        </div>
                      </div>
                      {selectedResumeId === r._id && <span style={{ color: 'var(--color-primary)' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Job Description */}
      {step === 2 && (
        <div className="animate-fade-in">
          {/* Resume confirmation */}
          {(uploadedResume || selectedResumeId) && (
            <div style={{
              padding: '12px 16px', marginBottom: '16px',
              background: 'var(--color-success-light)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', gap: '10px',
              color: 'var(--color-success)', fontSize: '0.875rem',
            }}>
              <span>✓</span>
              <span style={{ fontWeight: '500' }}>
                {uploadedResume?.originalName || 'Resume selected'} — {uploadedResume?.wordCount || 0} words extracted
              </span>
              <button
                onClick={() => { setStep(1); setSelectedResumeId(''); setUploadedResume(null); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Change
              </button>
            </div>
          )}

          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>Step 2: Job Description</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              Paste the complete job description for accurate keyword matching
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="input-label">Job Title</label>
                <input
                  className="input-field"
                  placeholder="e.g. Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="input-label">Company (Optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g. Google"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="input-label">Job Description *</label>
                <span style={{
                  fontSize: '0.75rem',
                  color: jdCharCount < MIN_JD_LENGTH ? 'var(--color-warning)' : jdRemaining < 1000 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                }}>
                  {jdCharCount.toLocaleString()} / {MAX_JD_LENGTH.toLocaleString()} chars
                </span>
              </div>
              <textarea
                className={`input-field ${jdError ? 'error' : ''}`}
                placeholder="Paste the full job description here. Include responsibilities, requirements, and skills sections for best results. Minimum 50 characters required."
                value={jobDescription}
                onChange={(e) => { setJobDescription(e.target.value); if (jdError) setJdError(''); }}
                rows={12}
                style={{ resize: 'vertical', minHeight: '240px', fontFamily: 'inherit', lineHeight: '1.6' }}
                maxLength={MAX_JD_LENGTH}
              />
              {jdError && (
                <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>⚠️ {jdError}</p>
              )}
              {jdCharCount < MIN_JD_LENGTH && jdCharCount > 0 && (
                <p style={{ color: 'var(--color-warning)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Need {MIN_JD_LENGTH - jdCharCount} more characters for analysis
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn-primary"
                onClick={handleRunAnalysis}
                disabled={jdCharCount < MIN_JD_LENGTH}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                ⚡ Run ATS Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Analyzing */}
      {step === 3 && (
        <div className="animate-fade-in glass-card" style={{ padding: '64px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px', animation: 'float 2s ease-in-out infinite' }}>🤖</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>Analyzing Your Resume...</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', maxWidth: '420px', margin: '0 auto 32px' }}>
            Running TF-IDF keyword analysis, cosine similarity scoring, and generating AI improvements. This may take a few seconds.
          </p>

          <div style={{ maxWidth: '300px', margin: '0 auto 16px' }}>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div className="progress-fill animate-pulse-glow" style={{ width: '70%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '32px', flexWrap: 'wrap' }}>
            {['🔑 Extracting Keywords', '📐 Computing Similarity', '✨ Generating AI Tips'].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.8rem', color: 'var(--color-text-secondary)',
                padding: '6px 12px',
                background: 'var(--color-surface-2)',
                borderRadius: '100px',
              }}>
                <span className="animate-spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(108,99,255,0.3)', borderTopColor: '#6C63FF', borderRadius: '50%' }} />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzePage;
