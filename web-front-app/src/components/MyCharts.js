import React, { useEffect, useRef, memo } from 'react';
import Chart from 'chart.js/auto';
import { getRelativePosition } from 'chart.js/helpers';

const transparetize = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDarkMode) {
    return ('rgb(0, 197, 255)').replace('rgb', 'rgba').replace(')', `, ${0.1})`);
  }
  return 'rgba(0, 0, 0, 0.1)';
}

// Custom plugin for background of charts
const plugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const lightModeColor = options.lightColor || '#ffffff'; 
    const darkModeColor = options.darkColor || '#3B82F6';  
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = isDarkMode ? darkModeColor : lightModeColor;
    ctx.fillRect(0, 0, chart.width, chart.height);

    ctx.restore();
  },
};

// Doughnout chart
export const Donut = memo(({ value, col, score }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chart;
    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            datasets: [
              {
                data: value,
                backgroundColor: col,
                hoverOffset: 4,
              },
            ],
          },
          options: {
            animation: true,
            plugins: {
              customCanvasBackgroundColor: {
                lightColor: '#FFFFFF',
                darkColor: '#1F2937',
              },
              tooltip: {
                enabled: true,
              },
            },
            onClick: (event) => {
              const position = getRelativePosition(event, chart);
              console.log('Click position relative to chart:', position);
            },
          },
          plugins: [
            plugin,
            {
              id: 'center-text',
              beforeDraw: (chart) => {
                const { width } = chart;
                const { height } = chart;
                const ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 100).toFixed(2);
                ctx.font = `${fontSize}em sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                const text = score.toFixed(0) + '%' || '';
                const textX = width / 2;
                const textY = height / 2;
                const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                ctx.fillStyle = isDarkMode ? '#9CA3AF' : '#4B5563';  
                ctx.fillText(text, textX, textY);
                ctx.save();
              },
            },
          ],
        });
      }
    };
    createChart();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (chart) {
        chart.destroy(); 
        createChart(); 
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      if (chart) {
        chart.destroy();
      }
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [value, col, score]);

  return <canvas ref={chartRef}></canvas>;
});

// Area chart for page Load Time
export const Area = memo(({ value, label, title }) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    let chart;
    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d'); 
        chart = new Chart(ctx, {
          type: 'line',
          data: {
              labels: label,
              datasets: [
                {
                  label: title,
                  data: value,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1,
                  fill: true,
                  backgroundColor: transparetize(),
                },  
              ],    
            },
          options: {
            plugins: {
              customCanvasBackgroundColor: {
                lightColor: '#ffffff', 
                darkColor: '#1f2937',  
              },
            },
            onClick: (event) => {
              const position = getRelativePosition(event, chart);
              console.log('Click position relative to chart:', position);
            },
          },
          plugins: [plugin],
        });
      }
    };
    createChart();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (chart) {
        chart.destroy(); 
        createChart(); 
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      if (chart) {
        chart.destroy();
      }
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [value, label]); 

  return <canvas ref={chartRef}></canvas>; 
});

export const SmallArea = memo(({ value, label, title }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chart;
    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: label,
            datasets: [
              {
                label: title,
                data: value,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              customCanvasBackgroundColor: {
                lightColor: '#ffffff',
                darkColor: '#1f2937',
              },
            },
          },
          plugins: [plugin],
        });
      }
    };

    createChart();

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.style.height = window.innerWidth < 640 ? '300px' : '500px';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (chart) {
        chart.destroy();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [value, label]);

  return (
    <div className="p-4 sm:p-6 w-full max-w-lg mx-auto">
      <canvas ref={chartRef} className="rounded-lg shadow-lg"></canvas>
    </div>
  );
});


// Bar chart
export const Bar = memo(({value, label, title }) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    let chart;
    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d'); 
        chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: label,
            datasets: [
              {
                label: title,
                data: value,
              },
            ],
          },
          options: {
            plugins: {
              customCanvasBackgroundColor: {
                lightColor: '#ffffff', 
                darkColor: '#1f2937',  
              },
            },
            onClick: (event) => {
              const position = getRelativePosition(event, chart);
              console.log('Click position relative to chart:', position);
            },
          },
          plugins: [plugin],
        });
      }
    };
    createChart();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (chart) {
        chart.destroy(); 
        createChart(); 
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      if (chart) {
        chart.destroy();
      }
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [value, label]); 

  return <canvas ref={chartRef}></canvas>; 
});

// Double line chart
export const Line = memo(({value1, value2, label, label1, label2}) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    let chart;
    const createChart = () => {
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d'); 
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: label,
            datasets: [
              {
                label: label1,
                data: value1,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
              },
              {
                label: label2,
                data: value2,
                fill: false,
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
              },  
            ],  
          },
          options: {
            plugins: {
              customCanvasBackgroundColor: {
                lightColor: '#ffffff', 
                darkColor: '#1f2937',  
              },
            },
            onClick: (event) => {
              const position = getRelativePosition(event, chart);
              console.log('Click position relative to chart:', position);
            },
          },
          plugins: [plugin],
        });
      }
    };
    createChart();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (chart) {
        chart.destroy(); 
        createChart(); 
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => {
      if (chart) {
        chart.destroy();
      }
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [value1, value2, label]); 

  return <canvas ref={chartRef}></canvas>; 
});
