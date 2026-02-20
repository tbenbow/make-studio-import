import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const measurements = await page.evaluate(`(() => {
    const results = {};
    
    // Get all major sections
    const sections = [];
    const mainEl = document.querySelector('main') || document.body;
    const directChildren = mainEl.children;
    
    for (let i = 0; i < directChildren.length; i++) {
      const el = directChildren[i];
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      if (r.height > 20) {
        const sectionInfo = {
          index: i,
          tag: el.tagName.toLowerCase(),
          top: Math.round(r.top + window.scrollY),
          height: Math.round(r.height),
          bg: s.backgroundColor,
          className: (el.className || '').toString().slice(0, 120),
          id: el.id || '',
        };
        
        // Get headings
        const headings = el.querySelectorAll('h1, h2, h3');
        const hTexts = [];
        for (let j = 0; j < headings.length && j < 3; j++) {
          hTexts.push({
            tag: headings[j].tagName.toLowerCase(),
            text: headings[j].textContent.trim().slice(0, 100),
          });
        }
        sectionInfo.headings = hTexts;
        
        // Get images
        const imgs = el.querySelectorAll('img');
        const imgCount = imgs.length;
        sectionInfo.imageCount = imgCount;
        
        // Get links/buttons
        const links = el.querySelectorAll('a[href]');
        const linkCount = links.length;
        sectionInfo.linkCount = linkCount;
        
        // Get paragraphs
        const paras = el.querySelectorAll('p');
        const paraCount = paras.length;
        sectionInfo.paragraphCount = paraCount;
        
        sections.push(sectionInfo);
      }
    }
    results.sections = sections;
    results.totalSections = sections.length;
    
    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
