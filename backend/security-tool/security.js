import ZapClient from 'zaproxy';
import { Save, Security } from './model.js';

const zapOptions = { apiKey: #####, proxy: { host: 'localhost', port: 8081 }};
const zap = new ZapClient(zapOptions);

export async function SecurityScan(targetUrl) {
    try {
        // Start a spider scan on the target URL
        const spiderResponse = await zap.spider.scan({ url: targetUrl });
        const scanId = spiderResponse.scan;
        
        let spiderStatus;
        do {
            spiderStatus = await zap.spider.status(scanId);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        } while (spiderStatus.status !== '100');

        console.log('Spider scan completed.');

        const scanResponse = await zap.ascan.scan({ url: targetUrl });
        const activeScanId = scanResponse.scan;

        let scanStatus;
        do {
            scanStatus = await zap.ascan.status(activeScanId);
            await new Promise(resolve => setTimeout(resolve, 5000)); 
        } while (scanStatus.status !== '100');

        console.log('Active scan completed.');

        const alertsResponse = await zap.core.alerts({ baseurl: targetUrl });
        const alerts = alertsResponse.alerts;
        const processedAlertRefs = new Set();
        const metrics = [];

        for (const alert of alerts) {
            const alertRef = alert.alertRef;

            if (processedAlertRefs.has(alertRef)) {
                continue; 
            }
            processedAlertRefs.add(alertRef);

            if (alert) {
                const tags = alert.tags || {};
                const tag = {
                    OWASP_2021_A05: tags.OWASP_2021_A05 || null,
                    OWASP_2017_A06: tags.OWASP_2017_A06 || null
                };

                const securityMetrics = {
                    name: alert.name || alert.alert,
                    risk: alert.risk,
                    description: alert.description,
                    confidence: alert.confidence,
                    evidence: alert.evidence,
                    solution: alert.solution,
                    reference: alert.reference,
                    attacks: alert.attacks,
                    cweid: alert.cweid,
                    wascid: alert.wascid,
                    alertRef: alertRef,
                    tags: tag
                };
                
                metrics.push(securityMetrics);
            }
        }

        if (metrics.length > 0) {
            const lastSavedMetrics = await Security.findOne({ url: targetUrl }).sort({ _id: -1 }).exec();
            const areMetricsIdentical = lastSavedMetrics && JSON.stringify(lastSavedMetrics.metrics) === JSON.stringify(metrics);

            if (!areMetricsIdentical) {
                await Save(Security, { url: targetUrl }, metrics);
                console.log('Saved to DB');
            } else {
                console.log('Metrics are identical. Skipping save.');
            }
        } else {
            console.log('No metrics to save.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    }
}
