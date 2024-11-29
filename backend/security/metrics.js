import ZapClient from 'zaproxy';
import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { saveAlertsToMongo } from '../db/security.js';

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
            evidence: alert.evidence,
        }));
        writeLog(`Success - URL: ${url}, Time: ${new Date().toISOString()}`);
        return { url: targetUrl, alerts };
    } catch (error) {
        console.error(`Error scanning ${targetUrl}:`, error.message);
        writeLog(`Error - URL: ${url}, Time: ${new Date().toISOString()}, ${error.message}`);
        return null; 
    }
}

const limit = pLimit(5); 

function writeLog(message) {
    const logDir = path.join('backend', 'logs');
    const logFile = path.join(logDir, 'securitylogs.log');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFile, logMessage, 'utf8');
}

export async function processUrls(urls) {
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

export function startPeriodicExecutionSecurity(urls) {
    processUrls(urls);
    setInterval(() => {
        processUrls(urls);
    }, 20 * 60 * 1000); 
}