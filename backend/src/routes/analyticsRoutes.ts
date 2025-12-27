import express from 'express';
import { 
  getGroupPerformance, 
  getAIInsights, 
  exportResearchData, 
  getExportStatus, 
  downloadExport, 
  getDashboardSummary,
  getStudentEngagement,
  getPerformanceData
} from '../controllers/analyticsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/analytics/class/:classId/group-performance
router.get('/class/:classId/group-performance', protect, getGroupPerformance);

// GET /api/analytics/class/:classId/ai-insights  
router.get('/class/:classId/ai-insights', protect, getAIInsights);

// POST /api/analytics/class/:classId/export
router.post('/class/:classId/export', protect, exportResearchData);

// GET /api/analytics/export/:exportId/status
router.get('/export/:exportId/status', protect, getExportStatus);

// GET /api/analytics/export/:exportId/download
router.get('/export/:exportId/download', protect, downloadExport);

// GET /api/analytics/class/:classId/dashboard-summary
router.get('/class/:classId/dashboard-summary', protect, getDashboardSummary);

// GET /api/analytics/class/:classId/student-engagement
router.get('/class/:classId/student-engagement', protect, getStudentEngagement);

// GET /api/analytics/class/:classId/performance-data
// New endpoint for Phase 4.1 - Returns aggregated performance data for charts
router.get('/class/:classId/performance-data', protect, getPerformanceData);

export default router;