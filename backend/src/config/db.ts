import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/employee_management';
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error}`);
    process.exit(1);
  }
};
