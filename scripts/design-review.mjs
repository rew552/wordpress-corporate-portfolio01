import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:9400';
const widths = [375, 768, 1024, 1440, 1536, 1920];

const px = (value) => Number.parseFloat(value || '0');
const centerY = (rect) => rect.top + rect.height / 2;

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
        return heading.getBoundingClientRect().height / px(style.lineHeight);
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
      const h1 = document.querySelector('.page-header h1')?.getBoundingClientRect();
      const content = document.querySelector('.page-header-grid')?.getBoundingClientRect();
      const excerpt = document.querySelector('.page-header .wp-block-post-excerpt')?.getBoundingClientRect();
      return { h1, content, excerpt };
    });
    assert(pageMetrics.content && pageMetrics.content.width <= 1182, `${route}: page header exceeds default content measure`);
    if (pageMetrics.excerpt) assert(pageMetrics.excerpt.width <= 674, `${route}: page intro exceeds reading measure`);
  }

  console.log('PASS: design review geometry, semantic Japanese wrapping, content measures, CTA hierarchy and wide-screen density.');
  await context.close();
} finally {
  await browser.close();
}
