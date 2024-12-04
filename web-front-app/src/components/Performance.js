import React, { useState, useRef, useMemo, useEffect } from "react";
import {Donut, Area, Bar, Line } from "./MyCharts";
import { useResults } from './URLContext.js';

function Performance() {
    let seo = 76.45;
    const results = useResults();
    const vitalsValue = useMemo(() => Object.values(results?.totalPerformance.vitals || {}), [results]);
    const vitalsLabel = useMemo(() => Object.keys(results?.totalPerformance.vitals || {}), [results]);
    const vitalColor = ['#0077b6', '#FFDF00', '#FF8C00', '#c9a0ff', '#00f9ff'];
    const [pageLoad, setPageLoad] = useState([]);
    const [computedTime, setComputedTime] = useState([]);
    const [pageWeight, setPageWeight] = useState([]);
    const [httpRequests, setHttpRequests] = useState([]);
    const [serverTimeMin, setServerTimeMin] = useState([]);
    const [serverTimeMax, setServerTimeMax] = useState([]);

    const score = useMemo(() => {
        return results?.totalPerformance.score
          ? parseFloat(results.totalPerformance.score.toFixed(2))
          : 0; 
    }, [results?.totalPerformance.score]);

    const pageLoadTime = useMemo(() => {
        return results?.pageLoadTime.avg
          ? parseFloat(results.pageLoadTime.avg.toFixed(3))
          : 0; 
    }, [results?.totalPerformance]);

    const PageLoad = useMemo(() => {
        return results?.pageLoadTime?.percentile 
        ? parseFloat(results.pageLoadTime.avg.toFixed(2))
        : 0;
    }, [results]);

    const PageWeight = useMemo(() => {
        return results?.totalPageWeight
        ? parseFloat(results.totalPageWeight.toFixed(2))
        : 0;
    })

    const HttpRequests = useMemo(() => {
        return results?.httpRequests
        ? parseFloat(results.httpRequests.toFixed(2))
        : 0;
    })

    const ServerTimeMin = useMemo(() => {
        return results?.serverResponseTime.min
        ? parseFloat(results.serverResponseTime.min.toFixed(2))
        : 0;
    })

    const ServerTimeMax = useMemo(() => {
        return results?.serverResponseTime.max
        ? parseFloat(results.serverResponseTime.max.toFixed(2))
        : 0;
    })

    const TTFB = useMemo(() => {
        return results?.totalPageWeight
        ? parseFloat(results.totalPageWeight.toFixed(2))
        : 0;
    })

    useEffect(() => {
        setPageLoad(prevPageLoad => [...prevPageLoad, PageLoad]);
        setPageWeight(prevPageWeight => [...prevPageWeight, PageWeight]);
        setHttpRequests(prevHttp => [...prevHttp, HttpRequests]);
        setServerTimeMin(prevServerTime => [...prevServerTime, ServerTimeMin]);
        setServerTimeMax(prevServerTime => [...prevServerTime, ServerTimeMax]);
        const now = new Date();
        const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setComputedTime(prevComputedTime => [...prevComputedTime, formattedTime]);
    }, [PageLoad, PageWeight, HttpRequests, ServerTimeMin, ServerTimeMax]);

    const getColorClass = (value, thresholds) => {
        if (value >= thresholds[2]) {
          return "text-pure-green font-bold text-3xl";
        } else if (value >= thresholds[1]) {
          return "text-org-yellow font-bold text-3xl";
        } else {
          return "text-pure-red font-bold text-3xl";
        }
    };
    
    const scoreThresholds = [0, 50, 90];  
    const loadThresholds = [0, 2000, 4000]; 
    const ttfbThresholds = [0, 500, 2000]; 
    
    return (
        <div className="bg-bg-main dark:bg-dark-bg-main h-auto font-sans flex flex-col gap-4 w-full">
            <div className="flex flex-row gap-2 fixed bg-navbar-bg dark:bg-dark-navbar-bg w-full shadow-4xl">
                <button className="rounded-md bg-card dark:bg-dark-card p-2 shadow-2xl dark:shadow-inherit text-base font-medium hover:bg-btn-bg dark:hover:bg-dark-btn-bg hover:text-white text-subheadings dark:text-dark-subheadings focus:bg-hvr-bg dark:focus:bg-dark-hvr-bg focus:text-white border border-card-border dark:border-dark-card-border">
                    <h3>Real Time</h3>
                </button>
                <button className="rounded-md bg-card dark:bg-dark-card p-2 shadow-2xl dark:shadow-inherit text-base font-medium hover:bg-btn-bg dark:hover:bg-dark-btn-bg hover:text-white text-subheadings dark:text-dark-subheadings focus:bg-hvr-bg dark:focus:bg-dark-hvr-bg focus:text-white border border-card-border dark:border-dark-card-border">
                    <h3>Last 24hrs</h3>
                </button>
                <button className="rounded-md bg-card dark:bg-dark-card p-2 shadow-2xl dark:shadow-inherit text-base font-medium hover:bg-btn-bg dark:hover:bg-dark-btn-bg hover:text-white text-subheadings dark:text-dark-subheadings focus:bg-hvr-bg dark:focus:bg-dark-hvr-bg focus:text-white border border-card-border dark:border-dark-card-border">
                    <h3>A week</h3>
                </button>
                <button className="rounded-md bg-card dark:bg-dark-card p-2 shadow-2xl dark:shadow-inherit text-base font-medium hover:bg-btn-bg dark:hover:bg-dark-btn-bg hover:text-white text-subheadings dark:text-dark-subheadings focus:bg-hvr-bg dark:focus:bg-dark-hvr-bg focus:text-white border border-card-border dark:border-dark-card-border">
                    <h3>A month</h3>
                </button>
                <h1 className="uppercase ml-48 text-center font-bold p-2 text-lg text-headings dark:text-dark-headings">Performance</h1>
            </div>
            <div className="grid grid-cols-4 gap-4 w-full p-4 mt-10">
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col w-full h-24">
                    <h3 className="text-subheadings dark:text-dark-subheadings font-semibold">Performance Score</h3>
                    <p className={getColorClass(score, scoreThresholds)}>{score}%</p>
                </div>

                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col w-full h-24">
                    <h3 className="text-subheadings dark:text-dark-subheadings font-semibold">Performance Score</h3>
                    <p className={getColorClass(seo, scoreThresholds)}>{seo}%</p>
                </div>

                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col w-full h-24">
                    <h3 className="text-subheadings dark:text-dark-subheadings font-semibold">Performance Score</h3>
                    <p className={getColorClass(pageLoadTime, loadThresholds)}>{pageLoadTime}ms</p>
                </div>
                
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col row-span-2 w-full">
                    <h3 className="text-subheadings dark:text-dark-subheadings font-semibold">Web Vitals</h3>
                    <Donut value={vitalsValue} col={vitalColor} score={score}/>
                </div>
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border w-full p-4 col-span-2 row-span-2">
                    <Area value={pageLoad} label={computedTime} title={'Percintile Page Load Time'}/>
                </div>
                
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col w-full">
                    <h3 className="text-subheadings font-semibold py-2 ">Labels</h3>
                    <div className="grid grid-cols-2 gap-4 px-4">
                    {vitalsLabel.map((vital, index) => (
                        <div className="flex flex-row gap-4">
                            <div className="flex flex-row gap-8">
                                <div key={index} className="h-2 w-2 justify-center mt-2" style={{ backgroundColor: vitalColor[index] }}/>
                                <p className="m-0 p-0 top-0 uppercase">{vital}</p>
                            </div>
                        </div>
                    ))}

                    </div>
                </div>

                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col col-span-2 row-span-2 w-full">
                    <Bar value={pageWeight} label={computedTime} title={'Average Page Weight'}/>
                </div>
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col col-span-2 row-span-2 w-full">
                    <Bar value={httpRequests} label={computedTime} title={'Number of Http Requests'}/>
                </div>
                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col col-span-2 row-span-2 w-full">
                    <Line value1={serverTimeMin} value2={serverTimeMax} label={computedTime} label1={'Minimum Server Response Time'} label2={'Maximum Server Response Time'}/>
                </div>

                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-4 flex flex-col w-full h-24">
                    <h3 className="text-subheadings font-semibold">Time to First Byte</h3>
                    <p className={getColorClass(TTFB, ttfbThresholds)}>{TTFB}%</p>
                </div>

                <div className="bg-card dark:bg-dark-card border border-card-border dark:border-dark-card-border p-2 flex flex-col w-full h-24">
                    <div className="flex gap-2 justify-center pt-6">
                        <div className="flex gap-2">
                            <div className="h-4 w-4 mt-1 rounded-lg bg-pure-green"></div>
                            <div>Good</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-4 w-4 mt-1 rounded-lg bg-org-yellow"></div>
                            <div>Average</div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-4 w-4 mt-1 rounded-lg bg-pure-red"></div>
                            <div>Poor</div>
                        </div>
                        
                    </div>
                </div>
                
            </div>



        </div>
    );
}

export default Performance;
