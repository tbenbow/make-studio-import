import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take screenshot
  const screenshotPath = '/tmp/okgosandbox-home-full.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to ${screenshotPath}`);

  // Extract and save detailed block information
  const blockInfo = await page.evaluate(`(() => {
    const blocks = [];
    const lessons = document.querySelectorAll('.lesson');
    
    lessons.forEach((lesson, idx) => {
      const isAlt = lesson.classList.contains('lesson--alt');
      const title = lesson.querySelector('h1, h2')?.textContent.trim() || '';
      const text = lesson.querySelector('.lesson__text')?.textContent.trim() || '';
      const button = lesson.querySelector('button, a');
      const buttonText = button?.textContent.trim() || '';
      const link = lesson.querySelector('a');
      const href = link?.getAttribute('href') || '';
      const footer = lesson.querySelector('.lesson__footer');
      const topics = footer?.querySelector('p')?.textContent.trim() || '';
      
      const images = lesson.querySelectorAll('img');
      const imageCount = images.length;
      const imageInfo = Array.from(images).slice(0, 3).map(img => ({
        src: img.getAttribute('src'),
        srcset: img.getAttribute('srcset'),
        alt: img.getAttribute('alt'),
      }));
      
      blocks.push({
        index: idx,
        isHero: idx === 0,
        isAlt: isAlt,
        title,
        description: text.slice(0, 150),
        buttonText,
        link: href,
        topics,
        imageCount,
        images: imageInfo,
      });
    });
    
    return blocks;
  })()`);

  const outputPath = '/tmp/okgosandbox-block-details.json';
  fs.writeFileSync(outputPath, JSON.stringify(blockInfo, null, 2));
  console.log(`Block details saved to ${outputPath}`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
