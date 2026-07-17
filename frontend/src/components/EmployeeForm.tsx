import React, { useState, useEffect } from 'react';
import { useAuth, type User } from '../hooks/useAuth';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface EmployeeFormProps {
  employeeIdToEdit?: string | null;
  onClose: () => void;
  onSave: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employeeIdToEdit, onClose, onSave }) => {
  const { token, user: currentUser } = useAuth();
  
  // Form fields
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'HR Manager' | 'Employee'>('Employee');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [reportingManager, setReportingManager] = useState('');
  const [password, setPassword] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Lists
  const [managers, setManagers] = useState<any[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const isEditMode = !!employeeIdToEdit;
  const isNormalEmployeeEdit = currentUser?.role === 'Employee';

  // Fetch managers list
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch('/api/employees?limit=1000', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          // Exclude the current employee being edited from reporting managers to avoid self-reporting
          const filtered = (data.employees || []).filter((emp: any) => emp._id !== employeeIdToEdit);
          setManagers(filtered);
        }
      } catch (err) {
        console.error('Error fetching manager list:', err);
      }
    };

    if (token) {
      fetchManagers();
    }
  }, [token, employeeIdToEdit]);

  // Fetch employee details in edit mode
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!isEditMode || !employeeIdToEdit) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/employees/${employeeIdToEdit}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setEmployeeId(data.employeeId || '');
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setDepartment(data.department || '');
          setDesignation(data.designation || '');
          setSalary(data.salary?.toString() || '');
          setRole(data.role || 'Employee');
          setStatus(data.status || 'Active');
          setReportingManager(data.reportingManager?._id || '');
          
          if (data.joiningDate) {
            setJoiningDate(new Date(data.joiningDate).toISOString().split('T')[0]);
          }

          if (data.profileImage) {
            setImagePreview(`${data.profileImage}`);
          }
        } else {
          setErrorMsg('Failed to load employee details.');
        }
      } catch (err) {
        console.error('Error loading employee profile:', err);
        setErrorMsg('Network error. Failed to load employee.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [isEditMode, employeeIdToEdit, token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) errors.name = 'Name is required';
    
    // Email validate
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please provide a valid email address';
      }
    }

    if (!phone.trim()) errors.phone = 'Phone number is required';
    
    if (!isNormalEmployeeEdit) {
      if (!employeeId.trim()) errors.employeeId = 'Employee ID is required';
      if (!department.trim()) errors.department = 'Department is required';
      if (!designation.trim()) errors.designation = 'Designation is required';
      if (!joiningDate) errors.joiningDate = 'Joining date is required';
      
      const salVal = parseFloat(salary);
      if (!salary.trim()) {
        errors.salary = 'Salary is required';
      } else if (isNaN(salVal) || salVal < 0) {
        errors.salary = 'Salary must be a non-negative number';
      }
    }

    if (!isEditMode && !password.trim()) {
      errors.password = 'Password is required for new employees';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    
    if (password.trim() !== '') {
      formData.append('password', password);
    }

    if (profileImageFile) {
      formData.append('profileImage', profileImageFile);
    }

    // Append fields only editable by Admin/HR
    if (!isNormalEmployeeEdit) {
      formData.append('employeeId', employeeId);
      formData.append('department', department);
      formData.append('designation', designation);
      formData.append('salary', salary);
      formData.append('joiningDate', joiningDate);
      formData.append('role', role);
      formData.append('status', status);
      formData.append('reportingManager', reportingManager); // can be empty string
    }

    try {
      const url = isEditMode
        ? `/api/employees/${employeeIdToEdit}`
        : '/api/employees';

      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        onSave();
      } else {
        setErrorMsg(data.message || 'Operation failed. Please check inputs.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrorMsg('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {isEditMode ? `Edit Profile: ${name}` : 'Register New Employee'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Top Error Message */}
            {errorMsg && (
              <div style={{
                backgroundColor: 'var(--error-light)',
                color: 'var(--error)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Avatar Upload Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '2px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    No Image
                  </div>
                )}
                <label style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid var(--surface)',
                }}>
                  <Upload size={14} />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Profile Photo</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Upload a clean face avatar. JPG, PNG or WebP, max 2MB.
                </p>
              </div>
            </div>

            <div className="grid-2">
              {/* Employee ID */}
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. EMP-002"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={isEditMode || isNormalEmployeeEdit} // Employee ID should be immutable in edit mode
                />
                {fieldErrors.employeeId && <span className="form-error">{fieldErrors.employeeId}</span>}
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter employee's name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {fieldErrors.name && <span className="form-error">{fieldErrors.name}</span>}
              </div>
            </div>

            <div className="grid-2">
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. name@ems.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +123 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {fieldErrors.phone && <span className="form-error">{fieldErrors.phone}</span>}
              </div>
            </div>

            {!isNormalEmployeeEdit && (
              <>
                <div className="grid-2">
                  {/* Department */}
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="">Select Department</option>
                      <option value="Administration">Administration</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                    </select>
                    {fieldErrors.department && <span className="form-error">{fieldErrors.department}</span>}
                  </div>

                  {/* Designation */}
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Senior Backend Architect"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                    {fieldErrors.designation && <span className="form-error">{fieldErrors.designation}</span>}
                  </div>
                </div>

                <div className="grid-2">
                  {/* Salary */}
                  <div className="form-group">
                    <label className="form-label">Salary (USD / Year)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 95000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                    {fieldErrors.salary && <span className="form-error">{fieldErrors.salary}</span>}
                  </div>

                  {/* Joining Date */}
                  <div className="form-group">
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                    />
                    {fieldErrors.joiningDate && <span className="form-error">{fieldErrors.joiningDate}</span>}
                  </div>
                </div>

                <div className="grid-2">
                  {/* Role */}
                  <div className="form-group">
                    <label className="form-label">Authorization Role</label>
                    <select
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      disabled={currentUser?.role === 'HR Manager' && role === 'Super Admin'} // HR cannot edit Super Admin role
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR Manager">HR Manager</option>
                      {/* HR manager cannot promote others to Super Admin */}
                      {(currentUser?.role === 'Super Admin' || role === 'Super Admin') && (
                        <option value="Super Admin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="form-group">
                    <label className="form-label">Employment Status</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Reporting Manager selection */}
                <div className="form-group">
                  <label className="form-label">Reporting Manager</label>
                  <select
                    className="form-control"
                    value={reportingManager}
                    onChange={(e) => setReportingManager(e.target.value)}
                  >
                    <option value="">None (Top-Level Node)</option>
                    {managers.map((mgr) => (
                      <option key={mgr._id} value={mgr._id}>
                        {mgr.name} - {mgr.designation} ({mgr.department})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                {isEditMode ? 'Change Password (Leave blank to keep current)' : 'Password'}
              </label>
              <input
                type="password"
                className="form-control"
                placeholder={isEditMode ? '••••••••' : 'Enter login password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving details...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
