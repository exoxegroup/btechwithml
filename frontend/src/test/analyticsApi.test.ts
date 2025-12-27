import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as analyticsApi from '../services/analyticsApi';

// Mock fetch globally
global.fetch = vi.fn();

describe('Analytics API Service', () => {
  const mockToken = 'test-token';
  const mockClassId = 'test-class-id';
  const mockBaseUrl = 'http://localhost:3001/api';

  beforeEach(() => {
    vi.clearAllMocks();
    // Set base URL for testing
    process.env.VITE_API_BASE_URL = mockBaseUrl;
  });

  afterEach(() => {
    delete process.env.VITE_API_BASE_URL;
  });

  describe('getGroupPerformance', () => {
    it('should fetch group performance data successfully', async () => {
      const mockResponse = [
        {
          groupId: '1',
          groupName: 'Group A',
          memberCount: 5,
          averageScore: 85,
          aiGenerated: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await analyticsApi.getGroupPerformance(mockClassId, mockToken);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/group-performance/${mockClassId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Failed to fetch group performance data'
      } as Response);

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow('Failed to fetch group performance data');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow('Network error');
    });

    it('should handle malformed JSON responses', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow('Invalid JSON');
    });
  });

  describe('getAIInsights', () => {
    it('should fetch AI insights data successfully', async () => {
      const mockResponse = {
        totalGroups: 2,
        aiGeneratedGroups: 1,
        humanCreatedGroups: 1,
        averageGroupSize: 4.5,
        averageScore: 81.5,
        scoreDistribution: {
          '70-80': 1,
          '80-90': 1
        },
        recommendations: ['Test recommendation']
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await analyticsApi.getAIInsights(mockClassId, mockToken);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/ai-insights/${mockClassId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Failed to fetch AI insights data'
      } as Response);

      await expect(analyticsApi.getAIInsights(mockClassId, mockToken))
        .rejects.toThrow('Failed to fetch AI insights data');
    });
  });

  describe('getStudentEngagement', () => {
    it('should fetch student engagement data successfully', async () => {
      const mockResponse = [
        {
          studentId: '1',
          name: 'John Doe',
          engagementScore: 92,
          participationRate: 0.85,
          lastActive: '2024-01-01T12:00:00Z'
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await analyticsApi.getStudentEngagement(mockClassId, mockToken);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/student-engagement/${mockClassId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Failed to fetch student engagement data'
      } as Response);

      await expect(analyticsApi.getStudentEngagement(mockClassId, mockToken))
        .rejects.toThrow('Failed to fetch student engagement data');
    });
  });

  describe('getHistoricalData', () => {
    it('should fetch historical data successfully', async () => {
      const mockResponse = [
        {
          date: '2024-01-01',
          averageScore: 81.5,
          groupCount: 2,
          totalStudents: 9
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await analyticsApi.getHistoricalData(mockClassId, mockToken);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/historical/${mockClassId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      await expect(analyticsApi.getHistoricalData(mockClassId, mockToken))
        .rejects.toThrow('Failed to fetch historical data');
    });
  });

  describe('exportData', () => {
    it('should export data as CSV successfully', async () => {
      const mockData = {
        groupPerformance: [
          { groupName: 'Group A', averageScore: 85, memberCount: 5 }
        ],
        aiInsights: { totalGroups: 1, averageScore: 85 },
        studentEngagement: [],
        historicalData: []
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['CSV data'], { type: 'text/csv' }),
        headers: new Headers({ 'content-type': 'text/csv' })
      } as Response);

      const result = await analyticsApi.exportData(mockClassId, mockToken, 'csv', mockData);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/export/csv`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ classId: mockClassId, data: mockData })
        }
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should export data as JSON successfully', async () => {
      const mockData = {
        groupPerformance: [],
        aiInsights: { totalGroups: 0 },
        studentEngagement: [],
        historicalData: []
      };

      const mockJsonBlob = new Blob([JSON.stringify(mockData)], { type: 'application/json' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockJsonBlob,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      const result = await analyticsApi.exportData(mockClassId, mockToken, 'json', mockData);

      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/analytics/export/json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ classId: mockClassId, data: mockData })
        }
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle invalid export format', async () => {
      const mockData = { groupPerformance: [], aiInsights: {}, studentEngagement: [], historicalData: [] };

      await expect(analyticsApi.exportData(mockClassId, mockToken, 'invalid' as any, mockData))
        .rejects.toThrow('Invalid export format');
    });

    it('should handle export API errors', async () => {
      const mockData = { groupPerformance: [], aiInsights: {}, studentEngagement: [], historicalData: [] };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(analyticsApi.exportData(mockClassId, mockToken, 'csv', mockData))
        .rejects.toThrow('Failed to export data');
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle missing base URL', async () => {
      delete process.env.VITE_API_BASE_URL;

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow('API base URL is not configured');
    });

    it('should handle malformed URLs', async () => {
      process.env.VITE_API_BASE_URL = 'not-a-valid-url';

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      vi.mocked(fetch).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(analyticsApi.getGroupPerformance(mockClassId, mockToken))
        .rejects.toThrow('Timeout');
    });
  });

  describe('Authentication handling', () => {
    it('should include authorization header with token', async () => {
      const mockResponse = [];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' })
      } as Response);

      await analyticsApi.getGroupPerformance(mockClassId, mockToken);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle missing token gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      await expect(analyticsApi.getGroupPerformance(mockClassId, ''))
        .rejects.toThrow('Failed to fetch group performance data');
    });
  });
});