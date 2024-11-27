import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import pRetry from 'p-retry'; // Retry logic for failed URLs
import { performanceMetrics } from '../db/performance.js'; // MongoDB model

// Constants
const BATCH_SIZE = 100;
const urls = [
    'https://example.com',
    'https://google.com',
    'https://facebook.com',
    'https://twitter.com',
    'https://linkedin.com',
];

// Function to run Lighthouse on a single URL using a shared Chrome instance
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
        };
    } catch (error) {
        console.error(`Error running Lighthouse for ${url}:`, error.message);
        throw error; // Rethrow for retry logic
    }
}

// Function to process URLs sequentially (one at a time)
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

// Function to save metrics to MongoDB in batches
async function saveMetricsToDb(metricsBatch) {
    try {
        await performanceMetrics.insertMany(metricsBatch, { ordered: false }); // Bulk insert
        console.log(`Saved ${metricsBatch.length} metrics to MongoDB.`);
    } catch (error) {
        console.error(`Error saving metrics to MongoDB:`, error.message);
    }
}

// Function to execute Lighthouse runs and save results
async function executeLighthouseProcess() {
    const browser = await puppeteer.launch({ headless: true }); // Shared Chrome instance

    try {
        console.log('Starting Lighthouse process...');
        for (let i = 0; i < urls.length; i += BATCH_SIZE) {
            const batchUrls = urls.slice(i, i + BATCH_SIZE); // Process in batches
            console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batchUrls.length} URLs)...`);

            const metrics = await processUrlsSequentially(batchUrls, browser); // Process URLs one at a time in batch
            await saveMetricsToDb(metrics); // Save results to MongoDB
        }

        console.log('All URLs processed successfully.');
    } catch (error) {
        console.error('Error during processing:', error.message);
    } finally {
        await browser.close(); // Close shared Chrome instance
    }
}

// Schedule the process to run every 10 minutes
function startPeriodicExecution() {
    console.log('Starting periodic Lighthouse execution...');
    executeLighthouseProcess(); // Run immediately
    setInterval(executeLighthouseProcess, 10 * 60 * 1000); // Run every 10 minutes
}

// Start the periodic execution
startPeriodicExecution();
