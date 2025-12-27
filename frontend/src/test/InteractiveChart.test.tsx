import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { InteractiveChart } from '../components/analytics/InteractiveChart';

// Mock D3.js modules
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      remove: vi.fn()
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({
        attr: vi.fn(() => ({
          style: vi.fn()
        })),
        style: vi.fn()
      })),
      style: vi.fn(() => ({
        text: vi.fn()
      })),
      text: vi.fn()
    })),
    style: vi.fn(() => ({
      text: vi.fn()
    })),
    text: vi.fn()
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn()
    })),
    range: vi.fn()
  })),
  scaleOrdinal: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn()
    })),
    range: vi.fn()
  })),
  extent: vi.fn(() => [0, 100]),
  axisBottom: vi.fn(() => ({
    tickFormat: vi.fn()
  })),
  axisLeft: vi.fn(() => ({}))
}));

const mockScatterData = [
  { name: 'Group A', records: 5, aiGenerated: true, performance: 85 },
  { name: 'Group B', records: 4, aiGenerated: false, performance: 78 },
  { name: 'Group C', records: 6, aiGenerated: true, performance: 92 }
];

const mockLineData = [
  { date: '2024-01-01', score: 80 },
  { date: '2024-01-02', score: 82 },
  { date: '2024-01-03', score: 85 }
];

const mockBarData = [
  { category: 'AI Generated', count: 15 },
  { category: 'Human Created', count: 10 }
];

const mockHeatmapData = [
  { x: 0, y: 0, value: 10 },
  { x: 1, y: 0, value: 20 },
  { x: 0, y: 1, value: 15 },
  { x: 1, y: 1, value: 25 }
];

describe('InteractiveChart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render scatter plot chart', () => {
    render(
      <InteractiveChart
        data={mockScatterData}
        type="scatter"
        xKey="records"
        yKey="performance"
        colorKey="aiGenerated"
        title="Group Performance Analysis"
        accessibilityLabel="Scatter plot showing group performance vs member count"
        height={400}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Group Performance Analysis')).toBeInTheDocument();
    expect(screen.getByLabelText('Scatter plot showing group performance vs member count')).toBeInTheDocument();
  });

  it('should render line chart', () => {
    render(
      <InteractiveChart
        data={mockLineData}
        type="line"
        xKey="date"
        yKey="score"
        title="Score Trends Over Time"
        accessibilityLabel="Line chart showing score trends over time"
        height={300}
        showTooltip={true}
        showLegend={false}
      />
    );

    expect(screen.getByText('Score Trends Over Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Line chart showing score trends over time')).toBeInTheDocument();
  });

  it('should render bar chart', () => {
    render(
      <InteractiveChart
        data={mockBarData}
        type="bar"
        xKey="category"
        yKey="count"
        title="Group Distribution"
        accessibilityLabel="Bar chart showing distribution of group types"
        height={250}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Group Distribution')).toBeInTheDocument();
    expect(screen.getByLabelText('Bar chart showing distribution of group types')).toBeInTheDocument();
  });

  it('should render heatmap chart', () => {
    render(
      <InteractiveChart
        data={mockHeatmapData}
        type="heatmap"
        xKey="x"
        yKey="y"
        colorKey="value"
        title="Performance Heatmap"
        accessibilityLabel="Heatmap visualization of performance data"
        height={350}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Performance Heatmap')).toBeInTheDocument();
    expect(screen.getByLabelText('Heatmap visualization of performance data')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', () => {
    render(
      <InteractiveChart
        data={[]}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Empty Chart"
        accessibilityLabel="Chart with no data"
        height={300}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart with no data')).toBeInTheDocument();
  });

  it('should apply custom margins', () => {
    const customMargins = { top: 50, right: 40, bottom: 80, left: 70 };
    
    render(
      <InteractiveChart
        data={mockScatterData}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Custom Margins Chart"
        accessibilityLabel="Chart with custom margins"
        height={400}
        showTooltip={true}
        showLegend={true}
        margin={customMargins}
      />
    );

    expect(screen.getByText('Custom Margins Chart')).toBeInTheDocument();
  });

  it('should handle missing optional props', () => {
    render(
      <InteractiveChart
        data={mockScatterData}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Minimal Chart"
        accessibilityLabel="Chart with minimal configuration"
        height={300}
      />
    );

    expect(screen.getByText('Minimal Chart')).toBeInTheDocument();
    expect(screen.getByLabelText('Chart with minimal configuration')).toBeInTheDocument();
  });

  it('should be responsive to data changes', async () => {
    const { rerender } = render(
      <InteractiveChart
        data={mockScatterData}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Dynamic Chart"
        accessibilityLabel="Chart that updates with data changes"
        height={300}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Dynamic Chart')).toBeInTheDocument();

    const updatedData = [...mockScatterData, { name: 'Group D', records: 7, aiGenerated: true, performance: 88 }];
    
    rerender(
      <InteractiveChart
        data={updatedData}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Updated Chart"
        accessibilityLabel="Chart with updated data"
        height={300}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Updated Chart')).toBeInTheDocument();
  });

  it('should meet accessibility requirements', () => {
    render(
      <InteractiveChart
        data={mockScatterData}
        type="scatter"
        xKey="records"
        yKey="performance"
        title="Accessible Chart"
        accessibilityLabel="Fully accessible chart with proper ARIA labels"
        height={300}
        showTooltip={true}
        showLegend={true}
      />
    );

    const chartElement = screen.getByLabelText('Fully accessible chart with proper ARIA labels');
    expect(chartElement).toBeInTheDocument();
    expect(chartElement).toHaveAttribute('role', 'img');
  });

  it('should handle invalid chart type gracefully', () => {
    // @ts-expect-error - Testing invalid chart type
    const { container } = render(
      <InteractiveChart
        data={mockScatterData}
        type="invalid-type"
        xKey="records"
        yKey="performance"
        title="Invalid Chart Type"
        accessibilityLabel="Chart with invalid type"
        height={300}
        showTooltip={true}
        showLegend={true}
      />
    );

    expect(screen.getByText('Invalid Chart Type')).toBeInTheDocument();
    // Should still render the container without errors
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});