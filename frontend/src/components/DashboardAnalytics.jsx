import React, { useState, useEffect } from 'react';
import {
  getDashboardSummary,
  getPaymentTrends,
  getTransactionStats,
  getRefundStats,
  getReconciliationStats
} from '../services/api';
import {
  TrendingUp,
  Activity,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

const DashboardAnalytics = () => {
  const [currency, setCurrency] = useState('');
  const [period, setPeriod] = useState('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [txStats, setTxStats] = useState(null);
  const [refundStats, setRefundStats] = useState(null);
  const [reconStats, setReconStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAnalytics();
  }, [currency, period, startDate, endDate]);

  const loadAllAnalytics = async () => {
    setLoading(true);
    try {
      const startIso = startDate ? new Date(startDate).toISOString() : undefined;
      const endIso = endDate ? new Date(endDate).toISOString() : undefined;

      const [summaryRes, trendsRes, txRes, refundRes, reconRes] = await Promise.all([
        getDashboardSummary({ currency: currency || undefined, startDate: startIso, endDate: endIso }).catch(() => null),
        getPaymentTrends({ period, currency: currency || undefined, startDate: startIso, endDate: endIso }).catch(() => []),
        getTransactionStats({ startDate: startIso, endDate: endIso }).catch(() => null),
        getRefundStats({ currency: currency || undefined, startDate: startIso, endDate: endIso }).catch(() => null),
        getReconciliationStats().catch(() => null)
      ]);

      setSummary(summaryRes);
      setTrends(trendsRes || []);
      setTxStats(txRes);
      setRefundStats(refundRes);
      setReconStats(reconRes);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setCurrency('');
    setPeriod('day');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Analytics Filter Header */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--primary)" /> Enterprise Analytics Telemetry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Filter by currency and timeframe across payments, transactions, and refunds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 120 }}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="AED">AED</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 110 }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>

            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
            />

            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
            />

            {(currency || startDate || endDate) && (
              <button className="btn btn-sm btn-outline" onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards per Currency */}
      {summary && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Net Financial Volume by Supported Currency
          </h3>
          <div className="kpi-grid">
            {Object.keys(summary.netVolumeByCurrency || {}).length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No captured financial volume matches the selected criteria.
              </div>
            ) : (
              Object.entries(summary.netVolumeByCurrency).map(([curr, net]) => {
                const captured = summary.totalCapturedVolumeByCurrency[curr] || 0;
                const refunded = summary.totalRefundedVolumeByCurrency[curr] || 0;
                return (
                  <div key={curr} className="kpi-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="kpi-title">{curr} Net Settled Volume</span>
                      <DollarSign size={18} color="var(--primary)" />
                    </div>
                    <span className="kpi-value" style={{ color: Number(net) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {curr === 'USD' ? '$' : curr === 'INR' ? '₹' : 'AED '}
                      {Number(net).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="kpi-sub">
                      Gross: {Number(captured).toFixed(2)} | Refunds: {Number(refunded).toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Payment Volume Trends & Transaction Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Payment Trends */}
        <div className="card">
          <div className="card-title">
            <span>Payment Volume Breakdown ({period.toUpperCase()})</span>
            <span className="badge badge-info">{trends.length} periods</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 200 }}></div>
          ) : trends.length === 0 ? (
            <div className="empty-state">
              <p>No settled payment volume recorded in this timeframe.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {trends.map((item, idx) => (
                <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.period}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {item.currency} {Number(item.volume).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.count} captured payment transactions
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Stats Breakdown */}
        <div className="card">
          <div className="card-title">
            <span>Transaction Type & Lifecycle Distribution</span>
            <span className="badge badge-secondary">{txStats?.totalTransactions || 0} Total</span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 200 }}></div>
          ) : !txStats || txStats.totalTransactions === 0 ? (
            <div className="empty-state">
              <p>No transaction lifecycle records found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'var(--success-subtle)', borderRadius: '0.375rem' }}>
                  <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem' }}>{txStats.successfulTransactions}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Success</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--danger-subtle)', borderRadius: '0.375rem' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '1.1rem' }}>{txStats.failedTransactions}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--warning-subtle)', borderRadius: '0.375rem' }}>
                  <div style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '1.1rem' }}>{txStats.pendingTransactions}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Ledger Type Counts
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {Object.entries(txStats.typeDistribution || {}).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>{type}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund and Reconciliation Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Refund Stats */}
        <div className="card">
          <div className="card-title">
            <span>Refund Operations Telemetry</span>
            <RotateCcw size={16} />
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 160 }}></div>
          ) : !refundStats ? (
            <div className="empty-state">
              <p>No refund statistics available.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completed Refunds</span>
                <strong style={{ color: 'var(--success)' }}>{refundStats.completedRefunds}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending Approvals</span>
                <strong style={{ color: 'var(--warning)' }}>{refundStats.pendingRefunds}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Failed / Rejected</span>
                <strong style={{ color: 'var(--danger)' }}>{refundStats.failedRefunds}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refund Volume by Currency:</span>
                {Object.entries(refundStats.refundedAmountByCurrency || {}).map(([curr, amt]) => (
                  <div key={curr} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontWeight: 600 }}>
                    <span>{curr}</span>
                    <span>{Number(amt).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reconciliation Stats */}
        <div className="card">
          <div className="card-title">
            <span>Bank Settlement Discrepancy Breakdown</span>
            <ShieldAlert size={16} />
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 160 }}></div>
          ) : !reconStats ? (
            <div className="empty-state">
              <p>No settlement records processed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total External Records Ingested</span>
                <strong>{reconStats.totalRecords}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Successfully Matched</span>
                <strong style={{ color: 'var(--success)' }}>{reconStats.matchedRecords}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Amount Discrepancies</span>
                <strong style={{ color: 'var(--warning)' }}>{reconStats.amountMismatches}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status Gaps</span>
                <strong style={{ color: 'var(--warning)' }}>{reconStats.statusMismatches}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Missing Internal Entries</span>
                <strong style={{ color: 'var(--danger)' }}>{reconStats.missingInternalRecords}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
