import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAnalytics } from '../hooks/useAnalytics';

// Mock the analyticsApi module
vi.mock('../services/analyticsApi', () => ({
  getGroupPerformance: vi.fn(),
  getAIInsights: vi.fn(),
  getStudentEngagement: vi.fn(),
  getHistoricalData: vi.fn(),
}));

import * as analyticsApi from '../services/analyticsApi';

const mockGroupPerformance = [
  {
    groupId: '1',
    groupName: 'Group A',
    memberCount: 5,
    averageScore: 85,
    aiGenerated: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    groupId: '2',
    groupName: 'Group B',
    memberCount: 4,
    averageScore: 78,
    aiGenerated: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockAIInsights = {
  totalGroups: 2,
  aiGeneratedGroups: 1,
  humanCreatedGroups: 1,
  averageGroupSize: 4.5,
  averageScore: 81.5,
  scoreDistribution: {
    '70-80': 1,
    '80-90': 1
  },
  recommendations: [
    'Consider balancing group sizes for optimal collaboration',
    'AI-generated groups show higher average performance'
  ]
};

const mockStudentEngagement = [
  {
    studentId: '1',
    name: 'John Doe',
    engagementScore: 92,
    participationRate: 0.85,
    lastActive: '2024-01-01T12:00:00Z'
  }
];

const mockHistoricalData = [
  {
    date: '2024-01-01',
    averageScore: 81.5,
    groupCount: 2,
    totalStudents: 9
  }
];

describe('useAnalytics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: false 
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.groupPerformance).toEqual([]);
    expect(result.current.aiInsights).toBe(null);
    expect(result.current.studentEngagement).toEqual([]);
    expect(result.current.historicalData).toEqual([]);
    expect(result.current.refreshing).toBe(false);
    expect(result.current.lastUpdate).toBe(null);
  });

  it('should fetch analytics data successfully', async () => {
    vi.mocked(analyticsApi.getGroupPerformance).mockResolvedValue(mockGroupPerformance);
    vi.mocked(analyticsApi.getAIInsights).mockResolvedValue(mockAIInsights);
    vi.mocked(analyticsApi.getStudentEngagement).mockResolvedValue(mockStudentEngagement);
    vi.mocked(analyticsApi.getHistoricalData).mockResolvedValue(mockHistoricalData);

    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: false 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groupPerformance).toEqual(mockGroupPerformance);
    expect(result.current.aiInsights).toEqual(mockAIInsights);
    expect(result.current.studentEngagement).toEqual(mockStudentEngagement);
    expect(result.current.historicalData).toEqual(mockHistoricalData);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdate).toBeInstanceOf(Date);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch analytics data';
    vi.mocked(analyticsApi.getGroupPerformance).mockRejectedValue(new Error(errorMessage));
    vi.mocked(analyticsApi.getAIInsights).mockRejectedValue(new Error(errorMessage));
    vi.mocked(analyticsApi.getStudentEngagement).mockRejectedValue(new Error(errorMessage));
    vi.mocked(analyticsApi.getHistoricalData).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: false 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.groupPerformance).toEqual([]);
    expect(result.current.aiInsights).toBe(null);
  });

  it('should enable real-time updates with specified interval', async () => {
    vi.mocked(analyticsApi.getGroupPerformance).mockResolvedValue(mockGroupPerformance);
    vi.mocked(analyticsApi.getAIInsights).mockResolvedValue(mockAIInsights);
    vi.mocked(analyticsApi.getStudentEngagement).mockResolvedValue(mockStudentEngagement);
    vi.mocked(analyticsApi.getHistoricalData).mockResolvedValue(mockHistoricalData);

    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: true,
        refreshInterval: 5000 // 5 seconds for testing
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    vi.clearAllMocks();

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(analyticsApi.getGroupPerformance).toHaveBeenCalledTimes(1);
      expect(analyticsApi.getAIInsights).toHaveBeenCalledTimes(1);
      expect(result.current.refreshing).toBe(false);
    });
  });

  it('should handle manual refresh', async () => {
    vi.mocked(analyticsApi.getGroupPerformance).mockResolvedValue(mockGroupPerformance);
    vi.mocked(analyticsApi.getAIInsights).mockResolvedValue(mockAIInsights);
    vi.mocked(analyticsApi.getStudentEngagement).mockResolvedValue(mockStudentEngagement);
    vi.mocked(analyticsApi.getHistoricalData).mockResolvedValue(mockHistoricalData);

    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: false 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    vi.clearAllMocks();

    // Trigger manual refresh
    result.current.refreshData();

    expect(result.current.refreshing).toBe(true);

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
      expect(analyticsApi.getGroupPerformance).toHaveBeenCalledTimes(1);
      expect(analyticsApi.getAIInsights).toHaveBeenCalledTimes(1);
    });
  });

  it('should cleanup on unmount', async () => {
    vi.mocked(analyticsApi.getGroupPerformance).mockResolvedValue(mockGroupPerformance);
    vi.mocked(analyticsApi.getAIInsights).mockResolvedValue(mockAIInsights);
    vi.mocked(analyticsApi.getStudentEngagement).mockResolvedValue(mockStudentEngagement);
    vi.mocked(analyticsApi.getHistoricalData).mockResolvedValue(mockHistoricalData);

    const { result, unmount } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: true,
        refreshInterval: 1000
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    unmount();

    // Advance time to ensure no more API calls are made
    vi.advanceTimersByTime(2000);

    // Should not make additional calls after unmount
    expect(analyticsApi.getGroupPerformance).toHaveBeenCalledTimes(1);
  });

  it('should handle partial data fetch failures', async () => {
    vi.mocked(analyticsApi.getGroupPerformance).mockResolvedValue(mockGroupPerformance);
    vi.mocked(analyticsApi.getAIInsights).mockRejectedValue(new Error('AI insights failed'));
    vi.mocked(analyticsApi.getStudentEngagement).mockResolvedValue(mockStudentEngagement);
    vi.mocked(analyticsApi.getHistoricalData).mockResolvedValue(mockHistoricalData);

    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: 'test-class', 
        token: 'test-token',
        enableRealTime: false 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.groupPerformance).toEqual(mockGroupPerformance);
    expect(result.current.aiInsights).toBe(null);
    expect(result.current.error).toContain('AI insights failed');
  });

  it('should handle missing classId or token gracefully', async () => {
    const { result } = renderHook(() => 
      useAnalytics({ 
        classId: '', 
        token: '',
        enableRealTime: false 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(analyticsApi.getGroupPerformance).not.toHaveBeenCalled();
  });
});