import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client'; 
import { Metric, PerformanceBox, PerformanceDiagnostics, PerformanceProgress } from './utils/performance-utils';
import { Button, Card, Divider } from '@tremor/react';

const socket = io('http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070'); 

function Performance() {
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const [intervalDuration, setIntervalDuration] = useState(30000);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDevice, setDevice] = useState(false);
    const [metrics, setMetrics] = useState(null);

    const fetchPerformance = async (url) => {
        try {
            const response = await fetch(`http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070/report/${encodeURIComponent(url)}`);
            const result = await response.json();
            if (result && result.performanceMetrics) {
                setMetrics({
                    mobile: result.performanceMetrics.mobile,
                    desktop: result.performanceMetrics.desktop
                });
            }
        } catch (error) {
            console.error('Error fetching the report:', error);
        }
    };

    useEffect(() => {
        // Fetch initial data
        fetchPerformance(urls[0]);

        // Set up Socket.IO event listeners
        socket.on('reportFetched', ({ url, performanceMetrics }) => {
            if (urls.includes(url)) {
                setMetrics(performanceMetrics);
            }
        });

        socket.on('reportGenerated', ({ url, report }) => {
            if (urls.includes(url)) {
                fetchPerformance(url); 
            }
        });

        // Clean up Socket.IO event listeners
        return () => {
            socket.off('reportFetched');
            socket.off('reportGenerated');
        };
    }, [urls]);

    useEffect(() => {
        const startPolling = async () => {
            await fetchPerformance(urls[0]);
            intervalRef.current = setTimeout(startPolling, intervalDuration);
        };

        startPolling();

        return () => {
            clearTimeout(intervalRef.current);
        };
    }, [intervalDuration, urls]);

    const changeDevice = () => {
        setDevice((prevState) => !prevState);
    };

    const toggleExpandAll = () => {
        setIsExpanded((prevState) => !prevState);
    };

    if (!metrics) {
        return <div>Loading...</div>;
    }

    const currentMetrics = isDevice ? metrics.desktop : metrics.mobile;

    return (
        <main className="font-serif">
            <Sidebar alerts={0} url={urls} />
            <div className="p-4 sm:ml-64 mt-0">
            <div className='flex w-full gap-2 text-mono'>
    <div className='flex-2 gap-2'>
        <h3 className="text-center text-tremor-title font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">Performance Metrics</h3>
        <div className='flex flex-col gap-2'>
            <div className="flex flex-grow gap-2 mb-2">
                <div className="flex-1 flex items-stretch">
                    <Card className="flex-1 flex items-stretch">
                        <PerformanceBox
                            toggleDevice={changeDevice}
                            isDevice={isDevice}
                            score={Math.round(currentMetrics.totalPerformance)}
                        />
                    </Card>
                </div>
                <div className="flex-1 flex items-stretch">
                    <Card className="flex-1 flex items-stretch">
                        <PerformanceProgress
                            fcp={currentMetrics.fcp.value}
                            lcp={currentMetrics.lcp.value}
                            cls={currentMetrics.cls.value}
                            tbt={currentMetrics.tbt.value}
                            si={currentMetrics.si.value}
                        />
                    </Card>
                </div>
            </div>
        </div>

        <Card className='flex flex-col gap-2'>
            <div className='grid grid-cols-2 gap-2 items-stretch'>
                <div className='flex flex-col items-start'>
                    <h3 className='text-base mt-2 font-bold'>METRICS</h3>
                    <Divider className='mt-auto mb-2' />
                </div>
                <div className='flex flex-col justify-between items-end'>
                    <Button variant="secondary" className='text-base m-0 border-none' onClick={toggleExpandAll}>{isExpanded ? 'Collapse' : 'Expand'}</Button>
                    <Divider className='mt-auto mb-2' />
                </div>
            </div>

            <div className='grid grid-cols-2 grid-flow-row gap-2 items-stretch'>
                <Metric
                    score={currentMetrics.fcp.value}
                    value={(currentMetrics.fcp.time/1000).toFixed(2)}
                    title={'First Contentful Paint'}
                    param={'First Contentful Paint marks the time at which the first text or image is painted.'}
                    link={'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/?utm_source=lighthouse&utm_medium=node'}
                    isExpanded={isExpanded}
                />
                <Metric
                    score={currentMetrics.lcp.value}
                    value={(currentMetrics.lcp.time/1000).toFixed(2)}
                    title={'Largest Contentful Paint'}
                    param={'Largest Contentful Paint marks the time at which the largest text or image is painted.'}
                    link={'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/?utm_source=lighthouse&utm_medium=node'}
                    isExpanded={isExpanded}
                />
                <Metric
                    score={currentMetrics.tbt.value}
                    value={(currentMetrics.tbt.time/1000).toFixed(2)}
                    title={'Total Blocking Time'}
                    param={'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds.'}
                    link={'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/?utm_source=lighthouse&utm_medium=node'}
                    isExpanded={isExpanded}
                />
                <Metric
                    score={currentMetrics.cls.value}
                    value={currentMetrics.cls.time}
                    title={'Cumulative Layout Shift'}
                    param={'Cumulative Layout Shift measures the movement of visible elements within the viewport.'}
                    link={'https://web.dev/articles/cls?utm_source=lighthouse&utm_medium=node'}
                    isExpanded={isExpanded}
                />
                <Metric
                    score={currentMetrics.si.value}
                    value={(currentMetrics.si.time/1000).toFixed(2)}
                    title={'Speed Index'}
                    param={'Speed Index shows how quickly the contents of a page are visibly populated.'}
                    link={'https://developer.chrome.com/docs/lighthouse/performance/speed-index/?utm_source=lighthouse&utm_medium=node'}
                    isExpanded={isExpanded}
                />
            </div>
        </Card>
    </div>
    <div className='flex-1 gap-2'>
        <h3 className="text-center text-tremor-title font-bold text-tremor-content-strong dark:text-dark-tremor-content-strong">Diagnostics</h3>
        <PerformanceDiagnostics diagnostic={currentMetrics.diagnostics} />
    </div>
</div>

            </div>
        </main>
    );
}

export default Performance;
