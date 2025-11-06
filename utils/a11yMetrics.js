import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const allyData = [];
export const performanceData = {};

export function checkAllyViolations(page, action, task, scenario, step) {
  console.log(`\n--- Accessibility Check ---`);
  if (page.isClosed()) {
    console.log('Page is closed, skipping accessibility check.');
    return;
  }

  const axe = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']);
  console.log('Running accessibility checks with axe-core...');

  (async () => {
    const a11yResults = await axe.analyze({ timeout: 5000 });
    const a11yViolations = [];
    if (a11yResults?.violations?.length) {
      console.log(`⚠️ ${a11yResults.violations.length} accessibility violations found on action: ${action}`);
      for (const violation of a11yResults.violations) {
        for (const node of violation.nodes) {
          try {
            const selector = node.target[0];
            const el = page.locator(selector);
            a11yViolations.push({
              rule: violation.id,
              impact: violation.impact,
              description: violation.description,
              helpUrl: violation.helpUrl,
              level: violation.tags,
              selector,
              element: node.html,
            });

          } catch (error) {
            console.error(`Could not capture screenshot for a11y violation. ${error.message} `);

          }
        }
      }
    }
    if (a11yViolations.length > 0) {
      allyData.push({
        task,
        scenario,
        step,
        action,
        accessibilityViolations: a11yViolations.length,
        violations: a11yViolations
      });
    }
  })();
}

export function writeA11yMetricsToFile(fileName = 'allyMetrics', filePath, persona) {
  if (allyData.length > 0) {
    fileName = fileName + ".json"
    const METRICS_FILE = path.join(filePath, "ally", fileName);
    const dir = path.dirname(METRICS_FILE);
    // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    Object.assign(performanceData, {
      persona: persona,
      results: allyData
    });
    console.log(allyData.length + ' total steps recorded so far.');
    fs.writeFileSync(METRICS_FILE, JSON.stringify(performanceData, null, 2), 'utf-8');
    console.log(`✅ A11y metrics written to ${METRICS_FILE}`);
  }
}