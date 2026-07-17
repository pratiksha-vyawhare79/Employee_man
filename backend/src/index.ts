import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
