import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'screenshots');

const BASE_URL = 'http://localhost:4322/first-glance/';
const SECTIONS = ['hero', 'planner', 'focus', 'ai-buddy', 'make-it-yours'];
const WIDTH = 1280;
const HEIGHT = 800;

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

  // Navigate and wait for fonts/images
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });

  // Hide nav and dot navigation
  await page.evaluate(() => {
    // Hide fixed nav
    const nav = document.querySelector('nav');
    if (nav) nav.style.display = 'none';
    // Hide dot nav
    const dotNav = document.querySelector('nav[aria-label]');
    if (dotNav) dotNav.style.display = 'none';
    // Also hide all fixed navs
    document.querySelectorAll('nav').forEach(n => n.style.display = 'none');
    // Hide Astro dev toolbar
    const astroToolbar = document.querySelector('astro-dev-toolbar');
    if (astroToolbar) astroToolbar.style.display = 'none';
  });

  // mkdir -p
  const fs = await import('fs');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const sectionId of SECTIONS) {
    // Scroll section into view and get its position
    const rect = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      // Scroll to section
      window.scrollTo(0, el.offsetTop);
      return {
        top: el.offsetTop,
        height: el.offsetHeight,
      };
    }, sectionId);

    if (!rect) {
      console.log(`Section #${sectionId} not found, skipping`);
      continue;
    }

    // Wait a bit for scroll and rendering
    await new Promise(r => setTimeout(r, 500));

    // Take screenshot of the section area
    await page.screenshot({
      path: path.join(outputDir, `${sectionId}.png`),
      clip: {
        x: 0,
        y: rect.top,
        width: WIDTH,
        height: Math.min(rect.height, HEIGHT),
      },
    });

    console.log(`✓ ${sectionId}.png (${WIDTH}x${Math.min(rect.height, HEIGHT)})`);
  }

  await browser.close();
  console.log(`\nDone! Screenshots saved to ${outputDir}`);
}

run().catch(console.error);
