import React, { useState, useEffect } from 'react';
import { getPayments, createPayment, authorizePayment, capturePayment, cancelPayment, getCustomers } from '../services/api';

export default function PaymentManager() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [referenceSearch, setReferenceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal & Create Payment Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('CARD_SIMULATED');
  const [description, setDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Selected payment detail modal
  const [activePayment, setActivePayment] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayments(referenceSearch, statusFilter, currencyFilter, page, 10);
      setPayments(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, currencyFilter]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers('', 'ACTIVE', 0, 50);
      setCustomers(data.content || []);
      if (data.content && data.content.length > 0) {
        setSelectedCustomerId(data.content[0].id);
      }
    } catch {
      // Handled gracefully
    }
  };

  const openCreateModal = () => {
    loadCustomers();
    setAmount('150.00');
    setCurrency('USD');
    setPaymentMethod('CARD_SIMULATED');
    setDescription('Product purchase checkout');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    const idempotencyKey = 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    try {
      await createPayment({
        customerId: selectedCustomerId,
        amount: parseFloat(amount),
        currency,
        paymentMethod,
        idempotencyKey,
        description,
      });
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      setFormError(err.message || 'Payment initiation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAuthorize = async (id) => {
    try {
      const updated = await authorizePayment(id);
      fetchPayments();
      if (activePayment?.id === id) setActivePayment(updated);
    } catch (err) {
      alert(err.message || 'Authorization failed');
    }
  };

  const handleCapture = async (id) => {
    try {
      const updated = await capturePayment(id);
      fetchPayments();
      if (activePayment?.id === id) setActivePayment(updated);
    } catch (err) {
      alert(err.message || 'Capture failed');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this payment?')) return;
    try {
      const updated = await cancelPayment(id);
      fetchPayments();
      if (activePayment?.id === id) setActivePayment(updated);
    } catch (err) {
      alert(err.message || 'Cancellation rejected');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CAPTURED': return 'badge up';
      case 'AUTHORIZED': return 'badge up';
      case 'PENDING': return 'badge';
      case 'CANCELLED': return 'badge down';
      case 'FAILED': return 'badge down';
      default: return 'badge';
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); fetchPayments(); }} style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '400px' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Search by payment reference..."
            value={referenceSearch}
            onChange={(e) => setReferenceSearch(e.target.value)}
          />
          <button className="btn" type="submit">Filter</button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="AUTHORIZED">AUTHORIZED</option>
            <option value="CAPTURED">CAPTURED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={currencyFilter}
            onChange={(e) => { setCurrencyFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
            <option value="AED">AED (د.إ)</option>
          </select>

          <button className="btn" onClick={openCreateModal}>+ Process Payment</button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Payment Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading payments...</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No payment records found. Use "+ Process Payment" to initiate a simulated transaction.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Reference</th>
                <th style={{ padding: '0.875rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.875rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.875rem 1rem' }}>Method</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    <button
                      onClick={() => setActivePayment(p)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {p.paymentReference}
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>{p.customerName}</td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                    {parseFloat(p.amount).toFixed(2)} {p.currency}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)' }}>{p.paymentMethod}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={getStatusBadgeClass(p.paymentStatus)}>{p.paymentStatus}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      {p.paymentStatus === 'PENDING' && (
                        <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleAuthorize(p.id)}>
                          Authorize
                        </button>
                      )}
                      {p.paymentStatus === 'AUTHORIZED' && (
                        <button className="btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: 'var(--color-success)' }} onClick={() => handleCapture(p.id)}>
                          Capture
                        </button>
                      )}
                      {(p.paymentStatus === 'PENDING' || p.paymentStatus === 'AUTHORIZED') && (
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-danger)' }} onClick={() => handleCancel(p.id)}>
                          Cancel
                        </button>
                      )}
                      <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setActivePayment(p)}>
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>
              Total {totalElements} payments (Page {page + 1} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
              <button className="btn-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* New Payment Simulation Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Initiate Simulated Payment</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              Payment simulation engine with automated ledger journaling.
            </p>

            {formError && <div className="alert-error">{formError}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Select Customer</label>
                {customers.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-warning)' }}>
                    No active customers available. Please add a customer first in the Customers tab.
                  </p>
                ) : (
                  <select
                    className="form-input"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CARD_SIMULATED">Simulated Credit Card</option>
                  <option value="UPI_SIMULATED">Simulated UPI Instant Transfer</option>
                  <option value="BANK_TRANSFER_SIMULATED">Simulated Wire / Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Order ID</label>
                <input
                  className="form-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Order #40922"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={formSubmitting || customers.length === 0}>
                  {formSubmitting ? 'Processing...' : 'Create Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Details Drawer / Modal */}
      {activePayment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Payment Details: {activePayment.paymentReference}</h3>
              <button className="btn-secondary" onClick={() => setActivePayment(null)}>Close</button>
            </div>

            <ul className="meta-list">
              <li className="meta-item">
                <span className="meta-key">Status</span>
                <span className={getStatusBadgeClass(activePayment.paymentStatus)}>{activePayment.paymentStatus}</span>
              </li>
              <li className="meta-item">
                <span className="meta-key">Amount</span>
                <span className="meta-value">{parseFloat(activePayment.amount).toFixed(2)} {activePayment.currency}</span>
              </li>
              <li className="meta-item">
                <span className="meta-key">Customer</span>
                <span className="meta-value">{activePayment.customerName}</span>
              </li>
              <li className="meta-item">
                <span className="meta-key">Idempotency Key</span>
                <span className="meta-value" style={{ fontSize: '0.75rem' }}>{activePayment.idempotencyKey}</span>
              </li>
            </ul>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem' }}>Transaction History Ledger</h4>
            {(!activePayment.transactions || activePayment.transactions.length === 0) ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No transaction lifecycle events executed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activePayment.transactions.map((t) => (
                  <div key={t.id} style={{ background: 'var(--bg-table-header)', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t.transactionType}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.transactionReference}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${t.transactionStatus === 'SUCCESS' ? 'up' : 'down'}`}>{t.transactionStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
