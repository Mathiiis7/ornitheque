// Étape 3b (2026-11-08) : le Birdydex au téléphone, version C (3 colonnes, nom 14 px, sans latin ni numéro).
// À 390 et 360 px : 3 colonnes, latin et numéro cachés, nom à 14 px, rien qui déborde ; capture à 390.
import { chromium } from 'playwright';
const nav = await chromium.launch();
let defauts = 0;
for(const [larg, haut] of [[390, 844], [360, 740]]){
  const ctx = await nav.newContext({ viewport:{ width:larg, height:haut }, isMobile:true, hasTouch:true, locale:'fr-FR' });
  await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'pokedex'); }catch(_){} });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(3500);
  const r = await p.evaluate(() => {
    const cartes = [...document.querySelectorAll('#pkdxGrid .pkdx-card')].slice(0, 6);
    const c = cartes[0];
    return { cols:new Set(cartes.map(x => Math.round(x.getBoundingClientRect().left))).size,
      nom:parseFloat(getComputedStyle(c.querySelector('.pkdx-name')).fontSize),
      latin:getComputedStyle(c.querySelector('.pkdx-sci')).display, num:getComputedStyle(c.querySelector('.pkdx-num')).display,
      largeur:document.documentElement.scrollWidth };
  });
  const ok = r.cols === 3 && r.nom === 14 && r.latin === 'none' && r.num === 'none' && r.largeur <= larg;
  if(!ok) defauts++;
  console.log(`${larg} px : ${r.cols} colonnes, nom ${r.nom} px, latin ${r.latin}, numéro ${r.num}, page ${r.largeur} px ${ok ? 'ok' : 'DÉFAUT'}`);
  if(larg === 390){
    await p.evaluate(() => { const g = document.getElementById('pkdxGrid'); scrollTo(0, g.getBoundingClientRect().top + scrollY - 70); });
    await p.waitForTimeout(500);
    await p.screenshot({ path:'notes-privees/chantier-telephone/pages-ok/birdydex.png' });
  }
  await ctx.close();
}
console.log(defauts ? 'DÉFAUT' : 'CONFORME');
await nav.close();
