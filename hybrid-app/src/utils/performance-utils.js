import React from 'react';
import { ProgressCircle, Divider, ProgressBar } from '@tremor/react';
import { FaCaretDown, FaCaretUp, FaCircle, FaSquare } from "react-icons/fa";
import { Accordion, AccordionBody,  AccordionHeader, AccordionList, Button, Badge } from '@tremor/react';

const getProgressColor = (value) => {
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

const getCaretAndColor = (incre) => {
    if (incre > 90) {
        return { caret: FaCaretUp, color: 'green' }; 
    } else if (incre > 85) {
        return { caret: FaSquare, color: 'yellow' };
    } else if (incre > 70) {
        return { caret: FaCircle, color: 'orange' };
    } else {
        return { caret: FaCaretDown, color: 'red' };
    }
};

const getValue = (percent, max) => {
    return (percent / 100 * max);
}

export function Metric ({ score, value, title, param, link, isExpanded }) {
    const { caret: CaretIcon, color } = getCaretAndColor(score);
    
    return (
        <div className='flex flex-col justify-between w-full max-w-[300px]'>
            <div>
                <h3 className="mt-0 mb-0 text-center font-semibold">
                    <CaretIcon style={{ marginRight: '8px', color }} /> 
                    {title}
                </h3>
                <p className="ml-2 text-tremor-content dark:text-dark-tremor-content text-sm" style={{color}}>{value}{title !== 'Cumulative Layout Shift' ? 's' : ''}</p>
                {isExpanded && (
                    <p className='text-left mb-2 ml-6 overflow-auto'>
                        {param} <span><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Learn more about {title} metric.</a></span>
                    </p>
                )}
            </div>
            <Divider className='mt-auto mb-2' />
        </div>
    );
};


export function PerformanceBox ({ score, isDevice, toggleDevice }) {
    return (
        <div className="mx-auto max-w-xs">
            <div className='flex flex-row justify-between items-center'>
                <h3 className="mt-0 mb-0 text-center font-semibold">{isDevice ? 'Desktop' : 'Mobile'}</h3>
                <Button variant="secondary" className='text-lg m-0 border-none' onClick={toggleDevice}>{isDevice ? 'Mobile' : 'Desktop'}</Button>
            </div>
            <div className='items-center'>
                <ProgressCircle
                        value={score}
                        size="md"
                        color={getProgressColor(score)}
                        strokeWidth={8}
                        radius={50}
                        className='mt-2 ml-5 mr-5 mb-2'
                >
                    <span className="text-xs font-medium text-slate-700">{score}%</span>
                </ProgressCircle>
                <h3 className="mt-0 mb-0 text-center font-semibold">Performance</h3>
                <p className="ml-2 mt-4 text-tremor-content dark:text-dark-tremor-content text-sm">
                    The 
                    <span className='ml-1 mr-1'>
                        <a target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" href='https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/?utm_source=lighthouse&utm_medium=node'> 
                            performance score is calculated
                        </a>
                    </span> 
                    directly from these metrics.
                    <span className='ml-1 mr-1'>
                        <a target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" href='https://googlechrome.github.io/lighthouse/scorecalc/#FCP=2826&LCP=3433&TBT=2017&CLS=0&SI=3576&TTI=10538&device=mobile&version=12.1.0'>
                            See calculator
                        </a>
                    </span>
                </p>
                <div className='flex items-center mt-3'>
                    <FaCaretDown style={{ marginRight: '6px', color: 'red' }}/>
                    <div className='mr-4 text-xs whitespace-nowrap'>
                        0-70
                    </div>
                    <FaCircle style={{ marginRight: '6px', color: 'orange' }} />
                    <div className='mr-4 text-xs whitespace-nowrap'>
                        71-85
                    </div>
                    <FaSquare style={{ marginRight: '6px', color: 'yellow' }} />
                    <div className='mr-4 text-xs whitespace-nowrap'>
                        86-90
                    </div>
                    <FaCaretUp style={{ marginRight: '6px', color: 'green' }} />
                    <div className='mr-4 text-xs whitespace-nowrap'>
                        91-100
                    </div>
                </div>
            </div>
        </div>
    )
}

export function PerformanceProgress ({ fcp, lcp, cls, si, tbt }) {
    return (
        <div className="mx-auto max-w-xs w-full">
            <h3 className="mt-0 mb-0 text-center font-semibold">Metric Score </h3>
            <div className='mt-3'>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                    <span>CLS &bull; +{Math.round(getValue(cls, 25))}</span>
                    <span>25</span>
                </p>
                <ProgressBar value={cls} color={getProgressColor(cls)} className="mt-3" />
            </div>

            <div className='mt-3'>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                    <span>LCP &bull; +{Math.round(getValue(lcp, 25))}</span>
                    <span>25</span>
                </p>
                <ProgressBar value={lcp} color={getProgressColor(lcp)} className="mt-3" />
            </div>
            <div className='mt-3'>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                    <span>SI &bull; +{Math.round(getValue(si, 10))}</span>
                    <span>10</span>
                </p>
                <ProgressBar value={si} color={getProgressColor(si)} className="mt-3" />
            </div>

            <div className='mt-3'>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                    <span>FCP &bull; +{Math.round(getValue(fcp, 10))}</span>
                    <span>10</span>
                </p>
                <ProgressBar value={fcp} color={getProgressColor(fcp)} className="mt-3" />
            </div>

            <div className='mt-3'>
                <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content flex items-center justify-between">
                    <span>TBT &bull; +{Math.round(getValue(tbt, 30))}</span>
                    <span>30</span>
                </p>
                <ProgressBar value={tbt} color={getProgressColor(tbt)} className="mt-3" />
            </div>
        </div>

    )
}

export function PerformanceDiagnostics({ diagnostic = [] }) {
    return (
        <AccordionList className="mx-auto max-w-md">
            {diagnostic.map((item, index) => (
                <Accordion key={index}>
                    <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong whitespace-nowrap">
                        {item.title}<span className="ml-2 text-red-600">{item.savings}</span>
                    </AccordionHeader>
                    <AccordionBody className="leading-6">
                        <p className="ml-2 text-tremor-content dark:text-dark-tremor-content text-sm">
                            {item.description}
                            <span className='ml-1'>
                                <a target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" href={item.link}>
                                    {item.info}
                                </a>
                            </span>
                            {(item.metrics ? item.metrics.split(',').map(metric => metric.trim()) : []).map((metric, idx) => (
                                <Badge key={idx} className='ml-1'>{metric}</Badge>    
                            ))}
                        </p >
                        {item.headings && item.headings.length > 0 && item.items && item.items.length > 0 ? (
                            <table className="min-w-full mt-4 border-collapse border border-gray-300">
                                <thead>
                                    <tr>
                                        {item.headings.map((heading, idx) => (
                                            <th key={idx} className="border border-gray-400 px-4 py-2">{heading.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.items.length > 0 ? (
                                        item.items.map((row, idx) => (
                                            <tr key={idx}>
                                                {item.headings.map((heading, hIdx) => (
                                                    <td key={hIdx} className="border border-gray-400 px-4 py-2">
                                                        {row[heading.value] || 'N/A'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={item.headings.length} className="border border-gray-400 px-4 py-2 text-center">No data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : null}
                    </AccordionBody>
                </Accordion>
            ))}
        </AccordionList>
    );
}

