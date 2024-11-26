import mongoose from 'mongoose';
import moment from 'moment';

mongoose.connect('mongodb://localhost:27017/performanceDB', {});

const metricsSchema = new mongoose.Schema({
    url: { type: String, required: true },
    metrics: {
        pageLoadTime: Number,
        webVitals: {
            lcp: Number,
            fid: Number,
            cls: Number,
            fcp: Number,
            tbt: Number,
        },
        serverResponseTime: Number,
        ttfb: Number,
        totalPageWeight: Number,
        httpRequests: Number,
    },
    collectedAt: { type: Date, default: Date.now }, 
});

// database instance for performance
export const performanceMetrics = mongoose.model('Metrics', metricsSchema);

// Returns given number of records from the database history
export async function getMetricsByUrl(url, limit = 5) {
    try {
        const metricsHistory = await performanceMetrics.find({ url })
            .sort({ collectedAt: -1 })
            .limit(limit)   
            .exec();

        if (metricsHistory.length > 0) {
            return metricsHistory;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error retrieving metrics:', error);
        return null;
    } finally {
        //mongoose.connection.close();  
    }
}

// Returns records for the given time range
export async function getMetricsByUrlAndTimeRange(url, timeRange) {
    try {
        let timeFilter = {};
        switch (timeRange) {
            case '1h':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'hours').toDate() } };
                break;
            case '24h':
                timeFilter = { collectedAt: { $gte: moment().subtract(24, 'hours').toDate() } };
                break;
            case '1w':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'week').toDate() } };
                break;
            case '1m':
                timeFilter = { collectedAt: { $gte: moment().subtract(1, 'month').toDate() } };
                break;
            default:
                throw new Error('Invalid time range. Use "1h", "24h", "1w", or "1m".');
        }

        // Retrieve the metrics based on the time range
        const metricsHistory = await performanceMetrics.find({ url, ...timeFilter })
            .sort({ collectedAt: -1 })
            .exec();

        if (metricsHistory.length > 0) {
            return metricsHistory;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error retrieving metrics:', error);
        return null;
    } finally {
        //mongoose.connection.close();
    }
}

// Gets the 95th percentile load time # for UX analysis
function getPercitileLoadTime (metrics) {
    const loadTimes = [];
    for (let i = 0; i < metrics.length; i++) {
        loadTimes.push(metrics[i].metrics.pageLoadTime);
    }   
    loadTimes.sort((a, b) => a - b);
    const percentileIndex = Math.floor(0.95 * loadTimes.length);
    return loadTimes[percentileIndex];
}

// Average page load time for given records
function getAverageLoadTime(metrics) {
    let avgTimes = 0;
    for (let i = 0; i < metrics.length; i++) {
        avgTimes += metrics[i].metrics.pageLoadTime;
    }
    return avgTimes / metrics.length;
}

// get the median page load
function getMedianLoadTime(metrics) {
    const loadTimes = [];
    for (let i = 0; i < metrics.length; i++) {
        loadTimes.push(metrics[i].metrics.pageLoadTime);
    }
    loadTimes.sort((a, b) => a - b);
    const len = loadTimes.length;
    const middleIndex = Math.floor(len / 2);

    if (len % 2 !== 0) {
        return loadTimes[middleIndex];
    } else {
        return (loadTimes[middleIndex - 1] + loadTimes[middleIndex]) / 2;
    }
}

// returns min & max page load time
function getMinMaxLoadTime(metrics) {
    const loadTimes = [];
    for (let i = 0; i < metrics.length; i++) {
        loadTimes.push(metrics[i].metrics.pageLoadTime);
    }
    // sort
    loadTimes.sort((a, b) => a - b);
    return {min : loadTimes[0], max : loadTimes[loadTimes.length - 1]};
}

// average web vitals
function getAverageWebVitals(metrics) {
    let web = {lcp : 0, fid : 0, cls : 0, fcp : 0, tbt : 0};
    for (let i = 0; i < metrics.length; i++) {
        web.lcp += metrics[i].metrics.webVitals.lcp;
        web.fid += metrics[i].metrics.webVitals.fid;
        web.cls += metrics[i].metrics.webVitals.cls;
        web.fcp += metrics[i].metrics.webVitals.fcp;
        web.tbt += metrics[i].metrics.webVitals.tbt;
    }
    const len = metrics.length;
    web = {lcp: web.lcp / len, fid: web.fid / len, cls : web.cls / len, fcp : web.fcp/len, tbt: web.tbt/len};
    return web;
}

