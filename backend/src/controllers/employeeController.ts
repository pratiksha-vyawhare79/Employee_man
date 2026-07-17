import { Response } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import { Employee, IEmployee } from '../models/Employee';
import { AuthRequest } from '../middleware/authMiddleware';
import { isCircularReporting, buildHierarchyTree } from '../utils/hierarchy';

// @desc    Get all employees (paginated, searched, filtered, sorted)
// @route   GET /api/employees
// @access  Private
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, department, role, status, sortBy, sortOrder } = req.query;

    // Base query: ignore soft-deleted employees
    const query: any = { isDeleted: false };

    // Search filter (name or email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Role, Department, Status filters
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;

    // Sorting
    const sort: any = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sort[sortBy as string] = order;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('reportingManager', 'name designation email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      employees,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single employee profile
// @route   GET /api/employees/:id
// @access  Private
export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('reportingManager', 'name designation email');

    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Super Admin, HR Manager)
export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      role,
      reportingManager,
      status,
    } = req.body;

    // Check permissions
    // HR Manager cannot create a Super Admin
    if (req.user?.role === 'HR Manager' && role === 'Super Admin') {
      return res.status(403).json({ message: 'HR Managers cannot create Super Admin accounts.' });
    }

    // Check unique employeeId
    const employeeIdExists = await Employee.findOne({ employeeId });
    if (employeeIdExists) {
      return res.status(400).json({ message: 'Employee ID is already registered' });
    }

    // Check unique email
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email address is already registered' });
    }

    // Validate reporting manager
    let managerId: any = null;
    if (reportingManager && reportingManager !== '') {
      const manager = await Employee.findById(reportingManager);
      if (!manager || manager.isDeleted) {
        return res.status(400).json({ message: 'Selected reporting manager is invalid' });
      }
      managerId = manager._id;
    }

    // Default password is employeeId (with standard hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(employeeId || 'Password123', salt);

    // Profile image filepath if uploaded
    const profileImage = req.file ? `/uploads/${req.file.filename}` : '';

    const newEmployee = await Employee.create({
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      salary: parseFloat(salary),
      joiningDate: new Date(joiningDate),
      role,
      reportingManager: managerId,
      status: status || 'Active',
      profileImage,
      password: hashedPassword,
    });

    res.status(201).json(newEmployee);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Validation error' });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (All Roles - with RBAC checks)
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentStaff = await Employee.findById(id);

    if (!currentStaff || currentStaff.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const {
      name,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      role,
      reportingManager,
      status,
      password,
    } = req.body;

    const currentUser = req.user!;

    // 1. RBAC Validation
    if (currentUser.role === 'Employee') {
      // Normal employee can only edit their own profile, and only specific fields
      if (currentUser._id.toString() !== id) {
        return res.status(403).json({ message: 'Employees can only edit their own profile' });
      }
      // Allowed modifications: name, email, phone, password, profileImage
      currentStaff.name = name || currentStaff.name;
      currentStaff.email = email || currentStaff.email;
      currentStaff.phone = phone || currentStaff.phone;
      if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        currentStaff.password = await bcrypt.hash(password, salt);
      }
    } else {
      // HR Manager or Super Admin checks
      if (currentUser.role === 'HR Manager') {
        // HR cannot edit Super Admin records
        if (currentStaff.role === 'Super Admin') {
          return res.status(403).json({ message: 'HR Managers cannot edit Super Admin accounts' });
        }
        // HR cannot promote anyone to Super Admin, or demote a Super Admin
        if (role === 'Super Admin') {
          return res.status(403).json({ message: 'HR Managers cannot assign the Super Admin role' });
        }
      }

      // Modify editable fields
      currentStaff.name = name ?? currentStaff.name;
      currentStaff.email = email ?? currentStaff.email;
      currentStaff.phone = phone ?? currentStaff.phone;
      currentStaff.department = department ?? currentStaff.department;
      currentStaff.designation = designation ?? currentStaff.designation;
      currentStaff.status = status ?? currentStaff.status;
      if (salary !== undefined) currentStaff.salary = parseFloat(salary);
      if (joiningDate) currentStaff.joiningDate = new Date(joiningDate);
      if (role && currentUser.role === 'Super Admin') {
        currentStaff.role = role;
      } else if (role && currentUser.role === 'HR Manager') {
        // HR cannot change role to Super Admin
        if (role !== 'Super Admin') {
          currentStaff.role = role;
        }
      }

      // Validate manager update & circular reporting check
      if (reportingManager !== undefined) {
        if (reportingManager === '' || reportingManager === null) {
          currentStaff.reportingManager = null;
        } else {
          const managerId = new mongoose.Types.ObjectId(reportingManager);
          
          // Check circular loop
          const circular = await isCircularReporting(currentStaff._id, managerId);
          if (circular) {
            return res.status(400).json({
              message: 'Circular reporting detected. This employee cannot report to their subordinate or themselves.',
            });
          }
          currentStaff.reportingManager = managerId;
        }
      }

      if (password && password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        currentStaff.password = await bcrypt.hash(password, salt);
      }
    }

    // Handled profile image if uploaded
    if (req.file) {
      currentStaff.profileImage = `/uploads/${req.file.filename}`;
    }

    const updatedEmployee = await currentStaff.save();
    res.json(updatedEmployee);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Validation error' });
  }
};

