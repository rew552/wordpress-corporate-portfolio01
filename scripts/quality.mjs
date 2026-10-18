import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';

const base = 'http://127.0.0.1:9400';
const routes = ['/', '/about/', '/services/', '/company/', '/resources/', '/contact/', '/news/', '/site-open/', '/definitely-not-found/'];
const browserTypes = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]];
const breakpointWidths = [375, 390, 599, 600, 601, 760, 761, 767, 768, 781, 782, 783, 820, 900, 960, 1023, 1024, 1280, 1440, 1536];
const alignmentWidths = new Set([375, 390, 768, 820, 1024, 1280, 1440, 1536]);
const axeWidths = [390, 820, 1440];
const axeRoutes = ['/', '/services/', '/company/', '/resources/', '/contact/', '/news/', '/site-open/'];
const visualCases = [
  { name: 'home-mobile', route: '/', width: 390, height: 1000, maskSelectors: ['.site-header .brand'] },
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
  await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
  assert.equal(await page.locator('h1').count(), 1, `${route}: expected one h1`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${route}: horizontal overflow ${overflow}px`);
};

const settleVisualPage = async (page) => {
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.decoding = 'sync';
    });
  });
  await page.evaluate(async () => {
    const step = Math.max(Math.floor(window.innerHeight * 0.8), 400);
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, max);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
    null,
    { timeout: 10000 }
  );
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(async (image) => {
      if (typeof image.decode !== 'function') return;
      try {
        await image.decode();
      } catch {
        // naturalWidth is asserted above; decode() can still reject for browser-specific reasons.
      }
    }));
  });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(150);
};

const isVisible = async (locator) => (await locator.count()) > 0 && await locator.first().isVisible();

const getNavigationState = async (page) => page.evaluate(() => {
  const describe = (element) => {
    if (!element) return null;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName,
      className: element.className,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
    };
  };
  const nav = document.querySelector('.wp-block-navigation');
  const button = document.querySelector('.wp-block-navigation__responsive-container-open');
  const container = document.querySelector('.wp-block-navigation__responsive-container');
  return {
    nav: describe(nav),
    button: describe(button),
    container: describe(container),
    html: nav?.outerHTML.slice(0, 5000) ?? null,
    stylesheets: [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean),
  };
});

const runResponsiveChecks = async (page) => {
  for (const width of breakpointWidths) {
    await page.setViewportSize({ width, height: 1000 });
    await waitForPage(page, '/');

    const navOpenButton = page.locator('.wp-block-navigation__responsive-container-open');
    const demoLink = page.locator('.portfolio-demo-bar__link');
    const headerCta = page.locator('.header-cta');
    const serviceRow = page.locator('.service-row').first();
    const navButtonVisible = await isVisible(navOpenButton);

    if (width <= 1023) {
      if (!navButtonVisible) {
        const navState = await getNavigationState(page);
        assert.fail(`${width}px: overlay navigation button must be visible\n${JSON.stringify(navState, null, 2)}`);
      }
    } else {
      assert(!navButtonVisible, `${width}px: overlay navigation button must be hidden`);
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

    const headerTracks = await page.locator('.site-header').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length);
    const expectedHeaderTracks = width <= 767 ? 2 : 3;
    assert.equal(headerTracks, expectedHeaderTracks, `${width}px: header should have ${expectedHeaderTracks} grid tracks, got ${headerTracks}`);

    const cmsTracks = await page.locator('.cms-demo-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length);
    assert.equal(cmsTracks, width <= 767 ? 1 : 2, `${width}px: CMS demo grid has an unexpected track count`);

    const cmsActionGeometry = await page.locator('.cms-demo-item').evaluateAll((items) => items.map((item) => {
      const itemRect = item.getBoundingClientRect();
      const linkRect = item.querySelector('a').getBoundingClientRect();
      return { itemLeft: itemRect.left, itemRight: itemRect.right, linkLeft: linkRect.left, linkRight: linkRect.right };
    }));
    for (const geometry of cmsActionGeometry) {
      assert(geometry.linkLeft >= geometry.itemLeft - 1, `${width}px: CMS action overflows the row on the left`);
      assert(geometry.linkRight <= geometry.itemRight + 1, `${width}px: CMS action overflows the row on the right`);
    }

    if (alignmentWidths.has(width)) {
      const alignment = await page.evaluate(() => {
        const left = (selector) => document.querySelector(selector)?.getBoundingClientRect().left ?? null;
        return {
          demo: left('.portfolio-demo-bar__label'),
          header: left('.header-brand'),
          hero: left('.hero'),
          section: left('.services-overview'),
          cms: left('.cms-demo'),
          footer: left('.footer-cta'),
        };
      });
      const reference = alignment.hero;
      assert(reference !== null, `${width}px: hero alignment reference missing`);
      for (const [name, value] of Object.entries(alignment)) {
        assert(value !== null, `${width}px: ${name} alignment target missing`);
        assert(Math.abs(value - reference) <= 2, `${width}px: ${name} left edge ${value}px differs from shared container ${reference}px`);
      }
    }
  }
  console.log('PASS: breakpoint, shared-container and CMS layout checks.');
};

const runAxeChecks = async (page) => {
  for (const width of axeWidths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of axeRoutes) {
      await waitForPage(page, route);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      assert.equal(blocking.length, 0, `chromium ${width}px ${route}: accessibility violations\n${formatViolations(blocking)}`);
    }
  }
  console.log('PASS: mobile/tablet/desktop axe scans.');
};

const paethPredictor = (left, up, upLeft) => {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  return upDistance <= upLeftDistance ? up : upLeft;
};

const decodePngRgb = (buffer) => {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(buffer.subarray(0, 8).equals(pngSignature), 'Visual regression screenshot is not a PNG');

  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let compressionMethod;
  let filterMethod;
  let interlaceMethod;
  const idatChunks = [];

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    offset += 4;
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    offset += 4;
    const chunkData = buffer.subarray(offset, offset + chunkLength);
    offset += chunkLength + 4; // Skip data and CRC.

    if (chunkType === 'IHDR') {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      bitDepth = chunkData[8];
      colorType = chunkData[9];
      compressionMethod = chunkData[10];
      filterMethod = chunkData[11];
      interlaceMethod = chunkData[12];
    } else if (chunkType === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (chunkType === 'IEND') {
      break;
    }
  }

  assert.equal(bitDepth, 8, 'Visual regression PNG must use 8-bit channels');
  assert([2, 6].includes(colorType), `Unsupported visual regression PNG color type: ${colorType}`);
  assert.equal(compressionMethod, 0, 'Unsupported PNG compression method');
  assert.equal(filterMethod, 0, 'Unsupported PNG filter method');
  assert.equal(interlaceMethod, 0, 'Interlaced visual regression PNGs are unsupported');

  const bytesPerPixel = colorType === 2 ? 3 : 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  assert.equal(inflated.length, (stride + 1) * height, 'Unexpected visual regression PNG data length');

  const decoded = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    const rowStart = y * stride;
    const previousRowStart = (y - 1) * stride;

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset];
      sourceOffset += 1;
      const left = x >= bytesPerPixel ? decoded[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? decoded[previousRowStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? decoded[previousRowStart + x - bytesPerPixel] : 0;
      let value;

      if (filterType === 0) value = raw;
      else if (filterType === 1) value = (raw + left) & 0xff;
      else if (filterType === 2) value = (raw + up) & 0xff;
      else if (filterType === 3) value = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filterType === 4) value = (raw + paethPredictor(left, up, upLeft)) & 0xff;
      else assert.fail(`Unsupported PNG scanline filter: ${filterType}`);

      decoded[rowStart + x] = value;
    }
  }

  if (colorType === 2) return { width, height, rgb: decoded };

  const rgb = Buffer.alloc(width * height * 3);
  for (let source = 0, target = 0; source < decoded.length; source += 4, target += 3) {
    rgb[target] = decoded[source];
    rgb[target + 1] = decoded[source + 1];
    rgb[target + 2] = decoded[source + 2];
  }
  return { width, height, rgb };
};

const runVisualChecks = async (page) => {
  if (!process.env.CI) {
    console.log('INFO: visual raw-pixel comparison is CI-only to avoid OS font-rendering noise.');
    return [];
  }

  const baseline = JSON.parse(await readFile('screenshots/visual-baseline.json', 'utf8'));
  assert.equal(baseline.version, 2, 'Visual regression baseline version must be 2');
  assert.equal(baseline.algorithm, 'sha256-rgb-pixels', 'Unexpected visual regression baseline algorithm');

  const actual = {};
  const mismatches = [];

  for (const visual of visualCases) {
    await page.setViewportSize({ width: visual.width, height: visual.height });
    await waitForPage(page, visual.route);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
    await settleVisualPage(page);
    // The mobile header wordmark can pick up one-pixel glyph rasterization noise on
    // hosted Linux runners. Geometry is asserted independently, so mask only that
    // header text while keeping the footer brand and the rest of the page strict.
    const mask = (visual.maskSelectors ?? []).map((selector) => page.locator(selector));
    const buffer = await page.screenshot({
      path: `screenshots/regression-actual/${visual.name}.png`,
      fullPage: true,
      mask,
      maskColor: '#ff00ff',
    });
    const decoded = decodePngRgb(buffer);
    const sha256 = createHash('sha256').update(decoded.rgb).digest('hex');
    actual[visual.name] = { width: decoded.width, height: decoded.height, sha256 };

    const expected = baseline.cases?.[visual.name];
    if (!expected) {
      mismatches.push(`${visual.name}: baseline is missing`);
      continue;
    }
    if (expected.width !== decoded.width || expected.height !== decoded.height) {
      mismatches.push(`${visual.name}: expected ${expected.width}x${expected.height}, actual ${decoded.width}x${decoded.height}`);
      continue;
    }
    if (expected.sha256 !== sha256) {
      mismatches.push(`${visual.name}: expected ${expected.sha256}, actual ${sha256}`);
    }
  }

  if (mismatches.length === 0) console.log('PASS: CI visual regression raw-pixel checks.');
  else console.log(`INFO: queued ${mismatches.length} visual regression mismatch(es); cross-browser checks will still complete.`);

  return { mismatches, actual };
};

await mkdir('screenshots/regression-actual', { recursive: true });

let visualResult = { mismatches: [], actual: {} };
for (const [name, type] of browserTypes) {
  const browser = await type.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();

    for (const route of routes) {
      await waitForPage(page, route);
    }
    console.log(`PASS: ${name} route, h1 and overflow checks.`);

    if (name === 'chromium') {
      await runResponsiveChecks(page);
      await runAxeChecks(page);
      visualResult = await runVisualChecks(page);
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

assert.equal(
  visualResult.mismatches.length,
  0,
  `Visual regression mismatch. Review screenshots/regression-actual artifacts, then explicitly update screenshots/visual-baseline.json if the change is intended.\n${visualResult.mismatches.join('\n')}\nSuggested baseline cases:\n${JSON.stringify(visualResult.actual, null, 2)}`
);

console.log('PASS: cross-browser routes, breakpoint ±1px checks, shared-container alignment, CMS action fit, mobile/tablet/desktop axe scans, and CI visual regression checks.');
