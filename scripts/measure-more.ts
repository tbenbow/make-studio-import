import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/more', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(`(() => {
    const results = {};

    // Page header
    const h1 = document.querySelector('h1');
    if (h1) {
      const s = window.getComputedStyle(h1);
      const r = h1.getBoundingClientRect();
      results['h1'] = {
        text: h1.textContent.trim(),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        textTransform: s.textTransform,
        letterSpacing: s.letterSpacing,
        marginBottom: s.marginBottom,
        textAlign: s.textAlign,
      };
      // Subtitle after h1
      var next = h1.nextElementSibling;
      if (next) {
        var ns = window.getComputedStyle(next);
        results['subtitle'] = {
          text: next.textContent.trim().slice(0, 60),
          tag: next.tagName.toLowerCase(),
          fontSize: ns.fontSize,
          fontWeight: ns.fontWeight,
          color: ns.color,
          marginTop: ns.marginTop,
        };
      }
    }

    // Container width
    var mainContent = document.querySelector('main') || document.querySelector('[class*="container"]');
    if (mainContent) {
      var mr = mainContent.getBoundingClientRect();
      results['main'] = { width: Math.round(mr.width), left: Math.round(mr.left) };
    }

    // Section headings (video group titles)
    var h2s = document.querySelectorAll('h2');
    var sectionHeadings = [];
    for (var i = 0; i < Math.min(h2s.length, 5); i++) {
      var hs = window.getComputedStyle(h2s[i]);
      sectionHeadings.push({
        text: h2s[i].textContent.trim().slice(0, 40),
        fontSize: hs.fontSize,
        fontWeight: hs.fontWeight,
        textTransform: hs.textTransform,
        letterSpacing: hs.letterSpacing,
        textAlign: hs.textAlign,
        marginTop: hs.marginTop,
        marginBottom: hs.marginBottom,
      });
    }
    results['section-headings'] = sectionHeadings;

    // Video thumbnails - find the grid
    var imgs = document.querySelectorAll('img[src*="youtube"], img[src*="ytimg"]');
    if (imgs.length > 0) {
      var firstImg = imgs[0];
      var ir = firstImg.getBoundingClientRect();
      results['first-thumbnail'] = {
        width: Math.round(ir.width),
        height: Math.round(ir.height),
        src: firstImg.getAttribute('src').slice(0, 60),
      };
      // Find the grid parent
      var gridParent = firstImg.closest('div');
      while (gridParent && window.getComputedStyle(gridParent).display !== 'grid' && window.getComputedStyle(gridParent).display !== 'flex') {
        gridParent = gridParent.parentElement;
      }
      if (gridParent) {
        var gs = window.getComputedStyle(gridParent);
        var gr = gridParent.getBoundingClientRect();
        results['video-grid'] = {
          display: gs.display,
          gridTemplateColumns: gs.gridTemplateColumns,
          gap: gs.gap,
          columnGap: gs.columnGap,
          rowGap: gs.rowGap,
          width: Math.round(gr.width),
          left: Math.round(gr.left),
        };
      }
    }

    // Check for rounded corners on thumbnails
    if (imgs.length > 0) {
      var wrapper = imgs[0].closest('a') || imgs[0].closest('div');
      if (wrapper) {
        var ws = window.getComputedStyle(wrapper);
        results['thumbnail-wrapper'] = {
          borderRadius: ws.borderRadius,
          overflow: ws.overflow,
        };
      }
      var imgStyle = window.getComputedStyle(imgs[0]);
      results['thumbnail-img'] = {
        borderRadius: imgStyle.borderRadius,
        objectFit: imgStyle.objectFit,
      };
    }

    // Overall section padding
    var sections = document.querySelectorAll('section, [class*="section"]');
    for (var i = 0; i < Math.min(sections.length, 3); i++) {
      var ss = window.getComputedStyle(sections[i]);
      var sr = sections[i].getBoundingClientRect();
      var heading = sections[i].querySelector('h1, h2');
      results['section-' + i] = {
        width: Math.round(sr.width),
        height: Math.round(sr.height),
        padding: ss.paddingTop + ' ' + ss.paddingRight + ' ' + ss.paddingBottom + ' ' + ss.paddingLeft,
        bg: ss.backgroundColor,
        heading: heading ? heading.textContent.trim().slice(0, 40) : null,
      };
    }

    // Spacing between video sections
    if (h2s.length >= 2) {
      var r1 = h2s[0].getBoundingClientRect();
      var r2 = h2s[1].getBoundingClientRect();
      // Find the last element in the first section
      var firstSection = h2s[0].closest('div, section');
      if (firstSection) {
        var fsr = firstSection.getBoundingClientRect();
        results['section-spacing'] = {
          firstSectionBottom: Math.round(fsr.bottom),
          secondHeadingTop: Math.round(r2.top),
          gap: Math.round(r2.top - fsr.bottom),
        };
      }
    }

    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
