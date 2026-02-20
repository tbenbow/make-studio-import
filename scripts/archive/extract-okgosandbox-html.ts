import { chromium } from 'playwright';
import * as fs from 'fs';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get main content
  const mainHtml = await page.evaluate(`document.querySelector('main')?.outerHTML || ''`);
  
  // Save to file for analysis
  const outputPath = '/tmp/okgosandbox-home-html.txt';
  fs.writeFileSync(outputPath, mainHtml);
  
  console.log(`Saved HTML to ${outputPath}`);
  console.log(`HTML length: ${mainHtml.length} characters`);
  
  // Get structure info
  const info = await page.evaluate(`(() => {
    const main = document.querySelector('main');
    const lessonElements = main.querySelectorAll('.lesson');
    
    return {
      totalLessons: lessonElements.length,
      lessons: Array.from(lessonElements).map((el, idx) => ({
        index: idx,
        hasAside: !!el.querySelector('aside'),
        hasContent: !!el.querySelector('.lesson__content'),
        hasImages: el.querySelectorAll('img').length,
        hasHeading: !!el.querySelector('h1, h2, h3'),
        heading: el.querySelector('h1, h2, h3')?.textContent.trim().slice(0, 100) || null,
        hasLink: !!el.querySelector('a'),
        linkText: el.querySelector('a')?.textContent.trim().slice(0, 50) || null,
        isAlt: el.classList.contains('lesson--alt'),
      }))
    };
  })()`);

  console.log('\n=== LESSON STRUCTURE ===');
  console.log(JSON.stringify(info, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
