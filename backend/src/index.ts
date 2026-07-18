import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import { Employee } from './models/Employee';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve profile uploads as static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Base route
app.get('/', (req: Request, res: Response) => {
  res.send('Employee Management API is running...');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Auto-seed Super Admin if not exists
const autoSeedAdmin = async () => {
  try {
    const adminExists = await Employee.findOne({ role: 'Super Admin', isDeleted: false });
    if (!adminExists) {
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
        isDeleted: false,
      });
      console.log('Super Admin auto-seeded: admin@ems.com / Password123');
    } else {
      console.log('Super Admin already exists, skipping auto-seed.');
    }
  } catch (err) {
    console.error('Auto-seed error:', err);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  // Auto-seed admin user if not exists
  setTimeout(autoSeedAdmin, 2000);
});
