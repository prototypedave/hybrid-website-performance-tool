import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client'; 
import {
  Cards, SecurityChart, SecurityIntroCard, SecurityAllLine,
  SecurityTypeLine, SecurityLog, SecurityRisks, SecurityVulnerabilityCard
} from './utils/security-utils.js';

const socket = io('http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070'); 

function Security() {
    const location = useLocation();
    const urls = location.state?.urls || [];
    const intervalRef = useRef(null);
    const mediumRef = useRef(null);
    const [activeRiskData, setActiveRiskData] = useState(null);
    const [activeColor, setActiveColor] = useState(null);
    const [activeType, setType] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [criticalCount, setCritical] = useState(0);
    const [mediumCount, setMedium] = useState(0);
    const [lowCount, setLow] = useState(0);
    const [informationalCount, setInformational] = useState(0);
    const [mediumAlerts, setMediumAlerts] = useState([]);
    const [criticalAlerts, setCriticalAlerts] = useState([]);
    const [lowAlerts, setLowAlerts] = useState([]);
    const [infoAlerts, setInfoAlerts] = useState([]);
    const [score, setScore] = useState(100);
    const [allTotalAlerts, setAllAlerts] = useState([]);
    const [testData, setTestData] = useState([]);
    const [totalLineData, setTotalLineData] = useState([]);
    const [currentData, setCurrentLineData] = useState([]);
    const [intervalDuration, setIntervalDuration] = useState(30000);
    const [totalAlerts, setTotalAlerts] = useState(0);
    const [sqlAlerts, setSQLAlerts] = useState(0);
    const [crossAlerts, setCrossAlerts] = useState(0);
    const [forgeryAlerts, setForgeryAlerts] = useState(0);
    const [commonAlerts, setCommonAlerts] = useState([]);
    const [leakAlerts, setLeakAlerts] = useState(0);
    const [sessionAlerts, setSessionAlerts] = useState(0);
    const [tamperingAlerts, setTamperAlerts] = useState(0);
    const [InfoLeakAlerts, setLeakageAlerts] = useState([]);
    const [bruteAlerts, setBruteAlerts] = useState(0);
    const [headerAlerts, setSecurityAlerts] = useState(0);
    const [policyAlerts, setPolicyAlerts] = useState(0);
    const [securityAttacks, setSecurityAttacks] = useState([]);
    const prevTotalAlerts = useRef(0);

    const fetchSecurityResults = useCallback(async (url) => {
        try {
        const response = await fetch(`http://ec2-16-171-73-98.eu-north-1.compute.amazonaws.com:7070/security/${encodeURIComponent(url)}`);
        const result = await response.json();

        if (result && result.alerts) {
            setAlerts(prevResults =>
            prevResults.map(r =>
                r.originalUrl === url
                ? { ...r, element: result.alerts }
                : r
            )
            );
            saveAlerts(result);
        }
        } catch (error) {
        console.error('Error fetching the report:', error);
        }
    }, []);

    const saveAlerts = (result) => {
        if (!result || !result.alerts) return;

        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const riskCounts = { High: 0, Medium: 0, Low: 0, Informational: 0 };
        const alertsByRisk = { High: [], Medium: [], Low: [], Informational: [] };
        const newAlerts = new Set();

        const vulAlerts = [];
        let sqlCount = 0, crossCount = 0, forgeryCount = 0;
        const leakageAlerts = [];
        let leakCount = 0, sessionCount = 0, parameterCount = 0;
        const securityAlerts = [];
        let bruteCount = 0, headersCount = 0, policyCount = 0;

        result.alerts.forEach(alert => {
        if (allTotalAlerts.some(existingAlert => existingAlert.id === alert.alertRef)) return;

        newAlerts.add(alert.alertRef);
        const alertList = alertsByRisk[alert.risk];
        if (alertList && !alertList.some(existingAlert => existingAlert.id === alert.alertRef)) {
            alertList.push(alert);
            riskCounts[alert.risk] += 1;

            if (alert.name.includes("SQL")) {
            vulAlerts.push(alert);
            sqlCount += 1;
            }

            if (alert.name.includes("Cross Site Scripting") || alert.name.includes("XSS")) {
            vulAlerts.push(alert);
            crossCount += 1;
            }

            if (alert.name.includes("Cross-") || alert.name.includes('CSRF') || alert.name.includes('CRLF')) {
            vulAlerts.push(alert);
            forgeryCount += 1;
            }

            if (alert.name.includes("Leak")) {
            leakageAlerts.push(alert);
            leakCount += 1;
            }

            if (alert.name.includes("Session") || alert.name.includes("Cookie") || alert.name.includes("Authentication") || alert.name.includes("ID") || alert.name.includes("Token") || alert.name.includes("Hijacking")) {
            leakageAlerts.push(alert);
            sessionCount += 1;
            }

            if (alert.name.includes("Parameter") || alert.name.includes("Tampering") || alert.name.includes("Modification") || alert.name.includes("Manipulation")) {
            leakageAlerts.push(alert);
            parameterCount += 1;
            }

            if (alert.name.includes("Authentication")) {
            securityAlerts.push(alert);
            bruteCount += 1;
            }

            if (alert.name.includes("Header")) {
            securityAlerts.push(alert);
            headersCount += 1;
            }

            if (alert.name.includes("Policy")) {
            securityAlerts.push(alert);
            policyCount += 1;
            }
        }
        });

        setSQLAlerts(sqlCount);
        setCrossAlerts(crossCount);
        setForgeryAlerts(forgeryCount);
        setCommonAlerts(vulAlerts);

        setLeakAlerts(leakCount);
        setSessionAlerts(sessionCount);
        setTamperAlerts(parameterCount);
        setLeakageAlerts(leakageAlerts);

        setBruteAlerts(bruteCount);
        setSecurityAlerts(headersCount);
        setPolicyAlerts(policyCount);
        setSecurityAttacks(securityAlerts);

        setCritical(riskCounts.High);
        setMedium(riskCounts.Medium);
        setLow(riskCounts.Low);
        setInformational(riskCounts.Informational);
        setScore(Math.round(calculateTotalPercentage(riskCounts.High, riskCounts.Medium, riskCounts.Low, riskCounts.Informational)));

        const pieData = [
        { name: "Critical", value: riskCounts.High },
        { name: 'Medium', value: riskCounts.Medium },
        { name: 'Low', value: riskCounts.Low },
        { name: 'Informational', value: riskCounts.Informational }
        ];
        setTestData(pieData);

        const total = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
        const fixedAlerts = Math.max(0, prevTotalAlerts.current - total);
        const totalLineData = { time: formattedTime, issues: total, mitigated: fixedAlerts };
        setTotalLineData(prevData => [...prevData, totalLineData].slice(-20));
        setTotalAlerts(total);

        const currentLineData = { time: formattedTime, high: riskCounts.High, medium: riskCounts.Medium, low: riskCounts.Low, informational: riskCounts.Informational };
        setCurrentLineData(prevData => [...prevData, currentLineData].slice(-20));

        prevTotalAlerts.current = total;

        const updateAlerts = (setAlerts, riskAlerts) => {
        setAlerts(prevData => {
            if (JSON.stringify(prevData) !== JSON.stringify(riskAlerts)) {
            return riskAlerts;
            }
            return prevData;
        });
        };

        updateAlerts(setMediumAlerts, alertsByRisk.Medium);
        updateAlerts(setCriticalAlerts, alertsByRisk.High);
        updateAlerts(setLowAlerts, alertsByRisk.Low);
        updateAlerts(setInfoAlerts, alertsByRisk.Informational);
        updateAlerts(setAllAlerts, [].concat(...Object.values(alertsByRisk)));
    };

    useEffect(() => {
        socket.on('security_data', data => {
        if (data) {
            saveAlerts(data);
        }
        });

        return () => {
        socket.off('security_data');
        };
    }, [saveAlerts]);

    useEffect(() => {
        if (intervalRef.current) {
        clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
        urls.forEach(url => {
            fetchSecurityResults(url);
        });
        }, intervalDuration);

        return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        };
    }, [urls, fetchSecurityResults, intervalDuration]);

    const handleRiskClick = (riskData, color, type) => {
        setActiveRiskData(riskData);
        setActiveColor(color);
        setType(type);
    };

    function calculateTotalPercentage(high, medium, low, info) {
        let highContribution = high <= 0 ? 40 : Math.max(0, 40 - 8 * high);
        let mediumContribution = medium <= 0 ? 30 : Math.max(0, 30 - 3 * medium);
        let lowContribution = low <= 0 ? 20 : Math.max(0, 20 - (4 / 3) * low);
        let infoContribution = info <= 0 ? 10 : Math.max(0, 10 - 0.5 * info);

        return highContribution + mediumContribution + lowContribution + infoContribution;
    }

    return (
        <main className="font-serif">
        <Sidebar alerts={0} url={urls} />
        <div className="p-4 sm:ml-64 mt-0">
            <h2 className='text-mono text-center font-medium text-lg antialiased font-black mb-2 uppercase'>Security Audit</h2>
            <div className='flex grid-cols-3 gap-2 text-mono'>
            <div className='col-span-2'>
                <div className='flex grid-cols-2 gap-2'>
                <div className='flex flex-col mt-0 gap-2'>
                    <div className='flex flex-row gap-2'>
                    <Cards critical={criticalCount} type={"CRITICAL"} color={"red"} sectionRef={mediumRef} onClick={() => handleRiskClick(criticalAlerts, 'red', 'High Risk')} />
                    <Cards critical={mediumCount} type={"MEDIUM RISK"} color={"orange"} sectionRef={mediumRef} onClick={() => handleRiskClick(mediumAlerts, 'orange', 'Medium Risk')} />
                    </div>
                    <SecurityIntroCard score={score} onClick={() => handleRiskClick(allTotalAlerts, 'gray', 'Alerts')} sectionRef={mediumRef} />
                    <SecurityAllLine data={totalLineData} title={"All Alerts Line Graph"} />
                </div>
                <div className='flex flex-col mt-0 gap-2'>
                    <div className='flex flex-row gap-2'>
                    <Cards critical={lowCount} type={"LOW RISK"} color={"yellow"} sectionRef={mediumRef} onClick={() => handleRiskClick(lowAlerts, 'yellow', 'Low Risk')} />
                    <Cards critical={informationalCount} type={"INFORMATIONAL"} color={"gray"} sectionRef={mediumRef} onClick={() => handleRiskClick(infoAlerts, '#D3D3D3', 'Informational')} />
                    </div>
                    <SecurityChart data={testData} total={totalAlerts} />
                    <SecurityTypeLine data={currentData} title={"Alerts Types Line Graph"} />
                </div>
                </div>
                <div className='flex gap-2 text-mono mt-2 mb-2'>
                <div className='flex flex-row mt-0 gap-2'>
                    <SecurityVulnerabilityCard
                    title={"Common Vulnerabilities"}
                    valOne={sqlAlerts} valTwo={crossAlerts} valThree={forgeryAlerts}
                    info1={"SQL Injection"}
                    info2={"Cross-site scripting (XSS)"}
                    info3={"Cross-site request forgery"}
                    onClick={() => handleRiskClick(commonAlerts, 'blue', 'Vulnerabilities Attack')}
                    sectionRef={mediumRef}
                    />
                    <SecurityVulnerabilityCard
                    title={"Sensitive Info Leakage"}
                    valOne={leakAlerts} valTwo={sessionAlerts} valThree={tamperingAlerts}
                    info1={"Exposed Credentials"}
                    info2={"Session Management Vulnerabilities"}
                    info3={"Parameter Tampering"}
                    onClick={() => handleRiskClick(InfoLeakAlerts, 'blue', 'Information Leakage Attack')}
                    sectionRef={mediumRef}
                    />
                    <SecurityVulnerabilityCard
                    title={"Security Attacks"}
                    valOne={bruteAlerts} valTwo={headerAlerts} valThree={policyAlerts}
                    info1={"Brute Force"}
                    info2={"Missing security headers"}
                    info3={"Directory traversal attacks"}
                    onClick={() => handleRiskClick(securityAttacks, 'blue', 'Security Attacks')}
                    sectionRef={mediumRef}
                    />
                </div>
                </div>
                <div className='fixed-width'>
                {activeRiskData && (
                    <SecurityRisks data={activeRiskData} color={activeColor} ref={mediumRef} type={activeType} />
                )}
                </div>
            </div>
            <div className='col-span-1'>
                <div className='flex flex-col mt-0 gap-2 w-64'>
                <SecurityLog data={allTotalAlerts} />
                </div>
            </div>
            </div>
        </div>
        </main>
    );    
}

export default Security;