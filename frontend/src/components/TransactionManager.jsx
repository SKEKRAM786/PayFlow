import React, { useState, useEffect } from 'react';
import { getTransactions, getTransactionById, getCustomers } from '../services/api';

export default function TransactionManager() {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  // Load customer list for filter dropdown
  useEffect(() => {
    getCustomers('', 'ACTIVE', 0, 100)
      .then((res) => setCustomers(res.content || []))
      .catch(() => {});
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: 15,
        search: search.trim() || undefined,
        customerId: selectedCustomerId || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        currency: currencyFilter || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };

      const data = await getTransactions(params);
      setTransactions(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Failed to load transaction ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, selectedCustomerId, typeFilter, statusFilter, currencyFilter]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCustomerId('');
    setTypeFilter('');
    setStatusFilter('');
    setCurrencyFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
    setTimeout(fetchTransactions, 50);
  };

  const getStatusBadge = (status) => {
    if (status === 'SUCCESS') return 'badge up';
    if (status === 'FAILED') return 'badge down';
    return 'badge pending';
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'AUTHORIZATION':
        return 'badge authorized';
      case 'CAPTURE':
        return 'badge up';
      case 'REFUND':
        return 'badge pending';
      case 'CANCELLATION':
        return 'badge down';
      default:
        return 'badge';
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Financial Transaction Ledger
          </h1>
          <div className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Immutable double-entry event ledger of all authorizations, captures, cancellations, and settlements.
          </div>
        </div>
        <button
          className="btn-secondary btn-sm"
          onClick={fetchTransactions}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <span>↻</span> Refresh Ledger
        </button>
      </div>

      {/* Advanced Filtering Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">Search Box</label>
            <input
              className="form-input"
              type="text"
              placeholder="Customer name, TX or PAY ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Select Customer</label>
            <select
              className="form-input"
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Transaction Type</label>
            <select
              className="form-input"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Types</option>
              <option value="AUTHORIZATION">AUTHORIZATION</option>
              <option value="CAPTURE">CAPTURE</option>
              <option value="CANCELLATION">CANCELLATION</option>
              <option value="REFUND">REFUND</option>
            </select>
          </div>

          <div>
            <label className="form-label">Outcome Status</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          <div>
            <label className="form-label">Currency</label>
            <select
              className="form-input"
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
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

          <div>
            <label className="form-label">To Date</label>
            <input
              className="form-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
              Filter
            </button>
            <button type="button" className="btn-secondary" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Transaction Ledger Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading financial ledger records...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              No transactions matching the selected filters
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Try selecting a different customer, clearing search terms, or resetting date filters.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-header)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Transaction Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.875rem 1rem' }}>Payment Ref</th>
                <th style={{ padding: '0.875rem 1rem' }}>Type</th>
                <th style={{ padding: '0.875rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                    {t.transactionReference}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {t.customerName ? (
                      <div
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
                        onClick={() => {
                          if (t.customerId) {
                            setSelectedCustomerId(t.customerId);
                            setPage(0);
                          }
                        }}
                        title={`Filter ledger by ${t.customerName}`}
                      >
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--primary-subtle)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        >
                          {t.customerName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--primary)', fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                          {t.customerName}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {t.paymentReference}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={getTypeBadge(t.transactionType)}>{t.transactionType}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {parseFloat(t.amount).toFixed(2)} {t.currency}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={getStatusBadge(t.transactionStatus)}>{t.transactionStatus}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedTx(t)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Showing {transactions.length} of {totalElements} journal events (Page {page + 1} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn-secondary btn-sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTx && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-modal)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Transaction Audit Ledger Record
              </h3>
              <button className="btn-secondary btn-sm" onClick={() => setSelectedTx(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{selectedTx.transactionReference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedTx.customerName || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Associated Payment Ref:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{selectedTx.paymentReference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Provider Tracking Ref:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {selectedTx.providerReference || 'N/A (Internal Rail)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Journal Entry Type:</span>
                <span className={getTypeBadge(selectedTx.transactionType)}>{selectedTx.transactionType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Execution Outcome:</span>
                <span className={getStatusBadge(selectedTx.transactionStatus)}>{selectedTx.transactionStatus}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Settlement Amount:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
                  {parseFloat(selectedTx.amount).toFixed(2)} {selectedTx.currency}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Recorded Timestamp:</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setSelectedTx(null)}>
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
