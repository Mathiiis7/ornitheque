// Essai ponctuel (2026-10-30), démo locale, faux eBird : Jersey, Guernesey, Man montrent les points du Récent.
// Mathis : la liste s'affiche à droite, mais aucun point sur la carte.
// node outils/verif/_essai-iles-points.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
const CENTRES = { JE:[49.21, -2.13], GG:[49.45, -2.58], IM:[54.23, -4.55] };
const jour = n => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10) + ' 08:30';
await ctx.route(/ornitheque-relais|api\.ebird\.org/, route => {
  const ch = new URL(route.request().url()).pathname.replace(/^\/v2\//, '');
  const m = ch.match(/^data\/obs\/(JE|GG|IM)\/recent(\/[^/]+)?$/);
  if(!m) return route.fallback();
  const [la, lo] = CENTRES[m[1]];
  const obs = [['barwar1', 'Curruca nisoria'], ['wallcr1', 'Tichodroma muraria'], ['snobun', 'Plectrophenax nivalis']].map(([speciesCode, sciName], i) => ({ speciesCode, sciName, comName:sciName, locId:'L' + m[1] + i, locName:'Lieu ' + i, obsDt:jour(i + 1), howMany:1, lat:la + i * 0.01, lng:lo, obsValid:true, obsReviewed:false, locationPrivate:false, subId:'S' + i }));
  return route.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(m[2] ? obs.filter(o => o.speciesCode === m[2].slice(1)) : obs) });
});
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click()); await p.waitForTimeout(1000);
let defauts = 0;
for(const cc of ['JE', 'GG', 'IM']){
  await p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === cc && !pr.ebird && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, cc);
  await p.waitForTimeout(3500);
  const e = await p.evaluate(() => {
    let points = 0; window.__carte.eachLayer(l => { if(l._rec) points++; else if(l.getAllChildMarkers && l._icon) points += l.getAllChildMarkers().filter(m => m._rec).length; });
    return { lieu:document.getElementById('ctEbPaysBtn')?.textContent.trim(), points, lignes:document.querySelectorAll('#ctContenu [data-volet="recent"] .ct-rang').length, deplie:/déplie une espèce/.test(document.getElementById('ctContenu').innerText) };
  });
  console.log(cc, JSON.stringify(e));
  if(!e.points || !e.lignes || e.deplie) { console.log('   ÉCART : points absents'); defauts++; }
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
