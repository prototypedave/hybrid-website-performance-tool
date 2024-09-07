import puppeteer from "puppeteer";
import lighthouse from "lighthouse"; 

// create a chrome browser
export function createBrowser() {
   return puppeteer.launch({
     args: ["--show-paint-rects"] 
   });
}

// generate lighthouse reports
export async function createReportWithBrowser(browser, url, options = { output: "html" }) {
    const endpoint = browser.wsEndpoint(); 
    const endpointURL = new URL(endpoint); 

    let mobileResult, desktopResult;
    try {
        // try to fetch reports for mobile devices
        mobileResult = await lighthouse(
            url,
            {
                port: endpointURL.port,
                output: options.output,
                onlyCategories: ['performance'],
                emulatedFormFactor: 'mobile',
            }
        );

        // get specific metrics
        const { lhr: lhrMobile } = mobileResult;
        const metricsMobile = {
            fcp: lhrMobile.audits['first-contentful-paint'].numericValue,
            lcp: lhrMobile.audits['largest-contentful-paint'].numericValue,
            tbt: lhrMobile.audits['total-blocking-time'].numericValue,
            cls: lhrMobile.audits['cumulative-layout-shift'].numericValue,
            si: lhrMobile.audits['speed-index'].numericValue,
        };

        // try to fetch desktop results
        desktopResult = await lighthouse(
            url,
            {
                port: endpointURL.port,
                output: options.output,
                onlyCategories: ['performance'],
                emulatedFormFactor: 'desktop',
            }
        );

        // get specific results for desktop
        const { lhr: lhrDesktop } = desktopResult;
        const metricsDesktop = {
            fcp: lhrDesktop.audits['first-contentful-paint'].numericValue,
            lcp: lhrDesktop.audits['largest-contentful-paint'].numericValue,
            tbt: lhrDesktop.audits['total-blocking-time'].numericValue,
            cls: lhrDesktop.audits['cumulative-layout-shift'].numericValue,
            si: lhrDesktop.audits['speed-index'].numericValue,
        };

        // return metrics as one
        return {metrics: { mobile: metricsMobile, desktop: metricsDesktop}};
    }
    catch (error) {
        throw new Error('Lighthouse run failed: ' + error.message);
    }   
}