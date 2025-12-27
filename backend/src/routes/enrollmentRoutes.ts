import { Router } from 'express';
import { enrollInClass, getEnrollments, getStudentClasses, updateStudentScores, teacherEnrollStudents } from '../controllers/enrollmentController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, enrollInClass);
router.post('/teacher-enroll', protect, teacherEnrollStudents);
router.get('/student', protect, getStudentClasses);
router.get('/:classId', protect, getEnrollments);
router.put('/:classId/student/:studentId/scores', protect, updateStudentScores);

export default router;