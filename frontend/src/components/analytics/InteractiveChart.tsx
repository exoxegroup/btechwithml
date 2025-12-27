import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ACCESSIBLE_COLORS } from '../../config/visualization';

interface InteractiveChartProps {
  data: any[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  type: 'scatter' | 'line' | 'bar' | 'heatmap';
  xKey: string;
  yKey: string;
  colorKey?: string;
  title?: string;
  onDataPointClick?: (data: any) => void;
  onDataPointHover?: (data: any) => void;
  accessibilityLabel?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  type,
  xKey,
  yKey,
  colorKey,
  title,
  onDataPointClick,
  onDataPointHover,
  accessibilityLabel = 'Interactive data visualization'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string }>(
    { visible: false, x: 0, y: 0, content: '' }
  );

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[xKey]) as [number, number])
      .range([0, innerWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d[yKey]) as [number, number])
      .range([innerHeight, 0])
      .nice();

    const colorScale = colorKey ? 
      d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d[colorKey])) :
      d3.scaleOrdinal().range([ACCESSIBLE_COLORS.primary]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 35)
      .attr('fill', '#374151')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(xKey);

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -innerHeight / 2)
      .attr('fill', '#374151')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(yKey);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    // Create visualization based on type
    switch (type) {
      case 'scatter':
        createScatterPlot(g, data, xScale, yScale, colorScale, innerHeight);
        break;
      case 'line':
        createLineChart(g, data, xScale, yScale, colorScale, innerHeight);
        break;
      case 'bar':
        createBarChart(g, data, xScale, yScale, colorScale, innerHeight);
        break;
      case 'heatmap':
        createHeatmap(g, data, xScale, yScale, colorScale, innerWidth, innerHeight);
        break;
    }

  }, [data, width, height, margin, type, xKey, yKey, colorKey]);

  const createScatterPlot = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>, colorScale: d3.ScaleOrdinal<string, string>, innerHeight: number) => {
    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d[xKey]))
      .attr('cy', d => yScale(d[yKey]))
      .attr('r', 6)
      .style('fill', d => colorScale(colorKey ? d[colorKey] : 'default'))
      .style('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8)
          .style('opacity', 1);
        
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content: `${xKey}: ${d[xKey]}, ${yKey}: ${d[yKey]}${colorKey ? `, ${colorKey}: ${d[colorKey]}` : ''}`
        });

        if (onDataPointHover) {
          onDataPointHover(d);
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .style('opacity', 0.7);
        
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      })
      .on('click', function(event, d) {
        if (onDataPointClick) {
          onDataPointClick(d);
        }
      });
  };

  const createLineChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>, colorScale: d3.ScaleOrdinal<string, string>, innerHeight: number) => {
    // Group data by color key if provided
    const line = d3.line<any>()
      .x(d => xScale(d[xKey]))
      .y(d => yScale(d[yKey]))
      .curve(d3.curveMonotoneX);

    if (colorKey) {
      const groupedData = d3.group(data, d => d[colorKey]);
      
      groupedData.forEach((values, key) => {
        g.append('path')
          .datum(values)
          .attr('fill', 'none')
          .attr('stroke', colorScale(key))
          .attr('stroke-width', 2)
          .attr('d', line);

        // Add dots
        g.selectAll(`.dot-${key}`)
          .data(values)
          .enter().append('circle')
          .attr('class', `dot-${key}`)
          .attr('cx', d => xScale(d[xKey]))
          .attr('cy', d => yScale(d[yKey]))
          .attr('r', 4)
          .style('fill', colorScale(key))
          .style('cursor', 'pointer')
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', 6);
            setTooltip({
              visible: true,
              x: event.pageX,
              y: event.pageY,
              content: `${xKey}: ${d[xKey]}, ${yKey}: ${d[yKey]}, ${colorKey}: ${d[colorKey]}`
            });
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 4);
            setTooltip({ visible: false, x: 0, y: 0, content: '' });
          });
      });
    } else {
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', ACCESSIBLE_COLORS.primary)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add dots
      g.selectAll('.dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d[xKey]))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', 4)
        .style('fill', ACCESSIBLE_COLORS.primary)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 6);
          setTooltip({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            content: `${xKey}: ${d[xKey]}, ${yKey}: ${d[yKey]}`
          });
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 4);
          setTooltip({ visible: false, x: 0, y: 0, content: '' });
        });
    }
  };

  const createBarChart = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>, colorScale: d3.ScaleOrdinal<string, string>, innerHeight: number) => {
    const barWidth = innerWidth / data.length * 0.8;
    
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d[xKey]) - barWidth / 2)
      .attr('width', barWidth)
      .attr('y', d => yScale(d[yKey]))
      .attr('height', d => innerHeight - yScale(d[yKey]))
      .style('fill', d => colorScale(colorKey ? d[colorKey] : 'default'))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8);
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content: `${xKey}: ${d[xKey]}, ${yKey}: ${d[yKey]}${colorKey ? `, ${colorKey}: ${d[colorKey]}` : ''}`
        });
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });
  };

  const createHeatmap = (g: d3.Selection<SVGGElement, unknown, null, undefined>, data: any[], xScale: d3.ScaleLinear<number, number>, yScale: d3.ScaleLinear<number, number>, colorScale: d3.ScaleOrdinal<string, string>, innerWidth: number, innerHeight: number) => {
    // Create a color scale for heatmap
    const heatmapColorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data, d => d[yKey]) as number]);

    const cellSize = Math.min(innerWidth, innerHeight) / Math.sqrt(data.length);
    
    g.selectAll('.cell')
      .data(data)
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d[xKey]))
      .attr('y', d => yScale(d[yKey]))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .style('fill', d => heatmapColorScale(d[yKey]))
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).style('stroke-width', 2);
        setTooltip({
          visible: true,
          x: event.pageX,
          y: event.pageY,
          content: `${xKey}: ${d[xKey]}, ${yKey}: ${d[yKey].toFixed(2)}`
        });
      })
      .on('mouseout', function() {
        d3.select(this).style('stroke-width', 1);
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });
  };

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-slate-200 rounded-lg"
        aria-label={accessibilityLabel}
      />
      
      {tooltip.visible && (
        <div
          className="absolute bg-slate-800 text-white px-3 py-2 rounded-lg text-sm pointer-events-none z-10 shadow-lg"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;