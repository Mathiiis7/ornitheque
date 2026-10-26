// Capture ponctuelle (2026-10-27) : les hotspots des Pays de la Loire tels que la Carte les affiche,
// pour la maquette notes-privees/maquettes/hotspots-taille/ (hors dépôt : les conditions d'eBird
// interdisent d'en publier une copie).
// node outils/verif/_capture-hotspots-maquette.mjs
import { chromium } from 'playwright';
import fs from 'fs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1440, height:900 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
await clicForme('cc', 'FR'); await p.waitForTimeout(2000);
await clicForme('ebird', 'FR-PDL'); await p.waitForTimeout(2000);
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
for(let i = 0; i < 150; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('mapEbCount')?.textContent || ''); if(!t.includes('…') && i > 2) break; }
const hs = await p.evaluate(() => { const r = []; window.__carte.eachLayer(l => { if(l._hs){ const ll = l.getLatLng(); r.push([l._hs.nom, +ll.lat.toFixed(4), +ll.lng.toFixed(4), l._hs.nb, l._hs.allSp, l._hs.dept]); } }); return r; });
const dossier = 'notes-privees/maquettes/hotspots-taille';
fs.mkdirSync(dossier, { recursive:true });
fs.writeFileSync(dossier + '/donnees.js', '// [nom, lat, lon, à cocher, espèces depuis toujours, département] : Pays de la Loire, démo, ' + new Date().toISOString().slice(0, 10) + '\nconst HOTSPOTS = ' + JSON.stringify(hs) + ';\n');
console.log(hs.length, 'hotspots écrits');
await nav.close();
