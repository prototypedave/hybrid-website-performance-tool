import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse'; 
import { filterAndTransform, calculatePerformanceMetrics } from './metrics-utils.js';
import { saveDiagnostics, Report, handleReportSave } from './model.js';


// Create a Chrome browser
export function createBrowser() {
    return puppeteer.launch({
        args: ['--show-paint-rects']
    });
}

// Fetch Lighthouse report for a given form factor
async function fetchLighthouseReport(url, port, formFactor, output = 'html') {
    return lighthouse(url, {
        port,
        output,
        onlyCategories: ['performance'],
        emulatedFormFactor: formFactor,
    });
}

// Extract specific metrics from a Lighthouse report
function extractMetrics(lhr) {
    return {
        fcp: lhr.audits['first-contentful-paint'].numericValue,
        lcp: lhr.audits['largest-contentful-paint'].numericValue,
        tbt: lhr.audits['total-blocking-time'].numericValue,
        cls: lhr.audits['cumulative-layout-shift'].numericValue,
        si: lhr.audits['speed-index'].numericValue,
    };
}

// Extract diagnostics from a Lighthouse report
function extractDiagnostics(lhr) {
    return Object.keys(lhr.audits)
        .filter(auditKey => lhr.audits[auditKey].details && lhr.audits[auditKey].details.type === 'opportunity')
        .map(auditKey => {
            const audit = lhr.audits[auditKey];
            return {
                title: audit.title,
                description: audit.description,
                displayValue: audit.displayValue,
                metricSavings: audit.metricSavings,
                level: audit.guidanceLevel,
                details: audit.details.overallSavingsMs || audit.details.overallSavingsBytes ? {
                    potentialSavings: audit.details.overallSavingsMs ? `${audit.details.overallSavingsMs} ms` : undefined,
                    potentialSavingsBytes: audit.details.overallSavingsBytes ? `${audit.details.overallSavingsBytes / 1024} KiB` : undefined,
                    headings: audit.details.headings,
                    items: audit.details.items
                } : null
            };
        });
}

// Create a Lighthouse report with metrics and diagnostics
export async function createReportWithBrowser(browser, url, options = { output: 'html' }) {
    const endpoint = browser.wsEndpoint(); 
    const endpointURL = new URL(endpoint);

    try {
        // Fetch reports for mobile and desktop
        const mobileResult = await fetchLighthouseReport(url, endpointURL.port, 'mobile', options.output);
        const desktopResult = await fetchLighthouseReport(url, endpointURL.port, 'desktop', options.output);

        // Extract metrics and diagnostics
        const metricsMobile = extractMetrics(mobileResult.lhr);
        const diagnosticsMobile = extractDiagnostics(mobileResult.lhr);
        const filtMobile = filterAndTransform(diagnosticsMobile);

        const metricsDesktop = extractMetrics(desktopResult.lhr);
        const diagnosticsDesktop = extractDiagnostics(desktopResult.lhr);
        const filtDesktop = filterAndTransform(diagnosticsDesktop);

        // Save diagnostics to the database
        saveDiagnostics(filtMobile, filtDesktop, url);

        const mobileMetrics = calculatePerformanceMetrics(metricsMobile, 'mobile');
        const desktopMetrics = calculatePerformanceMetrics(metricsDesktop, 'desktop');       
        const { performanceMetrics } = combine(mobileMetrics, desktopMetrics);
        
        // Save metrics
        await handleReportSave(Report, { url: url }, {performanceMetrics});

    } catch (error) {
        throw new Error('Lighthouse run failed: ' + error.message);
    } finally {
        await browser.close();
    }
}

function combine(mobMetrics, deskMetrics) {
    return { performanceMetrics: {
        mobile: mobMetrics,
        desktop: deskMetrics
    }};
}