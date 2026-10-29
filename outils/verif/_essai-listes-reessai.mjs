// Essai ponctuel (2026-10-29), démo locale, faux eBird : un refus d'eBird sur les listes (429) ne laisse plus
// le Récent sur « une observation par espèce » : le secours s'affiche, puis les listes redemandées 20 s plus
// tard le remplacent. Les listes répondent 429 pendant 8 s, puis trois listes.
// node outils/verif/_essai-listes-reessai.mjs
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR' });
await bouchonEbird(ctx);
let appels = 0, premier = 0;
// Posée après le faux eBird : c'est elle qui répond aux listes.
await ctx.route(/carte\/listes\//, route => {
  // Les autres zones (la région, cliquée avant) : refusées sans compter, le faux eBird n'en a pas.
  if(!/FR-PDL-44/.test(route.request().url())) return route.fulfill({ status:503, headers:{ 'access-control-allow-origin':'*' }, body:'' });
  appels++;
  const cors = { 'access-control-allow-origin':'*' };
  // Refus pendant 8 s : l'appel réessaie déjà une fois aussitôt, il faut que ce second essai échoue aussi.
  if(!premier) premier = Date.now();
  if(Date.now() - premier < 8000) return route.fulfill({ status:429, headers:cors, body:'listes indisponibles' });
  const d = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10) + ' 09:00';
  const listes = [0, 1, 2].map(i => ({ s:`S9${i}`, d, n:`Lieu ${i + 1} (FR-PDL-44)`, la:47.25 + i * 0.03, lo:-1.65 + i * 0.04, h:true, z:'FR-PDL-44', o:[['lapbun', 2], ['barwar1', 1]] }));
  return route.fulfill({ status:200, contentType:'application/json', headers:cors, body:JSON.stringify({ zone:'FR-PDL-44', jours:14, total:3, reste:0, listes }) });
});
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2500);
// Tous les en-têtes du Récent, dans l'ordre, depuis le clic sur la Loire-Atlantique.
await p.evaluate(() => { window.__tetes = []; setInterval(() => { const t = (document.querySelector('#ctListeRecent .ct-compte')?.textContent || '').replace(/\s+/g, ' ').trim(); if(t && window.__tetes[window.__tetes.length - 1] !== t) window.__tetes.push(t); }, 100); });
await clic('ebird', 'FR-PDL-44');
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]')?.getAttribute('aria-pressed') === 'true' || document.querySelector('#ctCouches [data-couche="recent"]').click());
for(let i = 0; i < 60 && !(await p.evaluate(() => (window.__tetes || []).some(t => /\(\d+ listes\)/.test(t)))); i++) await p.waitForTimeout(1000);
const tetes = await p.evaluate(() => window.__tetes);
console.log('en-têtes successifs :\n   ' + tetes.join('\n   '));
console.log('appels aux listes :', appels);
let defauts = 0;
const iSecours = tetes.findIndex(t => /nouvel essai en cours/.test(t)), iListes = tetes.findIndex(t => /\(\d+ listes\)/.test(t));
if(iSecours < 0) { console.log('   ÉCART : le secours n\'a pas annoncé le nouvel essai'); defauts++; }
if(iListes < 0 || iListes < iSecours) { console.log('   ÉCART : les listes n\'ont pas remplacé le secours'); defauts++; }
console.log('erreurs :', erreurs.length ? erreurs : 'aucune'); if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
