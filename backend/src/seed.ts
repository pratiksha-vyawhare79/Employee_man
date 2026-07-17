import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Employee } from './models/Employee';

dotenv.config();

const seedAdmin = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee_management';
    await mongoose.connect(connStr);
    console.log('Database connected for seeding.');

    // Check if Super Admin already exists
    const adminExists = await Employee.findOne({ role: 'Super Admin', isDeleted: false });

    if (adminExists) {
      console.log('Super Admin account already exists. Seeding skipped.');
      process.exit(0);
    }

    // Hash Password123
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    await Employee.create({
      employeeId: 'EMP-001',
      name: 'System Administrator',
      email: 'admin@ems.com',
      phone: '+1234567890',
      department: 'Administration',
      designation: 'Super Admin',
      salary: 150000,
      joiningDate: new Date('2026-01-01'),
      status: 'Active',
      role: 'Super Admin',
      reportingManager: null,
      profileImage: '',
      password: hashedPassword,
    });

    console.log('Super Admin account seeded successfully:');
    console.log('Email: admin@ems.com');
    console.log('Password: Password123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAdmin();
