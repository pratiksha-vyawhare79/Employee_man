import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { EmployeeTable } from './components/EmployeeTable';
import { OrgTree } from './components/OrgTree';

// Helper component to resolve page titles dynamically based on location
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  // Resolve Header Title
  let title = 'Employee Management';
  if (location.pathname === '/') title = 'Dashboard Analytics';
  else if (location.pathname === '/employees') title = 'Employee Registry';
  else if (location.pathname === '/tree') title = 'Organizational Hierarchy';

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="app-container">
      {/* Sidebar with mobile toggle classes */}
      <div className={mobileMenuOpen ? 'mobile-sidebar-open' : ''}>
        <Sidebar />
      </div>

      {/* Dim backdrop when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 99,
          }}
        />
      )}

      <main className="main-content">
        <Navbar title={title} onMenuClick={toggleMobileMenu} />
        {children}
      </main>

      {/* Inline styles for responsive mobile drawer */}
      <style>{`
        @media (max-width: 768px) {
          aside {
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
          }
          .mobile-sidebar-open aside {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
};

// Route wrapper to require authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Checking session credentials...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route wrapper for guest routes (redirect to dashboard if logged in)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return null;

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <AppLayout>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <EmployeeTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tree"
          element={
            <ProtectedRoute>
              <OrgTree />
            </ProtectedRoute>
          }
        />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
