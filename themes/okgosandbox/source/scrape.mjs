import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });

// Full page screenshot
await page.screenshot({ path: 'themes/okgosandbox/source/homepage-full.png', fullPage: true });

// Extract computed styles for key elements
const analysis = await page.evaluate(() => {
  const getStyles = (el) => {
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius,
      boxShadow: cs.boxShadow,
      border: cs.border,
    };
  };

  const results = {};

  // Get all unique colors and fonts
  const allElements = document.querySelectorAll('*');
  const colors = new Set();
  const bgColors = new Set();
  const fonts = new Set();
  const fontSizes = new Map();

  allElements.forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') colors.add(cs.color);
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(cs.backgroundColor);
    if (cs.fontFamily) fonts.add(cs.fontFamily);
    const tag = el.tagName.toLowerCase();
    if (['h1','h2','h3','h4','h5','h6','p','a','span','button','li'].includes(tag)) {
      const key = `${tag}:${cs.fontSize}:${cs.fontWeight}`;
      if (!fontSizes.has(key)) {
        fontSizes.set(key, { tag, fontSize: cs.fontSize, fontWeight: cs.fontWeight, text: el.textContent?.trim().substring(0, 50) });
      }
    }
  });

  results.colors = [...colors];
  results.bgColors = [...bgColors];
  results.fonts = [...fonts];
  results.fontSizes = [...fontSizes.values()];

  // Analyze specific sections
  const nav = document.querySelector('nav, header, [class*="nav"]');
  if (nav) results.navStyles = getStyles(nav);

  const hero = document.querySelector('h1, [class*="hero"]');
  if (hero) {
    results.heroStyles = getStyles(hero);
    results.heroText = hero.textContent?.trim();
  }

  // Find buttons
  const buttons = document.querySelectorAll('a[class*="btn"], button, [class*="button"], a[href*="results"]');
  results.buttons = [...buttons].map(b => ({
    text: b.textContent?.trim().substring(0, 40),
    styles: getStyles(b),
    classes: b.className,
  }));

  // Find cards
  const cards = document.querySelectorAll('[class*="card"], article, [class*="lesson"]');
  results.cards = [...cards].slice(0, 2).map(c => ({
    styles: getStyles(c),
    classes: c.className,
    html: c.outerHTML.substring(0, 500),
  }));

  // Get the outer HTML of each major section
  const sections = document.querySelectorAll('section, [class*="section"], main > div');
  results.sectionCount = sections.length;
  results.sections = [...sections].map((s, i) => ({
    index: i,
    tag: s.tagName,
    classes: s.className,
    styles: getStyles(s),
    childCount: s.children.length,
    text: s.textContent?.trim().substring(0, 200),
  }));

  // Full page HTML
  results.bodyHTML = document.body.innerHTML;

  return results;
});

// Write analysis
const fs = await import('fs');
fs.writeFileSync('themes/okgosandbox/source/analysis.json', JSON.stringify(analysis, null, 2));

// Write full HTML
fs.writeFileSync('themes/okgosandbox/source/homepage.html', analysis.bodyHTML);
delete analysis.bodyHTML;

console.log('=== COLORS ===');
console.log('Text colors:', analysis.colors);
console.log('BG colors:', analysis.bgColors);
console.log('\n=== FONTS ===');
console.log(analysis.fonts);
console.log('\n=== FONT SIZES ===');
analysis.fontSizes.forEach(f => console.log(`  ${f.tag} ${f.fontSize} w${f.fontWeight}: "${f.text}"`));
console.log('\n=== HERO ===');
console.log(analysis.heroText);
console.log(analysis.heroStyles);
console.log('\n=== BUTTONS ===');
analysis.buttons.forEach(b => console.log(b.text, b.styles.backgroundColor, b.styles.color, b.styles.borderRadius, b.styles.padding));
console.log('\n=== CARDS ===');
analysis.cards.forEach(c => console.log(c.styles.backgroundColor, c.styles.boxShadow, c.styles.borderRadius, c.classes));
console.log('\n=== SECTIONS ===');
analysis.sections.forEach(s => console.log(`  [${s.index}] <${s.tag}> .${s.classes?.substring(0,60)} bg:${s.styles.backgroundColor} children:${s.childCount}`));

await browser.close();
