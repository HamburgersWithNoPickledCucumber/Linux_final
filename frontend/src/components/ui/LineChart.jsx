import { useRef, useEffect, useCallback, useState } from 'react';
import { useServer } from '../../context/ServerContext';

export default function LineChart({
  moduleName,
  maxValue,
  minValue = 0,
  refreshRate = 1000,
  getDisplayValue,
  metrics = [],
  color = '0,255,0',
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [metricData, setMetricData] = useState([]);
  const [empty, setEmpty] = useState(false);

  const { fetchOnce, startPolling, stopPolling } = useServer();

  const handleData = useCallback(
    (serverResponseData) => {
      if (!serverResponseData || (Array.isArray(serverResponseData) && serverResponseData.length === 0)) {
        setEmpty(true);
        return;
      }

      const displayValue = getDisplayValue
        ? getDisplayValue(serverResponseData)
        : serverResponseData;

      const now = Date.now();

      if (seriesRef.current) {
        seriesRef.current.append(now, displayValue);

        const chart = chartRef.current;
        if (chart && chart.seriesSet && chart.seriesSet[0]) {
          const ratio = maxValue ? displayValue / maxValue : 0;
          if (ratio > 0.75) {
            chart.seriesSet[0].options.strokeStyle = 'rgba(255, 89, 0, 1)';
            chart.seriesSet[0].options.fillStyle = 'rgba(255, 89, 0, 0.2)';
          } else if (ratio > 0.33) {
            chart.seriesSet[0].options.strokeStyle = 'rgba(255, 238, 0, 1)';
            chart.seriesSet[0].options.fillStyle = 'rgba(255, 238, 0, 0.2)';
          } else {
            chart.seriesSet[0].options.strokeStyle = `rgba(${color}, 1)`;
            chart.seriesSet[0].options.fillStyle = `rgba(${color}, 0.2)`;
          }
        }
      }

      if (metrics.length > 0) {
        setMetricData(
          metrics.map((m) => ({
            name: m.name,
            value: m.generate(serverResponseData),
          }))
        );
      }
    },
    [getDisplayValue, maxValue, metrics, color]
  );

  useEffect(() => {
    if (!maxValue && maxValue !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const SmoothieChart = window.SmoothieChart;
    const TimeSeries = window.TimeSeries;
    if (!SmoothieChart || !TimeSeries) return;

    const chart = new SmoothieChart({
      borderVisible: false,
      sharpLines: true,
      grid: {
        fillStyle: '#161820',
        strokeStyle: 'rgba(37,40,48,0.5)',
        sharpLines: true,
        millisPerLine: 3000,
        borderVisible: false,
      },
      labels: {
        fontSize: 10,
        precision: 0,
        fillStyle: '#8b8fa3',
      },
      maxValue: parseInt(maxValue),
      minValue: parseInt(minValue),
    });

    const series = new TimeSeries();
    chart.addTimeSeries(series, {
      strokeStyle: `rgba(${color}, 1)`,
      fillStyle: `rgba(${color}, 0.2)`,
      lineWidth: 2,
    });

    chart.streamTo(canvas, 1000);

    chartRef.current = chart;
    seriesRef.current = series;

    fetchOnce(moduleName, handleData);
    startPolling(moduleName, handleData, refreshRate);

    return () => {
      stopPolling(moduleName);
      chart.stop();
    };
  }, [moduleName, maxValue, refreshRate]);

  const metricElements = metricData.map((m, i) => (
    <div key={i} className="metric">
      <span className="metricName">{m.name}:</span>
      <span className="metricValue">{m.value}</span>
    </div>
  ));

  if (empty) {
    return (
      <div className="chartContainer">
        <div className="chartEmpty">No data available</div>
      </div>
    );
  }

  return (
    <div className="chartContainer">
      <canvas ref={canvasRef} style={{ width: '100%', height: '180px' }} />
      {metricElements.length > 0 && <div className="chartMetrics">{metricElements}</div>}
    </div>
  );
}
