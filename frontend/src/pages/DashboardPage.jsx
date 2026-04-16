import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { analysisService } from '../services/services';
import useAuthStore from '../store/authStore';
import { ScoreBadge, getScoreColor } from '../components/common/ScoreMeter';
import { format } from 'date-fns';

// Skeleton loader component
const Skeleton = ({ w = '100%', h = '20px', style = {} }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: '8px', ...style }} />
);

const StatCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <div className="glass-card glass-card-hover" style={{ 
    padding: '24px',
    borderTop: `4px solid ${color || 'var(--color-primary)'}`,
    animation: `fadeInUp 0.6s ease-out ${delay}s both`,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: '-10%', right: '-10%', fontSize: '6rem', opacity: 0.05, transform: 'rotate(15deg)' }}>
      {icon}
    </div>
    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{icon}</div>
    <div style={{ fontSize: '2.5rem', fontWeight: '900', fontFamily: "'Space Grotesk', sans-serif", color: color || 'var(--color-primary)', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontWeight: '700', color: 'var(--color-text)', marginTop: '8px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</div>}
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await analysisService.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = data?.scoreHistory?.map((item) => ({
    date: format(new Date(item.createdAt), 'MMM d'),
    score: item.atsScore,
    job: item.jobSnapshot?.title || 'Analysis',
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</p>
          <p style={{ fontWeight: '700', color: getScoreColor(payload[0].value) }}>
            Score: {payload[0].value}%
          </p>
          {payload[0].payload.job && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {payload[0].payload.job}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
      {/* Premium Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', animation: 'fadeInDown 0.5s ease-out' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Welcome back, {user?.name?.split(' ')[0] || 'User'}</span>
            <span style={{ animation: 'shimmer 2s infinite linear' }}>🚀</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
            Here is your live intelligence overview and optimization telemetry.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4)' }}>
          <span>✨</span>
          <span>Start AI Analysis</span>
        </Link>
      </div>

      {error && (
        <div style={{
          padding: '14px 16px',
          background: 'var(--color-danger-light)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '10px',
          color: 'var(--color-danger)',
          marginBottom: '24px',
          fontSize: '0.9rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {loading ? (
          Array(4).fill(null).map((_, i) => <Skeleton key={i} h="140px" />)
        ) : (
          <>
            <StatCard
              icon="📊"
              label="Total Analyses"
              value={data?.stats?.totalAnalyses || 0}
              sub="All time"
              color="#0EA5E9"
              delay={0.1}
            />
            <StatCard
              icon="⭐"
              label="Average Score"
              value={data?.stats?.avgScore ? `${Math.round(data.stats.avgScore)}%` : '—'}
              sub="Across all analyses"
              color="#38BDF8"
              delay={0.2}
            />
            <StatCard
              icon="🏆"
              label="Best Score"
              value={data?.stats?.maxScore ? `${data.stats.maxScore}%` : '—'}
              sub="Highest achieved"
              color="#10B981"
              delay={0.3}
            />
            <StatCard
              icon="📄"
              label="Plan Level"
              value={user?.plan?.toUpperCase() || 'FREE'}
              sub={`${user?.analysisCount || 0} analyses run`}
              color="#F59E0B"
              delay={0.4}
            />
          </>
        )}
      </div>

      {/* Score History Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="section-title" style={{ marginBottom: '4px' }}>📈 Score Trend</h3>
          <p className="section-subtitle" style={{ marginBottom: '20px' }}>Last 30 days</p>

          {loading ? (
            <Skeleton h="200px" />
          ) : chartData.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
              <p style={{ fontWeight: '600' }}>No score history yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Run your first analysis to see trends</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  dot={{ fill: '#0EA5E9', r: 5, strokeWidth: 2, stroke: '#111218' }}
                  activeDot={{ r: 8, stroke: '#38BDF8', strokeWidth: 2 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="section-title" style={{ marginBottom: '4px' }}>🎯 Score Breakdown</h3>
          <p className="section-subtitle" style={{ marginBottom: '20px' }}>Distribution range</p>

          {loading ? (
            <Skeleton h="200px" />
          ) : chartData.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
              <p style={{ fontWeight: '600' }}>No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.slice(-8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 className="section-title">📋 Recent Analyses</h3>
            <p className="section-subtitle">Your latest resume optimization results</p>
          </div>
          <Link to="/history" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            View All →
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array(3).fill(null).map((_, i) => <Skeleton key={i} h="72px" />)}
          </div>
        ) : !data?.recentAnalyses?.length ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚀</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--color-text)' }}>
              No analyses yet
            </h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
              Upload your resume and a job description to get started
            </p>
            <Link to="/analyze" className="btn-primary" style={{ textDecoration: 'none' }}>
              ⚡ Run First Analysis
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.recentAnalyses.map((analysis) => (
              <Link
                key={analysis._id}
                to={`/history/${analysis._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 16px',
                  background: 'var(--color-surface-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                >
                  <ScoreBadge score={analysis.atsScore} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {analysis.jobSnapshot?.title || 'Analysis'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {analysis.jobSnapshot?.company && `${analysis.jobSnapshot.company} · `}
                      {format(new Date(analysis.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                    {analysis.resumeSnapshot?.fileName?.substring(0, 20) || 'Resume'}...
                  </div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
