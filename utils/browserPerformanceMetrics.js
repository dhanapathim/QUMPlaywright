import fs from 'fs';
import path from 'path';

const browserData = [];
let lastNavigation = 0;
let lastURL = '';
export const performanceData = {};

async function getBrowserMetrics(page, action, task, scenario, step) {

    console.log(`\n--- Browser Metrics---`);
    const currentURL = page.url();
    console.log(`last URL=${lastURL}   currentURL=${currentURL}`);
    const params = {
        prevNavStart: lastNavigation,
        lastURL,
        currentURL
    };
    const perfTimings = await page.evaluate(({ prevNavStart, lastURL, currentURL }) => {
        const perf = performance.getEntriesByType('navigation')[0];
        const presentNavigation = performance.timeOrigin;
        if (currentURL === lastURL && prevNavStart === presentNavigation) { return { metrics: {}, presentNavigation }; }

        const metrics = {
            ttfb: perf.responseStart - perf.requestStart, // Time to First Byte
            ttlb: perf.responseEnd - perf.requestStart,   // Time to Last Byte
            domInteractive: perf.domInteractive,
            pageLoad: perf.loadEventEnd,
            firstResponse: perf.responseStart,
            backendTime: perf.responseStart - perf.requestStart,
            domContentLoaded: perf.domContentLoadedEventEnd,
            networkLatency: perf.connectEnd - perf.connectStart,
            onLoad: perf.loadEventEnd - perf.loadEventStart,
            dnsLookup: perf.domainLookupEnd - perf.domainLookupStart,
            connectionTime: perf.connectEnd - perf.connectStart,
            transferSize: perf.transferSize,                     // Total bytes transferred including headers
            encodedBodySize: perf.encodedBodySize,               // Compressed body
            decodedBodySize: perf.decodedBodySize
        };
        return { metrics, presentNavigation };
    }, params);
    lastNavigation = perfTimings.presentNavigation;
    lastURL = currentURL;
    if (Object.keys(perfTimings.metrics).length > 0) {
        browserData.push({
            task,
            scenario,
            step,
            action,
            browserMetrics: perfTimings.metrics,
        });
    }

}
export function writeBrowserMetricsToFile(fileName = 'browserMetrics', filePath, persona) {
    if (browserData.length > 0) {
        fileName = fileName + ".json"
        const METRICS_FILE = path.join(filePath, "browser", fileName);
        const dir = path.dirname(METRICS_FILE);
        // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        Object.assign(performanceData, {
            persona: persona,
            results: browserData
        });
        console.log(browserData.length + ' total steps recorded for browserMetrics.');
        fs.writeFileSync(METRICS_FILE, JSON.stringify(performanceData, null, 2), 'utf-8');
        console.log(`✅ browser metrics written to ${METRICS_FILE}`);
    }
}
export { getBrowserMetrics };