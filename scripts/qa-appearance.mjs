import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compileTheme } from "./build.mjs";

// Optional browser QA against an actual Obsidian stylesheet. Supply an existing
// Playwright installation and browser to avoid changing the build dependencies.
const [appCssPath, playwrightPath, executablePath, screenshotDirectory] = process.argv.slice(2);
if (!appCssPath) {
  throw new Error("Usage: node scripts/qa-appearance.mjs <app.css> [Playwright module] [Chromium executable] [screenshot directory]");
}
const appCss = await readFile(resolve(appCssPath), "utf8");
// Obsidian 1.14.5 constructs the ribbon with only mod-primary; older builds
// use only mod-left. Giving a fixture both classes hides incompatible selectors.
const ribbonSideClass = appCss.includes(".workspace-ribbon.mod-primary")
  ? "mod-primary"
  : "mod-left";
const { chromium } = await import(
  playwrightPath ? pathToFileURL(resolve(playwrightPath)).href : "playwright"
);
const browser = await chromium.launch({ headless: true, ...(executablePath && { executablePath }) });
const errors = [];
let scenarios = 0;
const check = (condition, message) => { if (!condition) errors.push(message); };
const channels = (color) => color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
const luminance = (rgb) => rgb.map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (color, background, opacity = 1) => {
  const bg = channels(background);
  const fg = channels(color).map((v, i) => v * opacity + bg[i] * (1 - opacity));
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const composite = (color, background, opacity) => `rgb(${channels(color).map(
  (value, index) => value * opacity + channels(background)[index] * (1 - opacity),
).join(", ")})`;

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.setContent(`<body class="theme-dark mod-macos is-hidden-frameless is-focused">
    <div class="workspace">
      <div class="workspace-ribbon side-dock-ribbon ${ribbonSideClass}"></div>
      <div class="workspace-split mod-root"><div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
        <div class="workspace-tab-header-container"><div class="workspace-tab-header-container-inner">
          <div class="workspace-tab-header is-active"><div class="workspace-tab-header-inner">Active note</div></div>
          <div class="workspace-tab-header" id="inactive"><div class="workspace-tab-header-inner">Other note</div></div>
        </div></div>
        <div class="workspace-leaf-content"><div class="markdown-rendered">
          <a class="internal-link is-unresolved">Unresolved note</a>
          <ul><li class="task-list-item" data-task="x">Completed task</li></ul>
          ${["note", "tip", "warning", "danger", "quote", "example", "abstract"].map((type) => `<div class="callout" data-callout="${type}"><div class="callout-title"><div class="callout-icon"><svg class="svg-icon"></svg></div><div class="callout-title-inner">${type}</div></div><div class="callout-content">Callout content</div></div>`).join("")}
          <h4>Heading four</h4><h5>Heading five</h5><h6>Heading six</h6>
          <h2 id="reading-h2">Reading heading</h2><ul><li>Reading content</li></ul>
        </div><div class="markdown-source-view mod-cm6 cm-s-obsidian is-live-preview">
          <span class="is-unresolved">Editor unresolved note</span><div class="HyperMD-task-line" data-task="x">Editor completed task</div>
          <div class="cm-line HyperMD-header HyperMD-header-2">Meetings</div>
          <div class="cm-line HyperMD-list-line HyperMD-list-line-1" id="h2-list-content">Meeting details start immediately</div>
          <div class="cm-line HyperMD-header HyperMD-header-2">Notes</div>
          <div class="cm-line" id="h2-paragraph-content">Paragraph starts immediately</div>
          <div class="cm-line HyperMD-header HyperMD-header-2">Existing blank line</div>
          <div class="cm-line"><br></div>
          <div class="cm-line" id="h2-after-blank">Content after an existing blank line</div>
          <div class="cm-line HyperMD-header HyperMD-header-3">Other heading</div>
          <div class="cm-line" id="h3-content">Other heading spacing stays native</div>
        </div></div>
      </div></div>
      <div class="sidebar-toggle-button mod-right mod-secondary"><div class="clickable-icon">Toggle</div></div>
    </div></body>`);
  await page.addStyleTag({ content: appCss });
  await page.addStyleTag({ content: await compileTheme() });
  const style = (selector, pseudo = null) => page.locator(selector).first().evaluate((el, pseudo) => {
    const s = getComputedStyle(el, pseudo);
    // Resolve any supported CSS color syntax to sRGB for contrast checks.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = s.color;
    context.fillRect(0, 0, 1, 1);
    const rgb = context.getImageData(0, 0, 1, 1).data;
    return { color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, background: s.backgroundColor, opacity: Number(s.opacity), width: parseFloat(s.width), nativeRibbonWidth: parseFloat(s.getPropertyValue("--ribbon-width")), content: s.content, fontStyle: s.fontStyle };
  }, pseudo);
  const cornerPixels = async (ribbonWidth) => {
    const header = await page.locator(".workspace-tab-header-container").boundingBox();
    const height = Math.floor(header.height);
    // Sample actual painted pixels on either side of the ribbon/rail boundary,
    // within the reserved traffic-light area before the first tab starts.
    const screenshot = await page.screenshot({
      clip: { x: 0, y: Math.max(0, header.y), width: ribbonWidth + 16, height },
    });
    return page.evaluate(async ({ png, ribbonWidth, height }) => {
      const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      const sample = (x) => [...context.getImageData(x, Math.floor(height / 2), 1, 1).data];
      const pixels = [sample(Math.floor(ribbonWidth / 2)), sample(ribbonWidth + 8)];
      bitmap.close();
      return pixels;
    }, { png: screenshot.toString("base64"), ribbonWidth, height });
  };
  for (const mode of ["theme-dark", "theme-dark red-graphite-dark-document", "theme-light"]) {
    for (const focused of [false, true]) {
      for (const left of [false, true]) {
        for (const right of [false, true]) {
          await page.evaluate(({ mode, focused, left, right }) => {
            document.body.className = `${mode} mod-macos show-ribbon is-hidden-frameless ${focused ? "is-focused" : ""}`;
            const workspace = document.querySelector(".workspace");
            workspace.classList.toggle("is-left-sidedock-open", left);
            workspace.classList.toggle("is-right-sidedock-open", right);
            document.querySelector(".workspace-ribbon").classList.toggle("is-collapsed", !left);
          }, { mode, focused, left, right });
          await page.mouse.move(1390, 990);
          await page.evaluate(() => {
            document.body.getBoundingClientRect();
            document.getAnimations().forEach((animation) => animation.finish());
          });
          const label = `${mode}; focused=${focused}, left=${left}, right=${right}`;
          const background = (await style(".workspace-leaf-content")).background;
          for (const selector of ["#h2-list-content", "#h2-paragraph-content"]) {
            const gap = await page.locator(selector).evaluate((el) => {
              const s = getComputedStyle(el);
              return { padding: parseFloat(s.paddingTop), lineHeight: parseFloat(s.lineHeight) };
            });
            check(gap.padding > 0 && gap.padding < gap.lineHeight / 2, `H2 needs a modest gap below its rule: ${selector}; ${label}`);
          }
          for (const selector of ["#h2-after-blank", "#h3-content"]) {
            const padding = await page.locator(selector).evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
            check(padding === 0, `H2 spacing added an extra gap beyond its intended scope: ${selector}; ${label}`);
          }
          const readingGap = await page.locator("#reading-h2").evaluate((el) => parseFloat(getComputedStyle(el).marginBottom));
          check(readingGap > 0, `Reading H2 lost its native content spacing; ${label}`);
          for (const selector of [".markdown-rendered .is-unresolved", ".task-list-item", ".markdown-source-view .is-unresolved", ".HyperMD-task-line"]) {
            const s = await style(selector);
            check(contrast(s.color, background, s.opacity) >= 4.5, `Faint text: ${selector}; ${label}; ${s.color} on ${background}, opacity=${s.opacity}`);
          }
          for (const type of ["note", "tip", "warning", "danger", "quote", "example", "abstract"]) {
            const selector = `.callout[data-callout="${type}"]`;
            const title = await style(`${selector} .callout-title-inner`);
            const callout = await style(selector);
            const tint = await style(`${selector} .callout-title`, "::before");
            const paintedBackground = tint.content !== "none"
              ? composite(tint.background, background, tint.opacity)
              : background;
            check(contrast(title.color, paintedBackground) >= 4.5, `Callout title contrast: ${type}; ${label}`);
            if (type !== "quote") check(Math.max(...channels(title.color)) - Math.min(...channels(title.color)) > 5, `Missing callout title hue: ${type}; ${label}`);
            check(callout.background !== "rgba(0, 0, 0, 0)" || (tint.content !== "none" && tint.background !== "rgba(0, 0, 0, 0)" && tint.opacity > 0), `Missing callout tint: ${type}; ${label}`);
          }
          const ribbon = await style(".workspace-ribbon", "::before");
          check(ribbon.width === ribbon.nativeRibbonWidth, `Traffic-light backdrop protrudes beyond the ribbon; ${label}`);
          if (!left) {
            const rail = await style(".workspace-tab-header-container");
            check(ribbon.background === rail.background, `Traffic-light corner differs from the adjacent tab rail; ${label}`);
            const [cornerPixel, railPixel] = await cornerPixels(ribbon.nativeRibbonWidth);
            check(cornerPixel.every((value, index) => Math.abs(value - railPixel[index]) <= 1), `Painted traffic-light background is split at the ribbon boundary; ${label}`);
          }
          const ribbonBody = await style(".workspace-ribbon");
          const lightFrame = mode === "theme-light";
          check(channels(ribbonBody.background).every((v) => lightFrame ? v > 200 : v < 100), `Vertical ribbon lost its host palette; ${label}`);
          if (left) {
            check(channels(ribbon.background).every((v) => lightFrame ? v > 200 : v < 100), `Open-sidebar traffic-light corner lost its host palette; ${label}`);
          }
          check((await style("h5")).fontStyle !== (await style("h4")).fontStyle, `H4/H5 need distinct styles; ${label}`);
          await page.locator("#inactive").hover();
          const tab = await style("#inactive .workspace-tab-header-inner");
          const lightCenter = !mode.includes("red-graphite-dark-document");
          check(channels(tab.background).every((v) => lightCenter ? v > 200 : v < 100), `Tab hover palette; ${label}`);
          await page.locator(".sidebar-toggle-button .clickable-icon").hover();
          const corner = await style(".sidebar-toggle-button");
          const lightCorner = mode === "theme-light" || (mode === "theme-dark" && !right);
          check(channels(corner.background).every((v) => lightCorner ? v > 200 : v < 100), `Right corner palette; ${label}`);
          if (screenshotDirectory && focused && !left && !right) {
            await mkdir(resolve(screenshotDirectory), { recursive: true });
            await page.screenshot({ path: resolve(screenshotDirectory, `${mode.replaceAll(" ", "-")}.png`), fullPage: true });
          }
          scenarios++;
        }
      }
    }
  }
  for (const state of ["mod-windows", "mod-macos is-fullscreen", "mod-macos is-popout-window", "mod-macos is-mobile"]) {
    await page.evaluate((state) => {
      document.body.className = `theme-dark show-ribbon is-hidden-frameless ${state}`;
    }, state);
    const ribbon = await style(".workspace-ribbon", "::before");
    check(ribbon.width === ribbon.nativeRibbonWidth, `Traffic-light backdrop escaped its desktop macOS scope; ${state}`);
  }
} finally {
  await browser.close();
}
console.log(`${scenarios} appearance/sidebar/focus scenarios; ${errors.length} failures.`);
if (errors.length) console.log(errors.slice(0, 3).join("\n"));
assert.deepEqual([...new Set(errors.map((message) => message.split(";", 1)[0]))], [], "Appearance regressions (first occurrence of each failure)");
