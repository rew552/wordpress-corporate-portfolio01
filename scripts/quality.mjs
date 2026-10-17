import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:9400';
const routes = ['/', '/about/', '/services/', '/contact/', '/news/', '/definitely-not-found/'];
const browserTypes = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]];

const formatViolations = (violations) => violations.map((violation) => {
  const nodes = violation.nodes.slice(0, 6).map((node) => {
    const target = node.target.join(' > ');
    const detail = node.failureSummary || '';
    return `  - ${target}\n    ${detail}\n    HTML: ${node.html}`;
  }).join('\n');
  return `${violation.id} (${violation.impact}) — ${violation.help}\n${nodes}`;
}).join('\n');

await mkdir('screenshots', { recursive: true });

for (const [name, type] of browserTypes) {
  const browser = await type.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      assert(response, `${name} ${route}: no response`);
      if (route.includes('definitely-not-found')) assert.equal(response.status(), 404, `${name}: 404 status`);
      else assert(response.ok(), `${name} ${route}: HTTP ${response.status()}`);
      await page.locator('main').waitFor();
      assert.equal(await page.locator('h1').count(), 1, `${name} ${route}: expected one h1`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 1, `${name} ${route}: horizontal overflow ${overflow}px`);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      assert.equal(blocking.length, 0, `${name} ${route}: accessibility violations\n${formatViolations(blocking)}`);
    }
    if (name === 'chromium') {
      const screenshots = new Map([
        [390, 'screenshots/home-mobile.png'],
        [768, 'screenshots/home-tablet.png'],
        [1440, 'screenshots/home-desktop.png'],
        [1536, 'screenshots/home-wide.png'],
      ]);
      for (const width of [375, 390, 768, 1024, 1280, 1440, 1536]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
        await page.locator('main').waitFor();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(overflow <= 1, `chromium ${width}px: horizontal overflow ${overflow}px`);
        const screenshot = screenshots.get(width);
        if (screenshot) await page.screenshot({ path: screenshot, fullPage: true });
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

console.log('PASS: Chromium / Firefox / WebKit, 375–1536px responsive checks, desktop/tablet/mobile visual snapshots, and axe serious/critical accessibility scan.');