// @desc    Delete employee (Soft Delete)
// @route   DELETE /api/employees/:id
// @access  Private (Super Admin Only)
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    // Only Super Admin can delete
    if (req.user?.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Only Super Admins can delete employees' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Keep admin from deleting themselves
    if (employee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own Super Admin account' });
    }

    // Set soft delete flags
    employee.isDeleted = true;
    employee.status = 'Inactive';
    employee.deletedAt = new Date();
    await employee.save();

    // Clean up reporting chain:
    // Anyone reporting to this employee will now report to this employee's manager
    await Employee.updateMany(
      { reportingManager: employee._id },
      { reportingManager: employee.reportingManager || null }
    );

    res.json({ message: 'Employee deleted successfully (soft delete)' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update reporting manager (PATCH)
// @route   PATCH /api/employees/:id/manager
// @access  Private (Super Admin, HR Manager)
export const updateManager = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { managerId } = req.body;

    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check RBAC rules
    if (req.user?.role === 'HR Manager' && employee.role === 'Super Admin') {
      return res.status(403).json({ message: 'HR Managers cannot edit Super Admin records' });
    }

    let resolvedManagerId: any = null;
    if (managerId && managerId !== '') {
      resolvedManagerId = new mongoose.Types.ObjectId(managerId);

      const manager = await Employee.findById(resolvedManagerId);
      if (!manager || manager.isDeleted) {
        return res.status(400).json({ message: 'Invalid manager ID' });
      }

      // Check for circular dependency
      const circular = await isCircularReporting(employee._id, resolvedManagerId);
      if (circular) {
        return res.status(400).json({
          message: 'Circular reporting detected. This employee cannot report to their subordinate or themselves.',
        });
      }
    }

    employee.reportingManager = resolvedManagerId;
    await employee.save();

    res.json({ message: 'Reporting manager updated successfully', employee });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get direct reportees of an employee
// @route   GET /api/employees/:id/reportees
// @access  Private
export const getReportees = async (req: AuthRequest, res: Response) => {
  try {
    const reportees = await Employee.find({
      reportingManager: req.params.id,
      isDeleted: false,
    }).select('employeeId name email designation department status role profileImage');

    res.json(reportees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complete organizational tree
// @route   GET /api/organization/tree
// @access  Private
export const getOrgTree = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find({ isDeleted: false })
      .select('employeeId name email designation department status role reportingManager profileImage')
      .lean();

    const tree = buildHierarchyTree(employees);
    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Bulk CSV Import
// @route   POST /api/employees/import
// @access  Private (Super Admin, HR Manager)
export const importCSV = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const results: any[] = [];
  const filepath = req.file.path;

  const successList: string[] = [];
  const errorList: { row: number; error: string; data?: any }[] = [];

  fs.createReadStream(filepath)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // Process CSV rows
      let rowNum = 1;
      const defaultPassword = 'Password123';
      const salt = await bcrypt.genSalt(10);
      const defaultHash = await bcrypt.hash(defaultPassword, salt);

      for (const row of results) {
        rowNum++;
        const {
          employeeId,
          name,
          email,
          phone,
          department,
          designation,
          salary,
          joiningDate,
          role,
          reportingManagerId, // employeeId format or db ID
        } = row;

        try {
          // Check required fields
          if (!employeeId || !name || !email || !phone || !department || !designation || !salary || !joiningDate) {
            errorList.push({
              row: rowNum,
              error: 'Missing required columns (employeeId, name, email, phone, department, designation, salary, joiningDate)',
              data: row,
            });
            continue;
          }

          // Check email regex
          const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
          if (!emailRegex.test(email)) {
            errorList.push({
              row: rowNum,
              error: `Invalid email format: ${email}`,
              data: row,
            });
            continue;
          }

          // Check positive salary
          const parsedSalary = parseFloat(salary);
          if (isNaN(parsedSalary) || parsedSalary < 0) {
            errorList.push({
              row: rowNum,
              error: `Salary must be a non-negative number: ${salary}`,
              data: row,
            });
            continue;
          }

          // HR cannot import Super Admins
          if (req.user?.role === 'HR Manager' && role === 'Super Admin') {
            errorList.push({
              row: rowNum,
              error: 'HR Managers are not allowed to import Super Admin accounts',
              data: row,
            });
            continue;
          }

          // Duplicate checks
          const idExists = await Employee.findOne({ employeeId });
          if (idExists) {
            errorList.push({
              row: rowNum,
              error: `Employee ID ${employeeId} already exists`,
              data: row,
            });
            continue;
          }

          const emailExists = await Employee.findOne({ email });
          if (emailExists) {
            errorList.push({
              row: rowNum,
              error: `Email ${email} already exists`,
              data: row,
            });
            continue;
          }

          // Resolve manager
          let managerId: any = null;
          if (reportingManagerId && reportingManagerId.trim() !== '') {
            // Find manager by employeeId or mongoId
            let manager = await Employee.findOne({
              $or: [
                { employeeId: reportingManagerId.trim() },
                { _id: mongoose.isValidObjectId(reportingManagerId) ? reportingManagerId : new mongoose.Types.ObjectId() }
              ],
              isDeleted: false,
            });

            if (manager) {
              managerId = manager._id;
            } else {
              // Non-blocking but warn/skip or set null?
              // Better to log error for consistency
              errorList.push({
                row: rowNum,
                error: `Reporting Manager '${reportingManagerId}' was not found. Skipping row.`,
                data: row,
              });
              continue;
            }
          }

          // Save employee
          await Employee.create({
            employeeId: employeeId.trim(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            department: department.trim(),
            designation: designation.trim(),
            salary: parsedSalary,
            joiningDate: new Date(joiningDate),
            role: role || 'Employee',
            reportingManager: managerId,
            status: 'Active',
            password: defaultHash,
          });

          successList.push(employeeId);
        } catch (err: any) {
          errorList.push({
            row: rowNum,
            error: err.message || 'Save error',
            data: row,
          });
        }
      }

      // Remove temporary file
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Failed to delete temporary CSV file:', err);
      }

      res.json({
        message: 'CSV processing completed',
        totalProcessed: results.length,
        successCount: successList.length,
        errorCount: errorList.length,
        errors: errorList,
      });
    });
};
