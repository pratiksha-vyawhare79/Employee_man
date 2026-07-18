import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { getImageUrl } from '../config';
import { Menu, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  title: string;
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title, onMenuClick }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header style={{
      height: 'var(--navbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      margin: '-2rem -2rem 2rem -2rem',
    }}>
      {/* Page Title & Hamburger for mobile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onMenuClick}
          className="btn btn-secondary"
          style={{
            display: 'none',
            padding: '0.5rem',
            border: 'none',
          }}
          id="mobile-nav-toggle"
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
      </div>

      {/* Profile info / system status badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Role badge */}
        <span className={`badge ${
          user.role === 'Super Admin'
            ? 'badge-admin'
            : user.role === 'HR Manager'
            ? 'badge-hr'
            : 'badge-employee'
        }`}>
          {user.role}
        </span>

        {/* User preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user.profileImage ? (
            <img
              src={getImageUrl(user.profileImage)}
              alt={user.name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid var(--primary)',
              }}
            />
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <UserIcon size={16} />
            </div>
          )}
          <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'inline-block' }}>
            {user.name}
          </span>
        </div>
      </div>

      {/* Inject simple mobile styles dynamically */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-nav-toggle {
            display: flex !important;
          }
          header {
            margin: 0 !important;
            padding: 0 1rem !important;
            position: fixed !important;
            width: 100% !important;
            left: 0 !important;
            top: 0 !important;
          }
        }
      `}</style>
    </header>
  );
};
