// Essai ponctuel (2026-10-26) : les points du Récent d'un département (listes eBird de ce département, donc
// dedans pour de vrai) qui tombent HORS de son contour dessiné, pour comparer des contours plus ou moins fins.
// 1. node outils/verif/_essai-points-dehors.mjs releve FR-PDL-44 fichier.json  (démo locale, toutes espèces)
// 2. node outils/verif/_essai-points-dehors.mjs compte fichier.json 44 data/carte-departements.json
import { readFileSync, writeFileSync } from 'node:fs';
const [, , action, a, b, c] = process.argv;
const dansAnneau = ([x, y], r) => { let d = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const [xi, yi] = r[i], [xj, yj] = r[j]; if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d; } return d; };
const dansGeom = (p, g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some(poly => dansAnneau(p, poly[0]) && !poly.slice(1).some(t => dansAnneau(p, t)));
if(action === 'compte'){
  const pts = JSON.parse(readFileSync(a, 'utf8'));
  const f = JSON.parse(readFileSync(c, 'utf8')).features.find(x => x.properties.code === b);
  const dehors = pts.filter(p => !dansGeom([p.lng, p.lat], f.geometry));
  console.log(`${c} : ${dehors.length} points dehors sur ${pts.length}` + (dehors.length ? ' : ' + [...new Set(dehors.map(p => p.lieu))].slice(0, 6).join(' ; ') : ''));
} else {
  const { chromium } = await import('playwright');
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
  await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
  const regle = async (id, v) => { await p.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles:true })); }, [id, v]); await p.waitForTimeout(1500); };
  await regle('mapEbRegion', a.split('-').slice(0, 2).join('-')); await regle('mapEbDept', a);
  await p.evaluate(() => { const x = document.getElementById('ctRecManque'); if(x && x.checked) x.click(); });
  for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); if(await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length && !(document.getElementById('ctRecEtat')?.textContent || '').includes('…'))) break; }
  await p.waitForTimeout(2000);
  const pts = await p.evaluate(() => { const out = []; window.__carte.eachLayer(l => { if(l.getAllChildMarkers || !l.getLayers) return; l.getLayers().forEach(m => { if(m._rec && m._rec.lieu !== 'Lieu privé') out.push({ lat:m.getLatLng().lat, lng:m.getLatLng().lng, lieu:m._rec.lieu }); }); }); return out; });
  writeFileSync(b, JSON.stringify(pts));
  console.log(pts.length + ' points publics relevés dans ' + b);
  await nav.close();
}
