// Essai ponctuel (2026-10-26), démo locale : dans la liste du Récent (Loire-Atlantique), cliquer une
// espèce notée sur plusieurs listes la déplie : autant d'observations que la ligne en annonce ?
// Puis un clic sur une observation : son point est-il à l'écran, sa bulle ouverte ? Un second clic replie.
// node outils/verif/_essai-espece-depliee.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto(process.env.BASE || 'http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.waitForTimeout(800);
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
await regle('mapEbRegion', 'FR-PDL');
await regle('mapEbDept', 'FR-PDL-44');
for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
await p.waitForTimeout(1500);
// L'espèce de la liste qui annonce le plus de listes.
const cible = await p.evaluate(() => {
  let best = null;
  for(const r of document.querySelectorAll('#ctListeRecent .ct-rang[data-sci]')){ const m = (r.querySelector('.sous')?.textContent || '').match(/(\d+) listes?/); const n = m ? +m[1] : 1; if(!best || n > best.n) best = { sci:r.dataset.sci, n, nom:r.querySelector('.nom').textContent }; }
  return best;
});
console.log('espèce :', JSON.stringify(cible));
await p.evaluate(sci => document.querySelector(`#ctListeRecent .ct-rang[data-sci="${sci}"]`).click(), cible.sci);
await p.waitForTimeout(2000);
const depli = await p.evaluate(sci => {
  const r = document.querySelector(`#ctListeRecent .ct-rang[data-sci="${sci}"]`);
  const ul = r.nextElementSibling && r.nextElementSibling.classList.contains('ct-rang-obs') ? r.nextElementSibling : null;
  return { ouverte:r.getAttribute('aria-expanded'), obs:ul ? ul.querySelectorAll('.ct-obs').length : 0, lignes:ul ? [...ul.querySelectorAll('.ct-obs')].slice(0, 4).map(b => b.innerText.replace(/\n/g, ' | ')) : [] };
}, cible.sci);
console.log('dépliée :', JSON.stringify(depli));
await p.evaluate(() => document.querySelector('#ctListeRecent .ct-rang-obs').scrollIntoView({ block:'center' }));
await p.screenshot({ path:`${DOS}/espece-depliee-${largeur}.png` });
// Une observation : la deuxième s'il y en a deux.
await p.evaluate(() => { const b = document.querySelectorAll('#ctListeRecent .ct-obs'); (b[1] || b[0]).click(); });
await p.waitForTimeout(2500);
console.log('après clic sur une observation :', JSON.stringify(await p.evaluate(() => {
  const tip = document.querySelector('.leaflet-tooltip');
  return { bulle:tip ? tip.innerText.replace(/\n/g, ' | ').slice(0, 120) : 'aucune' };
})));
await p.screenshot({ path:`${DOS}/espece-point-${largeur}.png` });
await p.evaluate(sci => document.querySelector(`#ctListeRecent .ct-rang[data-sci="${sci}"]`).click(), cible.sci);
await p.waitForTimeout(800);
console.log('second clic :', await p.evaluate(sci => document.querySelector(`#ctListeRecent .ct-rang[data-sci="${sci}"]`).getAttribute('aria-expanded') + ', listes visibles ' + document.querySelectorAll('#ctListeRecent .ct-rang-obs').length, cible.sci));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
