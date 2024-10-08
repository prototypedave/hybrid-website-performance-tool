import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; 
import { Additional, IPMap, PingChart, PingTracker, SSL, Table } from './utils/network-utils.js';
import { Card } from '@tremor/react';

const socket = io('http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070'); 

function Network() {
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const [intervalDuration, setIntervalDuration] = useState(30000);
    const [pingMetrics, setPingMetrics] = useState(null);
    const [pingTracker, setPingTracker] = useState([]);
    const [pingLatency, setLatency] = useState([]);
    const [sslCertificate, setCertificate] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [traceData, setTrace] = useState([]);

    useEffect(() => {
        socket.on('reportGenerated', (data) => {
            console.log('Report Generated:', data);
            
        });

        socket.on('reportFetched', (data) => {
            console.log('Report Fetched:', data);
            
        });

        socket.on('pingReportFetched', (data) => {
            console.log('Ping Report Fetched:', data);
            
        });

        socket.on('traceReportFetched', (data) => {
            console.log('Trace Report Fetched:', data);
            
        });

        socket.on('coordinatesFetched', (data) => {
            console.log('Coordinates Fetched:', data);
            setCoordinates(data.filter(coord => coord[0] !== null && coord[1] !== null));
        });

        socket.on('SSLReportFetched', (data) => {
            console.log('SSL Report Fetched:', data);
            setCertificate(data);
        });

        socket.on('securityReportFetched', (data) => {
            console.log('Security Report Fetched:', data);
            
        });

        socket.on('reportDeleted', (data) => {
            console.log('Report Deleted:', data);
            
        });

        return () => {
            socket.off('reportGenerated');
            socket.off('reportFetched');
            socket.off('pingReportFetched');
            socket.off('traceReportFetched');
            socket.off('coordinatesFetched');
            socket.off('SSLReportFetched');
            socket.off('securityReportFetched');
            socket.off('reportDeleted');
        };
    }, []);

    useEffect(() => {
        const startPolling = async () => {
            await Promise.all([
                fetchPing(urls[0]),
                fetchSsl(urls[0]),
                fetchCoords(urls[0]),
                fetchTrace(urls[0])
            ]);

            intervalRef.current = setTimeout(startPolling, intervalDuration);
        };

        startPolling();

        return () => {
            clearTimeout(intervalRef.current);
        };
    }, [intervalDuration, urls]);

    const fetchData = async (url, endpoint, setStateCallback) => {
        try {
            const response = await axios.get(`http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070/${endpoint}/${encodeURIComponent(url)}`);
            setStateCallback(response.data);
        } catch (error) {
            console.error(`Error fetching the report from ${endpoint}:`, error);
        }
    };

    const fetchPing = async (url) => {
        await fetchData(url, 'ping', (result) => {
            if (result && result.pingMetrics) {
                setPingMetrics(result.pingMetrics);
                const color = result.pingMetrics.alive ? 'green' : 'gray';
                const alive = {
                    color: color,
                    tooltip: result.pingMetrics.alive ? 'alive' : 'dead',
                };
                setPingTracker((prevState) => [...prevState.slice(-19), alive]);
                const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                setLatency((prevState) => [...prevState.slice(-19), { time: currentTime, latency: result.pingMetrics.time }]);
            }
        });
    };

    const fetchSsl = async (url) => {
        await fetchData(url, 'SSL', setCertificate);
    };

    const fetchCoords = async (url) => {
        await fetchData(url, 'coord', (result) => {
            if (Array.isArray(result)) {
                setCoordinates(result.filter(coord => coord[0] !== null && coord[1] !== null));
            }
        });
    };

    const fetchTrace = async (url) => {
        await fetchData(url, 'trace', (result) => {
            if (result && result.tracerouteData) {
                setTrace(result.tracerouteData.map(hop => ({
                    hop: hop.hopNumber,
                    host: hop.ipAddress,
                    time: `${hop.latency}ms`
                })));
            }
        });
    };

    if (!pingMetrics) {
        return <div>Loading...</div>;
    }

    const aliveCount = pingTracker.filter(item => item.tooltip === 'alive').length;
    const totalCount = pingTracker.length;
    const percent = totalCount > 0 ? (aliveCount / totalCount) * 100 : 0;

    const getProgressColor = (value) => {
        if (value < 10) return "green";
        if (value < 50) return "yellow";
        if (value < 70) return "orange";
        return "red";
    };

    const color = getProgressColor(pingMetrics.packetLoss);

    return (
        <main className="font-serif">
            <Sidebar alerts={0} url={urls} />
            <div className="p-4 sm:ml-64 mt-0">
                <div className="grid grid-cols-3 gap-2 w-full text-mono">
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className="mt-0 mb-0 text-center font-semibold">Ping Network</h3>
                            <PingTracker data={pingTracker} percent={percent} url={urls[0]} />
                            <h3 className='text-tremor-label dark:text-dark-tremor-label mt-4'>Packet Loss</h3>
                            <p className='flex mb-2 text-2xl font-semibold' style={{ color }}>{pingMetrics.packetLoss}%</p>
                        </Card>
                        <Card>
                            <h3 className="mt-0 mb-0 text-center font-semibold">Latency</h3>
                            <PingChart data={pingLatency} />
                        </Card>
                    </div>
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className="mt-0 mb-0 text-center font-semibold">SSL Certificate</h3>
                            <SSL data={sslCertificate} />
                        </Card>
                        <Card>
                            <Additional
                                title={'Get a free SSL certificate'}
                                param={"A Certificate Authority (CA) is a trusted third party that is necessary to determine whether the website operator really has the right to identify themselves with a specific public key and to create an encrypted HTTPS connection for a specific domain. You can obtain free SSL certificates from Let’s Encrypt, a non-profit CA aiming at automating the provisioning of free SSL certificates to anyone. They greatly contribute to a safer and better World Wide Web. We highly recommend to use their free SSL certificates for any of your projects. More information on how to obtain and install a Let’s Encrypt SSL certificate under 5mn is available in their"}
                                link={'https://letsencrypt.org/docs/'}
                                add={'online documentation.'}
                            />
                        </Card>
                    </div>
                    <div className="col-span-1 gap-2 space-y-2">
                        <Card>
                            <h3 className='text-center font-bold mb-2'>Trace Map</h3>
                            <IPMap coordinates={coordinates} />
                        </Card>
                        <Table data={traceData} />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Network;
