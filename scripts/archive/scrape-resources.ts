import { chromium } from 'playwright';

const LESSON_PAGES = [
  '/this-too-shall-pass',
  '/the-one-moment', 
  '/the-writings-on-the-wall',
  '/upside-down-inside-out',
  '/needing-getting',
  '/all-together-now',
  '/this',
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Step 1: Collect all resource links from each lesson page
  const allResources: { parentTitle: string; parentSlug: string; title: string; url: string }[] = [];
  
  for (const lessonSlug of LESSON_PAGES) {
    await page.goto('https://okgosandbox.org' + lessonSlug, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const resources = await page.evaluate(`(() => {
      var results = [];
      // Look for resource card links - they typically have titles and link to sub-pages
      var links = document.querySelectorAll('a[href]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        var parentSlug = '${lessonSlug}';
        // Resource links are sub-paths of the lesson
        if (href.startsWith(parentSlug + '/') && href !== parentSlug) {
          var h = links[i].querySelector('h2, h3, h4');
          var title = h ? h.textContent.trim() : links[i].textContent.trim().split('\\n')[0].trim();
          if (title && title.length > 2 && title.length < 100) {
            results.push({ title: title, url: href });
          }
        }
      }
      // Deduplicate by URL
      var seen = {};
      return results.filter(function(r) {
        if (seen[r.url]) return false;
        seen[r.url] = true;
        return true;
      });
    })()`);
    
    var parentTitle = lessonSlug.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    // Fix specific titles
    if (lessonSlug === '/this-too-shall-pass') parentTitle = 'This Too Shall Pass';
    if (lessonSlug === '/the-one-moment') parentTitle = 'The One Moment';
    if (lessonSlug === '/the-writings-on-the-wall') parentTitle = "The Writing's On The Wall";
    if (lessonSlug === '/upside-down-inside-out') parentTitle = 'Upside Down & Inside Out';
    if (lessonSlug === '/needing-getting') parentTitle = 'Needing/Getting';
    if (lessonSlug === '/all-together-now') parentTitle = 'All Together Now';
    if (lessonSlug === '/this') parentTitle = 'This';
    
    for (const r of resources as any[]) {
      allResources.push({ parentTitle, parentSlug: lessonSlug, ...r });
    }
    
    console.error('Found', (resources as any[]).length, 'resources for', parentTitle);
  }
  
  console.error('\nTotal resources:', allResources.length);
  
  // Step 2: Visit each resource page and extract content
  const fullResources: any[] = [];
  
  for (const resource of allResources) {
    try {
      await page.goto('https://okgosandbox.org' + resource.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);
      
      const content = await page.evaluate(`(() => {
        var result = {};
        
        // Title (h1 or first large heading)
        var h1 = document.querySelector('h1');
        if (h1) result.title = h1.textContent.trim();
        
        // Description - look for main paragraph text
        var descriptions = document.querySelectorAll('p');
        for (var i = 0; i < descriptions.length; i++) {
          var text = descriptions[i].textContent.trim();
          if (text.length > 50 && text.length < 1000) {
            var ps = window.getComputedStyle(descriptions[i]);
            var fontSize = parseInt(ps.fontSize);
            if (fontSize >= 16) {
              result.description = text;
              break;
            }
          }
        }
        
        // Materials - look for download/resource buttons
        var materials = [];
        var buttons = document.querySelectorAll('a[href][download], a[href*="download"], a[href*=".pdf"], a[href*="drive.google"]');
        if (buttons.length === 0) {
          // Try looking for styled buttons/links in the sidebar
          buttons = document.querySelectorAll('a.button, a[class*="btn"], a[class*="material"], a[class*="download"]');
        }
        // Also try looking for elements that look like material buttons
        var allLinks = document.querySelectorAll('a[href]');
        for (var i = 0; i < allLinks.length; i++) {
          var linkText = allLinks[i].textContent.trim();
          if (linkText.match(/^(Educator Guide|Teacher Guide|Student Guide|Clip|Download|Guide)/i) || 
              linkText.match(/(Download the|View the)/i)) {
            var lr = allLinks[i].getBoundingClientRect();
            if (lr.width > 100) {
              materials.push({
                label: linkText.split('\\n')[0].trim(),
                subtitle: linkText.split('\\n').slice(1).join(' ').trim() || '',
                url: allLinks[i].getAttribute('href') || '#'
              });
            }
          }
        }
        result.materials = materials;
        
        // Video URL
        var iframe = document.querySelector('iframe[src*="youtube"], iframe[src*="vimeo"]');
        if (iframe) {
          result.videoUrl = iframe.getAttribute('src') || '';
        }
        
        return result;
      })()`);
      
      fullResources.push({
        ...resource,
        ...(content as any),
      });
      
      console.error('Scraped:', resource.title);
    } catch (e) {
      console.error('Error scraping', resource.url, e);
      fullResources.push(resource);
    }
  }
  
  // Output as JSON
  console.log(JSON.stringify(fullResources, null, 2));
  
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
