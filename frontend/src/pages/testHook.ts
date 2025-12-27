// Test hook in the same directory
import { useState } from 'react';

export const useTestAnalytics = () => {
  const [test] = useState('test');
  return { test };
};