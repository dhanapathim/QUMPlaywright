import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";


const targetLang = process.env.TARGET_LANG || "en";
const supportLangs = (process.env.supportLangs || "")
  .split(',')
  .map(l => l.trim())
  .filter(Boolean);

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const I18N_MODEL = process.env.I18N_MODEL || "gemini-1.5-flash";

const llm = new ChatGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
  model: I18N_MODEL,
});

const i18nData = [];
const langCache = new Map(); // 🧠 Cache repeated strings

/** Main entry */
export async function checkI18N(page, action, task, scenario, step) {
  console.log(`\n--- 🌐 Starting i18N Check --- `);
  const startTime = Date.now();
  if (page.isClosed()) {
    console.warn('⚠️ Page is closed, skipping i18n check.');
    return;
  }

  const extractedData = await getDomElementsWithData(page);
  if (!extractedData || Object.keys(extractedData).length === 0) {
    console.log('No text elements found.');
    return;
  }

  // 🧩 Chunk input for LLM
  const chunks = getChunks(extractedData, 40);
  console.log(`Total chunks: ${chunks.length}`);

  const limit = pLimit(3); // control concurrency
  const i18nList = [];

  const results = await Promise.allSettled(
    chunks.map(chunk => limit(() => getMisMatchedWords(chunk)))
  );

  for (const res of results) {
    if (res.status === 'fulfilled' && res.value) {
      i18nList.push(res.value);
    }
  }

  if (i18nList.length > 0) {     
    const totalMismatchedCount=getCount(i18nList);
    i18nData.push({
      task,
      scenario,
      step,
      action,
      totalMisMatchWords: totalMismatchedCount,
      misMatchWords: i18nList.flat(),
    });
  }
  const endTime = Date.now(); // 🕒 End timer
  const durationMs = endTime - startTime;
  const durationSec = (durationMs / 1000).toFixed(2);
  const durationMin = (durationMs / 60000).toFixed(2);
  console.log(`✅ i18N completed in ${durationSec}s (${durationMin} min). Found ${i18nList.length} chunks with mismatches.`);
}

/** DOM traversal + text extraction */
async function getDomElementsWithData(page) {
  console.log("🔍 Extracting DOM text data...");
  const extractedData = await page.evaluate(() => {
    const results = {};
    const IGNORED_TAGS = new Set(['html', 'head', 'meta', 'script', 'style', 'link', 'noscript']);

    function getFullXPath(el) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
      const segments = [];
      let current = el;
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        const tag = current.nodeName.toLowerCase();
        let index = 1;
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children)
            .filter(sib => sib.nodeName === current.nodeName);
          if (siblings.length > 1) index = siblings.indexOf(current) + 1;
        }
        segments.unshift(`${tag}[${index}]`);
        current = current.parentElement;
      }
      return '/' + segments.join('/');
    }

    function getDirectText(el) {
      return Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0)
        .map(node => node.textContent.trim())
        .join(' ')
        .trim() || null;
    }

    function traverse(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tagName = node.nodeName.toLowerCase();
      if (IGNORED_TAGS.has(tagName)) return;

      const xpath = getFullXPath(node);
      const innerText = getDirectText(node);
      const title = node.getAttribute('title');
      const placeholder = node.getAttribute('placeholder');
      const altText = node.getAttribute('alt');
      const ariaLabel = node.getAttribute('aria-label');
      const value = node.value;

      if (innerText || title || placeholder || altText || ariaLabel || value) {
        results[xpath] = { innerText, title, placeholder, altText, ariaLabel, value };
      }

      for (const child of node.children) traverse(child);
    }

    traverse(document.body);
    return results;
  });

  // 🧹 Filter irrelevant / short text
 /* for (const [path, obj] of Object.entries(extractedData)) {
    for (const key in obj) {
      const val = obj[key];
      if (!val || val.trim().length < 3 || /^\W+$/.test(val)) delete obj[key];
    }
    if (Object.keys(obj).length === 0) delete extractedData[path];
  }*/

  console.log(`✅ Extracted ${Object.keys(extractedData).length} elements.`);
  return extractedData;
}

/** Batch splitting */
function getChunks(data, size = 40) {
  const entries = Object.entries(data);
  const chunks = [];
  for (let i = 0; i < entries.length; i += size) {
    chunks.push(Object.fromEntries(entries.slice(i, i + size)));
  }
  return chunks;
}

/** Invoke LLM + parse result */
async function getMisMatchedWords(data) {
  const cacheKey = JSON.stringify(data);
  if (langCache.has(cacheKey)) return langCache.get(cacheKey);

  const prompt = `
You are a multilingual text auditor.
Analyze UI text data and detect mismatched language words.

Allowed languages: ${JSON.stringify([targetLang, ...supportLangs])}

**Do not include elements that have no mismatched words.**
**Do not include empty 'mismatches' objects or fields with empty arrays.**


Return only pure JSON (no markdown, no commentary) matching this schema:
[
  {
    "element": "xpath",
    "mismatches": {
      "innerText": [{"word": "text", "lang": "xx"}],
      "placeholder": [{"word": "text", "lang": "xx"}],
      "altText": [{"word": "text", "lang": "xx"}],
      "ariaLabel": [{"word": "text", "lang": "xx"}],
      "title": [{"word": "text", "lang": "xx"}],
      "value": [{"word": "text", "lang": "xx"}]
    }
  }
]

Input:
${JSON.stringify(data, null, 2)}
`;

  try {
    const result = await llm.invoke([{ role: "user", content: prompt }]);
    let raw = result?.content?.toString() || "";

    // 🧹 Clean any backticks or markdown
    raw = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/^[^{[]+/, "")
      .replace(/[^}\]]+$/, "")
      .trim();

    const parsed = JSON.parse(raw);
    langCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error("❌ LLM error or parse failure:", err.message);
    return null;
  }
}

/** Write to file */
export function writeI18NMetricsToFile(fileName = 'i18nMetrics', filePath) {
  if (i18nData.length === 0) {
    console.log("ℹ️ No i18n data to write.");
    return;
  }

  const dir = path.join(filePath, "i18n");
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${fileName}.json`);
  fs.writeFileSync(file, JSON.stringify(i18nData, null, 2), 'utf-8');
  console.log(`✅ i18n metrics written to ${file}`);
}
function getCount(i18nList){
// Ensure everything is parsed JSON objects
const parsedList = i18nList.flatMap(item => {
    if (typeof item === "string") {
      try {
        return JSON.parse(item);
      } catch {
        return [];
      }
    }
    return item;
  });
  const totalMismatchedCount = parsedList.reduce((total, item) => {
    if (item && item.mismatches) {
      for (const field in item.mismatches) {
        if (Array.isArray(item.mismatches[field])) {
          total += item.mismatches[field].length;
        }
      }
    }
    return total;
  }, 0);
  
  console.log("Total mismatched words:", totalMismatchedCount);
    return totalMismatchedCount;
}