// average response time
function getAverageResponseTime(metrics) {
    let avgTimes = 0;
    for (let i = 0; i < metrics.length; i++) {
        avgTimes += metrics[i].metrics.serverResponseTime;
    }
    return avgTimes / metrics.length;
}

// minimum & maximum server response time
function getMinMaxResponseTime(metrics) {
    const responseTimes = [];
    for (let i = 0; i < metrics.length; i++) {
        responseTimes.push(metrics[i].metrics.serverResponseTime);
    }
    // sort
    responseTimes.sort((a, b) => a - b);
    return {min : responseTimes[0], max : responseTimes[responseTimes.length - 1]};
}

// average time to first byte
function getAverageTTFB(metrics) {
    let avgTimes = 0;
    for (let i = 0; i < metrics.length; i++) {
        avgTimes += metrics[i].metrics.ttfb;
    }
    return avgTimes / metrics.length;
}

// minimum & maximum time to first byte
function getMinMaxTTFB(metrics) {
    const ttfbTimes = [];
    for (let i = 0; i < metrics.length; i++) {
        ttfbTimes.push(metrics[i].metrics.ttfb);
    }
    // sort
    ttfbTimes.sort((a, b) => a - b);
    return {min : ttfbTimes[0], max : ttfbTimes[ttfbTimes.length - 1]};
}

// average page weight
function getAveragePageWeight(metrics) {
    let avgTimes = 0;
    for (let i = 0; i < metrics.length; i++) {
        avgTimes += metrics[i].metrics.totalPageWeight;
    }
    return avgTimes / metrics.length;
}

// average http requests
function getAverageRequests(metrics) {
    let avgTimes = 0;
    for (let i = 0; i < metrics.length; i++) {
        avgTimes += metrics[i].metrics.httpRequests;
    }
    return avgTimes / metrics.length;
}

// get results by time
export async function ParseResults(url, time) {
    if (time != 6) {
        const metrics = await getMetricsByUrlAndTimeRange(url, time);
        if (metrics != null) {
            // page Load Time
            const PLTpercentile = getPercitileLoadTime(metrics);
            const PLTMinMax = getMinMaxLoadTime(metrics);
            const PLTMedian = getMedianLoadTime(metrics);
            const PLTAvg = getAverageLoadTime(metrics);

            // web vitals
            const vitals = getAverageWebVitals(metrics);

            // server response time
            const SRTAvg = getAverageResponseTime(metrics);
            const SRTMinMax = getMinMaxResponseTime(metrics);

            // time to first byte
            const ttfbAvg = getAverageTTFB(metrics);
            const ttfgMinMax = getMinMaxTTFB(metrics);

            // total page weight
            const tpwAvg = getAveragePageWeight(metrics);
            
            // http requests
            const hrAvg = getAverageRequests(metrics);

            return {
                pageLoadTime: {percentile: PLTpercentile, minMax: PLTMinMax, median: PLTMedian, avg: PLTAvg},
                webVitals: vitals,
                serverResponseTime: {avg: SRTAvg, minMax: SRTMinMax},
                ttfb: {avg: ttfbAvg, minMax: ttfgMinMax},
                totalPageWeight: tpwAvg,
                httpRequests: hrAvg,
            }
        }
    } else {
        const metrics = await getMetricsByUrl(url, 1) 
        return {
            pageLoadTime: metrics[0].metrics.pageLoadTime,
            webVitals: metrics[0].metrics.webVitals,
            serverResponseTime: metrics[0].metrics.serverResponseTime,
            ttfb: metrics[0].metrics.ttfb,
            totalPageWeight: metrics[0].metrics.totalPageWeight,
            httpRequests: metrics[0].metrics.httpRequests
        };
        
    }
}

const met = await ParseResults('https://example.com', 6);
console.log(met);


