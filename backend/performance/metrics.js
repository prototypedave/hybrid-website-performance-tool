import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { performanceMetrics } from '../db/performance.js';

const BATCH_SIZE = 50; 
const CONCURRENCY_LIMIT = 5; 
const urls = ['https://example.com', 'https://google.com']; 

// Function to run Lighthouse for a URL and return metrics
async function runLighthouse(url, chrome) {
    const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port,
    };

    try {
        const runnerResult = await lighthouse(url, options);
        const audits = runnerResult.lhr.audits;

        const metrics = {
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
        };

        return { url, metrics };
    } catch (error) {
        console.error(`Error running Lighthouse for ${url}:`, error);
        return null;
    }
}

// Function to process URLs in batches concurrently
async function processUrlsInBatches(urls) {
    let chrome;
    try {
        chrome = await launch({ chromeFlags: ['--headless'] });

        let batch = [];
        let results = [];

        for (let i = 0; i < urls.length; i++) {
            batch.push(runLighthouse(urls[i], chrome));

            // If batch reaches the limit, wait for all promises to resolve
            if (batch.length >= BATCH_SIZE || i === urls.length - 1) {
                const batchResults = await Promise.all(batch);
                results = results.concat(batchResults.filter(result => result !== null)); // Filter out any failed results
                batch = []; // Reset the batch
            }

            // Throttle the number of concurrent Lighthouse processes
            if (i % CONCURRENCY_LIMIT === 0 && i > 0) {
                console.log(`Pausing for a short time to throttle concurrency...`);
                await new Promise(resolve => setTimeout(resolve, 5000)); 
            }
        }

        // Bulk insert into database
        if (results.length > 0) {
            await performanceMetrics.insertMany(results.map(result => ({
                url: result.url,
                metrics: result.metrics,
                collectedAt: new Date(),
            })));
            console.log(`Saved ${results.length} metrics records to MongoDB.`);
        }
    } catch (error) {
        console.error('Error processing URLs:', error);
    } finally {
        if (chrome) {
            await chrome.kill();
        }
    }
}

async function runLighthousePeriodically() {
    setInterval(async () => {
        console.log('Running Lighthouse for URLs...');
        await processUrlsInBatches(urls);
    }, 10 * 60 * 1000); 
}

runLighthousePeriodically();
