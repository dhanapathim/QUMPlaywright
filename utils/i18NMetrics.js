import fs from 'fs';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import path from 'path';
import { franc } from 'franc';

const targetLang = process.env.TARGET_LANG;
const supportLangs = process.env.supportLangs ? process.env.supportLangs.split(',').map(l => l.trim()).filter(Boolean) : [];

const GOOGLE_API_KEY = process.env.GEN_AI_API_KEY;
const I18N_MODEL = process.env.GEN_AI_MODEL;
const i18nData = [];

if (process.env.GOOGLE_API_KEY && process.env.I18N_MODEL) {
  llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: process.env.I18N_MODEL,
  });
} else {
  console.warn(
    "[WARN] Google Generative AI not initialized — missing GOOGLE_API_KEY or I18N_MODEL."
  );
}

async function checkI18N(page, action, task, scenario, step) {
    console.log(`\n--- i18N Check ---`);
    if (page.isClosed()) {
        console.log('Page is closed, skipping accessibility check.');
        return;
    }
    const extractedData = await getDomElementsWithData(page);
    //console.log("expectedData=",extractedData);
    //if(expectedData.length)
    //const chunks = getChunks(expectedData, 50);
    //let i18nList = [];
    const entries = Object.entries(extractedData);
    console.log("extraceed Eelement:",entries.length);
    console.log("ex data:",entries[0]);
   /* const chunks = [];
    for (let i = 0; i < entries.length; i += 50) {
        const sliced = Object.fromEntries(entries.slice(i, i + 50));
        chunks.push(sliced);
    }
    console.log("chunks= ",chunks.length);
    for (let i = 0; i < chunks.length; i++) {
        const mismatchWords = await getMisMatchedWords(chunks[i]);
        //console.log("mismatchWord are "+mismatchWords);
        if (mismatchWords != null) {
            i18nList.push(mismatchWords);
        }
        console.log("i18NData list=",i18nList.length);
    }*/

   const mism=misMFranc(extractedData);
   const i18nList=mism.mismatchResults;
   const wordCount=mism.wordCount;

    if (i18nList!= null) {
        i18nData.push({
            task,
            scenario,
            step,
            action,
            //accessibilityViolations: a11yViolations.length,
            misMatchWordsCount: wordCount,
            misMatchWords: i18nList
        });
    }
}

async function getDomElementsWithData(page) {
    //await autoScroll(page);
    //console.log("page scrolled times=",count);
    // 1️⃣ Extract all direct text-related attributes with XPath
    console.log("Inside getDomElementsWithData");
    const extractedData = await page.evaluate(() => {
        const results = {};
        const IGNORED_TAGS = new Set(['html', 'head', 'meta', 'script', 'style', 'link', 'noscript']);

        // Generate full absolute XPath
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

        // Extract only *direct* text nodes from an element (exclude children)
        function getDirectText(el) {
            return Array.from(el.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0)
                .map(node => node.textContent.trim())
                .join(' ')
                .trim() || null;
        }

        // Recursive traversal
        function traverse(node) {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const tagName = node.nodeName.toLowerCase();
            if (IGNORED_TAGS.has(tagName)) return;

            const xpath = getFullXPath(node);

            const innerText = getDirectText(node);
            const title = node.getAttribute('title') || null;
            const placeholder = node.getAttribute('placeholder') || null;
            const altText = node.getAttribute('alt') || null;
            const ariaLabel = node.getAttribute('aria-label') || null;
            const value = node.value || null;

            // Include only if at least one has a value
            if (innerText || title || placeholder || altText || ariaLabel || value) {
                results[xpath] = { innerText, title, placeholder, altText, ariaLabel, value };
            }

            for (const child of node.children) traverse(child);
        }

        traverse(document.body);
        return results;
    });
    //console.log("expectedData=",extractedData);
    return extractedData;
}
function getChunks(extractedData, sliceSize = 50) {
    console.log("inside chunks");
    const entries = Object.entries(extractedData);
    const chunks = [];
    for (let i = 0; i < entries.length; i += sliceSize) {
        const sliced = Object.fromEntries(entries.slice(i, i + sliceSize));
        chunks.push(sliced);
    }
    return chunks;
}

