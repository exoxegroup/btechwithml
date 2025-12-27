/**
 * Chart.js Components for Analytics Dashboard
 * 
 * Reusable chart components built with Chart.js
 * Optimized for accessibility and performance
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { CHART_JS_CONFIG, ACCESSIBLE_COLORS, generateColorPalette, formatNumber, formatPercentage } from '../config/visualization';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Group Performance Line Chart Configuration
 * Displays average scores, improvement rates, and retention rates over time
 */
export function createGroupPerformanceChart(
  data: Array<{
    groupId: string;
    period: string;
    averageScore: number;
    improvementRate: number;
    retentionRate: number;
  }>
): { data: ChartData<'line'>; options: ChartOptions<'line'> } {
  const periods = [...new Set(data.map(d => d.period))].sort();
  const groups = [...new Set(data.map(d => d.groupId))];
  const colors = generateColorPalette(groups.length);

  const datasets = [
    {
      label: 'Average Score',
      data: periods.map(period => {
        const periodData = data.filter(d => d.period === period);
        return periodData.length > 0 
          ? periodData.reduce((sum, d) => sum + d.averageScore, 0) / periodData.length
          : 0;
      }),
      borderColor: ACCESSIBLE_COLORS.primary,
      backgroundColor: `${ACCESSIBLE_COLORS.primary}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8
    },
    {
      label: 'Improvement Rate',
      data: periods.map(period => {
        const periodData = data.filter(d => d.period === period);
        return periodData.length > 0 
          ? periodData.reduce((sum, d) => sum + d.improvementRate, 0) / periodData.length
          : 0;
      }),
      borderColor: ACCESSIBLE_COLORS.secondary,
      backgroundColor: `${ACCESSIBLE_COLORS.secondary}20`,
      fill: false,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      yAxisID: 'y1'
    },
    {
      label: 'Retention Rate',
      data: periods.map(period => {
        const periodData = data.filter(d => d.period === period);
        return periodData.length > 0 
          ? periodData.reduce((sum, d) => sum + d.retentionRate, 0) / periodData.length
          : 0;
      }),
      borderColor: ACCESSIBLE_COLORS.info,
      backgroundColor: `${ACCESSIBLE_COLORS.info}20`,
      fill: false,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
      yAxisID: 'y1'
    }
  ];

  const chartData: ChartData<'line'> = {
    labels: periods,
    datasets
  };

  const options: ChartOptions<'line'> = {
    ...CHART_JS_CONFIG,
    plugins: {
      ...CHART_JS_CONFIG.plugins,
      title: {
        display: true,
        text: 'Group Performance Metrics Over Time',
        color: ACCESSIBLE_COLORS.text,
        font: {
          size: 16,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold'
        }
      },
      tooltip: {
        ...CHART_JS_CONFIG.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Average Score') {
              return `${label}: ${formatNumber(value)}`;
            } else {
              return `${label}: ${formatPercentage(value)}`;
            }
          }
        }
      }
    },
    scales: {
      ...CHART_JS_CONFIG.scales,
      y: {
        ...CHART_JS_CONFIG.scales.y,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (0-100)',
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Rate (%)',
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          }
        },
        ticks: {
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            return formatPercentage(value);
          }
        }
      }
    }
  };

  return { data: chartData, options };
}

/**
 * Gender Balance Bar Chart Configuration
 * Displays gender distribution across groups
 */
export function createGenderBalanceChart(
  data: Array<{
    groupId: string;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
    totalStudents: number;
  }>
): { data: ChartData<'bar'>; options: ChartOptions<'bar'> } {
  const chartData: ChartData<'bar'> = {
    labels: data.map(d => `Group ${d.groupId}`),
    datasets: [
      {
        label: 'Male',
        data: data.map(d => d.maleCount),
        backgroundColor: ACCESSIBLE_COLORS.primary,
        borderColor: ACCESSIBLE_COLORS.primary,
        borderWidth: 1
      },
      {
        label: 'Female',
        data: data.map(d => d.femaleCount),
        backgroundColor: ACCESSIBLE_COLORS.secondary,
        borderColor: ACCESSIBLE_COLORS.secondary,
        borderWidth: 1
      },
      {
        label: 'Other',
        data: data.map(d => d.otherCount),
        backgroundColor: ACCESSIBLE_COLORS.neutral,
        borderColor: ACCESSIBLE_COLORS.neutral,
        borderWidth: 1
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    ...CHART_JS_CONFIG,
    plugins: {
      ...CHART_JS_CONFIG.plugins,
      title: {
        display: true,
        text: 'Gender Distribution by Group',
        color: ACCESSIBLE_COLORS.text,
        font: {
          size: 16,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold'
        }
      }
    },
    scales: {
      ...CHART_JS_CONFIG.scales,
      x: {
        ...CHART_JS_CONFIG.scales.x,
        stacked: true,
        title: {
          display: true,
          text: 'Groups',
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        ...CHART_JS_CONFIG.scales.y,
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students',
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      }
    }
  };

  return { data: chartData, options };
}

/**
 * AI Algorithm Effectiveness Radar Chart Configuration
 * Displays multiple metrics of algorithm performance
 */
export function createAIAlgorithmChart(
  data: {
    groupingAccuracy: number;
    genderBalanceScore: number;
    abilityDistributionScore: number;
    retentionImprovement: number;
    collaborationEffectiveness: number;
    overallSatisfaction: number;
  }
): { data: ChartData<'radar'>; options: ChartOptions<'radar'> } {
  const chartData: ChartData<'radar'> = {
    labels: [
      'Grouping Accuracy',
      'Gender Balance',
      'Ability Distribution',
      'Retention Improvement',
      'Collaboration Effectiveness',
      'Overall Satisfaction'
    ],
    datasets: [{
      label: 'Algorithm Performance',
      data: [
        data.groupingAccuracy,
        data.genderBalanceScore,
        data.abilityDistributionScore,
        data.retentionImprovement,
        data.collaborationEffectiveness,
        data.overallSatisfaction
      ],
      backgroundColor: `${ACCESSIBLE_COLORS.primary}20`,
      borderColor: ACCESSIBLE_COLORS.primary,
      borderWidth: 2,
      pointBackgroundColor: ACCESSIBLE_COLORS.primary,
      pointBorderColor: ACCESSIBLE_COLORS.background,
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const options: ChartOptions<'radar'> = {
    ...CHART_JS_CONFIG,
    plugins: {
      ...CHART_JS_CONFIG.plugins,
      title: {
        display: true,
        text: 'AI Algorithm Performance Metrics',
        color: ACCESSIBLE_COLORS.text,
        font: {
          size: 16,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold'
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: ACCESSIBLE_COLORS.textSecondary,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: function(value) {
            return formatPercentage(value);
          }
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.2)'
        },
        angleLines: {
          color: 'rgba(107, 114, 128, 0.2)'
        },
        pointLabels: {
          color: ACCESSIBLE_COLORS.text,
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      }
    }
  };

  return { data: chartData, options };
}

/**
 * Student Engagement Pie Chart Configuration
 * Displays engagement levels across different metrics
 */
export function createEngagementChart(
  data: Array<{
    category: string;
    value: number;
    color: string;
  }>
): { data: ChartData<'pie'>; options: ChartOptions<'pie'> } {
  const chartData: ChartData<'pie'> = {
    labels: data.map(d => d.category),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: data.map(d => d.color),
      borderColor: ACCESSIBLE_COLORS.background,
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const options: ChartOptions<'pie'> = {
    ...CHART_JS_CONFIG,
    plugins: {
      ...CHART_JS_CONFIG.plugins,
      title: {
        display: true,
        text: 'Student Engagement Distribution',
        color: ACCESSIBLE_COLORS.text,
        font: {
          size: 16,
          family: 'Inter, system-ui, sans-serif',
          weight: 'bold'
        }
      },
      tooltip: {
        ...CHART_JS_CONFIG.plugins.tooltip,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = (value / total) * 100;
            return `${label}: ${formatNumber(value)} (${formatPercentage(percentage)})`;
          }
        }
      }
    }
  };

  return { data: chartData, options };
}

/**
 * Export chart as image
 * Helper function for research data exports
 */
export async function exportChartAsImage(
  chart: any,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): Promise<string> {
  try {
    return chart.toBase64Image(format, quality);
  } catch (error) {
    console.error('Error exporting chart as image:', error);
    throw new Error('Failed to export chart as image');
  }
}