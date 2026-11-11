// La grille du Birdydex posee en blocs (2026-11-11) est-elle au pixel celle du site en ligne ? Position et taille de
// chaque case et de chaque titre, par rapport a la grille, sur le site en ligne et en local : France (familles,
// puis tri par rarete) et Europe, a l'ordinateur et au telephone. La page defile jusqu'en bas d'abord, pour que
// tous les blocs aient ete mis en page.
// Usage : node outils/verif/_compare-grille-en-ligne.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const SITES = { enLigne: 'https://mathiiis7.github.io/ornitheque/demo/', local: `http://localhost:${port}/demo/` };
const nav = await chromium.launch();
let ok = true;
async function releve(url, ecran, cas){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...(ecran === 'tel' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1500);
  if(cas.cont){
    await p.evaluate(async c => { document.getElementById('pkdxCountry').click(); await new Promise(r => setTimeout(r, 600));
      document.querySelector(`.cp-group-title[data-cont="${c}"]`).click(); document.querySelector('.cp-modal-close')?.click(); }, cas.cont);
    await p.waitForTimeout(3000);
  }
  if(cas.tri) await p.evaluate(t => document.querySelector(`[data-pkdx-sort="${t}"]`)?.click(), cas.tri);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const g = document.getElementById('pkdxGrid');
    for(let y = 0; y < document.scrollingElement.scrollHeight; y += 500){ scrollTo(0, y); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
    scrollTo(0, 0); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const g0 = g.getBoundingClientRect();
    return [...g.querySelectorAll('.pkdx-card, .pkdx-groupe, .pkdx-ordre')].map(e => {
      const b = e.getBoundingClientRect();
      return [e.className.split(' ')[0] + ':' + (e.dataset.sci || e.textContent.slice(0, 20)), Math.round(b.left - g0.left), Math.round(b.top - g0.top), Math.round(b.width), Math.round(b.height)];
    });
  });
  await ctx.close();
  return r;
}
for(const ecran of ['ordi', 'tel']){
  for(const cas of [{ nom: 'France familles' }, { nom: 'France rarete', tri: 'rarete' }, { nom: 'Europe', cont: 'Europe' }]){
    const a = await releve(SITES.enLigne, ecran, cas), b = await releve(SITES.local, ecran, cas);
    let ecart = 0, premier = null;
    const n = Math.min(a.length, b.length);
    for(let i = 0; i < n; i++){
      const d = Math.max(...[1, 2, 3, 4].map(k => Math.abs(a[i][k] - b[i][k]))) + (a[i][0] === b[i][0] ? 0 : 999);
      if(d > 1){ ecart++; if(!premier) premier = [a[i], b[i]]; }
    }
    const bon = a.length === b.length && !ecart;
    if(!bon) ok = false;
    console.log(bon ? 'OK    ' : 'ECART ', ecran, cas.nom.padEnd(16), `${a.length} / ${b.length} elements, ${ecart} ecart(s) de plus de 1 px`, premier ? JSON.stringify(premier) : '');
  }
}
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
