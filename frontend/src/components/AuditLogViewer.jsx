import React, { useState, useEffect } from 'react';
import { getAuditLogs, getAuditLogById } from '../services/api';
import { ShieldCheck, Search, Filter, Calendar, Eye, X } from 'lucide-react';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, action, entityType, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const startIso = startDate ? new Date(startDate).toISOString() : undefined;
      const endIso = endDate ? new Date(endDate).toISOString() : undefined;

      const data = await getAuditLogs({
        page,
        size: 15,
        action: action.trim() || undefined,
        entityType: entityType.trim() || undefined,
        startDate: startIso,
        endDate: endIso
      });

      setLogs(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to fetch audit records', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setAction('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enterprise Audit Logs</h1>
          <p className="page-subtitle">Immutable security & event stream (Admin Authorized Only).</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Action (e.g. PAYMENT_CREATED)"
            style={{ width: 'auto', minWidth: 220 }}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />

          <input
            type="text"
            className="form-control"
            placeholder="Entity Type (e.g. PAYMENT, USER)"
            style={{ width: 'auto', minWidth: 180 }}
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />

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

          {(action || entityType || startDate || endDate) && (
            <button className="btn btn-sm btn-outline" onClick={resetFilters}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 260 }}></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>No audit trail records found matching criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor Email</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Correlation ID</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td><code>{log.userEmail || 'SYSTEM'}</code></td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td><strong>{log.entityType}</strong></td>
                    <td><code>{log.correlationId ? log.correlationId.substring(0, 8) + '...' : '—'}</code></td>
                    <td style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.description}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelectedLog(log)}>
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page + 1} of {totalPages} ({totalElements} total entries)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button className="btn btn-sm btn-secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedLog && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Audit Event Inspection</h3>
              <button className="btn-close" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><strong>Audit ID:</strong> <code>{selectedLog.id}</code></div>
              <div><strong>Actor Email:</strong> <code>{selectedLog.userEmail || 'SYSTEM'}</code></div>
              <div><strong>Actor User ID:</strong> <code>{selectedLog.userId || 'N/A'}</code></div>
              <div><strong>Action:</strong> <span className="badge badge-info">{selectedLog.action}</span></div>
              <div><strong>Entity Type:</strong> {selectedLog.entityType}</div>
              <div><strong>Entity ID:</strong> <code>{selectedLog.entityId || 'N/A'}</code></div>
              <div><strong>Correlation ID:</strong> <code>{selectedLog.correlationId || 'N/A'}</code></div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toISOString()}</div>
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '0.375rem' }}>
                <strong>Description / Payload:</strong>
                <p style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>{selectedLog.description}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
