import { API_URL } from './api';

interface ApiError {
  message: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'An unknown error occurred';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    return data;
  } catch (parseError) {
    throw new Error('Failed to parse JSON response');
  }
};

// Real-time Analytics Updates (WebSocket simulation with polling)
export interface RealTimeUpdate {
  type: 'performance_update' | 'engagement_update' | 'group_formation';
  data: any;
  timestamp: string;
}

// Group Performance Analytics
export interface GroupStudentDetail {
  id: string;
  name: string;
  gender: string;
  pretestScore: number | null;
  posttestScore: number | null;
  retentionScore: number | null;
  improvementRate: number;
  retentionRate: number;
  performanceCategory: 'High' | 'Mid' | 'Low';
}

export interface GroupPerformanceData {
  groupId: string;
  classId: string;
  averageScore: number;
  avgPretestScore: number;
  avgPosttestScore: number;
  avgRetentionScore: number;
  improvementRate: number;
  retentionRate: number;
  collaborationScore: number;
  participationRate: number;
  genderBalance: number;
  memberCount: number;
  abilityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  students?: GroupStudentDetail[];
  studentName?: string;
  isIndividual?: boolean;
  label?: string;
  groupingRationale?: string;
  aiGenerated?: boolean;
}

export const getGroupPerformance = async (classId: string, token: string): Promise<GroupPerformanceData[]> => {
  const response = await fetch(`${API_URL}/analytics/class/${classId}/group-performance?includeHistory=false`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const result = await handleResponse(response);
  
  return result.data?.performanceData || [];
};

export const getGroupPerformanceByGroup = async (classId: string, groupId: string, token: string): Promise<GroupPerformanceData> => {
  const response = await fetch(`${API_URL}/analytics/class/${classId}/group/${groupId}/performance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

// AI Algorithm Insights
export interface AIAlgorithmInsightsData {
  algorithmEffectiveness: number;
  totalGroupsAnalyzed: number;
  averageGroupPerformance: number;
  genderBalanceScore: number;
  recommendations: string[];
  improvementAreas: string[];
  timestamp: string;
}

export const getAIAlgorithmInsights = async (classId: string, token: string): Promise<AIAlgorithmInsightsData> => {
  const response = await fetch(`${API_URL}/analytics/class/${classId}/ai-insights`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await handleResponse(response);
  return result.data || null;
};

// Alias for getAIAlgorithmInsights to match test expectations
export const getAIInsights = getAIAlgorithmInsights;

// Research Data Export
export interface ExportOptions {
  format: 'csv' | 'json';
  anonymize: boolean;
  includeGenderData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  exportId: string;
  downloadUrl: string;
  recordCount: number;
  expiresAt: string;
  message: string;
}

export const exportResearchData = async (
  classId: string, 
  options: ExportOptions, 
  token: string
): Promise<ExportResult> => {
  const response = await fetch(`${API_URL}/analytics/class/${classId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ...options, classIds: [classId] }),
  });
  const result = await handleResponse(response);
  return result.data;
};

export const downloadExportFile = async (url: string, token: string): Promise<Blob> => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to download export file');
  }
  
  return response.blob();
};

// Alias for exportResearchData to match test expectations
export const exportData = async (
  classId: string, 
  token: string, 
  format: 'csv' | 'json', 
  data: any
): Promise<Blob> => {
  if (format !== 'csv' && format !== 'json') {
    throw new Error('Invalid export format');
  }
  
  const options: ExportOptions = {
    format,
    anonymize: false,
    includeGenderData: true,
  };
  
  const response = await fetch(`${API_URL}/analytics/export/${format}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ classId, data }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to export data');
  }
  
  return response.blob();
};

// Student Engagement Metrics
export interface StudentEngagementData {
  studentId: string;
  studentName: string;
  participationRate: number;
  quizCompletionRate: number;
  averageQuizScore: number;
  retentionTestScores: number[];
  engagementTrend: 'improving' | 'stable' | 'declining';
}

export const getStudentEngagementMetrics = async (classId: string, token: string): Promise<StudentEngagementData[]> => {
  const response = await fetch(`${API_URL}/analytics/class/${classId}/student-engagement`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await handleResponse(response);
  return result.data || [];
};

// Alias for getStudentEngagementMetrics to match test expectations
export const getStudentEngagement = getStudentEngagementMetrics;

// Historical Analytics
export interface HistoricalAnalyticsData {
  date: string;
  averageScore: number;
  totalStudents: number;
  groupCount: number;
  aiEffectiveness: number;
}

export const getHistoricalAnalytics = async (
  classId: string, 
  startDate: Date, 
  endDate: Date, 
  token: string
): Promise<HistoricalAnalyticsData[]> => {
  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  
  const response = await fetch(`${API_URL}/analytics/class/${classId}/historical?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

// Alias for getHistoricalAnalytics to match test expectations
export const getHistoricalData = (classId: string, token: string): Promise<HistoricalAnalyticsData[]> => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  return getHistoricalAnalytics(classId, startDate, endDate, token);
};

// Performance Data Analytics (Phase 4.1 Backend Aggregation)
export interface PerformanceDataResponse {
  success: boolean;
  data: {
    classId: string;
    chartData: GroupPerformanceData[];
    summaryStats: {
      totalStudents: number;
      studentsWithPretest: number;
      studentsWithPosttest: number;
      studentsWithRetention: number;
      completionRates: {
        pretest: number;
        posttest: number;
        retention: number;
      };
      averageScores: {
        pretest: number;
        posttest: number;
        retention: number;
      };
      improvementRate: number;
      retentionRate: number;
      groupingStats: {
        groupedStudents: number;
        uniqueGroups: number;
        groupingRate: number;
      };
    };
    totalGroups: number;
    dataSource: string;
    generatedAt: string;
  };
}

export const getPerformanceData = async (
  classId: string, 
  token: string, 
  chartType: 'line' | 'bar' = 'line',
  dataSource: 'saved_records' = 'saved_records'
): Promise<PerformanceDataResponse> => {
  const params = new URLSearchParams({
    chartType,
    dataSource
  });
  
  const response = await fetch(`${API_URL}/analytics/class/${classId}/performance-data?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return handleResponse(response);
};

export const subscribeToAnalyticsUpdates = (
  classId: string,
  token: string,
  onUpdate: (update: RealTimeUpdate) => void
): () => void => {
  // Simulate real-time updates with polling (WebSocket would be better for production)
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/class/${classId}/updates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const updates = await response.json();
        updates.forEach(onUpdate);
      }
    } catch (error) {
      console.error('Failed to fetch analytics updates:', error);
    }
  }, 30000); // Poll every 30 seconds

  // Return cleanup function
  return () => clearInterval(interval);
};