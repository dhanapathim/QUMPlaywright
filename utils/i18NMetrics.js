import fs from 'fs';
import path from 'path';
import { franc } from 'franc';

const targetLang = process.env.TARGET_LANG;
//const supportLangs = process.env.supportLangs ? process.env.supportLangs.split(',').map(l => l.trim()).filter(Boolean) : [];

const i18nData = [];

async function checkI18N(page, action, task, scenario, step) {
    console.log(`\n--- i18N Check ---`);
    if (page.isClosed()) {
        console.log('Page is closed, skipping accessibility check.');
        return;
    }
    const extractedData = await getDomElementsWithData(page);
    const entries = Object.entries(extractedData);
    console.log("extraceed Eelement:", entries.length);
    console.log("ex data:", entries[0]);
    const mismatches = misMFranc(extractedData);
    const i18nList = mismatches.mismatchResults;
    const wordCount = mismatches.wordCount;

    if (i18nList != null) {
        i18nData.push({
            task,
            scenario,
            step,
            action,
            misMatchWordsCount: wordCount,
            misMatchWords: i18nList
        });
    }
}

async function getDomElementsWithData(page) {

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

function misMFranc(extractedData) {
    console.log("Inside misMfranc");
    const mismatchResults = {};
    let wordCount = 0;
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
    console.log("word count:", wordCount);
    return { mismatchResults, wordCount };
}

async function autoScroll(page, step = 800, delay = 500) {
    let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    while (true) {
        // Scroll down step by step
        await page.evaluate(step => {
            window.scrollBy(0, step);
        }, step);

        // Wait for network/lazy-loaded elements

        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === lastHeight) break;
        lastHeight = newHeight;
    }
}

export { checkI18N };