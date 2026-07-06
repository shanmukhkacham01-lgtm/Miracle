import { Router } from 'express';
import { register, login, refresh, getProfile, updateProfile, sendOTP, googleLoginMock } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/google-login', googleLoginMock);
router.post('/send-otp', sendOTP);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
