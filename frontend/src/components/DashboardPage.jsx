import React, { useState, useEffect } from 'react';
import { getDashboardStats, getPayments, getTransactions, getRefunds } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, paymentsData, txData] = await Promise.all([
        getDashboardStats().catch(() => null),
        getPayments('', '', '', 0, 5).catch(() => ({ content: [] })),
        getTransactions({ page: 0, size: 5 }).catch(() => ({ content: [] }))
      ]);

      setStats(statsData);
      setRecentPayments(paymentsData.content || []);
      setRecentTransactions(txData.content || []);
    } catch (err) {
      console.error('Error fetching dashboard feed', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = () => {
    if (!stats || !stats.totalPayments || stats.totalPayments === 0) return 0;
    return ((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Overview</h1>
          <p className="page-subtitle">Real-time payment volume, transaction stream, and reconciliation telemetry.</p>
        </div>
        <div>
          <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            ● Engine Status: Active
          </span>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Total Payments</span>
            <CreditCard size={18} color="var(--primary)" />
          </div>
          <span className="kpi-value">{loading ? '...' : stats?.totalPayments || 0}</span>
          <span className="kpi-sub">
            {stats ? `${stats.successfulPayments} Captured • ${stats.pendingPayments} Pending` : '—'}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Captured USD Volume</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <span className="kpi-value" style={{ color: 'var(--success)' }}>
            ${loading ? '0.00' : Number(stats?.totalVolumeUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="kpi-sub">Settled Merchant Funds</span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">INR & AED Gross Volume</span>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <span className="kpi-value">
            ₹{loading ? '0' : Number(stats?.totalVolumeInr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="kpi-sub">
            AED {loading ? '0.00' : Number(stats?.totalVolumeAed || 0).toFixed(2)}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-title">Success Rate</span>
            <CheckCircle size={18} color="var(--warning)" />
          </div>
          <span className="kpi-value">{loading ? '0%' : `${calculateSuccessRate()}%`}</span>
          <span className="kpi-sub">
            {stats ? `${stats.failedPayments} Failed Transactions` : '—'}
          </span>
        </div>
      </div>

      {/* Visual Activity & Volume Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">
            <span>Payment Status Distribution</span>
            <span className="badge badge-secondary">{stats?.totalPayments || 0} Total</span>
          </div>
          
          {loading ? (
            <div className="skeleton" style={{ height: 180 }}></div>
          ) : !stats || stats.totalPayments === 0 ? (
            <div className="empty-state">
              <p>No payment records available to calculate status distribution.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span>Captured / Settled</span>
                  <strong>{stats.successfulPayments} ({((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)}%)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.successfulPayments / stats.totalPayments) * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span>Pending & Authorized</span>
                  <strong>{stats.pendingPayments} ({((stats.pendingPayments / stats.totalPayments) * 100).toFixed(1)}%)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.pendingPayments / stats.totalPayments) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span>Failed or Declined</span>
                  <strong>{stats.failedPayments || 0} ({(((stats.failedPayments || 0) / stats.totalPayments) * 100).toFixed(1)}%)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${((stats.failedPayments || 0) / stats.totalPayments) * 100}%`, height: '100%', background: 'var(--danger)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span>Cancelled</span>
                  <strong>{stats.cancelledPayments || 0} ({(((stats.cancelledPayments || 0) / stats.totalPayments) * 100).toFixed(1)}%)</strong>
                </div>
                <div style={{ width: '100%', height: 8, background: 'var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${((stats.cancelledPayments || 0) / stats.totalPayments) * 100}%`, height: '100%', background: '#64748b' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span>Reconciliation & Settlement Telemetry</span>
            <span className="badge badge-info">Multi-Batch</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 180 }}></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Matched Bank Records</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{stats?.totalReconciledRecords || 0}</div>
                </div>
                <CheckCircle size={24} color="var(--success)" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Flagged Discrepancies</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stats?.totalDiscrepancies > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                    {stats?.totalDiscrepancies || 0}
                  </div>
                </div>
                <AlertTriangle size={24} color={stats?.totalDiscrepancies > 0 ? 'var(--danger)' : 'var(--text-dim)'} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Payments */}
        <div className="card">
          <div className="card-title">
            <span>Recent Payment Operations</span>
            <Link to="/payments" className="btn btn-sm btn-outline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 150 }}></div>
          ) : recentPayments.length === 0 ? (
            <div className="empty-state">
              <p>No recent payment orders created yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(p => (
                    <tr key={p.id}>
                      <td>
                        <strong style={{ fontSize: '0.8rem' }}>{p.paymentReference}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.paymentMethod}</div>
                      </td>
                      <td>
                        <strong>{Number(p.amount).toFixed(2)}</strong> {p.currency}
                      </td>
                      <td>
                        <span className={`badge ${
                          p.paymentStatus === 'CAPTURED' ? 'badge-success' :
                          p.paymentStatus === 'AUTHORIZED' ? 'badge-info' :
                          p.paymentStatus === 'FAILED' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-title">
            <span>Recent Ledger Transactions</span>
            <Link to="/transactions" className="btn btn-sm btn-outline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 150 }}></div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No transaction history recorded yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tx Ref</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(t => (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ fontSize: '0.8rem' }}>{t.transactionReference}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(t.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-secondary">{t.transactionType}</span>
                      </td>
                      <td>
                        <strong>{Number(t.amount).toFixed(2)}</strong> {t.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
