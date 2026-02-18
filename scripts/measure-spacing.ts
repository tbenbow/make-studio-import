import { chromium } from 'playwright';

async function main() {
  const url = process.argv[2] || 'https://okgosandbox.org/this-too-shall-pass/chain-reaction-machines';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Use a string-based evaluate to avoid tsx transform issues
  const measurements = await page.evaluate(`(() => {
    const results = {};

    // H1
    const h1 = document.querySelector('h1');
    if (h1) {
      const s = window.getComputedStyle(h1);
      const r = h1.getBoundingClientRect();
      results['h1'] = {
        text: h1.textContent.trim().slice(0, 40),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        textTransform: s.textTransform,
        letterSpacing: s.letterSpacing,
        marginBottom: s.marginBottom,
        bottom: Math.round(r.bottom),
      };
    }

    // Video iframe
    const iframe = document.querySelector('iframe');
    if (iframe) {
      const wrapper = iframe.closest('div');
      const wr = wrapper.getBoundingClientRect();
      results['video'] = {
        width: Math.round(wr.width),
        height: Math.round(wr.height),
        top: Math.round(wr.top),
        left: Math.round(wr.left),
        right: Math.round(wr.right),
      };

      // Find flex parent
      let fp = wrapper.parentElement;
      while (fp && window.getComputedStyle(fp).display !== 'flex') {
        fp = fp.parentElement;
      }
      if (fp) {
        const fps = window.getComputedStyle(fp);
        const fpr = fp.getBoundingClientRect();
        results['flex-parent'] = {
          gap: fps.gap,
          columnGap: fps.columnGap,
          width: Math.round(fpr.width),
          left: Math.round(fpr.left),
          right: Math.round(fpr.right),
          padding: fps.paddingTop + ' ' + fps.paddingRight + ' ' + fps.paddingBottom + ' ' + fps.paddingLeft,
        };
        const kids = Array.from(fp.children);
        for (let i = 0; i < kids.length; i++) {
          const kr = kids[i].getBoundingClientRect();
          results['flex-child-' + i] = {
            width: Math.round(kr.width),
            height: Math.round(kr.height),
            left: Math.round(kr.left),
            right: Math.round(kr.right),
            top: Math.round(kr.top),
          };
        }
        if (kids.length >= 2) {
          const r0 = kids[0].getBoundingClientRect();
          const r1 = kids[1].getBoundingClientRect();
          results['video-to-sidebar-gap-px'] = Math.round(r1.left - r0.right);
        }
      }

      // Distance from video bottom to description
      const allP = document.querySelectorAll('p');
      for (let i = 0; i < allP.length; i++) {
        if (allP[i].textContent.length > 80) {
          const pr = allP[i].getBoundingClientRect();
          results['description'] = {
            text: allP[i].textContent.trim().slice(0, 60),
            top: Math.round(pr.top),
            left: Math.round(pr.left),
            width: Math.round(pr.width),
            fontSize: window.getComputedStyle(allP[i]).fontSize,
          };
          results['video-to-description-gap-px'] = Math.round(pr.top - wr.bottom);
          break;
        }
      }
    }

    // Materials panel - find by looking for the white box next to video
    const allDivs = document.querySelectorAll('div');
    for (let i = 0; i < allDivs.length; i++) {
      const d = allDivs[i];
      const ds = window.getComputedStyle(d);
      const text = d.textContent || '';
      if (text.includes('MATERIAL') && ds.boxShadow && ds.boxShadow !== 'none' && ds.backgroundColor.includes('255')) {
        const dr = d.getBoundingClientRect();
        results['materials-panel'] = {
          width: Math.round(dr.width),
          height: Math.round(dr.height),
          padding: ds.paddingTop + ' ' + ds.paddingRight + ' ' + ds.paddingBottom + ' ' + ds.paddingLeft,
          bg: ds.backgroundColor,
        };
        break;
      }
    }

    // Materials heading
    const allEls = document.querySelectorAll('h2, h3, h4, span, div');
    for (let i = 0; i < allEls.length; i++) {
      const el = allEls[i];
      if (el.textContent.trim() === 'MATERIALS' && el.children.length === 0) {
        const es = window.getComputedStyle(el);
        results['materials-heading'] = {
          fontSize: es.fontSize,
          fontWeight: es.fontWeight,
          textTransform: es.textTransform,
          letterSpacing: es.letterSpacing,
        };
        break;
      }
    }

    // Material download buttons
    const links = document.querySelectorAll('a');
    const matBtns = [];
    for (let i = 0; i < links.length; i++) {
      const t = links[i].textContent.trim();
      if (t.includes('Clip') || t.includes('Guide')) {
        const lr = links[i].getBoundingClientRect();
        const ls = window.getComputedStyle(links[i]);
        if (lr.width > 100) {
          matBtns.push({
            text: t.slice(0, 40),
            width: Math.round(lr.width),
            height: Math.round(lr.height),
            padding: ls.paddingTop + ' ' + ls.paddingRight + ' ' + ls.paddingBottom + ' ' + ls.paddingLeft,
            fontSize: ls.fontSize,
            fontWeight: ls.fontWeight,
          });
        }
      }
    }
    if (matBtns.length) results['material-buttons'] = matBtns;

    // Sections overview
    const sections = document.querySelectorAll('section, header, footer');
    for (let i = 0; i < sections.length; i++) {
      const sr = sections[i].getBoundingClientRect();
      const ss = window.getComputedStyle(sections[i]);
      const heading = sections[i].querySelector('h1, h2, h3');
      results['section-' + i] = {
        tag: sections[i].tagName.toLowerCase(),
        width: Math.round(sr.width),
        height: Math.round(sr.height),
        padding: ss.paddingTop + ' ' + ss.paddingRight + ' ' + ss.paddingBottom + ' ' + ss.paddingLeft,
        bg: ss.backgroundColor,
        heading: heading ? heading.textContent.trim().slice(0, 50) : null,
      };
    }

    // Related resources cards
    const imgs = document.querySelectorAll('img[src*="resource"], img[src*="poster"]');
    const relCards = [];
    for (let i = 0; i < imgs.length; i++) {
      const card = imgs[i].closest('div, a');
      if (card) {
        const cr = card.getBoundingClientRect();
        if (cr.width > 200 && cr.width < 600) {
          relCards.push({ width: Math.round(cr.width), height: Math.round(cr.height) });
        }
      }
    }
    if (relCards.length) results['related-cards'] = relCards;

    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
