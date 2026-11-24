import React, { useState, useEffect } from 'react';
import { getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

const UserDirectory = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.content || []);
    } catch (err) {
      console.error('Failed to load user directory', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Enterprise User Directory</h1>
          <p className="page-subtitle">Administrative oversight and role assignment (ADMIN privilege required).</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 200 }}></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No registered users found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.fullName}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' :
                        u.role === 'OPERATIONS' ? 'badge-info' : 'badge-secondary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.enabled ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                          <CheckCircle2 size={16} /> Active
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)' }}>
                          <XCircle size={16} /> Disabled
                        </span>
                      )}
                    </td>
                    <td><code>{u.id}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;
