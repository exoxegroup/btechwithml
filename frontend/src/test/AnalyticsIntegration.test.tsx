import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';

// Mock the complete analytics workflow
vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: vi.fn()
}));

vi.mock('../components/analytics/InteractiveChart', () => ({
  InteractiveChart: ({ title, data, type, accessibilityLabel }: any) => (
    <div data-testid={`chart-${type}`} aria-label={accessibilityLabel}>
      <h3>{title}</h3>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  )
}));

vi.mock('../components/analytics/GroupPerformanceCard', () => ({
  GroupPerformanceCard: ({ group }: any) => (
    <div data-testid={`group-${group.groupId}`}>
      <h4>{group.groupName}</h4>
      <span>Score: {group.averageScore}</span>
      <span>Members: {group.memberCount}</span>
    </div>
  )
}));

// Mock file download functionality
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

import { useAnalytics } from '../hooks/useAnalytics';
import * as analyticsApi from '../services/analyticsApi';

// Mock the analytics API export function
vi.mock('../services/analyticsApi', () => ({
  exportData: vi.fn()
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ classId: 'test-class-id' }),
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Analytics Integration Tests', () => {
  const mockAnalyticsData = {
    groupPerformance: [
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
    ],
    aiInsights: {
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
    },
    studentEngagement: [
      {
        studentId: '1',
        name: 'John Doe',
        engagementScore: 92,
        participationRate: 0.85,
        lastActive: '2024-01-01T12:00:00Z'
      }
    ],
    historicalData: [
      {
        date: '2024-01-01',
        averageScore: 81.5,
        groupCount: 2,
        totalStudents: 9
      }
    ],
    loading: false,
    refreshing: false,
    error: null,
    refreshData: vi.fn(),
    lastUpdate: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful export
    vi.mocked(analyticsApi.exportData).mockResolvedValue(new Blob(['test data'], { type: 'text/csv' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete full analytics workflow', async () => {
    const mockRefreshData = vi.fn();
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      refreshData: mockRefreshData
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Verify initial dashboard state
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Group Performance')).toBeInTheDocument();
      expect(screen.getByText('AI Algorithm Insights')).toBeInTheDocument();
    });

    // Verify stat cards are displayed
    expect(screen.getByText('Total Groups')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Verify group performance cards
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();

    // Verify AI insights recommendations
    expect(screen.getByText('Consider balancing group sizes for optimal collaboration')).toBeInTheDocument();
    expect(screen.getByText('AI-generated groups show higher average performance')).toBeInTheDocument();

    // Verify charts are rendered
    expect(screen.getByTestId('chart-scatter')).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
  });

  it('should handle data refresh workflow', async () => {
    const mockRefreshData = vi.fn();
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      refreshData: mockRefreshData
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify refresh was called
    expect(mockRefreshData).toHaveBeenCalledTimes(1);
  });

  it('should handle CSV export workflow', async () => {
    // Create a mock link element and click tracking
    const mockLink = document.createElement('a');
    mockLink.click = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Click CSV export button
    const exportCsvButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportCsvButton);

    // Wait for export to complete
    await waitFor(() => {
      expect(analyticsApi.exportData).toHaveBeenCalledWith(
        'test-class-id',
        'mock-token',
        'csv',
        expect.objectContaining({
          groupPerformance: mockAnalyticsData.groupPerformance,
          aiInsights: mockAnalyticsData.aiInsights,
          studentEngagement: mockAnalyticsData.studentEngagement,
          historicalData: mockAnalyticsData.historicalData
        })
      );
    });

    // Verify download was triggered
    expect(mockLink.download).toBe('analytics_data_test-class-id_2024-01-01.csv');
    expect(mockLink.href).toBe('mock-blob-url');
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('should handle JSON export workflow', async () => {
    // Create a mock link element and click tracking
    const mockLink = document.createElement('a');
    mockLink.click = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Click JSON export button
    const exportJsonButton = screen.getByRole('button', { name: /export json/i });
    fireEvent.click(exportJsonButton);

    // Wait for export to complete
    await waitFor(() => {
      expect(analyticsApi.exportData).toHaveBeenCalledWith(
        'test-class-id',
        'mock-token',
        'json',
        expect.objectContaining({
          groupPerformance: mockAnalyticsData.groupPerformance,
          aiInsights: mockAnalyticsData.aiInsights,
          studentEngagement: mockAnalyticsData.studentEngagement,
          historicalData: mockAnalyticsData.historicalData
        })
      );
    });

    // Verify download was triggered
    expect(mockLink.download).toBe('analytics_data_test-class-id_2024-01-01.json');
    expect(mockLink.href).toBe('mock-blob-url');
    expect(mockLink.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
  });

  it('should handle export errors gracefully', async () => {
    // Mock export failure
    vi.mocked(analyticsApi.exportData).mockRejectedValue(new Error('Export failed'));

    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Click CSV export button
    const exportCsvButton = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(exportCsvButton);

    // Wait for error handling
    await waitFor(() => {
      expect(analyticsApi.exportData).toHaveBeenCalled();
    });

    // Error should be logged but UI should remain functional
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('should handle authentication errors', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      error: 'Authentication required'
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Authentication required')).toBeInTheDocument();
    
    // Export buttons should not be available when not authenticated
    expect(screen.queryByRole('button', { name: /export csv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export json/i })).not.toBeInTheDocument();
  });

  it('should handle real-time updates', async () => {
    vi.useFakeTimers();
    
    const mockRefreshData = vi.fn();
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      refreshData: mockRefreshData
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Advance time to trigger real-time update (30 seconds)
    vi.advanceTimersByTime(30000);

    // Should call refresh after 30 seconds
    await waitFor(() => {
      expect(mockRefreshData).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should maintain accessibility during interactions', async () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Verify all interactive elements have proper ARIA labels
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    const exportCsvButton = screen.getByRole('button', { name: /export csv/i });
    const exportJsonButton = screen.getByRole('button', { name: /export json/i });

    expect(refreshButton).toHaveAttribute('aria-label');
    expect(exportCsvButton).toHaveAttribute('aria-label');
    expect(exportJsonButton).toHaveAttribute('aria-label');

    // Verify charts have accessibility labels
    const charts = screen.getAllByTestId(/^chart-/);
    charts.forEach(chart => {
      expect(chart).toHaveAttribute('aria-label');
    });

    // Verify proper heading structure
    expect(screen.getByRole('heading', { name: 'Analytics Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Group Performance', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Algorithm Insights', level: 2 })).toBeInTheDocument();
  });

  it('should handle data filtering and sorting', async () => {
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      groupPerformance: [
        { ...mockAnalyticsData.groupPerformance[0], averageScore: 95 },
        { ...mockAnalyticsData.groupPerformance[1], averageScore: 65 }
      ]
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Verify all groups are displayed regardless of score
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();

    // Verify charts receive the filtered data
    const chartDataElements = screen.getAllByTestId('chart-data');
    expect(chartDataElements.length).toBeGreaterThan(0);
  });
});