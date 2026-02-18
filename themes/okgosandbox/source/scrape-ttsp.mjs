import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://okgosandbox.org/this-too-shall-pass', { waitUntil: 'networkidle' });

// Full page screenshot
await page.screenshot({ path: 'themes/okgosandbox/source/ttsp-full.png', fullPage: true });

// Extract HTML
const html = await page.evaluate(() => document.body.innerHTML);
fs.writeFileSync('themes/okgosandbox/source/ttsp.html', html);

// Extract section-by-section content
const sections = await page.evaluate(() => {
  const results = [];

  // Get all major content sections
  const main = document.querySelector('main') || document.body;
  const children = main.children;

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    const cs = getComputedStyle(el);
    results.push({
      index: i,
      tag: el.tagName,
      classes: el.className?.substring?.(0, 100) || '',
      bg: cs.backgroundColor,
      html: el.outerHTML.substring(0, 2000),
      text: el.textContent?.trim().substring(0, 500),
    });
  }

  // Also get all images
  const imgs = document.querySelectorAll('img');
  const images = [...imgs].map(img => ({
    src: img.src,
    alt: img.alt,
    width: img.naturalWidth,
    height: img.naturalHeight,
  }));

  return { sections: results, images };
});

console.log('=== SECTIONS ===');
sections.sections.forEach(s => {
  console.log(`\n[${s.index}] <${s.tag}> bg:${s.bg}`);
  console.log('  text:', s.text?.substring(0, 200));
});

console.log('\n=== IMAGES ===');
sections.images.forEach(img => {
  console.log(`  ${img.src} (${img.width}x${img.height}) alt="${img.alt}"`);
});

await browser.close();
