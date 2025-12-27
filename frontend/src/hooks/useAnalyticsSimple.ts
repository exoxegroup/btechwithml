import { useState, useEffect } from 'react';

// Simple test hook to verify import works
export const useAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return {
    data,
    loading,
    error,
    refreshData: async () => {
      console.log('Refresh data called');
    }
  };
};

export default useAnalytics;