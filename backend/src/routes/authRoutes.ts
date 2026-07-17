import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
