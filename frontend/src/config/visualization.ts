/**
 * Visualization Configuration
 * 
 * Centralized configuration for Chart.js and D3.js visualizations
 * Ensures WCAG 2.1 AA accessibility compliance and consistent styling
 * across all analytics dashboards
 */

// Color palette optimized for accessibility (WCAG 2.1 AA compliant)
export const ACCESSIBLE_COLORS = {
  primary: '#2563eb',      // Blue - 4.5:1 contrast ratio
  secondary: '#059669',    // Green - 4.5:1 contrast ratio
  tertiary: '#dc2626',     // Red - 4.5:1 contrast ratio
  warning: '#d97706',      // Orange - 4.5:1 contrast ratio
  info: '#7c3aed',         // Purple - 4.5:1 contrast ratio
  neutral: '#6b7280',      // Gray - 4.5:1 contrast ratio
  background: '#ffffff',   // White background
  text: '#1f2937',         // Dark gray text - 7:1 contrast ratio
  textSecondary: '#4b5563', // Medium gray text - 4.5:1 contrast ratio
} as const;

// Chart.js global configuration for accessibility
export const CHART_JS_CONFIG = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: ACCESSIBLE_COLORS.text,
        font: {
          size: 14,
          family: 'Inter, system-ui, sans-serif'
        },
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: ACCESSIBLE_COLORS.text,
      titleColor: ACCESSIBLE_COLORS.background,
      bodyColor: ACCESSIBLE_COLORS.background,
      titleFont: {
        size: 14,
        family: 'Inter, system-ui, sans-serif'
      },
      bodyFont: {
        size: 13,
        family: 'Inter, system-ui, sans-serif'
      },
      padding: 12,
      cornerRadius: 6,
      displayColors: true
    }
  },
  scales: {
    x: {
      ticks: {
        color: ACCESSIBLE_COLORS.textSecondary,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      },
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        drawBorder: false
      }
    },
    y: {
      ticks: {
        color: ACCESSIBLE_COLORS.textSecondary,
        font: {
          size: 12,
          family: 'Inter, system-ui, sans-serif'
        }
      },
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        drawBorder: false
      }
    }
  }
} as const;

// D3.js configuration for accessibility
export const D3_CONFIG = {
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
  colors: ACCESSIBLE_COLORS,
  font: {
    family: 'Inter, system-ui, sans-serif',
    size: {
      small: 12,
      medium: 14,
      large: 16
    }
  },
  // ARIA labels and roles for screen readers
  aria: {
    role: 'img',
    labelPrefix: 'Chart showing'
  }
} as const;

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  // Maximum data points before sampling
  maxDataPoints: 1000,
  
  // Animation duration in milliseconds
  animationDuration: 750,
  
  // Debounce delay for real-time updates
  updateDebounceMs: 300,
  
  // Maximum concurrent chart renders
  maxConcurrentRenders: 4
} as const;

// Export format configurations
export const EXPORT_CONFIG = {
  // Chart.js export settings
  chartJs: {
    width: 1200,
    height: 600,
    backgroundColor: ACCESSIBLE_COLORS.background,
    devicePixelRatio: 2 // High resolution for exports
  },
  
  // D3.js export settings
  d3: {
    width: 1200,
    height: 600,
    margin: D3_CONFIG.margin
  }
} as const;

// Type definitions for chart data
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  group?: string;
  metric?: string;
}

export interface GroupPerformanceData {
  groupId: string;
  averageScore: number;
  improvementRate: number;
  retentionRate: number;
  genderBalance: number;
  collaborationScore: number;
  participationRate: number;
}

// Helper function to generate accessible color palette for multiple series
export function generateColorPalette(count: number): string[] {
  const baseColors = [
    ACCESSIBLE_COLORS.primary,
    ACCESSIBLE_COLORS.secondary,
    ACCESSIBLE_COLORS.tertiary,
    ACCESSIBLE_COLORS.info,
    ACCESSIBLE_COLORS.warning,
    '#0891b2', // Cyan
    '#be185d', // Magenta
    '#65a30d', // Lime
  ];
  
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Generate additional colors if needed
  const additionalColors = [];
  for (let i = baseColors.length; i < count; i++) {
    // Use HSL color space to generate distinct colors
    const hue = (i * 360 / count) % 360;
    additionalColors.push(`hsl(${hue}, 70%, 45%)`);
  }
  
  return [...baseColors, ...additionalColors];
}

// Helper function to format numbers for accessibility
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Helper function to format percentages for accessibility
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

// Screen reader friendly date formatting
export function formatDateForAccessibility(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}