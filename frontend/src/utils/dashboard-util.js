import React, { useState, useEffect } from 'react';
import { AgCharts } from "ag-charts-react";
import "ag-charts-enterprise";
import { Card, Badge } from '@tremor/react';

export const getProgressColor = (value) => {
    if (value > 90) {
        return "green";
    } else if (value > 85) {
        return "yellow";
    } else if (value > 70) {
        return "orange";
    }
    else {
        return "red";
    }
};

export const getValue = (percent, max) => {
    return (percent / 100 * max);
};

export const PerformanceChart = React.memo(({ data, score, colorpal }) => {
    const [options, setOptions] = useState({
        data: data,
        series: [
            {
                type: "donut",
                calloutLabelKey: "metric",
                legendItemKey: "legend",
                angleKey: "score",
                innerRadiusRatio: 0.7,
                fills: colorpal,
                innerLabels: [
                    {
                        text: `${score}%`,
                        fontSize: 10,
                        color: getProgressColor(score),
                    },
                ],
            },
        ],
    });

    useEffect(() => {
        setOptions(prevOptions => ({
            ...prevOptions,
            data: data,
            series: [{
                ...prevOptions.series[0],
                fills: colorpal,
                innerLabels: [{
                    ...prevOptions.series[0].innerLabels[0],
                    text: `${score}%`,
                    color: getProgressColor(score),
                }],
            }],
        }));
    }, [data, score, colorpal]);

    return <AgCharts options={options} style={{height: '35vh'}}/>;
});

export const Waterfall = React.memo(({data}) => {
    const [options, setOptions] = useState({
        data: data,
        series: [
            {
                type: "waterfall",
                xKey: "metric",
                xName: "Metrics",
                yKey: "score",
                yName: "delay",
                item: {
                    score: {
                      fill: "#4A90E2",
                      stroke: "#4A90E2",
                    },
                }
            },
        ],

        axes: [
            {
                type: 'category',
                position: 'bottom',
            },
            {
                type: 'number',
                position: 'left',
                label: {
                    formatter: (params) => `${params.value} ms`, 
                },  
            },
        ],
        legend: {
            enabled: false, 
        },
    });

    useEffect(() => {
        setOptions(prevOptions => ({
            ...prevOptions,
            data: data, 
        }));
    }, [data]);

    return <AgCharts options={options} style={{height: '35vh'}}/>;
});

export const LineChart = React.memo(({ data }) => {
    const [options, setOptions] = useState({
        series: [
            {
                data: data,
                xKey: "time",
                yKey: "latency",
                yName: "Latency",
                interpolation: { type: "smooth" },
            }, 
        ],
        axes: [
            {
                type: "category",
                position: "bottom",
            },
            {
                type: "number",
                position: "left",
                label: {
                    formatter: (params) => `${params.value} ms`, 
                },
                tick: {
                    count: 4,  
                },
            },
        ],
    });

    useEffect(() => {
        setOptions(prevOptions => ({
            ...prevOptions,
            series: [{
                ...prevOptions.series[0],
                data: data,  
            }],
        }));
    }, [data]);

    return <AgCharts options={options} style={{height: '35vh'}} />;
});

export const Heatmap = React.memo(({data}) => {
    const [options, setOptions] = useState({
        data: data,
        series: [
            {
                type: "heatmap",
                xKey: "time",
                xName: "Time",
                yKey: "hop",
                yName: "Hop Number",
                colorKey: "latency",
                colorName: "Latency",
                colorRange: ["#00FF00", "#FFFF00", "#FFA500", "#FF0000"], 
                colorDomain: [0, 50, 100, 200], 
            },
        ],
        gradientLegend: {
            enabled: false,
        },
        
    });

    useEffect(() => {
        setOptions(prevOptions => ({
            ...prevOptions,
            data: data, 
        }));
    }, [data]);

    return <AgCharts options={options} style={{height: '35vh'}}/>;
});

export const SecurityChart = React.memo(({data}) => {
    const [options, setOptions] = useState({
      data: data,
      series: [
        {
          type: "bar",
          xKey: "time",
          yKey: "critical",
          yName: "Critical",
          direction: "vertical",
        },
        {
          type: "bar",
          xKey: "time",
          yKey: "medium",
          yName: "Medium",
          direction: "vertical",
        },
        {
          type: "bar",
          xKey: "time",
          yKey: "low",
          yName: "Low",
          direction: "vertical",
        },
        {
          type: "bar",
          xKey: "time",
          yKey: "informational",
          yName: "Informational",
          direction: "vertical",
        },
      ],
    });
  
    useEffect(() => {
        setOptions(prevOptions => ({
            ...prevOptions,
            data: data, 
        }));
    }, [data]);

    return <AgCharts options={options} style={{height: '35vh'}}/>;
});

const categorizeMetrics = (metrics) => {
    let performanceMetrics = [];
    let pingState = "Perfect";
    let secState = "Secure";
  
    metrics.forEach((metric) => {
      if (metric.length === 3 && metric !== 'low') {
        performanceMetrics.push(metric);
      } else if (metric.includes('ping')) {
        pingState = 'Check Server Network';
      } else if (['low', 'medium', 'high', 'informational'].includes(metric)) {
        secState = metric;
      }
    });
  
    if (performanceMetrics.length === 0) {
      performanceMetrics.push('All good');
    }
  
    return { performanceMetrics, pingState, secState };
  };
  
export const ListItems = ({metrics}) => {
    const  { performanceMetrics, pingState, secState } = categorizeMetrics(metrics);
    
    return (
        <div className='h-52'>
            <Card className='mx-auto max-w-xs mb-1'>
                <div className='mx-auto max-w-xs mb-1'>
                <p className="text-tremor-label dark:text-dark-tremor-label whitespace-nowrap overflow-x-auto">
                    Performance:
                    {performanceMetrics.map((metric, index) => {
                        const formattedMetric = metric.length === 3
                            ? metric.toUpperCase() 
                            : metric.charAt(0).toUpperCase() + metric.slice(1).toLowerCase(); 

                        return (
                            <span key={index} className="ml-2 text-sm">
                                <Badge className='text-xs'>{formattedMetric}</Badge>
                            </span>
                        );
                    })}
                </p>

                    {performanceMetrics.every(metric => metric !== "All good") ? (
                        <p className="text-tremor-label dark:text-dark-tremor-label text-red-600">Check Performance Metric Page for fix!</p>
                        ) : (
                        performanceMetrics.map((metric, index) => (
                            <></>
                        ))
                    )}
                </div>
                <div className='mx-auto max-w-xs mb-1'>
                <p className="text-tremor-label dark:text-dark-tremor-label text-base whitespace-nowrap">
                    Network:
                    <span
                        className={`ml-2 text-sm ${pingState === null ? '!text-green-600' : '!text-red-600'} dark:text-dark-tremor-content`}
                    >
                        {pingState === null ? 'Perfect!' : pingState}
                    </span>
                </p>

                </div>
 
            </Card>
            <Card classname='mx-auto max-w-xs'>
                <p className="text-tremor-label dark:text-dark-tremor-label text-base">
                    Security Alert lvl: 
                    <span className="ml-2 text-tremor-content dark:text-dark-tremor-content text-sm">{secState}</span>
                </p>
                <p className="text-tremor-label dark:text-dark-tremor-label text-base text-red-600">{secState === 'Secure' ? '' : 'Check Security Analysis Page!'}</p>
            </Card>      
        </div>   
  )
};
  