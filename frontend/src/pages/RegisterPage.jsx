import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (result.success) {
      toast.success('Account created! Welcome to ATSOptimizer 🚀');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'var(--color-danger)', width: '25%' };
    if (p.length < 8) return { label: 'Weak', color: 'var(--color-warning)', width: '40%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: 'var(--color-warning)', width: '65%' };
    return { label: 'Strong', color: 'var(--color-success)', width: '100%' };
  };

  const strength = passwordStrength();

  const fieldConfig = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', autoComplete: 'name' },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
    }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', top: '-5%', right: '10%', width: '500px', height: '500px', background: 'rgba(108,99,255,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-5%', left: '10%', width: '400px', height: '400px', background: 'rgba(0,212,255,0.05)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '460px' }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'var(--gradient-primary)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px',
            margin: '0 auto 10px',
            boxShadow: 'var(--shadow-glow)',
          }}>🎯</div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '800',
            fontSize: '1.6rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>ATSOptimizer</h1>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>Create your account</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
            Start optimizing your resume for free
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {fieldConfig.map(({ name, label, type, placeholder, autoComplete }) => (
              <div key={name} style={{ marginBottom: '16px' }}>
                <label className="input-label" htmlFor={name}>{label}</label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  autoComplete={autoComplete}
                  className={`input-field ${errors[name] ? 'error' : ''}`}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                />
                {/* Password strength indicator */}
                {name === 'password' && strength && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '3px', background: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '3px', transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: '600' }}>{strength.label}</span>
                  </div>
                )}
                {errors[name] && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '4px' }}>⚠️ {errors[name]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                  Creating Account...
                </>
              ) : 'Create Free Account →'}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '16px' }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
