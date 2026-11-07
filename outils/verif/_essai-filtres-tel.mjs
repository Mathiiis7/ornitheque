// Essai ponctuel (2026-11-07) : au téléphone, sur la Carte, les filtres s'ouvrent-ils au doigt ?
// Vrais touchers (touchscreen.tap aux coordonnées), pas de clic par script.
// node outils/verif/_essai-filtres-tel.mjs
import { chromium, webkit } from 'playwright';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const nav = await (process.env.WEBKIT ? webkit : chromium).launch();
const ctx = await nav.newContext({ viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
p.on('console', m => { if(m.type() === 'error') erreurs.push('console: ' + m.text()); });
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
// Fait défiler jusqu'au bas de la carte, comme un doigt.
await p.evaluate(() => document.getElementById('ctZone').scrollIntoView({ block:'end' }));
await p.waitForTimeout(600);
await p.screenshot({ path:`${DOS}/tel-1-bas.png` });
// Ce qui est sous le doigt au centre d'un élément (repère écran, zoom compris).
const sous = sel => p.evaluate(sel => {
  const e = document.querySelector(sel); if(!e) return { absent:true };
  const r = e.getBoundingClientRect(); if(!r.height) return { invisible:true };
  const x = r.left + r.width / 2, y = r.top + r.height / 2, d = document.elementFromPoint(x, y);
  return { x, y, h:Math.round(r.height), dansViewport:y > 0 && y < innerHeight, dessus:d ? (d.id || String(d.className) || d.tagName).slice(0, 60) : null, atteint:!!d && (d === e || e.contains(d)) };
}, sel);
const touche = async sel => { const s = await sous(sel); if(s.x != null && s.dansViewport) await p.touchscreen.tap(s.x, s.y); await p.waitForTimeout(900); return s; };
const etat = () => p.evaluate(() => ({ tiroir:document.getElementById('ctZone').dataset.tiroir,
  onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet,
  plis:[...document.querySelectorAll('.ct-pli')].map(d => d.id + (d.open ? ' ouvert' : ' fermé') + (d.offsetHeight ? '' : ' (invisible)')).join(', ') }));
console.log('poignée', JSON.stringify(await touche('#ctPoignee')), JSON.stringify(await etat()));
await p.screenshot({ path:`${DOS}/tel-1b-poignee.png` });
for(const k of ['recent', 'hot', 'ligue']){
  const pli = { recent:'#ctPliRecent', hot:'#ctPliHot', ligue:'#ctPliLigue' }[k];
  console.log('ONGLET', k, JSON.stringify(await touche(`#ctOnglets [data-onglet="${k}"]`)), JSON.stringify(await etat()));
  await p.screenshot({ path:`${DOS}/tel-2-${k}.png` });
  console.log('  Afficher la couche', JSON.stringify(await touche(`[data-volet="${k}"] [data-ct-allume]`)));
  await p.waitForTimeout(2500);
  console.log('  ', JSON.stringify(await etat()));
  await p.screenshot({ path:`${DOS}/tel-2b-${k}-allumee.png` });
  await p.evaluate(pli => document.querySelector(pli + ' > summary')?.scrollIntoView({ block:'center' }), pli);
  await p.waitForTimeout(400);
  console.log('  Filtres', JSON.stringify(await touche(`${pli} > summary`)), JSON.stringify(await etat()));
  await p.screenshot({ path:`${DOS}/tel-3-${k}-filtres.png` });
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
