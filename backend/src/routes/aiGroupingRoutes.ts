import express from 'express';
import { protect, authorizeTeacher } from '../middleware/authMiddleware';
import {
  generateAIGroups,
  generateManualGroups,
  getGroupingRationale,
  applyGroups,
  getGroupAnalytics,
  getAIGroups,
  getAIGroupingData
} from '../controllers/aiGroupingController';

const router = express.Router();

// All AI grouping routes require teacher authentication
router.use(protect);
router.use(authorizeTeacher);

/**
 * @route   POST /api/classes/:classId/ai-grouping
 * @desc    Generate AI-powered student groups for a class
 * @access  Teacher
 */
router.post('/classes/:classId/ai-grouping', generateAIGroups);

/**
 * @route   POST /api/classes/:classId/manual-grouping
 * @desc    Generate manual student groups for small classes (3-7 students)
 * @access  Teacher
 */
router.post('/classes/:classId/manual-grouping', generateManualGroups);

/**
 * @route   GET /api/classes/:classId/grouping-rationale/:groupingId
 * @desc    Get detailed rationale for AI-generated grouping
 * @access  Teacher
 */
router.get('/classes/:classId/grouping-rationale/:groupingId', getGroupingRationale);

/**
 * @route   PUT /api/classes/:classId/groups
 * @desc    Apply AI-generated groups or manual override
 * @access  Teacher
 */
// router.put('/classes/:classId/groups', applyGroups);

/**
 * @route   GET /api/ai-grouping/:groupingId/data
 * @desc    Get AI grouping data
 * @access  Teacher
 */
router.get('/ai-grouping/:groupingId/data', protect, getAIGroupingData);

/**
 * @route   GET /api/classes/:classId/ai-groups
 * @desc    Get AI-generated groups with members
 * @access  Teacher
 */
router.get('/classes/:classId/ai-groups', getAIGroups);

/**
 * @route   GET /api/classes/:classId/group-analytics
 * @desc    Get analytics data for existing groups
 * @access  Teacher
 */
router.get('/classes/:classId/group-analytics', getGroupAnalytics);

export default router;