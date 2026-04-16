import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Navbar = ({ isDark, setIsDark }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/analyze', label: 'Analyze', icon: '🔍' },
    { path: '/builder', label: 'Builder', icon: '📝' },
    { path: '/history', label: 'History', icon: '📋' },
  ];

  return (
    <nav style={{
      background: 'rgba(10, 11, 15, 0.5)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gradient-primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>🎯</div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            fontSize: '1.15rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>ATSOptimizer</span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isActive(link.path) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive(link.path) ? 'var(--color-primary-light)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="btn-ghost"
            style={{ padding: '8px', borderRadius: '8px', fontSize: '1.1rem' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '28px', height: '28px',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: 'white',
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontWeight: '500', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{menuOpen ? '▲' : '▼'}</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
              }} className="animate-fade-in">
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
                  <span className="badge badge-primary" style={{ marginTop: '4px', fontSize: '0.65rem' }}>
                    {user?.plan?.toUpperCase() || 'FREE'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = 'var(--color-danger-light)'}
                  onMouseLeave={e => e.target.style.background = 'none'}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
