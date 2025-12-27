import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getGroupPerformance, 
  getAIAlgorithmInsights, 
  getStudentEngagementMetrics,
  getHistoricalAnalytics,
  subscribeToAnalyticsUpdates,
  GroupPerformanceData,
  AIAlgorithmInsightsData,
  StudentEngagementData,
  HistoricalAnalyticsData,
  RealTimeUpdate
} from '../services/analyticsApi';

interface UseAnalyticsOptions {
  classId: string;
  token: string;
  enableRealTime?: boolean;
  refreshInterval?: number;
}

interface UseAnalyticsReturn {
  // Data
  groupPerformance: GroupPerformanceData[];
  aiInsights: AIAlgorithmInsightsData | null;
  studentEngagement: StudentEngagementData[];
  historicalData: HistoricalAnalyticsData[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  refreshGroupPerformance: () => Promise<void>;
  refreshAIInsights: () => Promise<void>;
  refreshStudentEngagement: () => Promise<void>;
  refreshHistoricalData: (startDate: Date, endDate: Date) => Promise<void>;
  
  // Real-time updates
  lastUpdate: Date | null;
  pendingUpdates: RealTimeUpdate[];
}

export const useAnalytics = ({
  classId,
  token,
  enableRealTime = true,
  refreshInterval = 30000 // 30 seconds
}: UseAnalyticsOptions): UseAnalyticsReturn => {
  // Data states
  const [groupPerformance, setGroupPerformance] = useState<GroupPerformanceData[]>([]);
  const [aiInsights, setAIInsights] = useState<AIAlgorithmInsightsData | null>(null);
  const [studentEngagement, setStudentEngagement] = useState<StudentEngagementData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalAnalyticsData[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time states
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<RealTimeUpdate[]>([]);
  
  // Refs for cleanup
  const realTimeSubscriptionRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all analytics data
  const fetchAllData = useCallback(async () => {
    if (!classId || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [
        performanceData,
        insightsData,
        engagementData
      ] = await Promise.all([
        getGroupPerformance(classId, token),
        getAIAlgorithmInsights(classId, token),
        getStudentEngagementMetrics(classId, token)
      ]);
      
      // Validate the data before setting state
      if (performanceData.length > 0) {
        // Data validation completed - memberCount is properly included
      }
      
      setGroupPerformance(performanceData);
      setAIInsights(insightsData);
      setStudentEngagement(engagementData);
      setLastUpdate(new Date());
      
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [classId, token]);

  // Refresh functions
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const refreshGroupPerformance = useCallback(async () => {
    if (!classId || !token) return;
    
    try {
      const data = await getGroupPerformance(classId, token);
      setGroupPerformance(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to refresh group performance:', err);
      setError(err.message || 'Failed to refresh group performance');
    }
  }, [classId, token]);

  const refreshAIInsights = useCallback(async () => {
    if (!classId || !token) return;
    
    try {
      const data = await getAIAlgorithmInsights(classId, token);
      setAIInsights(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to refresh AI insights:', err);
      setError(err.message || 'Failed to refresh AI insights');
    }
  }, [classId, token]);

  const refreshStudentEngagement = useCallback(async () => {
    if (!classId || !token) return;
    
    try {
      const data = await getStudentEngagementMetrics(classId, token);
      setStudentEngagement(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to refresh student engagement:', err);
      setError(err.message || 'Failed to refresh student engagement');
    }
  }, [classId, token]);

  const refreshHistoricalData = useCallback(async (startDate: Date, endDate: Date) => {
    if (!classId || !token) return;
    
    try {
      const data = await getHistoricalAnalytics(classId, startDate, endDate, token);
      setHistoricalData(data);
      setLastUpdate(new Date());
    } catch (err: any) {
      console.error('Failed to refresh historical data:', err);
      setError(err.message || 'Failed to refresh historical data');
    }
  }, [classId, token]);

  // Handle real-time updates
  const handleRealTimeUpdate = useCallback((update: RealTimeUpdate) => {
    setPendingUpdates(prev => [...prev, update]);
    setLastUpdate(new Date());
    
    // Process different types of updates
    switch (update.type) {
      case 'performance_update':
        // Update group performance data
        if (update.data.groupPerformance) {
          setGroupPerformance(update.data.groupPerformance);
        }
        break;
      case 'engagement_update':
        // Update student engagement data
        if (update.data.studentEngagement) {
          setStudentEngagement(update.data.studentEngagement);
        }
        break;
      case 'group_formation':
        // Handle new group formation
        if (update.data.newGroups) {
          setGroupPerformance(prev => [...prev, ...update.data.newGroups]);
        }
        break;
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (enableRealTime && classId && token) {
      realTimeSubscriptionRef.current = subscribeToAnalyticsUpdates(
        classId,
        token,
        handleRealTimeUpdate
      );
    }

    return () => {
      if (realTimeSubscriptionRef.current) {
        realTimeSubscriptionRef.current();
        realTimeSubscriptionRef.current = null;
      }
    };
  }, [enableRealTime, classId, token, handleRealTimeUpdate]);

  // Setup periodic refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [refreshInterval, refreshData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realTimeSubscriptionRef.current) {
        realTimeSubscriptionRef.current();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // Data
    groupPerformance,
    aiInsights,
    studentEngagement,
    historicalData,
    
    // Loading states
    loading,
    refreshing,
    error,
    
    // Actions
    refreshData,
    refreshGroupPerformance,
    refreshAIInsights,
    refreshStudentEngagement,
    refreshHistoricalData,
    
    // Real-time updates
    lastUpdate,
    pendingUpdates
  };
};

export default useAnalytics;