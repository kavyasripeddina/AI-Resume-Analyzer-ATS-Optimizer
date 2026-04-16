import { useState } from 'react';

const AIImprovements = ({ improvedBulletPoints = [], generalSuggestions = [], aiSummary = '', usedFallback = false }) => {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [copied, setCopied] = useState(null);

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: select text approach
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>✨ AI Resume Improvements</h3>
          <p className="section-subtitle">AI-powered bullet point rewrites and suggestions</p>
        </div>
        {usedFallback && (
          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
            ⚡ Rule-based
          </span>
        )}
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div style={{
          padding: '14px 16px',
          background: 'var(--color-primary-light)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          color: 'var(--color-text)',
          lineHeight: '1.6',
        }}>
          <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>🤖 AI Assessment: </span>
          {aiSummary}
        </div>
      )}

      {/* Bullet Point Improvements */}
      {improvedBulletPoints.length > 0 ? (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bullet Point Rewrites ({improvedBulletPoints.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {improvedBulletPoints.map((item, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--color-surface-2)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--color-text)',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    #{i + 1}: {item.original?.substring(0, 60) || 'Bullet point'}...
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                    {expandedIdx === i ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>

                {/* Expanded content */}
                {expandedIdx === i && (
                  <div style={{ padding: '16px' }} className="animate-fade-in">
                    {/* Original */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        ✗ Original
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        background: 'var(--color-danger-light)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        lineHeight: '1.5',
                        borderLeft: '3px solid var(--color-danger)',
                      }}>
                        {item.original || '—'}
                      </div>
                    </div>

                    {/* Improved */}
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        ✓ Improved
                      </div>
                      <div style={{
                        padding: '10px 14px',
                        background: 'var(--color-success-light)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        lineHeight: '1.5',
                        borderLeft: '3px solid var(--color-success)',
                        position: 'relative',
                      }}>
                        {item.improved || '—'}
                        <button
                          onClick={() => copyToClipboard(item.improved, i)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            color: 'var(--color-text-secondary)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {copied === i ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px' }}>
                        <span>💡</span>
                        <span><strong>Why:</strong> {item.reason}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px',
          background: 'var(--color-warning-light)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          color: 'var(--color-text)',
        }}>
          ⚠️ No bullet points were detected in your resume. Consider reformatting with action-verb-led bullet points for better ATS compatibility.
        </div>
      )}

      {/* General Suggestions */}
      {generalSuggestions.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💡 General Recommendations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {generalSuggestions.map((suggestion, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px' }}>→</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIImprovements;
