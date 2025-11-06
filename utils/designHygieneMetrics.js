import fs from 'fs';
import path from 'path';

const designData = [];
export async function getDesignHygieneMetrics(page, action, task, scenario, step) {
  console.log(`\n--- Design Hygiene Check ---`);
  if (page.isClosed()) {
    console.log('Page is closed, skipping accessibility check.');
    return;
  }
  // 🔹 2. Define CSS properties to audit
  const properties = [
    'font-family',
    'font-size',
    'font-weight',
    'text-decoration-line',
    'color',
    'background-color',
    'outline-color',
    'border-top-color',
    'border-bottom-color',
    'border-left-color',
    'border-right-color',
    'background-image',
    'text-decoration-color',
    'box-shadow',
    'z-index',
    'margin-top',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'padding-top',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius'
  ];

  // 🔹 3. Evaluate styles inside the page
  const results = await page.evaluate((properties) => {
    const allElements = Array.from(document.querySelectorAll('*'));
    const summary = {};

    for (const prop of properties) {
      const values = new Set();
      for (const el of allElements) {
        const style = getComputedStyle(el);
        values.add(style.getPropertyValue(prop));
      }
      summary[prop] = {
        count: values.size,
        uniqueValues: Array.from(values).sort(),
      };
    }

    return summary;
  }, properties);

  if (results!=null) {
    //const data= JSON.stringify(results, null, 2);
    designData.push({
      task,
      scenario,
      step,
      action,
      checkDesignHygiene: results
    });
}

}
/** Write to file */
export function writeDesignMetricsToFile(fileName = 'designHygiene', filePath) {
    if (designData.length === 0) {
      console.log("ℹ️ No design hygiene data to write.");
      return;
    }
  
    const dir = path.join(filePath, "designHygiene");
    fs.mkdirSync(dir, { recursive: true });
  
    const file = path.join(dir, `${fileName}.json`);
    fs.writeFileSync(file, JSON.stringify(designData, null, 2), 'utf-8');
    console.log(`✅ design hygiene metrics written to ${file}`);
  }