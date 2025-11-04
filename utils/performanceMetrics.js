import fs from 'fs';
import path from 'path';
import { isValid } from '../utils/qumValidation.js';
import { userActionCount } from '../utils/qumAction.js';

// Global array to hold all step metrics
export const stepMetrics = [];

/**
 * Add a single step metric (does not write to disk yet)
 */
function addStepMetric({ task, scenario, step, action, userActionTime, systemDelay,
  totalTime, networkCalls, isValid,type }) {
  stepMetrics.push({
    task,
    scenario,
    step,
    action,
    type,
    userActionTime,
    systemDelay,
    totalTime,
    networkCalls,
    isValid
  });

  console.log(`📊 Added metrics for: ${task} → ${step} → ${action}`);
  console.log(stepMetrics.length + ' total steps recorded so far.');
}

export function addOutCome(userActions, outCome) {
  stepMetrics.push({
    userActions,
    outCome
  });
}
/**
 * Wait until the DOM is interactive (or complete).
 * Works for both normal web pages and SPAs that trigger DOM changes early.
 */
export async function waitForDOMInteractive(page, timeout = 15000) {
  await page.waitForFunction(
    () => ['interactive', 'complete'].includes(document.readyState),
    { timeout }
  );

  // Small buffer to ensure scripts attached to DOM have executed
  await page.waitForTimeout(300);
}
async function getPerfEntries(page) {
  return await page.evaluate(() => {
    const entries = performance.getEntries()
      .filter(e => e.entryType === 'navigation' || e.entryType === 'resource')
      .map(entry => ({
        name: entry.name,
        type: entry.entryType,
        status: 200, // approximate, real status requires interception
        time: entry.duration.toFixed(2)
      }));
    performance.clearResourceTimings();
    return entries;
  });
}
async function getPerformanceMetrics(page, taskName, scenario, step, description, userStart, requestSent) {
  await waitForDOMInteractive(page);
  const systemEnd = performance.now();

  const userActionTime = requestSent - userStart;
  const systemDelay = systemEnd - requestSent;
  const totalTime = userActionTime + systemDelay;

  console.log(`User Action Time: ${userActionTime.toFixed(2)}ms`);
  console.log(`System Delay: ${systemDelay.toFixed(2)}ms`);

  // Capture simplified performance entries
  const perfEntries = await getPerfEntries(page);

  addStepMetric({
    task: taskName,
    scenario: scenario,
    step: step,
    action: description,
    userActionTime,
    systemDelay,
    totalTime,
    networkCalls: perfEntries,
    isValid: true,
    type:'user Action',
  });

}
/**
 * Write all collected metrics once at the end
 */
function writePerformanceMetricsToFile(fileName = 'performanceMetrics', commonDir) {
  if (stepMetrics.length > 0) {
    let outCome = "Not Completed";
    if (isValid) {
      outCome = "Completed";
    }
    addOutCome(userActionCount, outCome);
    fileName = fileName + ".json"
    const METRICS_FILE = path.join(commonDir, "performance", fileName);

    const dir = path.dirname(METRICS_FILE);
    // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    console.log(stepMetrics.length + ' total steps recorded so far.');
    fs.writeFileSync(METRICS_FILE, JSON.stringify(stepMetrics, null, 2), 'utf-8');
    console.log(`✅ All metrics written to ${METRICS_FILE}`);
  }
}

export { addStepMetric, writePerformanceMetricsToFile, getPerformanceMetrics };
