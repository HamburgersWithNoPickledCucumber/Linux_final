import { useRef, useEffect, useCallback, useState } from 'react';
import { useServer } from '../../context/ServerContext';

const SERIES_COLORS = [
  { stroke: 'rgba(0, 184, 148, 1)', fill: 'rgba(0, 184, 148, 0.15)' },
  { stroke: 'rgba(74, 158, 255, 1)', fill: 'rgba(74, 158, 255, 0.15)' },
  { stroke: 'rgba(167, 139, 250, 1)', fill: 'rgba(167, 139, 250, 0.15)' },
  { stroke: 'rgba(255, 177, 66, 1)', fill: 'rgba(255, 177, 66, 0.15)' },
];

export default function MultiLineChart({
  moduleName,
  units = '',
  refreshRate = 1000,
  delay = 1000,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRefs = useRef([]);
  const [metricData, setMetricData] = useState([]);
  const initializedRef = useRef(false);

  const { fetchOnce, startPolling, stopPolling } = useServer();

  const handleInit = useCallback(
    (serverResponseData) => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const canvas = canvasRef.current;
      const SmoothieChart = window.SmoothieChart;
      const TimeSeries = window.TimeSeries;
      if (!canvas || !SmoothieChart || !TimeSeries) return;

      const chart = new SmoothieChart({
        borderVisible: false,
        sharpLines: true,
        grid: {
          fillStyle: '#161820',
          strokeStyle: 'rgba(37,40,48,0.5)',
          sharpLines: true,
          borderVisible: false,
        },
        labels: {
          fontSize: 10,
          precision: 0,
          fillStyle: '#8b8fa3',
        },
        maxValue: 100,
        minValue: 0,
      });

      const keys = Object.keys(serverResponseData);
      const seriesArr = [];
      keys.forEach((key, i) => {
        const s = new TimeSeries();
        chart.addTimeSeries(s, {
          strokeStyle: SERIES_COLORS[i % SERIES_COLORS.length].stroke,
          fillStyle: SERIES_COLORS[i % SERIES_COLORS.length].fill,
          lineWidth: 2,
        });
        seriesArr.push(s);
      });

      chart.streamTo(canvas, delay);
      chartRef.current = chart;
      seriesRefs.current = seriesArr;
    },
    [delay]
  );

  const handleUpdate = useCallback(
    (serverResponseData) => {
      if (!serverResponseData) return;

      const chart = chartRef.current;
      const seriesArr = seriesRefs.current;
      if (!chart || seriesArr.length === 0) return;

      const keys = Object.keys(serverResponseData);
      const now = Date.now();
      let maxAvg = 100;

      keys.forEach((key, i) => {
        const val = serverResponseData[key];
        if (seriesArr[i]) {
          seriesArr[i].append(now, val);
        }
        maxAvg = Math.max(maxAvg, val);
      });

      const len = parseInt(Math.log(maxAvg) / Math.log(10));
      const div = Math.pow(10, len);
      chart.options.maxValue = Math.ceil(maxAvg / div) * div;

      setMetricData(
        keys.map((key, i) => ({
          name: key,
          color: SERIES_COLORS[i % SERIES_COLORS.length].stroke,
          value: serverResponseData[key] + ' ' + units,
        }))
      );
    },
    [units]
  );

  useEffect(() => {
    initializedRef.current = false;
    seriesRefs.current = [];

    fetchOnce(moduleName, (data) => {
      handleInit(data);
      handleUpdate(data);
    });

    const pollingId = setInterval(() => {
      fetchOnce(moduleName, handleUpdate);
    }, refreshRate);

    return () => {
      clearInterval(pollingId);
      stopPolling(moduleName);
      if (chartRef.current) {
        chartRef.current.stop();
      }
    };
  }, [moduleName, refreshRate]);

  return (
    <div className="chartContainer">
      <canvas ref={canvasRef} style={{ width: '100%', height: '180px' }} />
      {metricData.length > 0 && (
        <div className="chartMetrics">
          {metricData.map((m, i) => (
            <div key={i} className="metric">
              <span
                className="metricDot"
                style={{ backgroundColor: m.color }}
              />
              <span className="metricName">{m.name}:</span>
              <span className="metricValue">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
