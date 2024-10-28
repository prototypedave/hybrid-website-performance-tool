import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import axios from 'axios';
import { Card } from '@tremor/react';
import io from 'socket.io-client'; 
import { 
    Heatmap, 
    LineChart, 
    ListItems, 
    PerformanceChart, 
    SecurityChart, 
    Waterfall,
    getProgressColor,
    getValue 
} from './utils/dashboard-util.js';

function Dashboard() {
  const location = useLocation();
  const urls = useMemo(() => location.state?.urls || [], [location.state?.urls]);
  const intervalRef = useRef(null);
  const [intervalDuration, setIntervalDuration] = useState(30000);
  const [performance, setPerformanceData] = useState([]);
  const [performanceValue, setPerformanceValue] = useState([]);
  const [performanceMetric, setPerformanceMetric] = useState(null);
  const [score, setScore] = useState(0);
  const [colorpal, setFills] = useState([]);
  const [ping, setPing] = useState([]);
  const [pingMetric, setPingMetric] = useState(0);
  const [traceLatency, setTraceLatency] = useState([]);
  const [riskData, setRiskCount] = useState([]);
  const [count, setCount] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Set up WebSocket connection
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io('http://localhost:8080'); 
    
    // Listen for WebSocket events
    socket.current.on('reportGenerated', (data) => {
      console.log('Report Generated:', data);
      // Handle report generated data
    });

    socket.current.on('reportFetched', (data) => {
      console.log('Report Fetched:', data);
      // Handle fetched report data
    });

    socket.current.on('pingReportFetched', (data) => {
      console.log('Ping Report Fetched:', data);
      if (data?.pingMetrics) {
        const formattedTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        setPingMetric(data.pingMetrics.time);
        setPing((prevState) => [...prevState.slice(-9), { time: formattedTime, latency: data.pingMetrics.time }]);
        setDataLoaded(true);
      }
    });

    socket.current.on('traceReportFetched', (data) => {
      console.log('Trace Report Fetched:', data);
      if (data?.tracerouteData) {
        const formattedTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        updateTraceLatency(data.tracerouteData.map((hop) => ({ hopNumber: hop.hopNumber, latency: hop.latency, time: formattedTime })));
        setDataLoaded(true);
      }
    });

    socket.current.on('SSLReportFetched', (data) => {
      console.log('SSL Report Fetched:', data);
      // Handle SSL report data
    });

    socket.current.on('securityReportFetched', (data) => {
      console.log('Security Report Fetched:', data);
      if (data?.alerts) {
        const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const riskCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };
        data.alerts.forEach((alert) => {
          riskCounts[alert.risk]++;
        });
        setCount(riskCounts);
        setRiskCount((prevState) => [
          ...prevState.slice(-3),
          {
            time: formattedTime,
            critical: riskCounts.High,
            medium: riskCounts.Medium,
            low: riskCounts.Low,
            informational: riskCounts.Informational,
          },
        ]);
      }
    });

    socket.current.on('aiReportGenerated', (data) => {
      console.log('AI Report Generated:', data);
      setMetrics(data);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const fetchData = useCallback(async (url, endpoint, callback) => {
    try {
      const response = await axios.get(`http://localhost:8080/${endpoint}/${encodeURIComponent(url)}`); // Update axios URL
      callback(response.data);
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  }, []);

  const fetchPerformance = async (url) => {
    await fetchData(url, 'report', (result) => {
      if (result?.performanceMetrics) {
        const { mobile, desktop } = result.performanceMetrics;
        const averages = ['cls', 'tbt', 'si', 'lcp', 'fcp'].map((metric) => ({
          metric,
          value: (mobile[metric].value + desktop[metric].value) / 2,
          time: (mobile[metric].time + desktop[metric].time) / 2
        }));

        setFills(averages.map((avg) => getProgressColor(avg.value)));

        setPerformanceData(
          averages.map(({ metric, value }) => ({
            metric: metric.toUpperCase(),
            score: Math.round(getValue(value, metric === 'tbt' ? 30 : 25)),
            legend: `${Math.round(value)}% ${metric.toUpperCase()}`
          }))
        );

        const totalPerformance = (mobile.totalPerformance + desktop.totalPerformance) / 2;
        setScore(Math.round(totalPerformance));

        setPerformanceValue(
          averages.map(({ metric, time }) => ({
            metric: metric.toUpperCase(),
            score: Math.round(time)
          }))
        );

        setPerformanceMetric(Object.fromEntries(averages.map(({ metric, value }) => [metric.toUpperCase(), value])));
        setDataLoaded(true);
      }
    });
  };

  const fetchPing = async (url) => {
    await fetchData(url, 'ping', (result) => {
      if (result?.pingMetrics) {
        const formattedTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        setPingMetric(result.pingMetrics.time);
        setPing((prevState) => [...prevState.slice(-9), { time: formattedTime, latency: result.pingMetrics.time }]);
        setDataLoaded(true);
      }
    });
  };

  const updateTraceLatency = (newData) => {
    setTraceLatency((prevData) => {
      const hopMap = new Map();
      prevData.forEach((entry) => {
        if (!hopMap.has(entry.hop)) hopMap.set(entry.hop, []);
        hopMap.get(entry.hop).push(entry);
      });

      newData.forEach(({ hopNumber, latency, time }) => {
        const hopKey = `hop ${hopNumber}`;
        if (!hopMap.has(hopKey)) hopMap.set(hopKey, []);
        hopMap.get(hopKey).push({ hop: hopKey, time, latency });
        if (hopMap.get(hopKey).length > 10) hopMap.get(hopKey).shift();
      });

      return Array.from(hopMap.values()).flat();
    });
  };

  const fetchTrace = async (url) => {
    await fetchData(url, 'trace', (result) => {
      if (result?.tracerouteData) {
        const formattedTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        updateTraceLatency(result.tracerouteData.map((hop) => ({ hopNumber: hop.hopNumber, latency: hop.latency, time: formattedTime })));
        setDataLoaded(true);
      }
    });
  };

  const fetchSecurity = async (url) => {
    await fetchData(url, 'security', (result) => {
      if (result?.alerts) {
        const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const riskCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };

        result.alerts.forEach((alert) => {
          riskCounts[alert.risk]++;
        });

        setCount(riskCounts);

        setRiskCount((prevState) => [
          ...prevState.slice(-3),
          {
            time: formattedTime,
            critical: riskCounts.High,
            medium: riskCounts.Medium,
            low: riskCounts.Low,
            informational: riskCounts.Informational,
          },
        ]);
      }
    });
  };

  const analyze = async () => {
    if (performanceMetric && pingMetric && count) {
      const dataMetric = [performanceMetric, pingMetric, count];
      try {
        const serializedMetrics = encodeURIComponent(JSON.stringify(dataMetric));
        const response = await axios.get(`http://localhost:8080/ai/${serializedMetrics}`); // Update axios URL
        setMetrics(response.data);
      } catch (error) {
        console.error('Error fetching the AI report:', error);
      }
    } else {
      console.warn('Metrics are not ready for analysis');
    }
  };

  useEffect(() => {
    const startPolling = async () => {
      if (urls.length > 0) {
        await fetchPerformance(urls[0]);
        await fetchPing(urls[0]);
        await fetchTrace(urls[0]);
        await fetchSecurity(urls[0]);
        await analyze();

        // Set polling interval based on data completeness
        const newInterval = dataLoaded ? 600000 : 30000; // 10 minutes or 30 seconds
        setIntervalDuration(newInterval);

        intervalRef.current = setTimeout(startPolling, intervalDuration);
      }
    };

    startPolling();

    return () => clearTimeout(intervalRef.current);
  }, [intervalDuration, urls, fetchData, dataLoaded]);

  const sendReports = async (urls) => {
    try {
      const response = await axios.post('http://localhost:8080/report', urls.map((url) => ({ url }))); // Update axios URL
      console.log('Sent URLs and received data:', response.data);
    } catch (error) {
      console.error('Error sending reports:', error);
      alert('Something went wrong while sending our request: ' + error.message);
    }
  };

  useEffect(() => {
    if (urls.length > 0) sendReports(urls);
  }, [urls]);

  return (
    <main className="font-serif bg-slate-100 dashboard-container">
      <Sidebar alerts={0} url={urls} />
      <div className="p-4 sm:ml-64 mt-0 y-space-2">
        <div className="flex grid-cols-3 gap-2 text-mono">
          <div className="col-span-1">
            <Card className="h-auto">
              <h3 className="mt-0 mb-0 text-center">Performance Score</h3>
              <PerformanceChart data={performance} colorpal={colorpal} score={score} />
            </Card>
            <Card className="h-auto">
              <h3 className="text-center">Performance Metric Score</h3>
              <Waterfall data={performanceValue} />
            </Card>
          </div>
          <div className="col-span-1">
            <Card className="h-auto">
              <h3 className="text-center">Ping Latency</h3>
              <LineChart data={ping} />
            </Card>
            <Card className="h-auto">
              <h3 className="text-center">Hop Latency</h3>
              <Heatmap data={traceLatency} />
            </Card>
          </div>
          <div className="col-span-1">
            <Card className="h-auto">
              <h3 className="text-center">Security Threat Count</h3>
              <SecurityChart data={riskData} />
            </Card>
            <Card className="h-auto">
              <h3 className="text-center">AI Alerts</h3>
              <ListItems metrics={metrics} />
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;