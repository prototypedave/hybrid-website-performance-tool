import React, { useEffect, useRef, memo } from 'react';
import Chart from 'chart.js/auto';
import { getRelativePosition } from 'chart.js/helpers';

export const Utils = {
  months({ count = 12 }) {
    const now = new Date();
    const months = [];
    for (let i = 0; i < count; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(month.toLocaleString('default', { month: 'long' })); // E.g., 'January'
    }
    return months;
  },
};

const plugin = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const lightModeColor = options.lightColor || '#ffffff'; 
    const darkModeColor = options.darkColor || '#1f2937';  
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = isDarkMode ? darkModeColor : lightModeColor;
    ctx.fillRect(0, 0, chart.width, chart.height);

    ctx.restore();
  },
};


export const Donut = memo(({ value, col, score }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      const chart = new Chart(ctx, {
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
              lightColor: '#ffffff', 
              darkColor: '#1f2937',  
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
              const text = score.toFixed(0)+'%' || '';
              const textX = width / 2;
              const textY = height / 2;
              ctx.fillText(text, textX, textY);
              ctx.save();
            },
          },
        ],
      });

      return () => {
        chart.destroy();
      };
    }
  }, [value, score]);

  return <canvas ref={chartRef}></canvas>;
});

// area chart for page Load Time
export const Area = memo(({ value, label, title }) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d'); 
      const data = {
        labels: label,
        datasets: [
          {
            label: title,
            data: value,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: true,
          },  
      ],
        
      };

      const chart = new Chart(ctx, {
        type: 'line',
        data: data,
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
      return () => {
        chart.destroy();
      };
    }
  }, [value, label]); 

  return <canvas ref={chartRef}></canvas>; 
});

// Bar chart
export const Bar = memo(({value, label, title }) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d'); 
      const data = {
        labels: label,
        datasets: [
          {
            label: title,
            data: value,
          },
        ],
      };

      const chart = new Chart(ctx, {
        type: 'bar',
        data: data,
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
      return () => {
        chart.destroy();
      };
    }
  }, [value, label]); 

  return <canvas ref={chartRef}></canvas>; 
});

// Double line chart
export const Line = memo(({value1, value2, label, label1, label2}) => {
  const chartRef = useRef(null); 
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d'); 
      const data = {
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
      };

      const chart = new Chart(ctx, {
        type: 'line',
        data: data,
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
      return () => {
        chart.destroy();
      };
    }
  }, [value1, value2, label]); 

  return <canvas ref={chartRef}></canvas>; 
});