export function writeI18NMetricsToFile(fileName = 'i18nMetrics', filePath) {
    console.log("Inside i18n write");
    if (i18nData.length > 0) {
        fileName = fileName + ".json"
        const METRICS_FILE = path.join(filePath, "i18n", fileName);
        const dir = path.dirname(METRICS_FILE);
        // ✅ 1. Ensure directory exists (recursive = create nested folders if missing)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        console.log(i18nData.length + ' total steps recorded so far.');
        fs.writeFileSync(METRICS_FILE, JSON.stringify(i18nData, null, 2), 'utf-8');
        console.log(`✅ i18n metrics written to ${METRICS_FILE}`);
    }
}
async function getMisMatchedWords(data) {
    console.log("inside getMismatch");
   

    const prompt = `
You are a multilingual text auditor.

You will receive an array of UI element data objects. Each object has:
- "xpath" as the key
- The value is an object containing possible text fields: innerText, title, placeholder, altText, ariaLabel, value (some may be null).

Example input:
{
  "/html[1]/body[1]/div[1]/span": {
    "innerText": "Prodotto di fiducia per migliaia ok Brand",
    "title": "thhe",
    "placeholder": null,
    "altText": null,
    "ariaLabel": "test",
    "value": null
  }
}

Your task:
1. For each non-null text field, detect the language of each word or phrase using ISO 639-1 codes (en, it, fr, de, es, ja, etc.).
2. Ignore numbers and punctuation.
3. Compare each detected language with the allowed languages: ${JSON.stringify([targetLang, ...supportLangs])}.
4. If a word’s detected language is NOT one of the allowed languages, include it in the output under its corresponding field.
5. Include only elements with at least one mismatch.
6. Do not include null fields or empty arrays.
7. Output must be **pure JSON**, with no markdown formatting, no code fences, no explanations, no commentary.

Return output matching exactly this JSON structure:
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

Return only valid JSON. Do not wrap your output in markdown, triple backticks, or add any text before or after.

Input:
${JSON.stringify(data, null, 2)}
`;

    try {
        const result = await llm.invoke(prompt);
        if (result.content.length > 0) {
            let raw = result.content;

            // 🧹 Clean up any Markdown fences or stray backticks the model adds
            raw = raw
                .replace(/```json/g, '')   // remove ```json
                .replace(/```/g, '')       // remove ```
                .replace(/^[^{[]+/, '')    // remove anything before first { or [
                .replace(/[^}\]]+$/, '')   // remove anything after last } or ]
                .trim();
            const parsed = JSON.parse(raw);
            //console.log("Parsed result:", JSON.stringify(parsed[0], null, 2));
            //const outputPath = 'brandwatch_newi18NGen.json';
            //fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf-8');
            return JSON.stringify(parsed, null, 2);
        }
    } catch (err) {
        console.error("error occured while get the mismatch the words: ");
    }
    return null;
}

function misMFranc(extractedData)
{
    console.log("Inside misMfranc");
    const targetLang = 'eng'; // ISO 639-3 for Italian
    const mismatchResults = {};
    let wordCount=0;
    for (const [xpath, attrs] of Object.entries(extractedData)) {
      const elementMismatches = {};
  
      for (const [key, text] of Object.entries(attrs)) {
        if (!text) continue;
  
        const words = text.split(/\s+/).filter(w => w.length > 1);
        const nonItalianWords = [];
  
        for (const word of words) {
          const detectedLang = franc(word, { minLength: 2 });
          if (detectedLang !== targetLang) {
            nonItalianWords.push(word);
            wordCount++;
          }
        }
  
        if (nonItalianWords.length > 0) {
          elementMismatches[key] = nonItalianWords;
        }
      }
  
      if (Object.keys(elementMismatches).length > 0) {
        mismatchResults[xpath] = elementMismatches;
      }
    }
    console.log("word count:",wordCount);
    return {mismatchResults,wordCount};
}

async function autoScroll(page, step = 800, delay = 500) {
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    while (true) {
        // Scroll down step by step
        await page.evaluate(step => {
            window.scrollBy(0, step);
        }, step);

        // Wait for network/lazy-loaded elements
        //await page.waitForTimeout(delay);

        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === lastHeight) break;
        lastHeight = newHeight;
    }
}

export { checkI18N };
