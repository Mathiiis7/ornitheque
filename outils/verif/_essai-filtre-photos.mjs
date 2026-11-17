// Essai ponctuel (2026-11-17), démo locale : cliquer un palier du Birdydex ne doit plus éteindre les photos.
// Compte les photos visibles reprises telles quelles (même élément img, déjà décodé) et celles qui
// restent vides dans les images qui suivent le clic.
// node outils/verif/_essai-filtre-photos.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 950 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
// Faire défiler jusqu'aux premières cases observées et attendre leurs photos.
await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card:not(.missing)').scrollIntoView({ block:'start' }));
await p.waitForFunction(() => {
  const v = [...document.querySelectorAll('#pkdxGrid .pkdx-card:not(.missing) .pkdx-img > img')].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
  return v.length >= 5 && v.every(i => i.complete && i.naturalWidth);
}, null, { timeout:20000 }).catch(() => console.log('photos pas toutes chargées avant le clic'));
for(const palier of ['10', '10', '1']){
  const r = await p.evaluate(async (palier) => {
    const g = document.getElementById('pkdxGrid');
    const visibles = () => [...g.querySelectorAll('.pkdx-card:not(.missing) .pkdx-img > img')].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    const avant = new Set(g.querySelectorAll('img'));
    const nAvant = visibles().length;
    document.querySelector(`#pkdxFiltres .rar-chip[data-tier="${palier}"]`).click();
    const vides = [];
    for(let k = 0; k < 6; k++){
      await new Promise(r => requestAnimationFrame(r));
      const vv = visibles();
      vides.push(vv.length + '/' + vv.filter(i => avant.has(i)).length + '/' + vv.filter(i => !avant.has(i) && !(i.complete && i.naturalWidth)).length + '/' + g.querySelectorAll('.pkdx-card').length);
    }
    const v = visibles();
    return { palier, visiblesAvant:nAvant, visiblesApres:v.length, reprises:v.filter(i => avant.has(i)).length, neuves:v.filter(i => !avant.has(i)).length, videsParImage:vides.join(',') };
  }, palier);
  console.log(JSON.stringify(r));
  await p.waitForTimeout(800);
}
console.log('erreurs', erreurs.length ? erreurs : 'aucune');
await nav.close();
