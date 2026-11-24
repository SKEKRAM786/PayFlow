import React, { useState, useEffect } from 'react';
import { getDashboardStats, getAuditLogs } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    loadStats();
    if (user?.role === 'ADMIN') {
      loadAuditLogs();
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAuditLogs();
    }
  }, [auditPage, actionFilter, entityFilter]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await getAuditLogs({
        page: auditPage,
        size: 10,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined
      });
      setAuditLogs(res.content || []);
      setAuditTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div>
      {/* Metric Cards */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <span className="kpi-title">Total Payments</span>
          <span className="kpi-value">{stats ? stats.totalPayments : '...'}</span>
          <span className="kpi-sub">
            {stats ? `${stats.successfulPayments} Captured • ${stats.pendingPayments} Pending` : 'Aggregating...'}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="kpi-title">Captured USD Volume</span>
          <span className="kpi-value" style={{ color: '#10b981' }}>
            ${stats ? Number(stats.totalVolumeUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
          <span className="kpi-sub">Settled Merchant Funds</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <span className="kpi-title">INR & AED Volume</span>
          <span className="kpi-value">
            ₹{stats ? Number(stats.totalVolumeInr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0'}
          </span>
          <span className="kpi-sub">
            AED {stats ? Number(stats.totalVolumeAed || 0).toFixed(2) : '0.00'}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="kpi-title">Reconciliation Discrepancies</span>
          <span className="kpi-value" style={{ color: stats?.totalDiscrepancies > 0 ? '#ef4444' : '#10b981' }}>
            {stats ? stats.totalDiscrepancies : '0'}
          </span>
          <span className="kpi-sub">
            {stats ? `${stats.totalReconciledRecords} Matched Records` : 'Analyzing records'}
          </span>
        </div>
      </div>

      {/* Quick summary grid */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3>Platform Health & Architecture</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            PayFlow runs on a Spring Boot 3 modular monolith architecture, utilizing deterministic software simulations for multi-currency processing (USD, INR, AED), idempotent transaction lifecycle management, and bank settlement reconciliation.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-success">PostgreSQL Flyway V6</span>
            <span className="badge badge-info">Spring Security Stateless JWT</span>
            <span className="badge badge-primary">Java 21 Virtual Threads</span>
            <span className="badge badge-secondary">React 18 + Vite SPA</span>
          </div>
        </div>

        <div className="card">
          <h3>Customer & Refund Metrics</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats ? stats.totalCustomers : '0'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Registered Customers</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--color-border)', height: '50px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats ? stats.totalRefunds : '0'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Processed Refunds</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--color-border)', height: '50px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                ${stats ? Number(stats.totalRefundedAmount || 0).toFixed(2) : '0.00'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Refund Volume</div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Audit Trail */}
      {user?.role === 'ADMIN' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3>Enterprise Security & Audit Trail</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Immutable event stream recording authorization, captures, refunds, and user events
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Filter action (e.g. PAYMENT_CREATED)"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8rem' }}
              />
              <input
                type="text"
                placeholder="Entity (e.g. PAYMENT, REFUND)"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <table className="table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading audit entries...</td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem' }}>No audit trail entries recorded yet.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td><code>{log.userEmail || 'SYSTEM'}</code></td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td><strong>{log.entityType}</strong></td>
                    <td><code>{log.entityId ? log.entityId.substring(0, 8) + '...' : '—'}</code></td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {auditTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-sm btn-secondary" 
                disabled={auditPage === 0} 
                onClick={() => setAuditPage(auditPage - 1)}
              >
                Previous
              </button>
              <button 
                className="btn btn-sm btn-secondary" 
                disabled={auditPage + 1 >= auditTotalPages} 
                onClick={() => setAuditPage(auditPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;