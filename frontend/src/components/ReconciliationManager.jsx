import React, { useState, useEffect } from 'react';
import {
  getSettlementBatches,
  getReconciliationRecords,
  getReconciliationSummary,
  importSettlementCsv,
  runReconciliation,
  exportReconciliationCsv
} from '../services/api';

const ReconciliationManager = () => {
  const [batches, setBatches] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadBatches();
    loadSummary();
    loadRecords();
  }, [page, statusFilter, selectedBatchId]);

  const loadBatches = async () => {
    try {
      const data = await getSettlementBatches(0, 20);
      setBatches(data.content || []);
    } catch (err) {
      console.error('Failed to load settlement batches', err);
    }
  };

  const loadSummary = async (batchId = selectedBatchId) => {
    try {
      const data = await getReconciliationSummary(batchId || null);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load reconciliation summary', err);
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReconciliationRecords({
        page,
        size: 10,
        status: statusFilter || undefined,
        batchId: selectedBatchId || undefined,
        search: search.trim() || undefined
      });
      setRecords(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalRecords(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load reconciliation records');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a CSV file first');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await importSettlementCsv(formData);
      setSuccess(`File "${res.filename}" imported successfully (${res.totalRecords} records, Batch: ${res.batchId.substring(0, 8)}...)`);
      setSelectedFile(null);
      await loadBatches();
      await loadSummary(res.batchId);
      setSelectedBatchId(res.batchId);
    } catch (err) {
      setError(err.message || 'Failed to import settlement file');
    } finally {
      setUploading(false);
    }
  };

  const handleRunReconciliation = async (batchId) => {
    if (!batchId) return;
    setReconciling(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await runReconciliation(batchId);
      setSuccess(`Reconciliation finished for batch: Matched: ${res.matchedCount}, Amount Mismatches: ${res.amountMismatchCount}, Status Mismatches: ${res.statusMismatchCount}, Missing: ${res.missingInInternalCount}`);
      await loadBatches();
      await loadSummary(batchId);
      await loadRecords();
    } catch (err) {
      setError(err.message || 'Reconciliation execution failed');
    } finally {
      setReconciling(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await exportReconciliationCsv(selectedBatchId || null);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reconciliation_report_${selectedBatchId ? selectedBatchId.substring(0, 8) : 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccess('CSV report exported successfully');
    } catch (err) {
      setError(err.message || 'Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      MATCHED: 'badge-success',
      AMOUNT_MISMATCH: 'badge-warning',
      STATUS_MISMATCH: 'badge-warning',
      MISSING_IN_INTERNAL: 'badge-danger',
      MISSING_IN_EXTERNAL: 'badge-danger',
      UNRECONCILED: 'badge-secondary',
      PENDING: 'badge-info'
    };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h2>Payment Reconciliation Engine</h2>
          <p className="subtitle">Automated multi-criteria matching against external bank settlement files</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handleExportCsv}
            disabled={exporting}
          >
            {exporting ? 'Generating CSV...' : '📥 Export Reconciliation CSV'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Upload & Quick Action Section */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3>Import External Settlement CSV</h3>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Expected format: <code>transaction_reference, payment_reference, amount, currency, settlement_date, settlement_status</code>
          </p>
          <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Importing...' : 'Upload & Process Batch'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Active Settlement Batches</h3>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {batches.length === 0 ? (
              <p style={{ color: '#888', fontSize: '0.85rem' }}>No settlement batches imported yet.</p>
            ) : (
              <table className="table" style={{ fontSize: '0.8rem' }}>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} style={{ background: selectedBatchId === b.id ? '#eef2ff' : 'transparent' }}>
                      <td>
                        <strong>{b.filename}</strong>
                        <div style={{ color: '#666', fontSize: '0.75rem' }}>{b.totalRecords} records • {b.status}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.status === 'IMPORTED' && (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleRunReconciliation(b.id)}
                            disabled={reconciling}
                          >
                            Run
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-outline"
                          style={{ marginLeft: '0.3rem' }}
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            loadSummary(b.id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards & Proportions */}
      {summary && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <span className="kpi-title">Total Records</span>
            <span className="kpi-value">{summary.totalRecords}</span>
            <span className="kpi-sub">Total External Lines</span>
          </div>
          <div className="kpi-card" style={{ borderLeft: '4px solid #10b981' }}>
            <span className="kpi-title">Matched</span>
            <span className="kpi-value" style={{ color: '#10b981' }}>{summary.matched}</span>
            <span className="kpi-sub">{summary.totalRecords ? ((summary.matched / summary.totalRecords) * 100).toFixed(1) : 0}% reconciled</span>
          </div>
          <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="kpi-title">Amount Mismatch</span>
            <span className="kpi-value" style={{ color: '#f59e0b' }}>{summary.amountMismatch}</span>
            <span className="kpi-sub">Discrepancy in Settlement</span>
          </div>
          <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <span className="kpi-title">Missing / Unresolved</span>
            <span className="kpi-value" style={{ color: '#ef4444' }}>{summary.missingInInternal + summary.statusMismatch}</span>
            <span className="kpi-sub">{summary.missingInInternal} missing, {summary.statusMismatch} status gap</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search reference, mismatch reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadRecords()}
          />
        </div>
        <div>
          <select 
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Reconciliation Statuses</option>
            <option value="MATCHED">MATCHED</option>
            <option value="AMOUNT_MISMATCH">AMOUNT_MISMATCH</option>
            <option value="STATUS_MISMATCH">STATUS_MISMATCH</option>
            <option value="MISSING_IN_INTERNAL">MISSING_IN_INTERNAL</option>
            <option value="MISSING_IN_EXTERNAL">MISSING_IN_EXTERNAL</option>
            <option value="UNRECONCILED">UNRECONCILED</option>
          </select>
        </div>
        <div>
          <select
            className="form-control"
            value={selectedBatchId}
            onChange={(e) => {
              setSelectedBatchId(e.target.value);
              loadSummary(e.target.value);
            }}
          >
            <option value="">All Settlement Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.filename} ({b.id.substring(0, 8)})</option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => loadRecords()}>Filter</button>
      </div>

      {/* Records Table */}
      <div className="table-responsive card">
        <table className="table">
          <thead>
            <tr>
              <th>Ext Reference</th>
              <th>Internal Reference</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Reconciled At</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No reconciliation records found.</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.externalReference || '—'}</strong></td>
                  <td>{r.internalReference || '—'}</td>
                  <td>{r.expectedAmount ? Number(r.expectedAmount).toFixed(2) : '—'}</td>
                  <td>{r.actualAmount ? Number(r.actualAmount).toFixed(2) : '—'}</td>
                  <td>{r.currency}</td>
                  <td>{getStatusBadge(r.reconciliationStatus)}</td>
                  <td>{r.reconciledAt ? new Date(r.reconciledAt).toLocaleString() : '—'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => setSelectedRecord(r)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            Showing page {page + 1} of {totalPages || 1} ({totalRecords} records)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-sm btn-secondary" 
              disabled={page === 0} 
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-sm btn-secondary" 
              disabled={page + 1 >= totalPages} 
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal / Drawer */}
      {selectedRecord && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Reconciliation Record Inspection</h3>
              <button className="btn-close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div><strong>Record ID:</strong> <code>{selectedRecord.id}</code></div>
                <div><strong>Batch ID:</strong> <code>{selectedRecord.batchId || 'N/A'}</code></div>
                <div><strong>External Ref:</strong> <code>{selectedRecord.externalReference}</code></div>
                <div><strong>Internal Ref:</strong> <code>{selectedRecord.internalReference || 'N/A'}</code></div>
                <div><strong>Transaction ID:</strong> <code>{selectedRecord.transactionId || 'N/A'}</code></div>
                <div><strong>Status:</strong> {getStatusBadge(selectedRecord.reconciliationStatus)}</div>
                <div><strong>Expected Amount:</strong> {selectedRecord.expectedAmount} {selectedRecord.currency}</div>
                <div><strong>Actual Amount:</strong> {selectedRecord.actualAmount} {selectedRecord.currency}</div>
                <div><strong>Reconciled At:</strong> {selectedRecord.reconciledAt || 'Pending'}</div>
                <div><strong>Created At:</strong> {selectedRecord.createdAt}</div>
              </div>
              {selectedRecord.mismatchReason && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                  <strong>Mismatch Reason:</strong> {selectedRecord.mismatchReason}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationManager;