import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import DashboardPage from './components/DashboardPage';
import DashboardAnalytics from './components/DashboardAnalytics';
import PaymentManager from './components/PaymentManager';
import TransactionManager from './components/TransactionManager';
import RefundManager from './components/RefundManager';
import CustomerManager from './components/CustomerManager';
import ReconciliationManager from './components/ReconciliationManager';
import AuditLogViewer from './components/AuditLogViewer';
import UserDirectory from './components/UserDirectory';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Root Route: Shows Landing Page if unauthenticated, Dashboard if authenticated */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )
        }
      />
      <Route path="/overview" element={<LandingPage />} />

      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : (
            <div className="auth-page-wrapper">
              <div className="auth-ambient-bg" />
              <div className="auth-grid-pattern" />
              <div className="auth-card-container">
                <Login />
              </div>
            </div>
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : (
            <div className="auth-page-wrapper">
              <div className="auth-ambient-bg" />
              <div className="auth-grid-pattern" />
              <div className="auth-card-container">
                <Register />
              </div>
            </div>
          )
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
            <Layout>
              <DashboardAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <PaymentManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ledger"
        element={
          <ProtectedRoute>
            <Layout>
              <TransactionManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Layout>
              <TransactionManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/refunds"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
            <Layout>
              <RefundManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reconciliation"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}>
            <Layout>
              <ReconciliationManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <AuditLogViewer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout>
              <UserDirectory />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
