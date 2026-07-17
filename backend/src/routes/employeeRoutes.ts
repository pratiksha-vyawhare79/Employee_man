import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateManager,
  getReportees,
  getOrgTree,
  importCSV,
} from '../controllers/employeeController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Ensure upload folders exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Config for Profile Images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, webp)'));
    }
  },
});

// Multer Config for CSV imports
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `csv-${Date.now()}-${file.originalname}`);
  },
});

const csvUpload = multer({
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase() === '.csv';
    // Some OS have different mimetypes for CSV like text/csv, application/vnd.ms-excel etc.
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('CSV files only (.csv)'));
    }
  },
});

// Routes
router.get('/', protect, getEmployees);
router.get('/tree', protect, getOrgTree);
router.post('/import', protect, authorize('Super Admin', 'HR Manager'), csvUpload.single('file'), importCSV);
router.get('/:id', protect, getEmployeeById);
router.post('/', protect, authorize('Super Admin', 'HR Manager'), imageUpload.single('profileImage'), createEmployee);
router.put('/:id', protect, imageUpload.single('profileImage'), updateEmployee);
router.delete('/:id', protect, authorize('Super Admin'), deleteEmployee);
router.get('/:id/reportees', protect, getReportees);
router.patch('/:id/manager', protect, authorize('Super Admin', 'HR Manager'), updateManager);

export default router;
