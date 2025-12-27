
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, gender, studentId } = req.body;

  try {
    // 1. Validate input
    if (!email || !password || !name || !role || !gender) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const validRoles = ['TEACHER', 'STUDENT'];
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role value' });
    }
    if (!validGenders.includes(gender)) {
        return res.status(400).json({ message: 'Invalid gender value' });
    }

    // Validate Student ID
    if (role === 'STUDENT') {
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required for students' });
      }
      if (studentId.length > 20) {
        return res.status(400).json({ message: 'Student ID must be at most 20 characters' });
      }
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(studentId)) {
        return res.status(400).json({ message: 'Student ID must be alphanumeric' });
      }
      
      const existingStudentId = await prisma.user.findUnique({ where: { studentId } });
      if (existingStudentId) {
        return res.status(409).json({ message: 'Student ID already exists' });
      }
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        gender,
        studentId: role === 'STUDENT' ? studentId : null,
        isProfileComplete: false, // Profile is incomplete on initial registration
      },
    });

    // 5. Generate JWT
    const token = generateToken(user.id, user.role);

    // 6. Return response (excluding password)
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        studentId: user.studentId,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate a user and get token
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Generate JWT
    const token = generateToken(user.id, user.role);

    // 4. Return response
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user's data
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        studentId: true,
        isProfileComplete: true,
        phone: true,
        address: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { phone, address } = req.body;

    // Validate input
    if (!phone && !address) {
      return res.status(400).json({ message: 'Please provide phone or address to update' });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(phone && { phone }),
        ...(address && { address }),
        isProfileComplete: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gender: true,
        studentId: true,
        isProfileComplete: true,
        phone: true,
        address: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};
