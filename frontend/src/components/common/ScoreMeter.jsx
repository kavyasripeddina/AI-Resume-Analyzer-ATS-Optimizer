// Score color utility
export const getScoreColor = (score) => {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#6C63FF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
};

export const getScoreLabel = (score) => {
  if (score >= 80) return { label: 'Excellent', className: 'score-excellent' };
  if (score >= 60) return { label: 'Good', className: 'score-good' };
  if (score >= 40) return { label: 'Fair', className: 'score-fair' };
  return { label: 'Needs Work', className: 'score-poor' };
};

export const getScoreBgClass = (score) => {
  if (score >= 80) return 'score-bg-excellent';
  if (score >= 60) return 'score-bg-good';
  if (score >= 40) return 'score-bg-fair';
  return 'score-bg-poor';
};

// Animated circular score meter
const ScoreMeter = ({ score = 0, size = 160, strokeWidth = 12, label = '' }) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const { label: scoreLabel } = getScoreLabel(score);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 12px ${color}55)` }}
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-3)"
            strokeWidth={strokeWidth}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size > 140 ? '2.2rem' : '1.5rem',
            fontWeight: '800',
            fontFamily: "'Space Grotesk', sans-serif",
            color,
            lineHeight: 1,
          }}>{score}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: '700',
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>{scoreLabel}</span>
        {label && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{label}</div>}
      </div>
    </div>
  );
};

// Mini score badge
export const ScoreBadge = ({ score }) => {
  const color = getScoreColor(score);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '100px',
      background: `${color}15`,
      border: `1px solid ${color}33`,
      color,
      fontSize: '0.85rem',
      fontWeight: '700',
    }}>
      {score}%
    </span>
  );
};

// Progress bar with label
export const ProgressBar = ({ value, label, color }) => {
  const barColor = color || getScoreColor(value);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: barColor }}>{Math.round(value)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
    </div>
  );
};

export default ScoreMeter;
