// Essai ponctuel (2026-11-07) : au téléphone, à l'arrivée sur la Carte, le bouton « Filtres » du tiroir
// replié. Cas : aucune couche, puis chaque pastille allumée ; on touche « Filtres » au doigt.
// LARGEUR=360 pour un petit écran, NOM_LONG=1 pour un long nom de zone.
// node outils/verif/_essai-filtres-tel-pastille.mjs
import { chromium } from 'playwright';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const L = +(process.env.LARGEUR || 375);
const nav = await chromium.launch();
for(const k of ['aucune', 'recent', 'ligue', 'hot']){
  const ctx = await nav.newContext({ viewport:{ width:L, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2, locale:'fr-FR', serviceWorkers:'block' });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(2000);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  const centre = sel => p.evaluate(sel => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(); return { x:b.left + b.width / 2, y:b.top + b.height / 2 }; }, sel);
  if(k !== 'aucune'){
    await p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).scrollIntoView({ block:'center' }), k);
    await p.waitForTimeout(300);
    const r = await centre(`#ctCouches [data-couche="${k}"]`); await p.touchscreen.tap(r.x, r.y);
    await p.waitForTimeout(3000);
  }
  if(process.env.NOM_LONG) await p.evaluate(() => { document.getElementById('ctZoneNom').textContent = 'Provence-Alpes-Côte d’Azur'; });
  await p.evaluate(() => { document.getElementById('ctZone').scrollIntoView({ block:'end' }); scrollBy(0, 80); });
  await p.waitForTimeout(500);
  const replie = await p.evaluate(() => {
    const z = document.getElementById('ctZone'), zr = z.getBoundingClientRect(), b = document.getElementById('ctFiltresTel'), br = b.getBoundingClientRect();
    const n = document.getElementById('ctZoneNom').getBoundingClientRect();
    const d = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
    return { tiroir:z.dataset.tiroir, bouton:{ h:Math.round(br.height), w:Math.round(br.width), droiteDansTiroir:br.right <= zr.right - 8, basDansTiroir:br.bottom <= zr.bottom, touchable:d === b || b.contains(d), dessus:d && (d.id || String(d.className)).slice(0, 40) },
      nom:{ chevauche:n.right > br.left, centreNom:Math.round(n.top + n.height / 2), centreBouton:Math.round(br.top + br.height / 2), lignes:Math.round(n.height / 22) }, pageDeborde:document.documentElement.scrollWidth > innerWidth };
  });
  await p.screenshot({ path:`${DOS}/replie-${k}-${L}.png` });
  const r = await centre('#ctFiltresTel'); await p.touchscreen.tap(r.x, r.y);
  await p.waitForTimeout(1500);
  const apres = await p.evaluate(() => ({ tiroir:document.getElementById('ctZone').dataset.tiroir,
    onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet,
    boutonCache:!document.getElementById('ctFiltresTel').offsetHeight,
    plis:[...document.querySelectorAll('.ct-pli')].filter(d => d.offsetHeight).map(d => d.id + (d.open ? ' ouvert' : ' fermé')),
    eteinte:[...document.querySelectorAll('.ct-eteinte')].filter(d => d.offsetHeight).map(d => d.textContent.trim().slice(0, 50)) }));
  await p.screenshot({ path:`${DOS}/ouvert-${k}-${L}.png` });
  console.log(k.toUpperCase(), 'replié', JSON.stringify(replie), '\n   après Filtres', JSON.stringify(apres), erreurs.length ? erreurs : '');
  await ctx.close();
}
await nav.close();
