import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(`(() => {
    const results = {};

    // H1
    const h1 = document.querySelector('h1');
    if (h1) {
      const s = window.getComputedStyle(h1);
      results['h1'] = {
        text: h1.textContent.trim().slice(0, 40),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        textTransform: s.textTransform,
        marginBottom: s.marginBottom,
      };
    }

    // Main image
    const imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var ir = imgs[i].getBoundingClientRect();
      if (ir.width > 400 && ir.height > 200) {
        results['hero-image'] = {
          width: Math.round(ir.width),
          height: Math.round(ir.height),
          top: Math.round(ir.top),
          left: Math.round(ir.left),
          src: imgs[i].getAttribute('src').slice(0, 80),
        };
        break;
      }
    }

    // Newsletter / signup box - look for form or input
    var inputs = document.querySelectorAll('input[type="email"], input[type="text"], form');
    for (var i = 0; i < inputs.length; i++) {
      var panel = inputs[i].closest('div[class]');
      if (panel) {
        var pr = panel.getBoundingClientRect();
        var ps = window.getComputedStyle(panel);
        // Walk up to find the card container
        var card = panel;
        while (card && (!window.getComputedStyle(card).boxShadow || window.getComputedStyle(card).boxShadow === 'none')) {
          card = card.parentElement;
        }
        if (card) {
          var cr = card.getBoundingClientRect();
          var cs2 = window.getComputedStyle(card);
          results['newsletter-card'] = {
            width: Math.round(cr.width),
            height: Math.round(cr.height),
            top: Math.round(cr.top),
            left: Math.round(cr.left),
            right: Math.round(cr.right),
            padding: cs2.paddingTop + ' ' + cs2.paddingRight + ' ' + cs2.paddingBottom + ' ' + cs2.paddingLeft,
            bg: cs2.backgroundColor,
            shadow: cs2.boxShadow.slice(0, 60),
          };
        }
        results['newsletter-input'] = {
          width: Math.round(pr.width),
          top: Math.round(pr.top),
        };
        break;
      }
    }

    // Body text paragraphs
    var paragraphs = document.querySelectorAll('p');
    var bodyTexts = [];
    for (var i = 0; i < paragraphs.length; i++) {
      var pt = paragraphs[i].textContent.trim();
      if (pt.length > 50) {
        var ps = window.getComputedStyle(paragraphs[i]);
        var pr = paragraphs[i].getBoundingClientRect();
        bodyTexts.push({
          text: pt.slice(0, 80),
          fontSize: ps.fontSize,
          lineHeight: ps.lineHeight,
          color: ps.color,
          width: Math.round(pr.width),
          left: Math.round(pr.left),
          top: Math.round(pr.top),
        });
      }
    }
    results['body-paragraphs'] = bodyTexts.slice(0, 5);

    // Overall content container
    var allDivs = document.querySelectorAll('div');
    for (var i = 0; i < allDivs.length; i++) {
      var d = allDivs[i];
      var dr = d.getBoundingClientRect();
      var ds = window.getComputedStyle(d);
      if (dr.width > 800 && dr.width < 1300 && ds.maxWidth && ds.maxWidth !== 'none') {
        results['content-container'] = {
          maxWidth: ds.maxWidth,
          width: Math.round(dr.width),
          left: Math.round(dr.left),
          padding: ds.paddingLeft + ' ' + ds.paddingRight,
        };
        break;
      }
    }

    // Sections
    var sections = document.querySelectorAll('section, main');
    for (var i = 0; i < Math.min(sections.length, 5); i++) {
      var sr = sections[i].getBoundingClientRect();
      var ss = window.getComputedStyle(sections[i]);
      var heading = sections[i].querySelector('h1, h2, h3');
      results['section-' + i] = {
        tag: sections[i].tagName.toLowerCase(),
        width: Math.round(sr.width),
        height: Math.round(sr.height),
        padding: ss.paddingTop + ' ' + ss.paddingRight + ' ' + ss.paddingBottom + ' ' + ss.paddingLeft,
        bg: ss.backgroundColor,
        heading: heading ? heading.textContent.trim().slice(0, 40) : null,
      };
    }

    // Newsletter heading
    var h2s = document.querySelectorAll('h2, h3, h4');
    for (var i = 0; i < h2s.length; i++) {
      if (h2s[i].textContent.trim().toLowerCase().includes('newsletter')) {
        var ns = window.getComputedStyle(h2s[i]);
        results['newsletter-heading'] = {
          text: h2s[i].textContent.trim(),
          fontSize: ns.fontSize,
          fontWeight: ns.fontWeight,
          textTransform: ns.textTransform,
        };
        break;
      }
    }

    // Button/submit
    var btns = document.querySelectorAll('button, input[type="submit"], a[class*="bg-"]');
    for (var i = 0; i < btns.length; i++) {
      var bt = btns[i].textContent.trim();
      if (bt.toLowerCase().includes('subscribe') || bt.toLowerCase().includes('sign') || bt.toLowerCase().includes('submit')) {
        var bs = window.getComputedStyle(btns[i]);
        var br = btns[i].getBoundingClientRect();
        results['subscribe-button'] = {
          text: bt,
          width: Math.round(br.width),
          height: Math.round(br.height),
          bg: bs.backgroundColor,
          fontSize: bs.fontSize,
          fontWeight: bs.fontWeight,
        };
        break;
      }
    }

    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
