import { useState } from 'react';
import { ProgressBar } from '../common/ScoreMeter';

const KeywordAnalysis = ({ matchedKeywords = [], missingKeywords = [] }) => {
  const [activeTab, setActiveTab] = useState('matched');
  const [filterImportance, setFilterImportance] = useState('all');

  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const matchRate = totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 0;

  const filterKeywords = (keywords) => {
    if (filterImportance === 'all') return keywords;
    return keywords.filter((k) => k.importance === filterImportance);
  };

  const getImportancePriority = { high: 0, medium: 1, low: 2 };
  const sortByImportance = (a, b) =>
    (getImportancePriority[a.importance] || 2) - (getImportancePriority[b.importance] || 2);

  const filteredMatched = filterKeywords([...matchedKeywords].sort(sortByImportance));
  const filteredMissing = filterKeywords([...missingKeywords].sort(sortByImportance));

  const tabStyle = (tab) => ({
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'var(--gradient-primary)' : 'var(--color-surface-2)',
    color: activeTab === tab ? 'white' : 'var(--color-text-secondary)',
  });

  const ImportanceBadge = ({ level }) => {
    const colors = {
      high: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
      medium: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
      low: { bg: 'var(--color-surface-3)', color: 'var(--color-text-muted)' },
    };
    const s = colors[level] || colors.low;
    return (
      <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '100px', background: s.bg, color: s.color, textTransform: 'uppercase' }}>
        {level}
      </span>
    );
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.1rem' }}>🔑 Keyword Analysis</h3>
          <p className="section-subtitle">Keywords extracted from the job description</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: matchRate >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {matchRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Match Rate</div>
        </div>
      </div>

      {/* Match progress */}
      <div style={{ marginBottom: '20px' }}>
        <ProgressBar
          value={matchRate}
          label={`${matchedKeywords.length} of ${totalKeywords} keywords matched`}
        />
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span className="badge badge-success">✓ {matchedKeywords.length} Matched</span>
        <span className="badge badge-danger">✗ {missingKeywords.length} Missing</span>
        <span className="badge badge-accent">{totalKeywords} Total</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-2)', padding: '4px', borderRadius: '10px' }}>
          <button style={tabStyle('matched')} onClick={() => setActiveTab('matched')}>
            ✓ Matched ({matchedKeywords.length})
          </button>
          <button style={tabStyle('missing')} onClick={() => setActiveTab('missing')}>
            ✗ Missing ({missingKeywords.length})
          </button>
        </div>

        <select
          value={filterImportance}
          onChange={(e) => setFilterImportance(e.target.value)}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Importance</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Keyword List */}
      {activeTab === 'matched' ? (
        filteredMatched.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <p>No matching keywords found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {filteredMatched.map(({ keyword, frequency, importance }, i) => (
              <div
                key={i}
                className="keyword-chip keyword-matched"
                style={{
                  fontWeight: importance === 'high' ? '700' : '500',
                  opacity: importance === 'low' ? 0.8 : 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span>✓</span>
                  <span style={{ textTransform: 'capitalize' }}>{keyword}</span>
                  <ImportanceBadge level={importance} />
                </div>
                {frequency > 0 && (
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>freq: {frequency}×</span>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        filteredMissing.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <p>No missing keywords for this filter! Great coverage.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredMissing.map(({ keyword, importance, suggestion }, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  background: 'var(--color-danger-light)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: suggestion ? '4px' : 0 }}>
                  <span style={{ color: 'var(--color-danger)' }}>✗</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-text)', textTransform: 'capitalize' }}>{keyword}</span>
                  <ImportanceBadge level={importance} />
                </div>
                {suggestion && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingLeft: '16px' }}>
                    💡 {suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default KeywordAnalysis;
