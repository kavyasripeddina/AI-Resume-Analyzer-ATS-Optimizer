import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import HistoryPage from './pages/HistoryPage';
import AnalysisDetailPage from './pages/AnalysisDetailPage';
import BuilderPage from './pages/BuilderPage';
import useAuthStore from './store/authStore';
import DynamicStarBackground from './components/common/DynamicStarBackground';

const AppLayout = ({ children, isDark, setIsDark }) => (
  <>
    <Navbar isDark={isDark} setIsDark={setIsDark} />
    <main style={{ minHeight: 'calc(100vh - 64px)' }}>
      {children}
    </main>
  </>
);

function App() {
  const { token, user } = useAuthStore();
  const isAuth = !!(token && user);

  // Dark/light mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ats_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.body.className = isDark ? '' : 'light-mode';
    localStorage.setItem('ats_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <DynamicStarBackground />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: 'white' },
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={isAuth ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuth ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} setIsDark={setIsDark}>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} setIsDark={setIsDark}>
                  <AnalyzePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} setIsDark={setIsDark}>
                  <HistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} setIsDark={setIsDark}>
                  <AnalysisDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} setIsDark={setIsDark}>
                  <BuilderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to={isAuth ? '/dashboard' : '/login'} replace />}
          />
          <Route
            path="*"
            element={
              <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '16px', color: 'var(--color-text)',
              }}>
                <div style={{ fontSize: '4rem' }}>404</div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: '700' }}>Page Not Found</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary" style={{ textDecoration: 'none' }}>← Go Home</a>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
