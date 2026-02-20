import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://okgosandbox.org/ask-ok-go', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(`(() => {
    const results = {};

    // H1
    const h1 = document.querySelector('h1');
    if (h1) {
      const s = window.getComputedStyle(h1);
      results['h1'] = {
        text: h1.textContent.trim(),
        fontSize: s.fontSize,
        textTransform: s.textTransform,
      };
    }

    // Subtitle
    const h2 = document.querySelector('h2');
    if (h2) {
      const s = window.getComputedStyle(h2);
      results['subtitle'] = {
        text: h2.textContent.trim().slice(0, 60),
        fontSize: s.fontSize,
        color: s.color,
      };
    }

    // Find Q&A cards - look for video elements or iframes paired with text
    var cards = [];
    var allSections = document.querySelectorAll('section, div[class]');

    // Look for the repeating card pattern
    var videos = document.querySelectorAll('iframe, video, div[class*="video"], div[class*="embed"]');

    // Try to find cards by looking for question headings
    var headings = document.querySelectorAll('h2, h3, h4, p');
    var questions = [];
    for (var i = 0; i < headings.length; i++) {
      var text = headings[i].textContent.trim();
      if (text.endsWith('?') && text.length > 10) {
        var hs = window.getComputedStyle(headings[i]);
        var hr = headings[i].getBoundingClientRect();

        // Find the parent card
        var card = headings[i].closest('div');
        var cardParent = card ? card.parentElement : null;
        while (cardParent && cardParent.children.length < 2) {
          cardParent = cardParent.parentElement;
        }

        questions.push({
          text: text.slice(0, 60),
          fontSize: hs.fontSize,
          fontWeight: hs.fontWeight,
          color: hs.color,
          left: Math.round(hr.left),
          top: Math.round(hr.top),
          width: Math.round(hr.width),
          cardParentWidth: cardParent ? Math.round(cardParent.getBoundingClientRect().width) : null,
          cardParentLeft: cardParent ? Math.round(cardParent.getBoundingClientRect().left) : null,
        });
      }
    }
    results['questions'] = questions.slice(0, 6);

    // Measure the first few card containers
    // Look for flex containers that have video + text
    var flexContainers = document.querySelectorAll('div');
    var cardLayouts = [];
    for (var i = 0; i < flexContainers.length; i++) {
      var fc = flexContainers[i];
      var fcs = window.getComputedStyle(fc);
      if (fcs.display === 'flex' && fc.children.length === 2) {
        var child0 = fc.children[0];
        var child1 = fc.children[1];
        var hasVideo = child0.querySelector('iframe, video') || child1.querySelector('iframe, video');
        var hasText = child0.querySelector('h2, h3, h4, p') || child1.querySelector('h2, h3, h4, p');
        if (hasVideo && hasText) {
          var fcr = fc.getBoundingClientRect();
          var c0r = child0.getBoundingClientRect();
          var c1r = child1.getBoundingClientRect();
          cardLayouts.push({
            containerWidth: Math.round(fcr.width),
            containerLeft: Math.round(fcr.left),
            flexDirection: fcs.flexDirection,
            gap: fcs.gap,
            child0: { width: Math.round(c0r.width), left: Math.round(c0r.left), hasVideo: !!child0.querySelector('iframe, video') },
            child1: { width: Math.round(c1r.width), left: Math.round(c1r.left), hasVideo: !!child1.querySelector('iframe, video') },
          });
        }
      }
    }
    results['card-layouts'] = cardLayouts.slice(0, 4);

    // Check for rainbow stripe elements
    var stripes = document.querySelectorAll('div[class*="bg-"]');
    var rainbowCount = 0;
    for (var i = 0; i < stripes.length; i++) {
      var sr = stripes[i].getBoundingClientRect();
      if (sr.width < 10 && sr.height > 20) {
        rainbowCount++;
      }
    }
    results['narrow-stripe-elements'] = rainbowCount;

    // Text card styling
    if (questions.length > 0) {
      var firstQ = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].textContent.trim().endsWith('?') && headings[i].textContent.trim().length > 10) {
          firstQ = headings[i];
          break;
        }
      }
      if (firstQ) {
        var textCard = firstQ.closest('div');
        while (textCard && !window.getComputedStyle(textCard).boxShadow.includes('rgba')) {
          textCard = textCard.parentElement;
        }
        if (textCard) {
          var tcs = window.getComputedStyle(textCard);
          var tcr = textCard.getBoundingClientRect();
          results['text-card'] = {
            width: Math.round(tcr.width),
            height: Math.round(tcr.height),
            padding: tcs.paddingTop + ' ' + tcs.paddingRight + ' ' + tcs.paddingBottom + ' ' + tcs.paddingLeft,
            bg: tcs.backgroundColor,
            shadow: tcs.boxShadow.slice(0, 80),
          };
        }
      }
    }

    return results;
  })()`);

  console.log(JSON.stringify(measurements, null, 2));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
