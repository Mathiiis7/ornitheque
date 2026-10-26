// Essai ponctuel (2026-10-26), démo locale : les lignes d'espèce des listes de la Carte (Récent et Ligue),
// en Loire-Atlantique. La flèche déplie toutes les observations (autant que la ligne en annonce ?), un
// clic sur une observation ouvre sa bulle, un second clic sur la flèche replie, le nom ouvre la fiche.
// Ligue : résumé des filtres, chiffres entre parenthèses, plus de boîte grise.
// node outils/verif/_essai-espece-depliee.mjs [largeur] [recent|ligue]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700, liste = process.argv[3] || 'recent';
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const BOITE = liste === 'ligue' ? '#ctListeLigue' : '#ctListeRecent';
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
await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), liste === 'ligue' ? 'ligue' : 'recent');
await p.waitForTimeout(800);
const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
await regle('mapEbRegion', 'FR-PDL');
await regle('mapEbDept', 'FR-PDL-44');
for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(b => document.querySelectorAll(b + ' .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'), BOITE)) break; }
await p.waitForTimeout(1500);
console.log('== ' + liste + ' ' + largeur);
console.log('en tête :', JSON.stringify(await p.evaluate(b => ({ phrase:document.querySelector(b + ' .ct-compte')?.innerText, resume:document.getElementById(b === '#ctListeLigue' ? 'ctPliResumeLigue' : 'ctPliResume')?.textContent,
  boiteGrise:getComputedStyle(document.getElementById('mapStats')).display, pastilles:document.querySelectorAll(b + ' .ct-rang .tier-rond').length, lignes:document.querySelectorAll(b + ' .ct-rang').length }), BOITE)));
// L'espèce qui a le plus d'observations : celle dont la flèche en annonce le plus.
const cible = await p.evaluate(b => {
  let best = null;
  for(const f of document.querySelectorAll(b + ' .ct-rang-n')){ const m = (f.dataset.tip || '').match(/(\d+) observations/); const n = m ? +m[1] : 1; if(!best || n > best.n) best = { sci:f.dataset.sci, n, nom:f.getAttribute('aria-label') }; }
  return best;
}, BOITE);
console.log('espèce :', JSON.stringify(cible));
await p.evaluate(([b, sci]) => document.querySelector(`${b} .ct-rang-n[data-sci="${sci}"]`).click(), [BOITE, cible.sci]);
await p.waitForTimeout(2000);
const depli = await p.evaluate(([b, sci]) => {
  const f = document.querySelector(`${b} .ct-rang-n[data-sci="${sci}"]`), ul = f.closest('.ct-rang-e').nextElementSibling;
  const ok = ul && ul.classList.contains('ct-rang-obs');
  return { fleche:f.getAttribute('aria-expanded'), obs:ok ? ul.querySelectorAll('.ct-obs').length : 0, sansPoint:ok ? ul.querySelectorAll('.ct-obs[data-pt=""]').length : 0,
    lignes:ok ? [...ul.querySelectorAll('.ct-obs')].slice(0, 3).map(x => x.innerText.replace(/\n/g, ' | ')) : [], fiche:!document.getElementById('speciesModal').hidden };
}, [BOITE, cible.sci]);
console.log('dépliée :', JSON.stringify(depli));
await p.evaluate(b => document.querySelector(b + ' .ct-rang-obs').scrollIntoView({ block:'center' }), BOITE);
await p.screenshot({ path:`${DOS}/espece-depliee-${liste}-${largeur}.png` });
await p.evaluate(b => { const x = document.querySelectorAll(b + ' .ct-obs'); (x[1] || x[0]).click(); }, BOITE);
await p.waitForTimeout(2500);
console.log('clic sur une observation :', JSON.stringify(await p.evaluate(() => { const t = document.querySelector('.leaflet-tooltip'); return t ? t.innerText.replace(/\n/g, ' | ').slice(0, 120) : 'aucune bulle'; })));
await p.screenshot({ path:`${DOS}/espece-point-${liste}-${largeur}.png` });
await p.evaluate(([b, sci]) => document.querySelector(`${b} .ct-rang-n[data-sci="${sci}"]`).click(), [BOITE, cible.sci]);
await p.waitForTimeout(800);
console.log('second clic sur la flèche :', await p.evaluate(b => document.querySelectorAll(b + ' .ct-rang-obs').length + ' liste(s) dépliée(s)', BOITE));
await p.evaluate(([b, sci]) => document.querySelector(`${b} .ct-rang[data-sci="${sci}"]`).click(), [BOITE, cible.sci]);
await p.waitForTimeout(1500);
console.log('clic sur le nom :', await p.evaluate(() => { const m = document.getElementById('speciesModal'); return m.hidden ? 'pas de fiche' : 'fiche ouverte : ' + (m.querySelector('h2, .sm-name, [id^="sm"]')?.textContent || '').trim().slice(0, 40); }));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
