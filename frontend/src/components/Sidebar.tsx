import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Sun,
  Moon,
  LogOut,
  User as UserIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();

  if (!user) return null;

  return (
    <aside className="glass-panel" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 'var(--sidebar-width)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
      borderTop: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
      zIndex: 100,
      background: 'var(--surface)',
    }}>
      {/* Brand logo */}
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--border-radius-sm)',
          backgroundColor: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '1.25rem',
        }}>
          E
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.5px' }}>EMS Pro</h2>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '-3px' }}>
            Corporate Hierarchy
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{
        flex: 1,
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', border: 'none', padding: '0.75rem 1rem' }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/employees"
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', border: 'none', padding: '0.75rem 1rem' }}
        >
          <Users size={18} />
          <span>Directory</span>
        </NavLink>

        <NavLink
          to="/tree"
          className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
          style={{ justifyContent: 'flex-start', width: '100%', border: 'none', padding: '0.75rem 1rem' }}
        >
          <GitFork size={18} />
          <span>Org Structure</span>
        </NavLink>
      </nav>

      {/* Theme Toggle & User Info */}
      <div style={{
        padding: '1.25rem 1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ justifyContent: 'center', width: '100%', padding: '0.5rem' }}
        >
          {theme === 'light' ? (
            <>
              <Moon size={16} />
              <span>Dark Theme</span>
            </>
          ) : (
            <>
              <Sun size={16} />
              <span>Light Theme</span>
            </>
          )}
        </button>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem',
          borderRadius: 'var(--border-radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
        }}>
          {user.profileImage ? (
            <img
              src={`http://localhost:5000${user.profileImage}`}
              alt={user.name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--border-color)',
              }}
            />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <UserIcon size={20} />
            </div>
          )}
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user.name}
            </p>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              display: 'block',
              textTransform: 'capitalize',
            }}>
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--error)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
