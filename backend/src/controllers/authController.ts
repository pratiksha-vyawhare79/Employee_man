import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforems12345', {
    expiresIn: '30d',
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check for empty fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find employee by email, explicitly including password since it's hidden by default in the schema (wait, in mongoose schema we didn't specify select: false, but let's select it manually if we do or standard query)
    const employee = await Employee.findOne({ email, isDeleted: false });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (employee.status === 'Inactive') {
      return res.status(403).json({ message: 'Account is inactive. Please contact your administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employee.password || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      token: generateToken(employee._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const employee = await Employee.findById(req.user._id).populate('reportingManager', 'name designation');
    res.json(employee);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
