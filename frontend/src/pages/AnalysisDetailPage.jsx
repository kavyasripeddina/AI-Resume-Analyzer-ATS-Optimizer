import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { analysisService } from '../services/services';
import ScoreMeter, { ProgressBar, getScoreColor, getScoreLabel } from '../components/common/ScoreMeter';
import KeywordAnalysis from '../components/analysis/KeywordAnalysis';
import AIImprovements from '../components/analysis/AIImprovements';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Skeleton = ({ h = '20px', w = '100%' }) => (
  <div className="skeleton" style={{ height: h, width: w, borderRadius: '8px' }} />
);

const AnalysisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analysisService.getById(id);
        setAnalysis(res.data.analysis);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Analysis not found. It may have been deleted.');
        } else {
          setError(err.response?.data?.message || 'Failed to load analysis result.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!analysis) return;
    setDownloading(true);
    toast.loading('Generating PDF report...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#111218',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `ATS_Report_${analysis.jobSnapshot?.title || 'Analysis'}_${format(new Date(analysis.createdAt), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName.replace(/\s+/g, '_'));
      toast.dismiss();
      toast.success('PDF report downloaded! 📥');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <Skeleton h="40px" w="40%" style={{ margin: '0 auto 16px auto' }} />
        <Skeleton h="20px" w="20%" style={{ margin: '0 auto 32px auto' }} />
        <Skeleton h="300px" style={{ marginBottom: '32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {Array(4).fill(null).map((_, i) => <Skeleton key={i} h="120px" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>{error}</h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <Link to="/history" className="btn-secondary" style={{ textDecoration: 'none' }}>← Back to History</Link>
            <Link to="/analyze" className="btn-primary" style={{ textDecoration: 'none' }}>New Analysis</Link>
          </div>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(analysis.atsScore);
  const { label: scoreLabel } = getScoreLabel(analysis.atsScore);

  const breakdownItems = [
    { label: 'Keyword Density', key: 'keywordMatch', desc: 'Industry terms, hard skills, software matches' },
    { label: 'Skills Correlation', key: 'skillsMatch', desc: 'Direct matching of specific requested skills' },
    { label: 'Content Depth', key: 'experienceMatch', desc: 'Action verbs, impact metrics, and depth' },
    { label: 'Formatting', key: 'formatScore', desc: 'Readability, length, ATS parsability check' },
  ];

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '32px', maxWidth: '1400px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', animation: 'fadeInDown 0.5s ease-out' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
          <Link to="/history" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--color-text)'} onMouseLeave={e => e.target.style.color = 'var(--color-text-secondary)'}>Intelligence Log</Link>
          <span style={{ color: 'var(--color-border-hover)' }}>/</span>
          <span style={{ color: 'var(--color-primary)' }}>Health Report</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadPDF} disabled={downloading} className="btn-secondary" style={{ padding: '8px 16px' }}>
            {downloading ? '⏳ Compiling...' : '⬇️ Export Brief'}
          </button>
          <Link to="/analyze" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none' }}>
             Run New Scan
          </Link>
        </div>
      </div>

      <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Dynamic Grid Layout */}
        <div className="layout-split-grid">
          
          {/* LEFT COL: Main Health Score */}
          <div className="glass-card animate-fade-in" style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
             <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Resume Health Score</h2>
             <ScoreMeter score={analysis.atsScore} size={240} />
             <div style={{ marginTop: '32px', width: '100%' }}>
                <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', outline: `1px solid ${scoreColor}30`, marginBottom: '12px' }}>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Target Role Architecture</div>
                  <div style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1.1rem' }}>{analysis.jobSnapshot?.title || 'General Position'}</div>
                </div>
                <div style={{ background: 'var(--color-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                   <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Document Baseline</div>
                   <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.95rem' }}>{analysis.resumeSnapshot?.fileName || 'resume_file.pdf'}</div>
                </div>
             </div>
          </div>

          {/* RIGHT COL: Insight Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card animate-fade-in" style={{ padding: '32px', animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                 <div style={{ width: '8px', height: '24px', background: 'var(--color-accent)', borderRadius: '4px' }}></div>
                 <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Content Strength Analysis</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {breakdownItems.map(({ label, key, desc }, idx) => {
                  const val = analysis.scoreBreakdown?.[key] || 0;
                  const max = getMaxBreakdown(key);
                  const pct = Math.round((val / max) * 100);
                  const bColor = getScoreColor(pct);
                  return (
                    <div key={key} className="glass-card-hover" style={{ padding: '20px', background: 'var(--color-surface-2)', borderRadius: '12px', border: '1px solid var(--color-border)', transition: 'all 0.3s ease' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                         <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text)' }}>{label}</div>
                         <div style={{ fontSize: '1.4rem', fontWeight: '900', color: bColor }}>{pct}%</div>
                       </div>
                       <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: bColor, borderRadius: '3px' }}></div>
                       </div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Readability / Format Metrics */}
            <div className="metrics-four-grid">
               {[
                 { label: 'Words Processed', val: analysis.resumeSnapshot?.wordCount || 342, icon: '⚡' },
                 { label: 'Keywords Mapped', val: analysis.matchedKeywords?.length || 0, icon: '🎯' },
                 { label: 'Critical Gaps', val: analysis.missingKeywords?.length || 0, icon: '⚠️' },
                 { label: 'Optimum Length', val: '1 Page', icon: '📐' }
               ].map((stat, i) => (
                 <div key={i} className="glass-card animate-fade-in" style={{ padding: '20px', textAlign: 'center', animationDelay: `${0.2 + i*0.1}s` }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.8 }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--color-text)', display: 'block', margin: '4px 0' }}>{stat.val}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* BOTTOM METRICS */}
        
        {/* Improvement Opportunities */}
        {analysis.generalSuggestions?.length > 0 && (
          <div className="glass-card animate-fade-in" style={{ padding: '32px', animationDelay: '0.3s' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '8px', height: '24px', background: 'var(--color-warning)', borderRadius: '4px' }}></div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Improvement Opportunities</h2>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
               {analysis.generalSuggestions.map((suggestion, idx) => {
                 let priorityLevel = idx === 0 ? 'High' : (idx < 3 ? 'Medium' : 'Low');
                 let priorityColor = priorityLevel === 'High' ? 'var(--color-danger)' : (priorityLevel === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)');
                 return (
                 <div key={idx} style={{ 
                    padding: '20px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', 
                    borderRadius: '12px', borderTop: `3px solid ${priorityColor}`, display: 'flex', flexDirection: 'column'
                 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                       <span style={{ fontSize: '0.75rem', fontWeight: '700', color: priorityColor, background: `${priorityColor}15`, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                         {priorityLevel} Priority
                       </span>
                    </div>
                    <div style={{ color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: '1.6' }}>{suggestion}</div>
                 </div>
               )})}
             </div>
          </div>
        )}

        {/* Skill Intelligence Panel */}
        <div className="glass-card animate-fade-in" style={{ padding: '0', animationDelay: '0.4s', overflow: 'hidden' }}>
           <KeywordAnalysis matchedKeywords={analysis.matchedKeywords || []} missingKeywords={analysis.missingKeywords || []} />
        </div>

        {/* AI Actionable Rewrites */}
        <div className="glass-card animate-fade-in" style={{ padding: '0', animationDelay: '0.5s', overflow: 'hidden' }}>
           <AIImprovements improvedBulletPoints={analysis.improvedBulletPoints || []} generalSuggestions={[]} aiSummary={analysis.aiSummary || ''} />
        </div>

      </div>
    </div>
  );
};

// Max score per breakdown component for percentage calculation
const getMaxBreakdown = (key) => {
  const maxes = { keywordMatch: 50, skillsMatch: 15, experienceMatch: 30, formatScore: 5 };
  return maxes[key] || 100;
};

export default AnalysisDetailPage;
