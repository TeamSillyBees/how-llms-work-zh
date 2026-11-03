import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import ts from 'typescript';

const ROOT = path.resolve(process.env.SITE_ROOT || '../..');
const UPSTREAM = path.resolve(process.env.UPSTREAM_ROOT || '../../../upstream');
const OUT = path.resolve('artifacts');
await fs.mkdir(OUT, { recursive: true });
const report = { upstream: '1add5a7225cfa1292d5641b7d8e65bbd05beb8fd', checks: [], screenshots: [], knownBaselineIssues: [], failures: [] };
let browser;
const servers = [];
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, ...(detail === undefined ? {} : { detail }) }); }
  catch (e) { report.failures.push({ name, error: e.stack || String(e) }); report.checks.push({ name, passed: false }); }
}
async function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
      let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const filename = path.resolve(root, relative);
      if (!filename.startsWith(root + path.sep) || relative.split('/').some(p => p.startsWith('.'))) { res.writeHead(403).end(); return; }
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' }[path.extname(filename)] || 'application/octet-stream';
      const bytes = await fs.readFile(filename);
      res.writeHead(200, { 'Content-Type': mime + '; charset=utf-8' }); res.end(bytes);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return `http://127.0.0.1:${server.address().port}`;
}
function jsTokens(source) {
  const ast = ts.createSourceFile('main.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.equal(ast.parseDiagnostics.length, 0, 'JavaScript parse diagnostics');
  const tokens = [];
  function visit(n) {
    const children = n.getChildren(ast);
    if (children.length) children.forEach(visit);
    else tokens.push({ kind: ts.SyntaxKind[n.kind], text: n.getText(ast), language: [ts.SyntaxKind.StringLiteral, ts.SyntaxKind.NoSubstitutionTemplateLiteral, ts.SyntaxKind.TemplateHead, ts.SyntaxKind.TemplateMiddle, ts.SyntaxKind.TemplateTail].includes(n.kind), line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1 });
  }
  visit(ast); return tokens;
}
async function staticParity(page, sub) {
  const read = (root, f) => fs.readFile(path.join(root, sub, f), 'utf8');
  await check(`${sub || 'root'}: CSS bytes`, async () => assert.equal(await read(ROOT, 'style.css'), await read(UPSTREAM, 'style.css')));
  await check(`${sub || 'root'}: HTML element structure and non-language attributes`, async () => {
    const html = [await read(UPSTREAM, 'index.html'), await read(ROOT, 'index.html')];
    const structures = await page.evaluate(html => html.map(source => {
      const doc = new DOMParser().parseFromString(source, 'text/html');
      function node(el) {
        return { tag: el.tagName, attrs: [...el.attributes].filter(a => !['lang', 'aria-label', 'title', 'alt', 'placeholder'].includes(a.name)).map(a => [a.name, a.value]).sort(), children: [...el.children].map(node) };
      }
      return node(doc.documentElement);
    }), html);
    assert.deepEqual(structures[1], structures[0]);
  });
  await check(`${sub || 'root'}: JS non-language tokens and literal audit`, async () => {
    const a = jsTokens(await read(UPSTREAM, 'main.js')), b = jsTokens(await read(ROOT, 'main.js'));
    assert.deepEqual(b.map(t => [t.kind, t.language ? '<literal>' : t.text]), a.map(t => [t.kind, t.language ? '<literal>' : t.text]));
    const invariantNames = new Set(['MERGES', 'TOKEN_SETS', 'FALLBACK', 'PILL_COLORS', 'COLORS', 'BACK_ORDER', 'BACK_EDGE_STEPS']);
    function invariantData(source) {
      const ast = ts.createSourceFile('main.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      const data = {};
      function visit(n) {
        if (ts.isVariableDeclaration(n) && invariantNames.has(n.name.getText(ast)) && n.initializer) {
          data[n.name.getText(ast)] = jsTokens('const invariant = ' + n.initializer.getText(ast) + ';').map(t => [t.kind, t.text]);
        }
        ts.forEachChild(n, visit);
      }
      visit(ast); return data;
    }
    assert.deepEqual(invariantData(await read(ROOT, 'main.js')), invariantData(await read(UPSTREAM, 'main.js')), 'algorithm / tokenizer / sampling data must remain unchanged');
    const changes = a.flatMap((t, i) => t.text === b[i].text ? [] : [{ line: b[i].line, upstream: t.text, translated: b[i].text }]);
    await fs.writeFile(path.join(OUT, `${sub || 'root'}-literal-audit.json`), JSON.stringify(changes, null, 2));
    // Strings are audited separately: token shape alone is not proof of semantic equality.
    return { changedDisplayLiterals: changes.length, audit: `${sub || 'root'}-literal-audit.json` };
  });
}
async function interact(page, sub) {
  const click = id => page.locator('#' + id).click();
  const text = id => page.locator('#' + id).textContent();
  const disabled = id => page.locator('#' + id).isDisabled();
  const range = (id, value) => page.locator('#' + id).evaluate((el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, value);
  const hasClass = (id, cls) => page.locator('#' + id).evaluate((el, cls) => el.classList.contains(cls), cls);
  const result = {};
  if (!sub) {
    await page.locator('#bpe-input').fill('the'); await click('bpe-step-btn');
    result.bpeAfterStep = await page.locator('#bpe-strip .bpe-pill').allTextContents();
    assert.deepEqual(result.bpeAfterStep, ['th', 'e']);
    await click('bpe-auto-btn'); await page.waitForFunction(() => document.querySelector('#bpe-strip').children.length === 1);
    await click('bpe-reset-btn'); assert.equal(await page.locator('#bpe-strip .bpe-pill').count(), 3);
    await page.evaluate(() => { Math.random = () => 0; });
    result.initialSequence = await text('gen-seq'); assert.equal(result.initialSequence, 'The sky appears blue');
    result.continuations = [];
    for (let i = 0; i < 4; i++) { await click('sample-btn'); result.continuations.push(await text('gen-seq')); await page.waitForFunction(() => !document.querySelector('#sample-btn').disabled); }
    assert.equal(result.continuations[3], 'The sky appears blue because of Rayleigh scattering');
    await click('reset-gen-btn'); assert.equal(await text('gen-seq'), result.initialSequence);
    await range('temp-slider', '1.5'); assert.equal(await text('temp-val'), '1.5');
    for (const id of ['input', 'embed', 'attn', 'mlp', 'norm', 'repeat', 'logits']) {
      // The SVG is redrawn every animation frame; dispatching still invokes the real DOM listener without racing layout hit-testing.
      await page.locator(`[data-layer="${id}"]`).dispatchEvent('click');
      assert(await hasClass('transformer-card', 'tc-visible'));
      if (id === 'attn') assert.equal(await page.locator('.tc-cell').count(), 16);
      await page.locator(`[data-layer="${id}"]`).dispatchEvent('click'); assert(!await hasClass('transformer-card', 'tc-visible'));
    }
    await click('rag-run-btn'); await page.waitForTimeout(1100); await click('rag-reset-btn'); await page.waitForTimeout(4000);
    result.ragResetResurrectsContext = await hasClass('rag-ctx-box', 'rag-visible');
    report.knownBaselineIssues.push({ site: page.url(), issue: 'RAG in-flight reset does not cancel pending callbacks', reproduced: result.ragResetResurrectsContext });
  } else if (sub === 'how-to-use-llms') {
    await click('thinking-run-btn'); assert(await disabled('thinking-run-btn'));
    await page.waitForFunction(() => !document.querySelector('#thinking-run-btn').disabled);
    result.thinkingSteps = await page.locator('.thinking-step').count(); assert.equal(result.thinkingSteps, 5);
    await click('rp-run-btn'); await page.waitForFunction(() => getComputedStyle(document.querySelector('#rp-result')).display !== 'none');
    result.researchDone = !(await disabled('rp-run-btn'));
    await click('code-run-btn'); await page.waitForFunction(() => !document.querySelector('#code-run-btn').disabled);
    result.codeChart = await page.locator('#cd-step-2').isVisible(); assert(result.codeChart);
    await click('al-run-btn'); await page.waitForFunction(() => !document.querySelector('#al-run-btn').disabled); result.agentDone = true;
  } else {
    await range('np-w1', '1'); await range('np-w2', '0'); await range('np-b', '0');
    result.neuronRaw = await text('np-raw'); result.neuronOut = await text('np-out');
    assert(Math.abs(+result.neuronOut - Math.tanh(+result.neuronRaw)) < 0.001);
    for (let i = 0; i < 3; i++) await click('fp-run-btn'); assert(await disabled('fp-run-btn'));
    await click('fp-reset-btn'); assert(!(await disabled('fp-run-btn')));
    const before = +(await text('loss-val-display')); await click('loss-step-btn'); result.loss = +(await text('loss-val-display')); assert(result.loss < before);
    await click('loss-reset-btn'); assert.equal(+(await text('loss-w-val')), 3);
    await click('graph-forward-btn'); assert(!(await disabled('graph-back-btn'))); await click('graph-back-btn'); await page.waitForTimeout(4000);
    result.gradientLabels = await page.locator('#graph-svg').textContent();
    await click('graph-reset-btn'); assert(await disabled('graph-back-btn')); assert(!(await disabled('graph-forward-btn')));
    // Labels may be localized; compare numeric outputs and control state only.
    delete result.gradientLabels;
  }
  return result;
}
try {
  const urls = { en: await serve(UPSTREAM), zh: await serve(ROOT) };
  // Explicitly retain Chromium sandboxing. No --no-sandbox or environment workaround.
  // Ubuntu ships an AppArmor profile for the runner-installed stable Chrome.
  // Use that supported browser without weakening OS or browser sandbox settings.
  browser = await chromium.launch({ channel: 'chrome', chromiumSandbox: true });
  report.browser = { channel: 'chrome', version: browser.version(), chromiumSandbox: true };
  const auditPage = await browser.newPage();
  for (const sub of ['', 'how-to-use-llms', 'neural-networks']) await staticParity(auditPage, sub);
  await auditPage.close();
  const interactive = {};
  for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
    for (const sub of ['', 'how-to-use-llms', 'neural-networks']) {
      const sizes = {};
      for (const lang of ['en', 'zh']) {
        const key = `${viewport.name}-${lang}-${sub || 'root'}`;
        await check(key, async () => {
          const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.name === 'mobile', hasTouch: viewport.name === 'mobile', deviceScaleFactor: 1 });
          const page = await context.newPage(); const errors = [], externalFailures = [];
          page.on('pageerror', e => errors.push({ text: e.message, url: 'runtime' }));
          page.on('console', m => { if (m.type() === 'error') errors.push({ text: m.text(), url: m.location().url || '' }); });
          page.on('requestfailed', r => externalFailures.push({ url: r.url(), reason: r.failure()?.errorText }));
          await page.addInitScript(() => { Math.random = () => 0.1; });
          try {
            await page.goto(`${urls[lang]}/${sub ? sub + '/' : ''}`, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.locator('html').getAttribute('lang'), lang === 'en' ? 'en' : 'zh-CN');
            const brokenAnchors = await page.locator('a[href^="#"],.tnav-btn[data-section]').evaluateAll(els => els.filter(el => !document.getElementById(el.dataset.section || el.getAttribute('href').slice(1))).map(el => el.outerHTML));
            assert.deepEqual(brokenAnchors, []);
            // Scroll through actual content so the site's real IntersectionObservers reveal sections.
            const height = await page.evaluate(() => document.documentElement.scrollHeight);
            for (let y = 0; y < height; y += viewport.height * 0.8) { await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(50); }
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(700);
            sizes[lang] = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
            const screenshot = `${key}.png`; await page.screenshot({ path: path.join(OUT, screenshot), fullPage: true }); report.screenshots.push(screenshot);
            if (viewport.name === 'desktop') interactive[`${lang}-${sub}`] = await interact(page, sub);
            // Keep browser/network diagnostics even when an external font service is unavailable.
            const localErrors = errors.filter(e => !e.url.startsWith('https://fonts.googleapis.com') && !e.url.startsWith('https://fonts.gstatic.com'));
            const localRequestFailures = externalFailures.filter(r => r.url.startsWith(urls[lang]));
            assert.deepEqual(localRequestFailures, []);
            assert.deepEqual(localErrors, []);
            return { geometry: sizes[lang], browserConsoleErrors: errors, externalFailures };
          } finally { await context.close(); }
        });
      }
      await check(`${viewport.name}-${sub || 'root'} horizontal overflow relative to upstream`, async () => {
        assert(sizes.en && sizes.zh, 'both pages must render');
        assert(sizes.zh.scrollWidth - sizes.zh.width <= Math.max(0, sizes.en.scrollWidth - sizes.en.width), 'translation introduces horizontal overflow');
      });
    }
  }
  for (const sub of ['', 'how-to-use-llms', 'neural-networks']) await check(`${sub || 'root'} interactive English / Chinese results`, async () => {
    assert(interactive[`en-${sub}`] && interactive[`zh-${sub}`], 'both interaction runs must complete');
    assert.deepEqual(interactive[`zh-${sub}`], interactive[`en-${sub}`]);
  });
} catch (e) { report.failures.push({ name: 'setup / browser launch', error: e.stack || String(e) }); }
finally {
  if (browser) await browser.close();
  await Promise.all(servers.map(s => new Promise(resolve => s.close(resolve))));
  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const summary = `# Translation parity\n\n${report.checks.filter(c => c.passed).length}/${report.checks.length} checks passed. ${report.failures.length} failures.\n\nReal Chromium screenshots: ${report.screenshots.length}.\n\nCSS, DOM and JS token checks are structural evidence; screenshots require human visual review. Natural-language wrapping is not pixel-identical by design. JS changed-literal audit files require review for semantic fidelity. The upstream RAG interrupted-reset issue is recorded, not fixed.\n\n${report.failures.map(f => `- ${f.name}: ${f.error}`).join('\n')}\n`;
  await fs.writeFile(path.join(OUT, 'summary.md'), summary); console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}
process.exitCode = report.failures.length ? 1 : 0;
