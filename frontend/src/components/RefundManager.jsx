import React, { useState, useEffect } from 'react';
import { getRefunds, getPayments, processRefund, getRefundableBalance } from '../services/api';

export default function RefundManager() {
  const [refunds, setRefunds] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initiate Refund Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capturedPayments, setCapturedPayments] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState('full'); // 'full' | 'partial'
  const [reason, setReason] = useState('Customer return / dissatisfaction');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        currency: currencyFilter || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      const data = await getRefunds(params);
      setRefunds(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, statusFilter, currencyFilter]);

  const loadCapturedPayments = async () => {
    try {
      const data = await getPayments('', 'CAPTURED', '', 0, 50);
      const list = data.content || [];
      setCapturedPayments(list);
      if (list.length > 0) {
        setSelectedPaymentId(list[0].id);
        fetchBalance(list[0].id);
      }
    } catch {
      // Ignored
    }
  };

  const fetchBalance = async (pId) => {
    try {
      const bal = await getRefundableBalance(pId);
      setBalanceInfo(bal);
      if (refundType === 'full') {
        setRefundAmount(bal.remainingRefundableAmount.toString());
      }
    } catch {
      setBalanceInfo(null);
    }
  };

  const handlePaymentSelect = (e) => {
    const id = e.target.value;
    setSelectedPaymentId(id);
    fetchBalance(id);
  };

  const openRefundModal = () => {
    loadCapturedPayments();
    setRefundType('full');
    setReason('Customer requested return');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleRefundTypeChange = (type) => {
    setRefundType(type);
    if (type === 'full' && balanceInfo) {
      setRefundAmount(balanceInfo.remainingRefundableAmount.toString());
    } else if (type === 'partial' && balanceInfo) {
      setRefundAmount((balanceInfo.remainingRefundableAmount / 2).toFixed(2));
    }
  };

  const handleInitiateRefund = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    const idempotencyKey = 'idemp-ref-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    try {
      await processRefund(selectedPaymentId, {
        amount: parseFloat(refundAmount),
        reason,
        idempotencyKey,
      });
      setIsModalOpen(false);
      fetchRefunds();
    } catch (err) {
      setModalError(err.message || 'Refund processing rejected');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') return 'badge up';
    if (status === 'FAILED') return 'badge down';
    return 'badge';
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Filtering Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); fetchRefunds(); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">Search Reference</label>
            <input
              className="form-input"
              type="text"
              placeholder="REF- or PAY- ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>

          <div>
            <label className="form-label">Currency</label>
            <select className="form-input" value={currencyFilter} onChange={(e) => { setCurrencyFilter(e.target.value); setPage(0); }}>
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>

          <div>
            <label className="form-label">From Date</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" type="submit" style={{ flex: 1 }}>Filter</button>
            <button className="btn" type="button" style={{ background: 'var(--color-warning)' }} onClick={openRefundModal}>
              + Issue Refund
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Refunds Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading refunds...</div>
        ) : refunds.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No refund records found. Captured payments can be fully or partially refunded here.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Refund Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payment Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Refund Amount</th>
                <th style={{ padding: '0.875rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem' }}>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.refundReference}</td>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>{r.paymentReference}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    {parseFloat(r.refundAmount).toFixed(2)} {r.currency}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)' }}>{r.refundReason}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={getStatusBadge(r.refundStatus)}>{r.refundStatus}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>
              Showing {refunds.length} of {totalElements} refunds (Page {page + 1} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
              <button className="btn-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Issue Refund Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Issue Payment Refund</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              Full or partial reversals for CAPTURED transactions.
            </p>

            {modalError && <div className="alert-error">{modalError}</div>}

            <form onSubmit={handleInitiateRefund}>
              <div className="form-group">
                <label className="form-label">Eligible Captured Payment</label>
                {capturedPayments.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                    No captured payments available to refund.
                  </p>
                ) : (
                  <select className="form-input" value={selectedPaymentId} onChange={handlePaymentSelect} required>
                    {capturedPayments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.paymentReference} — {parseFloat(p.amount).toFixed(2)} {p.currency} ({p.customerName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {balanceInfo && (
                <div style={{ background: 'var(--bg-table-header)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Original Captured:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{parseFloat(balanceInfo.totalCapturedAmount).toFixed(2)} {balanceInfo.currency}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Already Refunded:</span>
                    <span style={{ color: 'var(--text-main)' }}>{parseFloat(balanceInfo.totalRefundedAmount).toFixed(2)} {balanceInfo.currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.25rem', color: 'var(--success)' }}>
                    <span>Available Refundable Balance:</span>
                    <strong>{parseFloat(balanceInfo.remainingRefundableAmount).toFixed(2)} {balanceInfo.currency}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Refund Scope</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" checked={refundType === 'full'} onChange={() => handleRefundTypeChange('full')} />
                    Full Refund
                  </label>
                  <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" checked={refundType === 'partial'} onChange={() => handleRefundTypeChange('partial')} />
                    Partial Refund
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Refund Amount</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceInfo ? balanceInfo.remainingRefundableAmount : undefined}
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={refundType === 'full'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Refund</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Defective goods, customer return, etc."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={submitting || capturedPayments.length === 0 || !balanceInfo || balanceInfo.remainingRefundableAmount <= 0}>
                  {submitting ? 'Settling Refund...' : 'Process Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
