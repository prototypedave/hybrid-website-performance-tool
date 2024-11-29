import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import pRetry from 'p-retry'; 
import { performanceMetrics } from '../db/performance.js';
import fs from 'fs';
import path from 'path'; 

// Constants
const BATCH_SIZE = 100;

async function runLighthouse(url, browser) {
    const { port } = new URL(browser.wsEndpoint());
    const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port,
    };

    try {
        const runnerResult = await lighthouse(url, options);
        const audits = runnerResult.lhr.audits;
        const suggestions = Object.values(audits)
            .filter(audit => audit.score !== 1 && audit.details?.type === 'opportunity')
            .map(audit => ({
                title: audit.title,
                description: audit.description,
                score: audit.score ?? 'N/A',
                estimatedSavings: audit.details.overallSavingsMs ?? 'N/A',
            }));
        const successMessage = `Success - URL: ${url}, Time: ${new Date().toISOString()}`;
        writeLog(successMessage);
        return {
            url,
            metrics: {
                pageLoadTime: audits['speed-index']?.numericValue ?? 'N/A',
                webVitals: {
                    lcp: audits['largest-contentful-paint']?.numericValue ?? 'N/A',
                    fid: audits['max-potential-fid']?.numericValue ?? 'N/A',
                    cls: audits['cumulative-layout-shift']?.numericValue ?? 'N/A',
                    fcp: audits['first-contentful-paint']?.numericValue ?? 'N/A',
                    tbt: audits['total-blocking-time']?.numericValue ?? 'N/A',
                },
                serverResponseTime: audits['server-response-time']?.numericValue ?? 'N/A',
                ttfb: audits['bootup-time']?.numericValue ?? 'N/A',
                totalPageWeight: audits['total-byte-weight']?.numericValue ?? 'N/A',
                httpRequests: audits['network-requests']?.details?.items?.length ?? 'N/A',
            },
            suggestions: suggestions.length ? suggestions : [],
        };
    } catch (error) {
        console.error(`Error running Lighthouse for ${url}:`, error.message);
        writeLog(`Error - URL: ${url}, Time: ${new Date().toISOString()}, ${error.message}`);
        throw error; 
    }
}

async function processUrlsSequentially(urls, browser) {
    const results = [];
    for (const url of urls) {
        try {
            const result = await pRetry(() => runLighthouse(url, browser), {
                retries: 3, // Retry up to 3 times
                onFailedAttempt: (error) => {
                    console.warn(`Retrying ${url} (${error.attemptNumber} attempt): ${error.message}`);
                },
            });
            results.push(result);
        } catch (error) {
            console.error(`Failed to process URL ${url}:`, error.message);
        }
    }
    return results;
}

async function saveMetricsToDb(metricsBatch) {
    try {
        await performanceMetrics.insertMany(metricsBatch, { ordered: false }); 
        console.log(`Saved ${metricsBatch.length} metrics to MongoDB.`);
    } catch (error) {
        console.error(`Error saving metrics to MongoDB:`, error.message);
    }
}

// Function to execute Lighthouse runs and save results
async function executeLighthouseProcess(urls) {
    const browser = await puppeteer.launch({ headless: true }); 
    try {
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batchUrls = urls.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batchUrls.length} URLs)...`);

            const metrics = await processUrlsSequentially(batchUrls, browser); 
            await saveMetricsToDb(metrics); 
        }

        console.log('All URLs processed successfully.');
    } catch (error) {
        console.error('Error during processing:', error.message);
    } finally {
        await browser.close(); 
    }
}

function writeLog(message) {
    const logDir = path.join('backend', 'logs');
    const logFile = path.join(logDir, 'performancelogs.log');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFile, logMessage, 'utf8');
}

// Schedule the process to run every 10 minutes
export function startPeriodicExecution(urls) {
    executeLighthouseProcess(urls);
    setInterval(() => {
        executeLighthouseProcess(urls);
    }, 10 * 60 * 1000); 
}

