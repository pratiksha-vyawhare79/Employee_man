import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL, getImageUrl } from '../config';
import { EmployeeForm } from './EmployeeForm';
import { CSVImportModal } from './CSVImportModal';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  GitCommit,
  UserCheck,
  X
} from 'lucide-react';

export const EmployeeTable: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  
  // Data State
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Queries/Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals & Action States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  
  // Quick direct reportees list view
  const [viewReporteesId, setViewReporteesId] = useState<string | null>(null);
  const [reportees, setReportees] = useState<any[]>([]);
  const [loadingReportees, setLoadingReportees] = useState(false);

  // Toast alert
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        search,
        department,
        role,
        status,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`${API_BASE_URL}/api/employees?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } else {
        triggerAlert('error', 'Failed to fetch employee directory.');
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      triggerAlert('error', 'Network error. Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters or page changes
  useEffect(() => {
    if (token) {
      fetchEmployees();
    }
  }, [token, page, department, role, status, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (token) {
        setPage(1); // Reset page on new search
        fetchEmployees();
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Fetch reportees list when active
  useEffect(() => {
    const fetchReporteesList = async () => {
      if (!viewReporteesId) return;
      setLoadingReportees(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees/${viewReporteesId}/reportees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setReportees(data);
        }
      } catch (err) {
        console.error('Error fetching reportees:', err);
      } finally {
        setLoadingReportees(false);
      }
    };

    fetchReporteesList();
  }, [viewReporteesId, token]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will perform a soft delete.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        triggerAlert('success', `Employee ${name} deleted successfully.`);
        fetchEmployees();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'Failed to delete employee.');
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      triggerAlert('error', 'Network error. Could not delete employee.');
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const canManage = currentUser?.role === 'Super Admin' || currentUser?.role === 'HR Manager';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Employee Directory</h2>
          <p style={{ color: 'var(--text-secondary)' }}>View, manage, and filter corporate employee records.</p>
        </div>

        {canManage && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowCSVModal(true)}>
              <FileSpreadsheet size={16} />
              <span>Import CSV</span>
            </button>
            <button className="btn btn-primary" onClick={() => { setSelectedEmpId(null); setShowFormModal(true); }}>
              <UserPlus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters panel */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          {/* Department Filter */}
          <select
            className="form-control"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
            style={{ width: '180px' }}
          >
            <option value="">All Departments</option>
            <option value="Administration">Administration</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Role Filter */}
          <select
            className="form-control"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            style={{ width: '150px' }}
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Employee">Employee</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-control"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            style={{ width: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading directory listings...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No employee records found matching current query.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('employeeId')}>
                    Employee ID {sortBy === 'employeeId' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('joiningDate')}>
                    Joining Date {sortBy === 'joiningDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Manager</th>
                  {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td style={{ fontWeight: 600 }}>{emp.employeeId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {emp.profileImage ? (
                          <img
                            src={getImageUrl(emp.profileImage)}
                            alt={emp.name}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                          }}>
                            {emp.name.charAt(0)}
                          </div>
                        )}
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>{emp.designation}</td>
                    <td>{new Date(emp.joiningDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        emp.role === 'Super Admin'
                          ? 'badge-admin'
                          : emp.role === 'HR Manager'
                          ? 'badge-hr'
                          : 'badge-employee'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      {emp.reportingManager ? (
                        <div style={{ fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 500, display: 'block' }}>{emp.reportingManager.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{emp.reportingManager.designation}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                    
                    {/* Actions Panel */}
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {/* View direct reportees list */}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setViewReporteesId(viewReporteesId === emp._id ? null : emp._id)}
                            title="View Direct Reports"
                          >
                            <GitCommit size={14} />
                          </button>

                          {/* Edit button (HR can't edit Super Admin profiles) */}
                          {!(currentUser?.role === 'HR Manager' && emp.role === 'Super Admin') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => { setSelectedEmpId(emp._id); setShowFormModal(true); }}
                              title="Edit Employee"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}

                          {/* Delete button (only Super Admin, cannot delete self) */}
                          {currentUser?.role === 'Super Admin' && currentUser._id !== emp._id && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(emp._id, emp.name)}
                              title="Delete Employee"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!loading && employees.length > 0 && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {employees.length} of <strong>{total}</strong> employees
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <span style={{ fontSize: '0.85rem' }}>
                Page <strong>{page}</strong> of {pages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct Reportees Side panel (collapsible under table) */}
      {viewReporteesId && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Direct Reports List ({reportees.length})
            </h4>
            <button onClick={() => setViewReporteesId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          {loadingReportees ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading reportees list...</p>
          ) : reportees.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No direct reportees found for this manager.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {reportees.map((rep) => (
                <div key={rep._id} style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {rep.profileImage ? (
                    <img
                      src={getImageUrl(rep.profileImage)}
                      alt={rep.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--primary)',
                      fontWeight: 600,
                    }}>
                      {rep.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rep.name}
                    </p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                      {rep.designation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Register / Edit Form Modal */}
      {showFormModal && (
        <EmployeeForm
          employeeIdToEdit={selectedEmpId}
          onClose={() => setShowFormModal(false)}
          onSave={() => {
            setShowFormModal(false);
            triggerAlert('success', `Employee profile updated successfully.`);
            fetchEmployees();
          }}
        />
      )}

      {/* CSV Batch Upload Modal */}
      {showCSVModal && (
        <CSVImportModal
          onClose={() => setShowCSVModal(false)}
          onSuccess={() => {
            setShowCSVModal(false);
            triggerAlert('success', 'Bulk CSV import completed successfully.');
            fetchEmployees();
          }}
        />
      )}

      {/* Toast Alert popup */}
      {alert && (
        <div className={`alert-toast alert-toast-${alert.type}`}>
          <UserCheck size={18} />
          <span>{alert.message}</span>
        </div>
      )}
    </div>
  );
};
