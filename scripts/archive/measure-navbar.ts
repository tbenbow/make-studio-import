import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(`(() => {
    var results = {};
    
    // Header element
    var header = document.querySelector('header, nav, [class*="nav"], [class*="header"]');
    if (header) {
      var hs = window.getComputedStyle(header);
      var hr = header.getBoundingClientRect();
      results['header'] = {
        height: Math.round(hr.height),
        bg: hs.backgroundColor,
        position: hs.position,
      };
    }
    
    // Logo
    var logo = document.querySelector('header img, nav img, [class*="logo"] img');
    if (logo) {
      var lr = logo.getBoundingClientRect();
      results['logo'] = {
        width: Math.round(lr.width),
        height: Math.round(lr.height),
        left: Math.round(lr.left),
        centerX: Math.round(lr.left + lr.width / 2),
      };
    }
    
    // Nav links
    var navLinks = document.querySelectorAll('header a, nav a');
    var links = [];
    for (var i = 0; i < navLinks.length; i++) {
      var a = navLinks[i];
      var ar = a.getBoundingClientRect();
      var as = window.getComputedStyle(a);
      if (ar.top < 100 && ar.height > 0) {
        links.push({
          text: a.textContent.trim().slice(0, 30),
          left: Math.round(ar.left),
          top: Math.round(ar.top),
          fontSize: as.fontSize,
          fontWeight: as.fontWeight,
          color: as.color,
          textTransform: as.textTransform,
          isButton: as.backgroundColor !== 'rgba(0, 0, 0, 0)' && as.backgroundColor !== 'transparent',
          bg: as.backgroundColor,
        });
      }
    }
    results['links'] = links;
    
    // Buttons in header
    var buttons = document.querySelectorAll('header button, nav button');
    var btns = [];
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var br = b.getBoundingClientRect();
      var bs = window.getComputedStyle(b);
      if (br.top < 100) {
        btns.push({
          text: b.textContent.trim().slice(0, 30),
          left: Math.round(br.left),
          width: Math.round(br.width),
          bg: bs.backgroundColor,
          color: bs.color,
        });
      }
    }
    results['buttons'] = btns;
    
    // Check for email icon/link
    var allHeaderLinks = document.querySelectorAll('header a[href*="mail"], nav a[href*="mail"], header a[aria-label*="mail"], header a[aria-label*="email"]');
    var emailLinks = [];
    for (var i = 0; i < allHeaderLinks.length; i++) {
      emailLinks.push({
        href: allHeaderLinks[i].href,
        text: allHeaderLinks[i].textContent.trim(),
      });
    }
    results['emailLinks'] = emailLinks;
    
    // Page width reference
    results['viewportWidth'] = window.innerWidth;
    results['viewportCenter'] = Math.round(window.innerWidth / 2);
    
    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
