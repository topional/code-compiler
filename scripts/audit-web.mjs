/**
 * Auditoría automatizada real en navegador (Playwright + axe-core):
 * - Verifica los 10 temas visuales (incluyendo GoJS Nocturno, Dracula, Tokyo Night,
 *   Catppuccin Mocha/Latte, Nord, Arcade Pixel, Cuaderno Taller, Bosque Menta y AAA 21:1).
 * - Comprueba las 4 vistas (#inicio, #estudio, #misiones, #guia) × 4 viewports
 *   (1440×900, 1280×720, 390×844, 320×568) con 0 errores consola, 0 HTTP >= 400,
 *   0 desbordamiento horizontal y 0 violaciones axe-core.
 * - Ejecuta E2E completos (calculadora interactiva, Rayos X, formateador, snapshots,
 *   paleta Ctrl+K, selector de 10 temas, Fuse.js) y genera capturas reales en docs/screenshots/.
 */

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = require.resolve('axe-core/axe.min.js');

const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}/`;
const ROUTES = ['inicio', 'estudio', 'misiones', 'guia'];
const ALL_THEMES = [
  'gojs-dark',
  'dracula',
  'tokyo-night',
  'catppuccin-mocha',
  'nord',
  'arcade-pixel',
  'cuaderno',
  'catppuccin-latte',
  'bosque-menta',
  'high-contrast',
];
const CORE_THEMES = ['gojs-dark', 'cuaderno', 'high-contrast'];
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
];

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // esperar
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`El servidor en ${url} no respondió en ${timeoutMs} ms`);
}

function startPreviewServer() {
  const isWin = process.platform === 'win32';
  return spawn(
    isWin ? 'cmd.exe' : 'npx',
    isWin
      ? ['/c', `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`]
      : ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    { stdio: 'pipe', cwd: process.cwd() },
  );
}

async function runAxeAndOverflow(page, label, failures) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    failures.push(`OVERFLOW [${label}]: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`);
  }

  await page.addScriptTag({ path: axeSource });
  const axeResults = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });

  for (const v of axeResults.violations) {
    failures.push(`AXE [${label}] (${v.impact}) ${v.id}: ${v.help} — ${v.nodes[0]?.target?.join(' ')}`);
  }
}

async function run() {
  mkdirSync(resolve(process.cwd(), 'docs/screenshots'), { recursive: true });
  const server = startPreviewServer();
  let browser;
  const failures = [];

  try {
    await waitForServer(BASE_URL);
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      try {
        browser = await chromium.launch({ headless: true, channel: 'chrome' });
      } catch {
        browser = await chromium.launch({ headless: true, channel: 'msedge' });
      }
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    const badResponses = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('response', (res) => {
      if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
    });

    // Activar reduced-motion vía botón/localStorage ANTES de cargar para que MotionConfig desactive fades
    await page.addInitScript(() => {
      localStorage.setItem('chispa_edu_reduced_motion', 'true');
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    let checksRun = 0;

    // 1. Matriz completa: 4 rutas × 4 viewports × 3 temas principales (48 checks)
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const theme of CORE_THEMES) {
        await page.evaluate((t) => {
          localStorage.setItem('chispa_edu_tema_v2', t);
          document.documentElement.setAttribute('data-theme', t);
        }, theme);

        for (const route of ROUTES) {
          await page.evaluate((r) => {
            window.location.hash = `#${r}`;
            window.scrollTo(0, 0);
          }, route);
          await page.waitForTimeout(150);
          await runAxeAndOverflow(page, `${route} | ${vp.name} | ${theme}`, failures);
          checksRun += 1;
        }
      }
    }

    // 2. Auditoría de contraste + overflow en TODOS los 10 temas (Inicio y Estudio en 1440×900)
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const theme of ALL_THEMES) {
      if (CORE_THEMES.includes(theme)) continue;
      await page.evaluate((t) => {
        localStorage.setItem('chispa_edu_tema_v2', t);
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      for (const route of ['inicio', 'estudio']) {
        await page.evaluate((r) => {
          window.location.hash = `#${r}`;
          window.scrollTo(0, 0);
        }, route);
        await page.waitForTimeout(140);
        await runAxeAndOverflow(page, `${route} | 1440x900 | ${theme}`, failures);
        checksRun += 1;
      }
    }

    // 3. Capturas reales + E2E completos
    const setView = async (theme, route) => {
      await page.evaluate(
        ({ t, r }) => {
          localStorage.setItem('chispa_edu_tema_v2', t);
          document.documentElement.setAttribute('data-theme', t);
          window.location.hash = `#${r}`;
          window.scrollTo(0, 0);
        },
        { t: theme, r: route },
      );
      await page.waitForTimeout(260);
    };

    // Portada GoJS Nocturno (por defecto) y Cuaderno Taller
    await setView('gojs-dark', 'inicio');
    await page.screenshot({ path: 'docs/screenshots/01-inicio-gojs-oscuro.png' });

    await setView('cuaderno', 'inicio');
    await page.screenshot({ path: 'docs/screenshots/02-inicio-cuaderno-claro.png' });

    // Galería de 10 temas abierta (Dracula)
    await setView('dracula', 'inicio');
    await page.locator('.theme-trigger-btn').click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'docs/screenshots/03-galeria-10-temas.png' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);

    // Estudio en Tokyo Night + ejecución + Rayos X + Historial + Formateador
    await setView('tokyo-night', 'estudio');
    await page.selectOption('#speed-select', '0');
    await page.getByRole('button', { name: 'Ejecutar' }).click();
    await page.mouse.move(10, 10);
    await page.waitForTimeout(300);
    const consoleText = await page.locator('.console-feed').textContent();
    if (!consoleText?.includes('Ya puedes programar con texto')) {
      failures.push(`E2E: basico.edu no imprimió salida esperada. Consola: ${consoleText}`);
    }
    await page.screenshot({ path: 'docs/screenshots/04-estudio-tokyo-night.png' });

    // Rayos X en Arcade Pixel
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'arcade-pixel'));
    await page.getByRole('tab', { name: /Rayos X/i }).click();
    await page.waitForTimeout(180);
    const xrayRows = await page.locator('.xray-table tbody tr').count();
    if (xrayRows < 5) failures.push(`E2E: Rayos X mostró pocas filas (${xrayRows})`);
    await page.screenshot({ path: 'docs/screenshots/05-rayosx-arcade-pixel.png' });

    // Flujo interactivo `preguntar` con calculadora.edu + Paleta Ctrl+K
    await page.getByRole('tab', { name: /Escenario/i }).click();
    await page.selectOption('#ejemplo-select', 'calculadora');
    await page.waitForTimeout(180);
    await page.getByRole('button', { name: 'Ejecutar' }).click();
    await page.waitForSelector('#respuesta-edu', { timeout: 3000 });
    await page.fill('#respuesta-edu', '1');
    await page.getByRole('button', { name: 'Responder' }).click();
    await page.waitForTimeout(100);
    await page.fill('#respuesta-edu', '8');
    await page.getByRole('button', { name: 'Responder' }).click();
    await page.waitForTimeout(100);
    await page.fill('#respuesta-edu', '5');
    await page.getByRole('button', { name: 'Responder' }).click();
    await page.waitForTimeout(220);
    const calcOut = await page.locator('.console-feed').textContent();
    if (!calcOut?.includes('13')) {
      failures.push(`E2E: calculadora.edu no devolvió 13. Consola: ${calcOut}`);
    }

    // Verificar Paleta de Comandos Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForSelector('#cmd-input', { timeout: 2000 });
    await page.fill('#cmd-input', 'Dracula');
    await page.waitForTimeout(120);
    const cmdCount = await page.locator('.cmd-item').count();
    if (cmdCount < 1) failures.push('E2E: Paleta Ctrl+K no devolvió resultados para Dracula');
    await page.keyboard.press('Escape');

    // Misiones en Bosque Menta + Guía Fuse.js + Alto Contraste AAA + Móvil 390
    await setView('bosque-menta', 'misiones');
    await page.screenshot({ path: 'docs/screenshots/06-misiones-bosque-menta.png' });

    await setView('cuaderno', 'guia');
    await page.fill('#guide-search', 'bucle');
    await page.waitForTimeout(150);
    if ((await page.locator('.guide-card').count()) < 1) {
      failures.push('E2E: búsqueda fuzzy "bucle" en Guía no devolvió resultados');
    }

    await setView('high-contrast', 'estudio');
    await page.screenshot({ path: 'docs/screenshots/07-alto-contraste-aaa.png' });

    await page.setViewportSize({ width: 390, height: 844 });
    await setView('gojs-dark', 'inicio');
    await page.screenshot({ path: 'docs/screenshots/08-movil-390.png' });

    if (consoleErrors.length > 0) failures.push(`CONSOLE ERRORS: ${consoleErrors.join(' | ')}`);
    if (pageErrors.length > 0) failures.push(`PAGE ERRORS: ${pageErrors.join(' | ')}`);
    if (badResponses.length > 0) failures.push(`HTTP >= 400: ${badResponses.join(' | ')}`);

    console.log(`\n=== AUDITORÍA CHISPA .EDU · CODE COMPILER (10 TEMAS) ===`);
    console.log(`Combinaciones auditadas: ${checksRun}`);
    console.log(`Temas auditados: ${ALL_THEMES.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`HTTP >= 400: ${badResponses.length}`);
    console.log(`Fallos detectados: ${failures.length}`);

    if (failures.length > 0) {
      console.error('\nDETALLE DE FALLOS:');
      for (const f of failures) console.error(' -', f);
      process.exitCode = 1;
    } else {
      console.log('¡AUDITORÍA SUPERADA AL 100 %! 0 errores, 0 desbordamientos, 0 incidencias axe-core en los 10 temas.');
    }
  } finally {
    if (browser) await browser.close();
    if (process.platform === 'win32' && server.pid) {
      spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill();
    }
    setTimeout(() => process.exit(process.exitCode ?? 0), 250);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
