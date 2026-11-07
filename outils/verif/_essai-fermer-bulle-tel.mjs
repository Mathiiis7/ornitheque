// Essai ponctuel (2026-11-07) : au téléphone, toucher la carte pour refermer la bulle d'un point ne choisit
// pas la région en dessous ; le toucher suivant, bulle fermée, la choisit. Vrais touchers.
// node outils/verif/_essai-fermer-bulle-tel.mjs
import { chromium } from 'playwright';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const nav = await chromium.launch();
const p = await (await nav.newContext({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true, deviceScaleFactor:3, locale:'fr-FR', serviceWorkers:'block' })).newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
// La France ouverte (ses régions deviennent touchables), la couche Ligue allumée, points non regroupés.
await p.evaluate(() => document.getElementById('ctLigPaysBtn').click()); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-item[data-cc="FR"]')?.click()); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop')?.click()); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="ligue"]').click()); await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('ctCarte').scrollIntoView({ block:'end' })); await p.waitForTimeout(500);
const etat = () => p.evaluate(() => ({ zone:document.getElementById('ctZoneNom').textContent, bulle:!!document.querySelector('#ctCarte .leaflet-tooltip, #ctCarte .leaflet-popup') }));
// Un point visible de la ligue, loin des bords.
const pt = await p.evaluate(() => {
  const c = document.getElementById('ctCarte').getBoundingClientRect();
  const ok = [...document.querySelectorAll('#ctCarte .leaflet-marker-icon, #ctCarte path.leaflet-interactive.ct-pt, #ctCarte .ct-pt')].map(e => e.getBoundingClientRect())
    .filter(b => b.width && b.top > c.top + 80 && b.bottom < c.bottom - 80 && b.left > c.left + 60 && b.right < c.right - 60);
  return ok.length ? { x:ok[0].left + ok[0].width / 2, y:ok[0].top + ok[0].height / 2, n:ok.length } : null;
});
console.log('point trouvé', JSON.stringify(pt), 'départ', JSON.stringify(await etat()));
if(!pt){ console.log('aucun point : essai impossible'); await nav.close(); process.exit(1); }
await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(800);
console.log('après toucher du point', JSON.stringify(await etat()));
await p.screenshot({ path:`${DOS}/bulle-ouverte.png` });
// Un endroit de la carte sans point, dans une région : cherché par elementFromPoint (un contour de région).
const vide = await p.evaluate(pt => {
  for(let dy = 60; dy < 260; dy += 20) for(const dx of [-90, 90, -140, 140]){
    const x = pt.x + dx, y = pt.y + dy, e = document.elementFromPoint(x, y);
    if(e && e.tagName === 'path' && !String(e.className.baseVal || '').includes('ct-pt') && e.closest('#ctCarte') && !e.closest('.leaflet-marker-pane')) return { x, y, cls:String(e.className.baseVal) };
  }
  return null;
}, pt);
console.log('endroit vide sur une région', JSON.stringify(vide));
await p.touchscreen.tap(vide.x, vide.y); await p.waitForTimeout(1200);
const apres1 = await etat();
console.log('1er toucher à côté (doit fermer sans choisir)', JSON.stringify(apres1));
await p.touchscreen.tap(vide.x, vide.y); await p.waitForTimeout(1500);
console.log('2e toucher (doit choisir la région)', JSON.stringify(await etat()));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
