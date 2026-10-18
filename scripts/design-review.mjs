import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:9400';
const widths = [375, 390, 768, 820, 1024, 1440, 1536, 1920];

const centerY = (rect) => rect.top + rect.height / 2;
const spread = (values) => Math.max(...values) - Math.min(...values);

async function assertSingleLinePhrase(page, selector, expected, width) {
  const phrase = page.locator(selector);
  assert.equal(await phrase.count(), 1, `${width}px: expected one ${expected} phrase guard`);
  const metrics = await phrase.evaluate((element) => ({
    text: element.textContent,
    whiteSpace: getComputedStyle(element).whiteSpace,
    rectCount: element.getClientRects().length,
  }));
  assert.equal(metrics.text, expected, `${width}px: guarded phrase text changed`);
  assert.equal(metrics.whiteSpace, 'nowrap', `${width}px: ${expected} must remain nowrap`);
  assert.equal(metrics.rectCount, 1, `${width}px: ${expected} split across visual lines`);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    assert(response?.ok(), `${width}px: home failed to load`);
    await page.locator('main').waitFor();
    await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(overflow <= 1, `${width}px: horizontal overflow ${overflow}px`);

    const heroLines = (await page.locator('.hero h1').innerText()).split('\n').map((line) => line.trim()).filter(Boolean);
    assert.deepEqual(heroLines, ['仕事を整える。', '可能性が、広がる。'], `${width}px: hero copy must keep its semantic two-line phrasing`);

    const heroMetrics = await page.locator('.hero h1').evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight), height: rect.height };
    });
    assert(heroMetrics.height <= heroMetrics.lineHeight * 2.25, `${width}px: hero heading unexpectedly wraps beyond two lines`);
    assert(heroMetrics.fontSize <= 72.5, `${width}px: hero display type is too large`);

    const measures = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
      return {
        shell: rect('.hero'),
        defaultContent: rect('.hero-grid'),
        heroLead: rect('.hero-lead'),
        sectionCopy: rect('.services-overview .section-header__copy'),
        cmsGrid: rect('.cms-demo-grid'),
        cmsList: rect('.cms-demo-list'),
      };
    });
    assert(measures.defaultContent && measures.defaultContent.width <= 1182, `${width}px: default content exceeds 1180px measure`);
    assert(measures.heroLead && measures.heroLead.width <= 674, `${width}px: hero lead exceeds reading measure`);
    assert(measures.sectionCopy && measures.sectionCopy.width <= 674, `${width}px: section copy exceeds reading measure`);
    assert(measures.cmsList && measures.cmsList.width <= 592, `${width}px: CMS list is too wide`);

    if (width >= 1440) {
      assert(measures.shell.width - measures.defaultContent.width >= 80, `${width}px: wide shell and default content are not visually separated`);
      assert(measures.cmsGrid.width <= 1182, `${width}px: CMS grid should use default content measure`);
    }

    const cmsTravel = await page.locator('.cms-demo-item').evaluateAll((items) => items.map((item) => {
      const copy = item.querySelector('p:nth-of-type(2)')?.getBoundingClientRect();
      const action = item.querySelector('p:last-child')?.getBoundingClientRect();
      return copy && action ? Math.abs(action.left - copy.left) : 0;
    }));
    for (const travel of cmsTravel) {
      assert(travel <= 12, `${width}px: CMS utility action is horizontally detached from its label (${travel}px)`);
    }

    const caseMetrics = await page.locator('.case-step').evaluateAll((steps) => steps.map((step) => {
      const rect = (selector) => step.querySelector(selector)?.getBoundingClientRect() ?? null;
      const container = step.getBoundingClientRect();
      return {
        containerTop: container.top,
        containerBottom: container.bottom,
        labelTop: rect('.number-label')?.top ?? null,
        headingTop: rect('h3')?.top ?? null,
        bodyTop: rect('p:not(.number-label)')?.top ?? null,
      };
    }));
    assert.equal(caseMetrics.length, 4, `${width}px: Demo Case must contain four steps`);

    const rowGroups = width >= 1024 ? [[0, 1, 2, 3]] : width >= 768 ? [[0, 1], [2, 3]] : [];
    for (const group of rowGroups) {
      for (const key of ['containerTop', 'containerBottom', 'labelTop', 'headingTop', 'bodyTop']) {
        const values = group.map((index) => caseMetrics[index][key]);
        assert(values.every(Number.isFinite), `${width}px: missing ${key} metric in Demo Case`);
        assert(spread(values) <= 2, `${width}px: Demo Case ${key} differs by ${spread(values).toFixed(2)}px`);
      }
    }

    await assertSingleLinePhrase(page, '.demo-case .section-header__title h2 .nowrap-ja', 'サイト', width);
    await assertSingleLinePhrase(page, '.demo-case .section-header__copy .nowrap-ja', 'います', width);

    const headingRows = await page.locator('.section-header__title h2, .news-head h2, .cms-demo h2').evaluateAll((headings) => headings.map((heading) => {
      const rows = [];
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (let index = 0; index < node.textContent.length; index += 1) {
          const character = node.textContent[index];
          if (!character.trim()) continue;
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const rect = range.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          let row = rows.find((candidate) => Math.abs(candidate.top - rect.top) <= 2);
          if (!row) {
            row = { top: rect.top, count: 0 };
            rows.push(row);
          }
          row.count += 1;
        }
      }
      return {
        text: heading.textContent.trim(),
        counts: rows.sort((a, b) => a.top - b.top).map((row) => row.count),
      };
    }));
    for (const heading of headingRows) {
      if (heading.counts.length > 1) {
        assert(heading.counts.at(-1) >= 3, `${width}px: section heading leaves a 1-2 character orphan: ${heading.text} (${heading.counts.join(',')})`);
      }
    }

    if (width >= 1024) {
      const header = await page.evaluate(() => {
        const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
        return { brand: rect('.header-brand'), nav: rect('.header-navigation'), cta: rect('.header-cta') };
      });
      assert(header.brand && header.nav && header.cta, `${width}px: header regions missing`);
      const centers = [centerY(header.brand), centerY(header.nav), centerY(header.cta)];
      assert(Math.max(...centers) - Math.min(...centers) <= 4, `${width}px: header regions are not optically centered`);

      const headerCtaHeight = await page.locator('.header-cta .wp-block-button__link').evaluate((element) => element.getBoundingClientRect().height);
      assert(headerCtaHeight >= 36 && headerCtaHeight <= 42, `${width}px: header CTA visual weight is inconsistent (${headerCtaHeight}px)`);
    }

    if (width >= 1024) {
      const sectionHeadingLines = await page.locator('.section-header__title h2').evaluateAll((headings) => headings.map((heading) => {
        const style = getComputedStyle(heading);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return heading.getBoundingClientRect().height / lineHeight;
      }));
      for (const lines of sectionHeadingLines) {
        assert(lines <= 2.35, `${width}px: a top-level section heading grows beyond two editorial lines (${lines.toFixed(2)})`);
      }
    }
  }

  for (const route of ['/about/', '/services/', '/company/', '/resources/', '/contact/']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
    assert(response?.ok(), `${route}: failed to load`);
    await page.locator('main').waitFor();
    const pageMetrics = await page.evaluate(() => {
      const content = document.querySelector('.page-header-grid')?.getBoundingClientRect();
      const excerpt = document.querySelector('.page-header .wp-block-post-excerpt')?.getBoundingClientRect();
      return { content, excerpt };
    });
    assert(pageMetrics.content && pageMetrics.content.width <= 1182, `${route}: page header exceeds default content measure`);
    if (pageMetrics.excerpt) assert(pageMetrics.excerpt.width <= 674, `${route}: page intro exceeds reading measure`);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  {
    const response = await page.goto(base + '/site-open/', { waitUntil: 'domcontentloaded' });
    assert(response?.ok(), '/site-open/: failed to load');
    await page.locator('.post-hero h1').waitFor();
    const lineLengths = await page.locator('.post-hero h1').evaluate((element) => {
      const rows = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        for (let index = 0; index < node.textContent.length; index += 1) {
          const character = node.textContent[index];
          if (!character.trim()) continue;
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const rect = range.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          let row = rows.find((candidate) => Math.abs(candidate.top - rect.top) <= 2);
          if (!row) {
            row = { top: rect.top, count: 0 };
            rows.push(row);
          }
          row.count += 1;
        }
      }
      return rows.sort((a, b) => a.top - b.top).map((row) => row.count);
    });
    assert(lineLengths.length <= 2, `/site-open/: post title wraps into too many lines (${lineLengths.join(',')})`);
    assert(lineLengths.length === 1 || lineLengths.at(-1) >= 4, `/site-open/: post title leaves an orphaned Japanese fragment (${lineLengths.join(',')})`);
  }

  console.log('PASS: design review geometry, Demo Case alignment, Japanese wrapping, content measures, CTA hierarchy and wide-screen density.');
  await context.close();
} finally {
  await browser.close();
}
