import { test } from '@playwright/test';
import path from 'path';
import { getPerformanceMetrics, writePerformanceMetricsToFile } from '../utils/performanceMetrics.js';
import { checkAllyViolations, writeA11yMetricsToFile } from './a11yMetrics.js';
import { getBrowserMetrics, writeBrowserMetricsToFile } from './browserPerformanceMetrics.js';
import { checkI18N, writeI18NMetricsToFile } from './i18NMetrics.js';
import { getDesignHygieneMetrics, writeDesignMetricsToFile } from './designHygieneMetrics.js';

export let userActionCount = 0;
/**
 * namedStep - Wraps a Playwright test step with:
 * - Step description + test info
 * - Network + navigation timings (name, type, duration, status)
 *
 * @param {string} description - Step description
 * @param {Page} page - Playwright Page object
 * @param {Function} fn - Async step actions
 */
export async function qumAction(description, step = 'step', page, fn) {
  const info = test.info();

  if (!page || typeof page.evaluate !== 'function') {
    throw new Error(`namedStep expected a Playwright Page, but got: ${page}`);
  }

  console.log(`\n--- Start of Action ---`);
  console.log(`tittle path ${info.titlePath}`);
  const [file, task, scenario] = info.titlePath;
  const taskName = formatTaskName(task);

  console.log(`Task: ${taskName}`);
  console.log(`Scenario: ${scenario}`);
  console.log(`Step: ${step}`);
  console.log(`Action: ${description}`);

  const userStart = performance.now();
  // Execute the step
  await test.step(description, async () => {
    await fn();
  });
  const requestSent = performance.now();
  const runA11y = info.project.metadata.a11y?.toLowerCase() === 'true' || false;
  const runPerformance = info.project.metadata.performance?.toLowerCase() === 'true' || false;
  const runBrowserMetrics = info.project.metadata.browserMetrics?.toLowerCase() === 'true' || false;
  const runI18n = info.project.metadata.i18n?.toLowerCase() === 'true' || false;
  const runDesign = info.project.metadata.designHygiene?.toLowerCase() === 'true' || false;

  console.log(`A11y=${runA11y}; performance=${runPerformance}; browserMetrics=${runBrowserMetrics};i18n=${runI18n}`);
  if (runPerformance) {
    await getPerformanceMetrics(page, taskName, scenario, step, description, userStart, requestSent);
  }
  userActionCount++;
  if (runA11y) {
    checkAllyViolations(page, description, taskName, scenario, step);
  }
  if (runBrowserMetrics) {
    await getBrowserMetrics(page, description, taskName, scenario, step);
  }
  if (runI18n) {
    await checkI18N(page, description, taskName, scenario, step);
  }
  if (runDesign) {
    await getDesignHygieneMetrics(page, description, taskName, scenario, step);
  }
  console.log(`--- END of Action ${description} ---\n`);
}

/**
 * Formats the task/spec filename:
 * - Removes .spec.ts / .spec.js / .ts / .js
 * - Replaces - and _ with spaces
 * - Capitalizes each word
 */
function formatTaskName(fileName) {
  return fileName
    .replace(/\.(spec|test)?\.(ts|js)$/i, '')
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function writeQUM(testInfo) {
  const runA11y = testInfo.project.metadata.a11y?.toLowerCase() === 'true' || false;
  const runPerformance = testInfo.project.metadata.performance?.toLowerCase() === 'true' || false;
  const runBrowserMetrics = testInfo.project.metadata.browserMetrics?.toLowerCase() === 'true' || false;
  const runI18N = testInfo.project.metadata.i18n?.toLowerCase() === 'true' || false;
  const runDesign = testInfo.project.metadata.designHygiene?.toLowerCase() === 'true' || false;

  console.log(`In writeQUM a11y=${testInfo.project.metadata.a11y} ,
     performance Metrics=${testInfo.project.metadata.performance}
     browser Metrics=${testInfo.project.metadata.browserMetrics}
     i18n Metrics= ${testInfo.project.metadata.i18n}
     designHygiene Metrics=${runDesign}`);
  return runA11y || runPerformance || runBrowserMetrics || runI18N || runDesign;
}

export function writeQUMFiles(testInfo) {
  if (writeQUM(testInfo)) {
    try {
      const fileName = path.basename(testInfo.file).replace('.spec.js', '');
      const filePath = testInfo.project.metadata.screenshotDir;
      const persona = testInfo.project.metadata?.persona ?? 'user';
      writePerformanceMetricsToFile(fileName, filePath, persona);
      writeA11yMetricsToFile(fileName, filePath, persona);
      writeBrowserMetricsToFile(fileName, filePath, persona);
      writeI18NMetricsToFile(fileName, filePath, persona);
      writeDesignMetricsToFile(fileName, filePath, persona);
      console.log('✅ Metrics written successfully');
    } catch (err) {
      console.error('⚠️ Failed to write metrics:', err);
    }
  }
}