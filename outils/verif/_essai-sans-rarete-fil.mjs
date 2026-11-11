// Pays sans rarete dans le Fil et « Qui a vu quoi » (2026-11-11) : une observation faite en Libye (ajoutee a la
// fausse ligue le temps de l'essai) n'a ni palier ni point - « Trop peu de listes », rond gris sans chiffre - et
// une observation faite en Espagne garde son palier.
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
let ok = true;
const dire = (bon, ...m) => { if(!bon) ok = false; console.log(bon ? 'OK    ' : 'DEFAUT', ...m); };
const ctx = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
await ctx.route(u => u.pathname.endsWith('/demo/donnees.js'), async route => {
  const rep = await route.fetch();
  const maintenant = Date.now();
  const obs = (k, c, co, d) => ({ k, c, s: k, d: '2026-11-0' + d, l: '', o: 1, f: 0, co, a: maintenant - d * 1000 });
  const ajout = "DONNEES['leagues/merlin-bird/members/demo-claire'].species.push(" + JSON.stringify(obs('cercotrichas galactotes', 'Agrobate roux', 'LY', 1)) + ', ' + JSON.stringify(obs('alectoris rufa', 'Perdrix rouge', 'ES', 2)) + ');';
  route.fulfill({ response: rep, body: (await rep.text()) + String.fromCharCode(10) + ajout, headers: { ...rep.headers(), 'content-type': 'application/javascript; charset=utf-8' } });
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
// Le Fil.
await p.evaluate(() => document.getElementById('fabFeed')?.click());
await p.waitForTimeout(4000);
const fil = await p.evaluate(() => [...document.querySelectorAll('.feed-item')].map(i => ({
  nom: i.querySelector('.feed-sp')?.textContent.trim(), pays: i.querySelector('.feed-sp')?.dataset.pays || '',
  rond: i.querySelector('.feed-pas')?.textContent.trim(), rar: i.querySelector('.feed-rar')?.textContent.trim() }))
  .filter(x => x.pays === 'LY' || x.pays === 'ES'));
const ly = fil.find(x => x.pays === 'LY'), es = fil.find(x => x.pays === 'ES');
dire(ly && ly.rond === '' && /Trop peu de listes/.test(ly.rar) && es && /^\d+$/.test(es.rond), 'Fil :', JSON.stringify(fil));
await p.evaluate(() => document.getElementById('fabBackdrop')?.click());
await p.waitForTimeout(500);
// Qui a vu quoi, rarete terrain, pays Libye.
await p.evaluate(() => document.querySelector('.tab[data-view="ranking"]')?.click());
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('button[data-mode="real"]')?.click());
await p.waitForTimeout(1000);
await p.evaluate(() => document.getElementById('paysBtn')?.click());
await p.waitForTimeout(1000);
await p.evaluate(() => document.querySelector('.cp-item[data-cc="LY"]')?.click());
await p.waitForTimeout(1500);
const m = await p.evaluate(() => {
  const lignes = [...document.querySelectorAll('#matrix tr')].filter(tr => /Agrobate roux/.test(tr.textContent));
  const rond = lignes[0]?.querySelector('.rar-cell .tier-rond');
  return { trouve: lignes.length, rond: rond?.textContent.trim(), titre: rond?.getAttribute('title') || rond?.dataset.tip || rond?.getAttribute('aria-label') || '',
    pastilles: [...document.querySelectorAll('#tierChips [data-tier]')].map(b => b.dataset.tier).join(' ') };
});
dire(m.trouve && m.rond === '–' && /Trop peu de listes/.test(m.titre), 'Qui a vu quoi, Libye :', JSON.stringify(m));
dire(!erreurs.length, 'erreurs :', erreurs.join(' | ') || 'aucune');
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
