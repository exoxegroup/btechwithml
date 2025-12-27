/**
 * D3.js Components for Advanced Analytics Visualizations
 * 
 * Advanced visualization components using D3.js for complex data representations
 * Optimized for performance and accessibility
 */

import * as d3 from 'd3';
import { D3_CONFIG, ACCESSIBLE_COLORS, formatNumber, formatPercentage, formatDateForAccessibility } from '../config/visualization';

/**
 * Creates an interactive force-directed network graph showing student collaboration patterns
 */
export function createCollaborationNetwork(
  container: HTMLElement,
  data: {
    nodes: Array<{
      id: string;
      name: string;
      group: number;
      gender: string;
      abilityLevel: number;
      engagementScore: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      strength: number;
      interactions: number;
    }>;
  }
): void {
  const width = container.clientWidth || 800;
  const height = Math.min(600, width * 0.75);
  const { margin } = D3_CONFIG;

  // Clear existing content
  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', D3_CONFIG.aria.role)
    .attr('aria-label', 'Student collaboration network showing interaction patterns');

  // Create simulation
  const simulation = d3.forceSimulation(data.nodes as any)
    .force('link', d3.forceLink(data.links).id((d: any) => d.id).strength((d: any) => d.strength * 0.1))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30));

  // Create links
  const link = svg.append('g')
    .selectAll('line')
    .data(data.links)
    .enter().append('line')
    .attr('stroke', ACCESSIBLE_COLORS.neutral)
    .attr('stroke-opacity', (d: any) => Math.min(d.strength, 0.8))
    .attr('stroke-width', (d: any) => Math.sqrt(d.interactions) * 2)
    .attr('aria-hidden', 'true');

  // Create nodes
  const node = svg.append('g')
    .selectAll('circle')
    .data(data.nodes)
    .enter().append('circle')
    .attr('r', (d: any) => 5 + (d.engagementScore * 10))
    .attr('fill', (d: any) => {
      switch (d.gender) {
        case 'MALE': return ACCESSIBLE_COLORS.primary;
        case 'FEMALE': return ACCESSIBLE_COLORS.secondary;
        default: return ACCESSIBLE_COLORS.neutral;
      }
    })
    .attr('stroke', ACCESSIBLE_COLORS.background)
    .attr('stroke-width', 2)
    .attr('tabindex', '0')
    .attr('role', 'img')
    .attr('aria-label', (d: any) => `${d.name}, ${d.gender}, ability level ${formatNumber(d.abilityLevel)}, engagement ${formatPercentage(d.engagementScore)}`);

  // Add drag behavior
  node.call(d3.drag<any, any>()
    .on('start', (event, d: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d: any) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }));

  // Add tooltips
  node.on('mouseover', function(event: any, d: any) {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('background', ACCESSIBLE_COLORS.text)
      .style('color', ACCESSIBLE_COLORS.background)
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '14px')
      .style('font-family', D3_CONFIG.font.family)
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    tooltip.html(`
      <strong>${d.name}</strong><br/>
      Gender: ${d.gender}<br/>
      Ability Level: ${formatNumber(d.abilityLevel)}<br/>
      Engagement: ${formatPercentage(d.engagementScore)}
    `);

    tooltip.style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  })
  .on('mouseout', function() {
    d3.selectAll('.d3-tooltip').remove();
  });

  // Update positions on simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);
  });
}

/**
 * Creates a hierarchical tree visualization showing ability distribution across groups
 */
export function createAbilityDistributionTree(
  container: HTMLElement,
  data: {
    name: string;
    children: Array<{
      name: string;
      children: Array<{
        name: string;
        value: number;
        abilityLevel: number;
      }>;
    }>;
  }
): void {
  const width = container.clientWidth || 800;
  const height = Math.min(600, width * 0.75);
  const { margin } = D3_CONFIG;

  // Clear existing content
  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', D3_CONFIG.aria.role)
    .attr('aria-label', 'Ability distribution tree showing student grouping by ability levels');

  // Create hierarchical data
  const root = d3.hierarchy(data)
    .sum((d: any) => d.value)
    .sort((a, b) => b.value - a.value);

  // Create treemap layout
  const treemap = d3.treemap()
    .size([width, height])
    .padding(2)
    .round(true);

  treemap(root);

  // Create color scale for ability levels
  const colorScale = d3.scaleSequential(d3.interpolateViridis)
    .domain([0, 100]);

  // Create cells
  const cell = svg.selectAll('g')
    .data(root.leaves())
    .enter().append('g')
    .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

  cell.append('rect')
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('height', (d: any) => d.y1 - d.y0)
    .attr('fill', (d: any) => colorScale(d.data.abilityLevel || 50))
    .attr('stroke', ACCESSIBLE_COLORS.background)
    .attr('stroke-width', 1)
    .attr('tabindex', '0')
    .attr('role', 'img')
    .attr('aria-label', (d: any) => `${d.data.name}, ability level ${formatNumber(d.data.abilityLevel)}, ${d.data.value} students`);

  // Add labels
  cell.append('text')
    .attr('x', (d: any) => (d.x1 - d.x0) / 2)
    .attr('y', (d: any) => (d.y1 - d.y0) / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', ACCESSIBLE_COLORS.background)
    .attr('font-family', D3_CONFIG.font.family)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text((d: any) => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      if (width > 40 && height > 20) {
        return d.data.name.length > 10 ? d.data.name.substring(0, 10) + '...' : d.data.name;
      }
      return '';
    });

  // Add tooltips
  cell.on('mouseover', function(event: any, d: any) {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('background', ACCESSIBLE_COLORS.text)
      .style('color', ACCESSIBLE_COLORS.background)
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '14px')
      .style('font-family', D3_CONFIG.font.family)
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    tooltip.html(`
      <strong>${d.data.name}</strong><br/>
      Ability Level: ${formatNumber(d.data.abilityLevel)}<br/>
      Students: ${d.data.value}
    `);

    tooltip.style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  })
  .on('mouseout', function() {
    d3.selectAll('.d3-tooltip').remove();
  });
}

