/**
 * Aqaar AI Concierge — Chart.js Wrappers
 * All charts styled with Aqaar dark theme + lime accent
 */

const ACCENT = '#c8e63c';
const ACCENT_DIM = 'rgba(200,230,60,0.15)';
const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TEXT_COLOR = '#666666';
const LABEL_COLOR = '#e9e9e9';
const MUTED_LABEL = '#a9a9a9';

const chartInstances = new Map();

function destroyChart(id) {
  if (chartInstances.has(id)) {
    chartInstances.get(id).destroy();
    chartInstances.delete(id);
  }
}

const baseFont = { family: "'Inter', sans-serif", size: 12 };
const labelFont = "600 11px Inter, sans-serif";

function shortLabel(value, max = 18) {
  const text = String(value || 'Available').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : String(value ?? '');
}

function prepareTopItems(items = [], limit = 6) {
  const normalized = items
    .map(item => ({
      name: item.name || item.title || 'Available on enquiry',
      value: Number(item.count || item.queries || item.value || 0),
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
  if (normalized.length <= limit) return normalized;
  const head = normalized.slice(0, limit);
  const otherValue = normalized.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return otherValue > 0 ? [...head, { name: 'Other', value: otherValue }] : head;
}

function drawRoundedLabel(ctx, text, x, y, color = LABEL_COLOR) {
  ctx.save();
  ctx.font = labelFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const width = ctx.measureText(text).width + 14;
  const height = 20;
  const left = x - width / 2;
  const top = y - height / 2;
  ctx.fillStyle = 'rgba(10,10,10,0.78)';
  ctx.strokeStyle = 'rgba(200,230,60,0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

const valueLabelsPlugin = {
  id: 'aqaarValueLabels',
  afterDatasetsDraw(chart, _args, pluginOptions = {}) {
    const { ctx, data } = chart;
    const dataset = data.datasets?.[0];
    const meta = chart.getDatasetMeta(0);
    if (!dataset || !meta?.data?.length) return;
    const isHorizontal = chart.options?.indexAxis === 'y';
    ctx.save();
    ctx.font = labelFont;
    ctx.fillStyle = LABEL_COLOR;
    ctx.textBaseline = 'middle';
    meta.data.forEach((element, index) => {
      const value = dataset.data[index];
      if (!Number(value)) return;
      const { x, y } = element.tooltipPosition();
      const label = pluginOptions.includeLabel
        ? `${shortLabel(data.labels[index], 14)} ${formatValue(value)}`
        : formatValue(value);
      ctx.textAlign = isHorizontal ? 'left' : 'center';
      const labelX = isHorizontal ? Math.min(x + 8, chart.chartArea.right - 8) : x;
      const labelY = isHorizontal ? y : Math.max(y - 12, chart.chartArea.top + 10);
      ctx.fillText(label, labelX, labelY);
    });
    ctx.restore();
  }
};

const linePointLabelsPlugin = {
  id: 'aqaarLinePointLabels',
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets?.[0];
    const meta = chart.getDatasetMeta(0);
    if (!dataset?.data?.length || !meta?.data?.length) return;
    const values = dataset.data.map(Number);
    const latestIndex = values.length - 1;
    const maxIndex = values.indexOf(Math.max(...values));
    const indexes = [...new Set([maxIndex, latestIndex])].filter(index => index >= 0);
    indexes.forEach(index => {
      const point = meta.data[index];
      if (!point) return;
      const { x, y } = point.tooltipPosition();
      const prefix = index === latestIndex ? 'Latest' : 'Peak';
      drawRoundedLabel(chart.ctx, `${prefix} ${formatValue(values[index])}`, Math.min(Math.max(x, chart.chartArea.left + 42), chart.chartArea.right - 42), Math.max(y - 24, chart.chartArea.top + 12));
    });
  }
};

const doughnutCalloutLabelsPlugin = {
  id: 'aqaarDoughnutCalloutLabels',
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    const arcs = meta?.data || [];
    if (!arcs.length) return;
    const { ctx, data, chartArea } = chart;
    const centerX = (chartArea.left + chartArea.right) / 2;
    ctx.save();
    ctx.font = labelFont;
    ctx.textBaseline = 'middle';
    arcs.forEach((arc, index) => {
      const value = Number(data.datasets[0].data[index] || 0);
      if (!value) return;
      const props = arc.getProps(['startAngle', 'endAngle', 'outerRadius', 'x', 'y'], true);
      const angle = (props.startAngle + props.endAngle) / 2;
      const edgeX = props.x + Math.cos(angle) * (props.outerRadius + 2);
      const edgeY = props.y + Math.sin(angle) * (props.outerRadius + 2);
      const elbowX = props.x + Math.cos(angle) * (props.outerRadius + 18);
      const elbowY = props.y + Math.sin(angle) * (props.outerRadius + 18);
      const isRight = edgeX >= centerX;
      const labelX = isRight ? Math.min(elbowX + 34, chartArea.right - 6) : Math.max(elbowX - 34, chartArea.left + 6);
      const labelY = Math.min(Math.max(elbowY, chartArea.top + 12), chartArea.bottom - 12);
      const label = `${shortLabel(data.labels[index], 16)} ${formatValue(value)}`;
      ctx.strokeStyle = index === 0 ? ACCENT : 'rgba(255,255,255,0.38)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(edgeX, edgeY);
      ctx.lineTo(elbowX, labelY);
      ctx.lineTo(labelX + (isRight ? -5 : 5), labelY);
      ctx.stroke();
      ctx.fillStyle = index === 0 ? ACCENT : MUTED_LABEL;
      ctx.textAlign = isRight ? 'left' : 'right';
      ctx.fillText(label, labelX, labelY);
    });
    ctx.restore();
  }
};

/**
 * Bar chart — Leads by Intent
 */
export function renderIntentBarChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const intents = data?.intents || { buy: 0, rent: 0, invest: 0, commercial: 0 };
  const labels = Object.keys(intents).map(k => k.charAt(0).toUpperCase() + k.slice(1));
  const values = Object.values(intents);

  const chart = new Chart(ctx, {
    type: 'bar',
    plugins: [valueLabelsPlugin],
    data: {
      labels,
      datasets: [{
        label: 'Leads',
        data: values,
        backgroundColor: [ACCENT_DIM, 'rgba(200,230,60,0.25)', 'rgba(200,230,60,0.35)', ACCENT_DIM],
        borderColor: ACCENT,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        aqaarValueLabels: { includeLabel: false },
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
          callbacks: {
            label: (ctx) => ` ${ctx.parsed.y} leads`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont },
          border: { color: 'transparent' },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont, precision: 0 },
          border: { color: 'transparent' },
          beginAtZero: true,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

/**
 * Doughnut chart — Project Popularity
 */
export function renderProjectDoughnutChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const projects = data?.top_projects || data?.projects || [];
  const limited = prepareTopItems(projects, 6);
  const labels = limited.map(p => p.name);
  const values = limited.map(p => p.value);

  const colors = [
    ACCENT,
    'rgba(200,230,60,0.7)',
    'rgba(200,230,60,0.5)',
    'rgba(200,230,60,0.35)',
    'rgba(200,230,60,0.2)',
    'rgba(255,255,255,0.1)',
    'rgba(255,255,255,0.06)',
  ];

  const chart = new Chart(ctx, {
    type: 'doughnut',
    plugins: [doughnutCalloutLabelsPlugin],
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#161616',
        borderWidth: 3,
        hoverBorderColor: ACCENT,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      layout: { padding: { top: 24, right: 44, bottom: 24, left: 44 } },
      plugins: {
        aqaarDoughnutCalloutLabels: {},
        legend: {
          display: false,
          position: 'right',
          labels: {
            color: '#b8b8b8',
            font: baseFont,
            boxWidth: 12,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

/**
 * Line chart — Chat sessions / activity over time
 */
export function renderActivityLineChart(canvasId, data) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  const sessions = data?.sessions_by_day || data?.activity || [];
  const labels = sessions.length > 0
    ? sessions.map(s => s.date || s.day || 'Seed')
    : ['Seed'];
  const values = sessions.length > 0
    ? sessions.map(s => s.count || s.sessions)
    : [0];

  const chart = new Chart(ctx, {
    type: 'line',
    plugins: [linePointLabelsPlugin],
    data: {
      labels,
      datasets: [{
        label: 'Chat Sessions',
        data: values,
        borderColor: ACCENT,
        backgroundColor: 'rgba(200,230,60,0.07)',
        borderWidth: 2,
        pointBackgroundColor: ACCENT,
        pointBorderColor: '#161616',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        aqaarLinePointLabels: {},
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c1c1c',
          borderColor: ACCENT,
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#b8b8b8',
          titleFont: baseFont,
          bodyFont: baseFont,
        },
      },
      scales: {
        x: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont },
          border: { color: 'transparent' },
        },
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: TEXT_COLOR, font: baseFont, precision: 0 },
          border: { color: 'transparent' },
          beginAtZero: true,
        },
      },
    },
  });

  chartInstances.set(canvasId, chart);
  return chart;
}

export function destroyAllCharts() {
  chartInstances.forEach(c => c.destroy());
  chartInstances.clear();
}
