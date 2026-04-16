import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analysisService } from '../services/services';
import { ScoreBadge } from '../components/common/ScoreMeter';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Skeleton = ({ h = '72px' }) => (
  <div className="skeleton" style={{ height: h, borderRadius: '10px' }} />
);

const HistoryPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  const loadHistory = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await analysisService.getHistory(page, 10);
      setAnalyses(res.data?.analyses || []);
      setPagination(res.data?.pagination || {});
      setStats(res.data?.stats || {});
      setCurrentPage(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(1); }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this analysis? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await analysisService.delete(id);
      setAnalyses((prev) => prev.filter((a) => a._id !== id));
      toast.success('Analysis deleted.');
    } catch {
      toast.error('Failed to delete analysis.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>
            📋 Analysis History
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>All your resume optimization results</p>
        </div>
        <Link to="/analyze" className="btn-primary" style={{ textDecoration: 'none' }}>
          ⚡ New Analysis
        </Link>
      </div>

      {/* Stats row */}
      {!loading && stats.totalAnalyses > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span className="badge badge-primary">📊 {stats.totalAnalyses} Total</span>
          <span className="badge badge-accent">⭐ Avg: {Math.round(stats.avgScore || 0)}%</span>
          <span className="badge badge-success">🏆 Best: {stats.maxScore || 0}%</span>
          <span className="badge badge-warning">📉 Min: {stats.minScore || 0}%</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '14px', background: 'var(--color-danger-light)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
          color: 'var(--color-danger)', marginBottom: '20px', fontSize: '0.9rem',
        }}>
          ⚠️ {error}
          <button onClick={() => loadHistory(currentPage)} style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array(6).fill(null).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : analyses.length === 0 ? (
        <div className="glass-card empty-state">
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text)' }}>No analyses yet</h2>
          <p>Start analyzing your resume against job descriptions to improve your ATS score.</p>
          <Link to="/analyze" className="btn-primary" style={{ textDecoration: 'none', marginTop: '16px' }}>
            ⚡ Run First Analysis
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {analyses.map((analysis) => (
              <Link
                key={analysis._id}
                to={`/history/${analysis._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface)'; }}
                >
                  <ScoreBadge score={analysis.atsScore} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {analysis.jobDescription?.title || analysis.jobSnapshot?.title || 'Job Analysis'}
                      {(analysis.jobDescription?.company || analysis.jobSnapshot?.company) && (
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: '400' }}>
                          {' '}at {analysis.jobDescription?.company || analysis.jobSnapshot?.company}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      📄 {analysis.resume?.originalName || analysis.resumeSnapshot?.fileName || 'Resume'} ·
                      🗓 {format(new Date(analysis.createdAt), 'MMM d, yyyy · h:mm a')}
                    </div>
                  </div>

                  {/* Score breakdown preview */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {analysis.scoreBreakdown && Object.entries(analysis.scoreBreakdown).slice(0, 2).map(([key, val]) => (
                      <div key={key} style={{
                        textAlign: 'center', fontSize: '0.7rem',
                        padding: '4px 8px',
                        background: 'var(--color-surface-2)',
                        borderRadius: '6px',
                      }}>
                        <div style={{ fontWeight: '700', color: 'var(--color-text)' }}>{val}</div>
                        <div style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase().split(' ')[0]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={(e) => handleDelete(analysis._id, e)}
                    disabled={deleting === analysis._id}
                    className="btn-danger"
                    style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    {deleting === analysis._id ? '...' : '🗑'}
                  </button>

                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => loadHistory(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
              >
                ← Previous
              </button>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="btn-secondary"
                onClick={() => loadHistory(currentPage + 1)}
                disabled={currentPage >= pagination.totalPages}
                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
