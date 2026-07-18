import React, { useState } from 'react';
import { useAuth, type User } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';
import { LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const userObj: User = {
          _id: data._id,
          employeeId: data.employeeId,
          name: data.name,
          email: data.email,
          role: data.role,
        };
        login(data.email, data.token, userObj);
      } else {
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      setErrorMsg('Network error. Failed to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      padding: '1.5rem',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        backgroundColor: 'var(--surface)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            margin: '0 auto 1rem auto',
          }}>
            E
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>
            Welcome to EMS Pro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Authenticate to access your employee portal
          </p>
        </div>

        {/* Error Indicator */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'var(--error-light)',
            color: 'var(--error)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Email input */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Work Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@ems.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password input */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', gap: '0.5rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Details info panel */}
        <div style={{
          marginTop: '2rem',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--border-radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '0.75rem',
          lineHeight: '1.5',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--primary)' }}>
            Seeded Demo Credentials:
          </strong>
          <div>Work Email: <code>admin@ems.com</code></div>
          <div>Password: <code>Password123</code></div>
        </div>
      </div>
    </div>
  );
};
