// Mesure (2026-10-30), démo en ligne, vrai relais : une recherche sans pays, faite deux fois par deux visiteurs
// différents. Compte ce qui part vraiment chez eBird (en-tête X-Vercel-Cache : HIT = gardé par le relais, gratuit).
// node outils/verif/_cout-recherche-monde.mjs [nom français d'une espèce]
import { chromium } from 'playwright';
const NOM = process.argv[2] || 'Tichodrome échelette';
const nav = await chromium.launch();
const passage = async () => {
  const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  const rep = []; p.on('response', r => { if(/ornitheque-relais.*data\/obs\/[A-Z]{2}\/recent\//.test(r.url())) rep.push({ s:r.status(), c:r.headers()['x-vercel-cache'] || '?' }); });
  await p.goto('https://mathiiis7.github.io/ornitheque/demo/', { waitUntil:'load' }); await p.waitForTimeout(2500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(4000);
  await p.keyboard.press('Escape');
  await p.evaluate(n => { const s = document.getElementById('mapSearch'); s.value = n; s.dispatchEvent(new Event('input', { bubbles:true })); }, NOM);
  await p.waitForTimeout(500);
  const t = Date.now();
  await p.evaluate(n => { const it = [...document.querySelectorAll('#mapSearchSuggest .map-search-suggest-item')].find(x => x.children[1]?.textContent === n); it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); }, NOM);
  await p.waitForFunction(() => /observation/.test(document.querySelector('#ctListeRecent')?.textContent || '') || /Aucune|ne répond/.test(document.getElementById('ctRecEtat')?.textContent || ''), null, { timeout:90000 }).catch(() => console.log('délai dépassé'));
  const parts = {}; for(const r of rep){ parts[r.c] = (parts[r.c] || 0) + 1; }
  const stat = {}; for(const r of rep){ stat[r.s] = (stat[r.s] || 0) + 1; }
  console.log(`${Date.now() - t} ms · ${rep.length} demandes · cache ${JSON.stringify(parts)} · statuts ${JSON.stringify(stat)}`);
  await ctx.close();
};
await passage();
await passage();
await nav.close();
