import { Schema, model, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  reportingManager?: Schema.Types.ObjectId | IEmployee | null;
  profileImage?: string;
  password?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be a non-negative number'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    role: {
      type: String,
      enum: ['Super Admin', 'HR Manager', 'Employee'],
      default: 'Employee',
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    profileImage: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Do not return password by default when converting to JSON
EmployeeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const Employee = model<IEmployee>('Employee', EmployeeSchema);