/**
 * Creates a time series chart showing performance trends over time
 */
export function createPerformanceTrendChart(
  container: HTMLElement,
  data: Array<{
    date: Date;
    averageScore: number;
    improvementRate: number;
    retentionRate: number;
    groupId: string;
  }>
): void {
  const width = container.clientWidth || 800;
  const height = Math.min(400, width * 0.5);
  const { margin } = D3_CONFIG;

  // Clear existing content
  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', D3_CONFIG.aria.role)
    .attr('aria-label', 'Performance trends over time showing score improvements and retention rates');

  // Parse dates and sort data
  const parsedData = data.map(d => ({
    ...d,
    date: new Date(d.date)
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Create scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([height - margin.bottom, margin.top]);

  // Create line generators
  const lineAverage = d3.line<any>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.averageScore))
    .curve(d3.curveMonotoneX);

  const lineImprovement = d3.line<any>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.improvementRate))
    .curve(d3.curveMonotoneX);

  const lineRetention = d3.line<any>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.retentionRate))
    .curve(d3.curveMonotoneX);

  // Create axes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => formatDateForAccessibility(d as Date));

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => formatNumber(d as number));

  // Add axes
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll('text')
    .attr('font-family', D3_CONFIG.font.family)
    .attr('font-size', '12px')
    .attr('fill', ACCESSIBLE_COLORS.textSecondary);

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(yAxis)
    .selectAll('text')
    .attr('font-family', D3_CONFIG.font.family)
    .attr('font-size', '12px')
    .attr('fill', ACCESSIBLE_COLORS.textSecondary);

  // Add grid lines
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat(() => '')
    )
    .selectAll('line')
    .attr('stroke', 'rgba(107, 114, 128, 0.1)')
    .attr('stroke-dasharray', '2,2');

  // Add lines
  svg.append('path')
    .datum(parsedData)
    .attr('fill', 'none')
    .attr('stroke', ACCESSIBLE_COLORS.primary)
    .attr('stroke-width', 3)
    .attr('d', lineAverage)
    .attr('aria-label', 'Average score trend line');

  svg.append('path')
    .datum(parsedData)
    .attr('fill', 'none')
    .attr('stroke', ACCESSIBLE_COLORS.secondary)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')
    .attr('d', lineImprovement)
    .attr('aria-label', 'Improvement rate trend line');

  svg.append('path')
    .datum(parsedData)
    .attr('fill', 'none')
    .attr('stroke', ACCESSIBLE_COLORS.info)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '10,5')
    .attr('d', lineRetention)
    .attr('aria-label', 'Retention rate trend line');

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right - 150}, ${margin.top})`);

  const legendData = [
    { label: 'Average Score', color: ACCESSIBLE_COLORS.primary, dasharray: 'none' },
    { label: 'Improvement Rate', color: ACCESSIBLE_COLORS.secondary, dasharray: '5,5' },
    { label: 'Retention Rate', color: ACCESSIBLE_COLORS.info, dasharray: '10,5' }
  ];

  legendData.forEach((item, i) => {
    const legendItem = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    legendItem.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', item.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', item.dasharray);

    legendItem.append('text')
      .attr('x', 25)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('font-family', D3_CONFIG.font.family)
      .attr('font-size', '12px')
      .attr('fill', ACCESSIBLE_COLORS.text)
      .text(item.label);
  });

  // Add axis labels
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .attr('text-anchor', 'middle')
    .attr('font-family', D3_CONFIG.font.family)
    .attr('font-size', '14px')
    .attr('fill', ACCESSIBLE_COLORS.textSecondary)
    .text('Score / Rate (%)');

  svg.append('text')
    .attr('transform', `translate(${width / 2}, ${height - 5})`)
    .attr('text-anchor', 'middle')
    .attr('font-family', D3_CONFIG.font.family)
    .attr('font-size', '14px')
    .attr('fill', ACCESSIBLE_COLORS.textSecondary)
    .text('Time Period');
}

/**
 * Utility function to clean up D3 visualizations
 */
export function cleanupD3Visualization(container: HTMLElement): void {
  d3.select(container).selectAll('*').remove();
  d3.selectAll('.d3-tooltip').remove();
}