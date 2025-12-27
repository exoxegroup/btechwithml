import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AnalyticsDashboard from '../pages/AnalyticsDashboard';

// Mock the useAnalytics hook
vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: vi.fn()
}));

// Mock the InteractiveChart component
vi.mock('../components/analytics/InteractiveChart', () => ({
  InteractiveChart: ({ title, accessibilityLabel }: any) => (
    <div data-testid="interactive-chart" aria-label={accessibilityLabel}>
      <h3>{title}</h3>
    </div>
  )
}));

// Mock the GroupPerformanceCard component
vi.mock('../components/analytics/GroupPerformanceCard', () => ({
  GroupPerformanceCard: ({ group }: any) => (
    <div data-testid="group-performance-card">
      <span>{group.groupName}</span>
      <span>{group.averageScore}</span>
    </div>
  )
}));

// Mock the ErrorBoundary component
vi.mock('../components/common/ErrorBoundary', () => ({
  default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>
}));

import { useAnalytics } from '../hooks/useAnalytics';

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

const mockLoadingState = {
  ...mockAnalyticsData,
  loading: true,
  groupPerformance: [],
  aiInsights: null,
  studentEngagement: [],
  historicalData: []
};

const mockErrorState = {
  ...mockAnalyticsData,
  error: 'Failed to load analytics data',
  loading: false
};

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

describe('AnalyticsDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockLoadingState);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockErrorState);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render dashboard with data', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Group Performance')).toBeInTheDocument();
    expect(screen.getByText('AI Algorithm Insights')).toBeInTheDocument();
    expect(screen.getByText('Research Data Export')).toBeInTheDocument();
    
    // Check for stat cards
    expect(screen.getByText('Total Groups')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Avg Group Size')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
    expect(screen.getByText('81.5')).toBeInTheDocument();
  });

  it('should display group performance cards', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    const groupCards = screen.getAllByTestId('group-performance-card');
    expect(groupCards).toHaveLength(2);
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
  });

  it('should display AI insights recommendations', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Consider balancing group sizes for optimal collaboration')).toBeInTheDocument();
    expect(screen.getByText('AI-generated groups show higher average performance')).toBeInTheDocument();
  });

  it('should display interactive charts', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    const charts = screen.getAllByTestId('interactive-chart');
    expect(charts.length).toBeGreaterThan(0);
    expect(screen.getByText('Performance by Group')).toBeInTheDocument();
    expect(screen.getByText('AI vs Human Performance')).toBeInTheDocument();
  });

  it('should handle refresh functionality', () => {
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

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    expect(mockRefreshData).toHaveBeenCalledTimes(1);
  });

  it('should handle export functionality', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    const exportCsvButton = screen.getByRole('button', { name: /export csv/i });
    const exportJsonButton = screen.getByRole('button', { name: /export json/i });

    expect(exportCsvButton).toBeInTheDocument();
    expect(exportJsonButton).toBeInTheDocument();
  });

  it('should display last update time', () => {
    const mockLastUpdate = new Date('2024-01-01T12:00:00Z');
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      lastUpdate: mockLastUpdate
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  it('should handle refreshing state', () => {
    vi.mocked(useAnalytics).mockReturnValue({
      ...mockAnalyticsData,
      refreshing: true
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    const refreshButton = screen.getByRole('button', { name: /refreshing/i });
    expect(refreshButton).toBeDisabled();
  });

  it('should be accessible', () => {
    vi.mocked(useAnalytics).mockReturnValue(mockAnalyticsData);

    render(
      <BrowserRouter>
        <AnalyticsDashboard />
      </BrowserRouter>
    );

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: 'Analytics Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Group Performance', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI Algorithm Insights', level: 2 })).toBeInTheDocument();
    
    // Check for button accessibility
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should handle missing token gracefully', () => {
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
  });
});