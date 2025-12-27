
import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate a user and get token
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's data
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', protect, updateProfile);

export default router;
