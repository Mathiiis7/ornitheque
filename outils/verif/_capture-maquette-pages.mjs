// Capture chaque version de la maquette notes-privees/maquettes/telephone-pages/ (2026-11-08) :
// une image du téléphone par page et par version, puis on les regarde en planches.
import { chromium } from 'playwright';
import fs from 'fs';
const SORTIE = 'notes-privees/chantier-telephone/pages';
fs.mkdirSync(SORTIE, { recursive:true });
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1300, height:960 } });
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/notes-privees/maquettes/telephone-pages/', { waitUntil:'load' });
await p.waitForTimeout(7000);
const liste = await p.evaluate(() => [...document.querySelectorAll('button[data-p]')].map(b => [b.dataset.p, b.dataset.ver]));
for(const [pg, ver] of liste){
  await p.evaluate(([pg, ver]) => document.querySelector(`button[data-p="${pg}"][data-ver="${ver}"]`).click(), [pg, ver]);
  await p.waitForTimeout(2200);
  // Descendre jusqu'au bloc concerné pour certaines pages
  await p.evaluate(pg => {
    const d = document.getElementById('demo').contentDocument, w = document.getElementById('demo').contentWindow;
    const cible = { ranking:'#viewRanking .board-sheet', trophies:'#viewTrophies .tro-families', pokedex:'#pkdxGrid' }[pg];
    const el = cible && d.querySelector(cible);
    if(el){ const y = el.getBoundingClientRect().top + w.scrollY - 70; w.scrollTo(0, y); }
  }, pg);
  await p.waitForTimeout(700);
  await p.locator('#demo').screenshot({ path:`${SORTIE}/${pg}-${ver || 'actuel'}.png` });
  if(pg === 'ranking'){
    await p.evaluate(() => { const d = document.getElementById('demo').contentDocument, w = document.getElementById('demo').contentWindow;
      const el = d.querySelector('#matrixCards'); w.scrollTo(0, el.getBoundingClientRect().top + w.scrollY - 70); });
    await p.waitForTimeout(500);
    await p.locator('#demo').screenshot({ path:`${SORTIE}/${pg}-${ver || 'actuel'}-qui.png` });
  }
  console.log(pg, ver || 'actuel');
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
