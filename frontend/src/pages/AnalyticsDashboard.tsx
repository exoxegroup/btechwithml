import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAnalytics } from '../hooks/useAnalytics';
import Header from '../components/common/Header';
import { Spinner } from '../components/common/Spinner';
import InteractiveChart from '../components/analytics/InteractiveChart';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  BarChart3, 
  Brain, 
  Download, 
  FileText, 
  RefreshCw,
  Filter,
  Calendar,
  AlertCircle,
  Eye
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportResearchData, downloadExportFile, GroupPerformanceData } from '../services/analyticsApi';
import { ACCESSIBLE_COLORS, getChartOptions } from './config/visualization';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import GroupDetailsModal from '../components/modals/GroupDetailsModal';

interface AnalyticsDashboardProps {}

interface AIInsightsData {
  algorithmEffectiveness: number;
  totalGroupsAnalyzed: number;
  averageGroupPerformance: number;
  genderBalanceScore: number;
  recommendations: string[];
  improvementAreas: string[];
}

interface ExportOptions {
  format: 'csv' | 'json';
  anonymize: boolean;
  includeGenderData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}> = ({ icon, title, value, subtitle, trend, trendValue }) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-teal-100 text-teal-600 p-3 rounded-full">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>
        {trend && trendValue !== undefined && (
          <div className={`text-sm font-medium ${trendColor} flex items-center gap-1`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trendValue).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const GroupPerformanceCard: React.FC<{ group: GroupPerformanceData; onViewDetails: (group: GroupPerformanceData) => void }> = ({ group, onViewDetails }) => {
  const performanceColor = group.averageScore >= 80 ? 'text-green-600' : 
                          group.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-slate-800">
          {group.studentName || group.groupName || group.label}
        </h4>
        {group.aiGenerated && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">AI</span>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Pretest:</span>
          <span className="font-medium text-slate-800">{group.avgPretestScore?.toFixed(1) || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Posttest:</span>
          <span className={`font-medium ${performanceColor}`}>{group.avgPosttestScore?.toFixed(1) || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Retention:</span>
          <span className="font-medium text-slate-800">{group.avgRetentionScore?.toFixed(1) || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Improvement:</span>
          <span className={`font-medium ${group.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {group.improvementRate >= 0 ? '+' : ''}{group.improvementRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Retention Rate:</span>
          <span className="font-medium text-slate-800">{group.retentionRate.toFixed(1)}%</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Gender Balance:</span>
          <span className="font-medium text-slate-800">{group.genderBalance.toFixed(1)}</span>
        </div>
        
        {group.groupingRationale && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Rationale:</p>
            <p className="text-xs text-slate-700 line-clamp-2">{group.groupingRationale}</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
            <button
                onClick={() => onViewDetails(group)}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium w-full"
            >
                <Eye size={16} />
                View Details
            </button>
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const token = localStorage.getItem('authToken') || '';
  
  // Use the actual analytics hook
  const {
    groupPerformance,
    aiInsights,
    studentEngagement,
    loading,
    refreshing,
    error,
    refreshData,
    lastUpdate,
    pendingUpdates
  } = useAnalytics({
    classId: classId || '',
    token: token,
    enableRealTime: false,
    refreshInterval: 30000
  });
  
  const [selectedVisualization, setSelectedVisualization] = useState<'performance' | 'insights' | 'export'>('performance');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Modal State
  const [selectedGroup, setSelectedGroup] = useState<GroupPerformanceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    anonymize: false,
    includeGenderData: true
  });

  // Handle refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  const openGroupModal = (group: GroupPerformanceData) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  // Handle data export with enhanced error handling and success feedback
  const handleExport = async () => {
    if (!classId) {
      setError('No class ID available for export');
      return;
    }
    
    setExportLoading(true);
    setExportSuccess(false);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Validate export options
      if (!exportOptions.format || !['csv', 'json'].includes(exportOptions.format)) {
        throw new Error('Invalid export format. Please select CSV or JSON.');
      }

      const exportResult = await exportResearchData(classId, exportOptions, token);
      
      // Validate export response
      if (!exportResult || !exportResult.downloadUrl) {
        throw new Error('Invalid export response from server');
      }
      
      // Download the file
      const blob = await downloadExportFile(exportResult.downloadUrl, token);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `biolearn_export_${classId}_${timestamp}.${exportOptions.format}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success feedback
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000); // Hide after 5 seconds
      
    } catch (err: any) {
      console.error('Export failed:', err);
      
      // Enhanced error messages based on error type
      let errorMessage = 'Export failed: ';
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errorMessage += 'Authentication failed. Please log in again.';
      } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
        errorMessage += 'You do not have permission to export this data.';
      } else if (err.message.includes('404') || err.message.includes('Not found')) {
        errorMessage += 'Data not found. The class or data may have been removed.';
      } else if (err.message.includes('429') || err.message.includes('Too many requests')) {
        errorMessage += 'Too many export requests. Please wait a moment and try again.';
      } else {
        errorMessage += err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  // Prepare chart data
  const performanceChartData = groupPerformance && groupPerformance.length > 0 ? groupPerformance.map(group => ({
    name: group.groupName,
    averageScore: group.averageScore,
    improvementRate: group.improvementRate,
    memberCount: group.memberCount
  })) : [];

  const genderBalanceData = groupPerformance && groupPerformance.length > 0 ? groupPerformance.map(group => ({
    name: group.groupName,
    genderBalance: group.genderBalance,
    aiGenerated: group.aiGenerated
  })) : [];

  // Data is automatically fetched by useAnalytics hook
  // No need for manual fetch call

  // Debug logging
  console.log('AnalyticsDashboard State:', { 
    loading, 
    error, 
    groupsCount: groupPerformance?.length,
    tokenPresent: !!token,
    classId
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-500 font-medium">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Header title="Analytics Dashboard" />
        <div className="container mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-lg font-semibold text-red-800">Error Loading Analytics</h2>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100">
        <Header title="Analytics Dashboard" />
        
        <main className="container mx-auto p-8">
          {/* Navigation and Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link 
                to={`/class/${classId}/students`} 
                className="flex items-center gap-2 text-teal-600 font-semibold hover:underline"
              >
                <ArrowLeft size={18} />
                Back to Class
              </Link>
              
              <div className="flex bg-white rounded-lg border border-slate-200">
                <button
                  onClick={() => setSelectedVisualization('performance')}
                  className={`px-4 py-2 rounded-l-lg transition-colors ${
                    selectedVisualization === 'performance' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 size={16} className="inline mr-2" />
                  Performance
                </button>

                <button
                  onClick={() => setSelectedVisualization('export')}
                  className={`px-4 py-2 rounded-r-lg transition-colors ${
                    selectedVisualization === 'export' 
                      ? 'bg-teal-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Download size={16} className="inline mr-2" />
                  Export
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Real-time status indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  pendingUpdates.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <span className="text-sm text-slate-600">
                  {pendingUpdates.length > 0 ? `${pendingUpdates.length} updates` : 'Real-time'}
                </span>
                {lastUpdate && (
                  <span className="text-xs text-slate-500">
                    Last: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Pending Updates Display */}
          {pendingUpdates.length > 0 && (
            <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg mb-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Pending Updates</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {pendingUpdates.map((update, index) => (
                  <li key={index}>{update.type}: {new Date(update.timestamp).toLocaleTimeString()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Content based on selected visualization */}
          {selectedVisualization === 'performance' && (
            <div className="space-y-8">
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={<BarChart3 size={24} />} 
                  title="Total Groups" 
                  value={groupPerformance.length} 
                  subtitle="Active groups"
                />
                <StatCard 
                  icon={<TrendingUp size={24} />} 
                  title="Avg Performance" 
                  value={groupPerformance.length > 0 ? 
                    (groupPerformance.reduce((sum, g) => sum + g.averageScore, 0) / groupPerformance.length).toFixed(1)
                    : '0'
                  } 
                  subtitle="Average score"
                />
                <StatCard 
                  icon={<Users size={24} />} 
                  title="Total Students" 
                  value={groupPerformance && groupPerformance.length > 0 ? groupPerformance.reduce((sum, g) => sum + (g.memberCount || 0), 0) : 0} 
                  subtitle="Across all groups"
                />
              </div>

              {/* Performance Charts - Simplified */}
              <div className="grid grid-cols-1 gap-8">
                {/* Charts removed for cleaner interface */}
              </div>



              {/* Group Performance Grid */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Detailed Group Performance</h3>
                {groupPerformance.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupPerformance.map((group) => (
                      <GroupPerformanceCard key={group.groupId} group={group} onViewDetails={openGroupModal} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="text-slate-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No Groups Formed Yet</h3>
                    <p className="text-slate-500 mt-1 max-w-sm mx-auto">
                      There are no student groups in this class. Groups will appear here once they are formed during class sessions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}



          {selectedVisualization === 'export' && (
            <div className="space-y-8">
              {/* Export Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={<FileText size={24} />} 
                  title="Total Records" 
                  value={groupPerformance.length + (studentEngagement?.length || 0)} 
                  subtitle="Available for export"
                />
                <StatCard 
                  icon={<Users size={24} />} 
                  title="Students" 
                  value={groupPerformance && groupPerformance.length > 0 ? groupPerformance.reduce((sum, g) => sum + (g.memberCount || 0), 0) : 0} 
                  subtitle="Total students"
                />
                <StatCard 
                  icon={<TrendingUp size={24} />} 
                  title="Avg Score" 
                  value={groupPerformance.length > 0 ? 
                    (groupPerformance.reduce((sum, g) => sum + g.averageScore, 0) / groupPerformance.length).toFixed(1)
                    : '0'
                  } 
                  subtitle="Mean performance"
                />
              </div>

              {/* Data Preview Visualization */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Export Data Preview</h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showPreview 
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                    }`}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Data Preview'}
                  </button>
                </div>

                {showPreview ? (
                  <>
                    <InteractiveChart
                      data={groupPerformance.map(group => ({
                        name: group.groupName,
                        records: group.memberCount,
                        aiGenerated: group.aiGenerated,
                        performance: group.averageScore
                      }))}
                      type="bar"
                      xKey="name"
                      yKey="records"
                      colorKey="aiGenerated"
                      title="Data Export Preview - Records by Group"
                      accessibilityLabel="Interactive bar chart showing number of records that will be exported for each group"
                      height={300}
                      showTooltip={true}
                      showLegend={true}
                      margin={{ top: 20, right: 30, bottom: 60, left: 50 }}
                    />
                    <p className="text-sm text-slate-600 mt-2">
                      Preview of data distribution that will be included in your export. Blue bars indicate AI-generated groups.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                    <BarChart3 size={48} className="text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">Click "Show Data Preview" to visualize export data</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Export Options</h3>
                  
                  {/* Success/Error Messages */}
                  {exportSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 text-green-600 p-1 rounded-full">
                          <TrendingUp size={12} />
                        </div>
                        <p className="text-sm text-green-800 font-medium">Export successful! File downloaded.</p>
                      </div>
                    </div>
                  )}
                  
                  {error && error.includes('Export failed') && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 text-red-600 p-1 rounded-full">
                          <AlertCircle size={12} />
                        </div>
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Format</label>
                      <select
                        value={exportOptions.format}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'csv' | 'json' }))}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="csv">CSV (Spreadsheet)</option>
                        <option value="json">JSON (Raw Data)</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-600 mb-2"><strong>CSV:</strong> Perfect for Excel, Google Sheets</p>
                      <p className="text-xs text-slate-600"><strong>JSON:</strong> Ideal for data analysis, machine learning</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="anonymize"
                        checked={exportOptions.anonymize}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, anonymize: e.target.checked }))}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="anonymize" className="text-sm text-slate-700">
                        Anonymize student data
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includeGender"
                        checked={exportOptions.includeGenderData}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeGenderData: e.target.checked }))}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <label htmlFor="includeGender" className="text-sm text-slate-700">
                        Include gender analysis data
                      </label>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date Range (Optional)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={exportOptions.dateRange?.start?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            const start = e.target.value ? new Date(e.target.value) : undefined;
                            setExportOptions(prev => ({ 
                              ...prev, 
                              dateRange: start ? { start, end: prev.dateRange?.end || new Date() } : undefined 
                            }));
                          }}
                          className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={exportOptions.dateRange?.end?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            const end = e.target.value ? new Date(e.target.value) : undefined;
                            setExportOptions(prev => ({ 
                              ...prev, 
                              dateRange: end && prev.dateRange?.start ? { start: prev.dateRange.start, end } : undefined 
                            }));
                          }}
                          className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="End date"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Leave empty to export all available data</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-4">Export Summary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Groups:</span>
                      <span className="font-medium text-slate-800">{groupPerformance.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Students:</span>
                      <span className="font-medium text-slate-800">{groupPerformance && groupPerformance.length > 0 ? groupPerformance.reduce((sum, g) => sum + (g.memberCount || 0), 0) : 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Format:</span>
                      <span className="font-medium text-slate-800 uppercase">{exportOptions.format}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Anonymized:</span>
                      <span className="font-medium text-slate-800">{exportOptions.anonymize ? 'Yes' : 'No'}</span>
                    </div>
                    {exportOptions.includeGenderData && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Gender Data:</span>
                        <span className="font-medium text-slate-800">Included</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleExport}
                      disabled={exportLoading}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      <Download size={16} />
                      {exportLoading ? 'Exporting...' : 'Export Research Data'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AnalyticsDashboard;