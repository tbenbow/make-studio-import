import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Get the HTML structure
  const html = await page.content();
  
  // Extract key structural information
  const structure = await page.evaluate(`(() => {
    const result = {};
    
    // Get body children
    const body = document.body;
    result.bodyChildrenCount = body.children.length;
    
    // Get main element structure
    const main = document.querySelector('main');
    if (main) {
      result.main = {
        childCount: main.children.length,
        children: []
      };
      
      for (let i = 0; i < main.children.length; i++) {
        const child = main.children[i];
        const r = child.getBoundingClientRect();
        const s = window.getComputedStyle(child);
        
        result.main.children.push({
          index: i,
          tag: child.tagName.toLowerCase(),
          className: (child.className || '').slice(0, 200),
          id: child.id || '',
          height: Math.round(r.height),
          hasImages: child.querySelectorAll('img').length > 0,
          imageCount: child.querySelectorAll('img').length,
          hasHeadings: child.querySelectorAll('h1, h2, h3, h4').length > 0,
          headingCount: child.querySelectorAll('h1, h2, h3, h4').length,
          firstHeading: child.querySelector('h1, h2, h3, h4')?.textContent.trim().slice(0, 80) || null,
          backgroundColor: s.backgroundColor,
          display: s.display,
          flexDirection: s.flexDirection,
        });
      }
    }
    
    // Get header
    const header = document.querySelector('header');
    if (header) {
      result.header = {
        childCount: header.children.length,
        height: Math.round(header.getBoundingClientRect().height),
        text: header.textContent.trim().slice(0, 100),
      };
    }
    
    // Get footer
    const footer = document.querySelector('footer');
    if (footer) {
      result.footer = {
        childCount: footer.children.length,
        height: Math.round(footer.getBoundingClientRect().height),
        text: footer.textContent.trim().slice(0, 100),
      };
    }
    
    return result;
  })()`);

  console.log('=== STRUCTURE ===');
  console.log(JSON.stringify(structure, null, 2));
  
  // Save HTML snippet
  const mainContent = await page.evaluate(`document.querySelector('main')?.outerHTML || ''`);
  console.log('\n=== HTML STRUCTURE (first 2000 chars) ===');
  console.log(mainContent.slice(0, 2000));
  
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
