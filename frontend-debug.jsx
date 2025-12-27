// Quick test to verify frontend data loading
import { useAnalytics } from '../src/hooks/useAnalytics';

function TestComponent() {
  const { groupPerformance, loading, error } = useAnalytics({
    classId: 'cmj6aol7d0002t91qezlzjrhu',
    token: 'your-token-here'
  });

  console.log('=== Frontend Data Debug ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Group Performance Length:', groupPerformance.length);
  console.log('First group:', groupPerformance[0]);
  
  const totalStudents = groupPerformance.reduce((sum, g) => sum + (g.memberCount || 0), 0);
  console.log('Total Students Calculation:', totalStudents);
  
  return null;
}