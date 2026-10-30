// Essai ponctuel (2026-10-30), démo locale, FAUX eBird : une zone déjà lue, puis eBird qui refuse ses listes.
// Attendu : la dernière lecture, datée, sans la liste sortie de la période ; puis la vraie dès qu'eBird répond.
// Une zone jamais lue garde le secours « une observation par espèce ».
// node outils/verif/_essai-listes-copie.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
const jour = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10) + ' 08:30';
const liste = (s, n) => ({ s, d:jour(n), n:'Lieu ' + s, la:47.25, lo:-1.65, h:true, z:'FR-PDL-44', o:[['barwar1', 1], ['wallcr1', 2]] });
let mode = 'ok', appels = 0;
await ctx.route(/carte\/listes/, route => {
  appels++;
  const cors = { 'access-control-allow-origin':'*' };
  if(mode === 'refus') return route.fulfill({ status:429, headers:cors, body:'' });
  const listes = mode === 'ok' ? [liste('S1', 1), liste('S2', 2)] : [liste('S1', 1), liste('S2', 2), liste('S3', 1)];
  return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify({ listes, total:listes.length, reste:0 }) });
});
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const ouvre = async dep => {
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
  await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click()); await p.waitForTimeout(500);
  await clic('cc', 'FR'); await p.waitForTimeout(2500);
  await clic('ebird', dep); await p.waitForTimeout(3000);
};
const compte = () => p.evaluate(() => [...document.querySelectorAll('#ctContenu [data-volet="recent"] .ct-compte')].map(x => x.textContent.trim()).filter(Boolean).join(' | '));
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
await ouvre('FR-PDL-44');
let c = await compte(); console.log('1re lecture :', c);
if(!/2 listes/.test(c)) ecart('première lecture');
await p.waitForTimeout(500);   // l'écriture dans IndexedDB
mode = 'refus'; const attendRefus = () => p.waitForTimeout(7000);
await ouvre('FR-PDL-44');
await attendRefus();
c = await compte(); console.log('refus, zone déjà lue :', c);
if(!/2 listes lues il y a 1 min, nouvel essai en cours/.test(c)) ecart('la copie datée');
if(/une observation par espèce/.test(c)) ecart('le secours au lieu de la copie');
// Le nouvel essai à 20 s : la vraie lecture remplace la copie.
mode = 'apres';
await p.waitForTimeout(21000);
c = await compte(); console.log('eBird répond de nouveau :', c);
if(!/3 listes/.test(c) || /lues il y a/.test(c)) ecart('la vraie lecture ne remplace pas la copie');
mode = 'refus';
await ouvre('FR-BRE-29');
await attendRefus();
c = await compte(); console.log('refus, zone jamais lue :', c);
if(!/une observation par espèce, nouvel essai en cours/.test(c)) ecart('le secours d\'une zone jamais lue');
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
