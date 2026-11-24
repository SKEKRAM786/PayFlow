import React, { useState, useEffect } from 'react';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
  getPayments,
  createPayment,
  authorizePayment,
  capturePayment,
  cancelPayment,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerManager() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states (Create / Edit Customer Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Customer Transactions & History Drawer/Modal
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [customerPaymentsLoading, setCustomerPaymentsLoading] = useState(false);
  const [customerPaymentsError, setCustomerPaymentsError] = useState(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');

  // Make Payment for specific customer Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('150.00');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [payMethod, setPayMethod] = useState('CARD_SIMULATED');
  const [payDescription, setPayDescription] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState(null);
  const [paySuccessMsg, setPaySuccessMsg] = useState(null);

  // Active Payment Details Modal
  const [activePaymentDetail, setActivePaymentDetail] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(search, statusFilter, page, 10);
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch customer list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers();
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormFullName(c.fullName);
    setFormEmail(c.email);
    setFormPhone(c.phoneNumber || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          fullName: formFullName,
          email: formEmail,
          phoneNumber: formPhone,
        });
      } else {
        await createCustomer({
          fullName: formFullName,
          email: formEmail,
          phoneNumber: formPhone,
        });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setFormError(err.message || 'Error saving customer record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (c) => {
    const newStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCustomerStatus(c.id, newStatus);
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Failed to update customer status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete/deactivate this customer?')) return;
    try {
      await deleteCustomer(id);
      fetchCustomers();
      if (selectedCustomerHistory?.id === id) {
        setSelectedCustomerHistory(null);
      }
    } catch (err) {
      alert(err.message || 'Deletion prevented');
    }
  };

  // Open customer transactions history
  const openCustomerHistory = (customer) => {
    setSelectedCustomerHistory(customer);
    setHistoryStatusFilter('');
    setPaySuccessMsg(null);
    fetchCustomerPayments(customer.id, '');
  };

  const fetchCustomerPayments = async (customerId, status) => {
    setCustomerPaymentsLoading(true);
    setCustomerPaymentsError(null);
    try {
      const data = await getPayments({
        customerId,
        status: status || '',
        page: 0,
        size: 50,
      });
      setCustomerPayments(data.content || []);
    } catch (err) {
      setCustomerPaymentsError(err.message || 'Failed to fetch customer transactions');
    } finally {
      setCustomerPaymentsLoading(false);
    }
  };

  const handleStatusFilterChange = (status) => {
    setHistoryStatusFilter(status);
    if (selectedCustomerHistory) {
      fetchCustomerPayments(selectedCustomerHistory.id, status);
    }
  };

  // Make Payment for customer
  const openMakePaymentModal = (defaultAmount = '150.00', defaultCurrency = 'USD') => {
    setPayAmount(defaultAmount);
    setPayCurrency(defaultCurrency);
    setPayMethod('CARD_SIMULATED');
    setPayDescription(`Payment for ${selectedCustomerHistory?.fullName || 'Customer'}`);
    setPayError(null);
    setIsPayModalOpen(true);
  };

  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerHistory) return;

    setPayError(null);
    setPaySubmitting(true);
    const idempotencyKey = 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    try {
      const newPayment = await createPayment({
        customerId: selectedCustomerHistory.id,
        amount: parseFloat(payAmount),
        currency: payCurrency,
        paymentMethod: payMethod,
        idempotencyKey,
        description: payDescription,
      });

      setIsPayModalOpen(false);
      setPaySuccessMsg(`Payment ${newPayment.reference} initiated successfully!`);
      // Reload customer payments and update customer list in background
      await fetchCustomerPayments(selectedCustomerHistory.id, historyStatusFilter);
      fetchCustomers();
    } catch (err) {
      setPayError(err.message || 'Payment initiation failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleAuthorize = async (id) => {
    try {
      await authorizePayment(id);
      if (selectedCustomerHistory) {
        fetchCustomerPayments(selectedCustomerHistory.id, historyStatusFilter);
      }
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Authorization failed');
    }
  };

  const handleCapture = async (id) => {
    try {
      await capturePayment(id);
      if (selectedCustomerHistory) {
        fetchCustomerPayments(selectedCustomerHistory.id, historyStatusFilter);
      }
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Capture failed');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this payment?')) return;
    try {
      await cancelPayment(id);
      if (selectedCustomerHistory) {
        fetchCustomerPayments(selectedCustomerHistory.id, historyStatusFilter);
      }
      fetchCustomers();
    } catch (err) {
      alert(err.message || 'Cancellation rejected');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CAPTURED':
        return 'badge up';
      case 'AUTHORIZED':
        return 'badge authorized';
      case 'PENDING':
        return 'badge pending';
      case 'CANCELLED':
      case 'FAILED':
        return 'badge down';
      default:
        return 'badge badge-secondary';
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '500px' }}>
          <input
            className="form-input"
            type="text"
            placeholder="Search customer by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn" type="submit">Search</button>
        </form>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button className="btn" onClick={openCreateModal}>+ Add Customer</button>
        </div>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Customer Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading customers...</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No customer profiles found. Use "+ Add Customer" to create the first profile.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Customer Name (Click to View)</th>
                <th style={{ padding: '0.875rem 1rem' }}>Email</th>
                <th style={{ padding: '0.875rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payments</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    transition: 'background 0.15s ease',
                  }}
                  className="customer-table-row"
                >
                  <td
                    style={{ padding: '0.875rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => openCustomerHistory(c)}
                    title="Click to view all transactions and payments for this customer"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          flexShrink: 0,
                        }}
                      >
                        {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                          {c.fullName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                          Click to inspect transactions
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)' }}>{c.email}</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-muted)' }}>{c.phoneNumber || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'up' : 'down'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      className="user-badge"
                      style={{ fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}
                      onClick={() => openCustomerHistory(c)}
                      title="View transactions"
                    >
                      {c.paymentCount ?? 0} txs ↗
                    </button>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        className="btn"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => openCustomerHistory(c)}
                        title="View all transactions & make payment"
                      >
                        Transactions & Pay
                      </button>
                      <button className="btn-secondary" onClick={() => openEditModal(c)}>Edit</button>
                      {isAdmin && (
                        <button className="btn-secondary" onClick={() => handleToggleStatus(c)}>
                          {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button
                        className="btn-secondary"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--color-border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>
              Showing {customers.length} of {totalElements} customers (Page {page + 1} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Transactions & Payments Modal / Detail View */}
      {selectedCustomerHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 90, padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-modal)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {selectedCustomerHistory.fullName ? selectedCustomerHistory.fullName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {selectedCustomerHistory.fullName}
                    </h2>
                    <span className={getStatusBadgeClass(selectedCustomerHistory.status)}>
                      {selectedCustomerHistory.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>{selectedCustomerHistory.email}</span>
                    {selectedCustomerHistory.phoneNumber && <span> • {selectedCustomerHistory.phoneNumber}</span>}
                    <span style={{ fontFamily: 'var(--font-mono)', marginLeft: '0.5rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      ID: {selectedCustomerHistory.id}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => openMakePaymentModal()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
                >
                  💳 Make Payment Again
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setSelectedCustomerHistory(null)}
                  style={{ fontSize: '1.1rem', padding: '0.35rem 0.65rem' }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notification / Alert messages */}
            {paySuccessMsg && (
              <div className="badge up" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', width: '100%', borderRadius: '6px' }}>
                ✓ {paySuccessMsg}
              </div>
            )}
            {customerPaymentsError && (
              <div className="alert-error">{customerPaymentsError}</div>
            )}

            {/* Filter and Overview Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', 'CAPTURED', 'PENDING', 'AUTHORIZED', 'FAILED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    className={`filter-pill-btn ${historyStatusFilter === st ? 'active' : ''}`}
                    onClick={() => handleStatusFilterChange(st)}
                  >
                    {st === '' ? 'ALL STATUSES' : st}
                  </button>
                ))}
              </div>

              <button
                className="btn-secondary btn-sm"
                onClick={() => fetchCustomerPayments(selectedCustomerHistory.id, historyStatusFilter)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>↻</span> Refresh
              </button>
            </div>

            {/* Transactions / Payments Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
              {customerPaymentsLoading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading transactions for {selectedCustomerHistory.fullName}...
                </div>
              ) : customerPayments.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    No transactions found {historyStatusFilter ? `with status "${historyStatusFilter}"` : ''}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    You can process a new payment for {selectedCustomerHistory.fullName} right now.
                  </div>
                  <button className="btn btn-primary" onClick={() => openMakePaymentModal()}>
                    + Make First Payment
                  </button>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Payment Ref</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerPayments.map((p) => {
                      const ref = p.paymentReference || p.reference || '—';
                      const st = p.paymentStatus || p.status;
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                            {ref}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {Number(p.amount).toFixed(2)} {p.currency}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {p.paymentMethod}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={getStatusBadgeClass(st)}>
                              {st}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              {st === 'PENDING' && (
                                <>
                                  <button className="btn btn-sm" onClick={() => handleAuthorize(p.id)}>
                                    Authorize
                                  </button>
                                  <button className="btn-secondary btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleCancel(p.id)}>
                                    Cancel
                                  </button>
                                </>
                              )}
                              {st === 'AUTHORIZED' && (
                                <>
                                  <button className="btn btn-sm" onClick={() => handleCapture(p.id)}>
                                    Capture
                                  </button>
                                  <button className="btn-secondary btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleCancel(p.id)}>
                                    Cancel
                                  </button>
                                </>
                              )}
                              {(st === 'FAILED' || st === 'CANCELLED') && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openMakePaymentModal(p.amount ? p.amount.toString() : '150.00', p.currency || 'USD')}
                                  title="Process payment again for this customer"
                                >
                                  ↺ Pay Again
                                </button>
                              )}
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => setActivePaymentDetail(p)}
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Make Payment for Customer Modal */}
      {isPayModalOpen && selectedCustomerHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Make Payment for {selectedCustomerHistory.fullName}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Customer: <strong>{selectedCustomerHistory.fullName}</strong> ({selectedCustomerHistory.email})
            </p>

            {payError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{payError}</div>}

            <form onSubmit={handleCreatePaymentSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="150.00"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input"
                    value={payCurrency}
                    onChange={(e) => setPayCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="CARD_SIMULATED">Simulated Card (Mock Gateway)</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CRYPTO_SIMULATED">Crypto Simulated Rail</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Order Reference</label>
                <input
                  className="form-input"
                  type="text"
                  value={payDescription}
                  onChange={(e) => setPayDescription(e.target.value)}
                  placeholder="Order payment checkout"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPayModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={paySubmitting}>
                  {paySubmitting ? 'Processing Payment...' : 'Confirm & Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {activePaymentDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 120, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Payment Details</h3>
              <button className="btn-secondary" onClick={() => setActivePaymentDetail(null)} style={{ padding: '0.2rem 0.6rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Payment Reference: </span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                  {activePaymentDetail.paymentReference || activePaymentDetail.reference}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Amount: </span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {Number(activePaymentDetail.amount).toFixed(2)} {activePaymentDetail.currency}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                <span className={getStatusBadgeClass(activePaymentDetail.paymentStatus || activePaymentDetail.status)}>
                  {activePaymentDetail.paymentStatus || activePaymentDetail.status}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method: </span>
                <span style={{ color: 'var(--text-main)' }}>{activePaymentDetail.paymentMethod}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Idempotency Key: </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{activePaymentDetail.idempotencyKey || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Gateway Transaction ID: </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{activePaymentDetail.gatewayTransactionId || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Created At: </span>
                <span style={{ color: 'var(--text-main)' }}>{activePaymentDetail.createdAt ? new Date(activePaymentDetail.createdAt).toLocaleString() : '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => setActivePaymentDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Customer Profile Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              {editingCustomer ? 'Update Customer Profile' : 'Onboard New Customer'}
            </h3>

            {formError && <div className="alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name / Organization</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Acme Global Inc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="billing@acme.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  className="form-input"
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1-555-0199"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editingCustomer ? 'Update Profile' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
