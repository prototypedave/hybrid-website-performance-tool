import ZapClient from 'zaproxy';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { Alert, saveAlertsToMongo } from '../db/security.js';
import { getMetricsByUrl } from '../db/main.js';

dotenv.config();

// ZAP configuration
const zapOptions = { apiKey: process.env.ZAP_API_KEY, proxy: { host: 'localhost', port: 8081 }};
const zap = new ZapClient(zapOptions);

async function performZapAttack(targetUrl) {
    try {
        console.log(`Starting scan for ${targetUrl}`);
        
        // Start Spider Scan
        const spiderResponse = await zap.spider.scan({ url: targetUrl });
        const scanId = spiderResponse.scan;
        while ((await zap.spider.status(scanId)).status !== '100') {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        console.log(`Spider scan completed for ${targetUrl}`);

        // Start Active Scan
        const scanResponse = await zap.ascan.scan({ url: targetUrl });
        const activeScanId = scanResponse.scan;
        while ((await zap.ascan.status(activeScanId)).status !== '100') {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        console.log(`Active scan completed for ${targetUrl}`);

        // Fetch Alerts
        const alertsResponse = await zap.core.alerts({ baseurl: targetUrl });
        const alerts = alertsResponse.alerts.map(alert => ({
            name: alert.alert,
            risk: alert.risk,
            confidence: alert.confidence,
            url: alert.url,
            description: alert.description,
            solution: alert.solution,
            reference: alert.reference,
        }));

        return { url: targetUrl, alerts };
    } catch (error) {
        console.error(`Error scanning ${targetUrl}:`, error.message);
        return null; // Skip to the next URL
    }
}

// Concurrency Limit
const limit = pLimit(5); // Adjust the concurrency level

// Main function to process URLs
async function processUrls(urls) {
    const tasks = urls.map(url =>
        limit(() => performZapAttack(url))
    );
    const results = await Promise.all(tasks);
    const bulkData = results.filter(result => result !== null); 
    
    if (bulkData.length > 0) {
        await saveAlertsToMongo(bulkData); 
    }
    
    console.log('All scans completed.');
}

(async () => {
    const urls = [
        'https://example.com',
        'https://google.com',
        // Add more URLs here
    ];
    try {
        await processUrls(urls);
    } catch (error) {
        console.error('Error during scanning process:', error);
    } finally {
        //mongoose.disconnect();
    }
})();