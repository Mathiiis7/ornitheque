// Essai (2026-11-10) : quels fichiers de pays du monde (data/countries/xx/pays.json, data/especes-monde/)
// la démo locale demande au démarrage, et quelle fonction les demande.
// Usage : node outils/verif/_essai-monde-demarrage.mjs [URL]
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:8766/demo/';
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => {
  window.__appelsMonde = [];
  const f = window.fetch;
  window.fetch = function(u, ...r){
    const s = String(u && u.url || u);
    if (/countries\/[a-z]{2}\/pays\.json|especes-monde/.test(s))
      window.__appelsMonde.push(s.replace(/\?.*/, '') + ' <- ' + (new Error().stack || '').split('\n').slice(2, 5).map(l => l.trim().replace(/\(.*\//, '(')).join(' < '));
    return f.call(this, u, ...r);
  };
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
const appels = await page.evaluate(() => window.__appelsMonde);
console.log(appels.length + ' demandes au demarrage');
const parOrigine = {};
for (const a of appels) { const o = a.split(' <- ')[1]; parOrigine[o] = (parOrigine[o] || 0) + 1; }
for (const [o, n] of Object.entries(parOrigine)) console.log(String(n).padStart(4), o);
await navigateur.close();
