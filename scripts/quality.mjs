import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:9400';
const routes = ['/', '/about/', '/services/', '/company/', '/resources/', '/contact/', '/news/', '/site-open/', '/definitely-not-found/'];
const browserTypes = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]];
const breakpointWidths = [375, 390, 599, 600, 601, 760, 761, 767, 768, 781, 782, 783, 820, 900, 960, 1023, 1024, 1280, 1440, 1536];
const axeWidths = [390, 820, 1440];
const axeRoutes = ['/', '/services/', '/company/', '/resources/', '/contact/', '/news/', '/site-open/'];
const visualCases = [
  { name: 'home-mobile', route: '/', width: 390, height: 1000 },
  { name: 'home-tablet', route: '/', width: 820, height: 1000 },
  { name: 'home-desktop', route: '/', width: 1440, height: 1000 },
  { name: 'services-tablet', route: '/services/', width: 820, height: 1000 },
  { name: 'single-desktop', route: '/site-open/', width: 1440, height: 1000 },
];

const formatViolations = (violations) => violations.map((violation) => {
  const nodes = violation.nodes.slice(0, 6).map((node) => {
    const target = node.target.join(' > ');
    const detail = node.failureSummary || '';
    return `  - ${target}\n    ${detail}\n    HTML: ${node.html}`;
  }).join('\n');
  return `${violation.id} (${violation.impact}) — ${violation.help}\n${nodes}`;
}).join('\n');

const waitForPage = async (page, route) => {
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  assert(response, `${route}: no response`);
  if (route.includes('definitely-not-found')) assert.equal(response.status(), 404, `${route}: expected 404 status`);
  else assert(response.ok(), `${route}: HTTP ${response.status()}`);
  await page.locator('main').waitFor();
  await page.evaluate(() => document.fonts?.ready);
  assert.equal(await page.locator('h1').count(), 1, `${route}: expected one h1`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${route}: horizontal overflow ${overflow}px`);
};

const isVisible = async (locator) => locator.count() > 0 && locator.first().isVisible();

await mkdir('screenshots/regression-actual', { recursive: true });

for (const [name, type] of browserTypes) {
  const browser = await type.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    for (const route of routes) {
      await waitForPage(page, route);
    }
    await context.close();
  } finally {
    await browser.close();
  }
  console.log(`PASS: ${name} route, h1 and overflow checks.`);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  for (const width of breakpointWidths) {
    await page.setViewportSize({ width, height: 1000 });
    await waitForPage(page, '/');

    const navOpenButton = page.locator('.wp-block-navigation__responsive-container-open');
    const demoLink = page.locator('.portfolio-demo-bar__link');
    const headerCta = page.locator('.header-cta');
    const serviceRow = page.locator('.service-row').first();

    if (width <= 1023) {
      assert(await isVisible(navOpenButton), `${width}px: overlay navigation button must be visible`);
    } else {
      assert(!(await isVisible(navOpenButton)), `${width}px: overlay navigation button must be hidden`);
    }

    if (width <= 767) {
      assert(!(await isVisible(demoLink)), `${width}px: demo utility link must be hidden on mobile`);
      assert(!(await isVisible(headerCta)), `${width}px: header CTA must be hidden on mobile`);
    } else {
      assert(await isVisible(demoLink), `${width}px: demo utility link must be visible from tablet upward`);
      assert(await isVisible(headerCta), `${width}px: header CTA must be visible from tablet upward`);
    }

    const serviceTracks = await serviceRow.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length);
    const expectedTracks = width <= 767 ? 2 : width <= 1023 ? 3 : 4;
    assert.equal(serviceTracks, expectedTracks, `${width}px: service row should have ${expectedTracks} grid tracks, got ${serviceTracks}`);
  }

  for (const width of axeWidths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of axeRoutes) {
      await waitForPage(page, route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      assert.equal(blocking.length, 0, `chromium ${width}px ${route}: accessibility violations\n${formatViolations(blocking)}`);
    }
  }

  if (process.env.CI) {
    const baseline = JSON.parse(await readFile('screenshots/visual-baseline.json', 'utf8'));
    const actual = {};
    const mismatches = [];

    for (const visual of visualCases) {
      await page.setViewportSize({ width: visual.width, height: visual.height });
      await waitForPage(page, visual.route);
      await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
      const buffer = await page.screenshot({ path: `screenshots/regression-actual/${visual.name}.png`, fullPage: true });
      const hash = createHash('sha256').update(buffer).digest('hex');
      actual[visual.name] = hash;
      if (!baseline[visual.name] || baseline[visual.name] !== hash) {
        mismatches.push(`${visual.name}: expected ${baseline[visual.name] || '<unset>'}, actual ${hash}`);
      }
    }

    assert.equal(
      mismatches.length,
      0,
      `Visual regression mismatch. Review screenshots/regression-actual artifacts, then explicitly update screenshots/visual-baseline.json if the change is intended.\n${mismatches.join('\n')}\nSuggested baseline:\n${JSON.stringify(actual, null, 2)}`
    );
  } else {
    console.log('INFO: visual screenshot hash comparison is CI-only to avoid OS font-rendering noise.');
  }

  await context.close();
} finally {
  await browser.close();
}

console.log('PASS: cross-browser routes, breakpoint ±1px checks, mobile/tablet/desktop axe scans, and CI visual regression checks.');
