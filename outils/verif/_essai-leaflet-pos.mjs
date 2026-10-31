// Essai ponctuel (2026-10-31), démo locale : d'où vient l'erreur « _leaflet_pos » quand on enchaîne des fiches vite, et
// existait-elle avant le radar ? AVANT=commit sert l'app.js de ce commit à la place du fichier actuel.
// PAUSE=ms : temps laissé à chaque fiche avant de la fermer. node outils/verif/_essai-leaflet-pos.mjs
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
const ANCIEN = process.env.AVANT ? execSync(`git show ${process.env.AVANT}:app.js`, { encoding:'utf8', maxBuffer:1e9 }) : null;
const PAUSE = +(process.env.PAUSE || 400);
const NOMS = ['dacelo novaeguineae', 'dromaius novaehollandiae', 'struthio camelus', 'turdus migratorius', 'spheniscus magellanicus', 'trochilus polytmus', 'turdus merula', 'ardea cinerea', 'cygnus olor', 'alcedo atthis'];
const nav = await chromium.launch();
let total = 0;
for(let tour = 0; tour < 3; tour++){
  const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
  await ctx.route(/\/app\.js/, async r => { const rep = await r.fetch(); await r.fulfill({ response:rep, body:(ANCIEN || await rep.text()) + '\n;window.__fiche = openSpeciesModal;' }); });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.stack || e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  for(const s of NOMS){ await p.evaluate(s => window.__fiche(s), s); await p.waitForTimeout(PAUSE); await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  total += erreurs.length;
  console.log('tour', tour, 'erreurs', erreurs.length);
  if(erreurs[0]) console.log(erreurs[0].split('\n').slice(0, 9).map(l => l.replace(/http:\/\/localhost:8765\//, '')).join('\n'));
  await ctx.close();
}
await nav.close();
console.log('TOTAL', total);
