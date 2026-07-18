import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';
import { X, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface CSVImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.csv')) {
        setFile(selected);
        setErrorMsg(null);
      } else {
        setFile(null);
        setErrorMsg('Please select a valid CSV (.csv) file.');
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setFeedback(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback(data);
        if (data.successCount > 0) {
          onSuccess();
        }
      } else {
        setErrorMsg(data.message || 'Failed to process CSV file.');
      }
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setErrorMsg('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--primary)" />
            <span>Import Employees via CSV</span>
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpload}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!feedback ? (
              <>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Upload a standard CSV file to bulk import employees. The system will auto-generate accounts.
                  Hashed passwords default to the employee's ID.
                </p>

                {/* CSV Template Guide */}
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--border-radius-sm)',
                  borderLeft: '4px solid var(--primary)',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>CSV Headers Required:</strong>
                  <code>employeeId, name, email, phone, department, designation, salary, joiningDate, role, reportingManagerId</code>
                  <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    * Dates should use YYYY-MM-DD format. Salary must be a positive number. Roles can be Super Admin, HR Manager, or Employee.
                  </span>
                </div>

                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: file ? 'var(--primary-light)' : 'transparent',
                  transition: 'background-color var(--transition-fast)',
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {file ? file.name : 'Click or Drag CSV file here'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Files up to 5MB
                  </span>
                </div>

                {errorMsg && (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={36} color="var(--success)" />
                  <div>
                    <h4 style={{ fontWeight: 600 }}>Import Processing Complete</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Successfully created <strong>{feedback.successCount}</strong> employees.
                      Failed on <strong>{feedback.errorCount}</strong> rows.
                    </p>
                  </div>
                </div>

                {/* Import Failures */}
                {feedback.errors && feedback.errors.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--error)' }}>
                      Failed Rows List:
                    </p>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '0.5rem',
                    }}>
                      <ul style={{ listStyle: 'none', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {feedback.errors.map((err: any, idx: number) => (
                          <li key={idx} style={{
                            padding: '0.4rem',
                            borderBottom: idx < feedback.errors.length - 1 ? '1px solid var(--border-color)' : 'none',
                          }}>
                            <strong>Row {err.row}:</strong> {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              {feedback ? 'Close' : 'Cancel'}
            </button>
            {!feedback && (
              <button type="submit" className="btn btn-primary" disabled={!file || loading}>
                {loading ? 'Uploading & Processing...' : 'Start Import'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
