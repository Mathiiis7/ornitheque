// Essai ponctuel (2026-10-29), démo locale : les demandes de Mathis du soir sur les réserves et les hotspots.
// 1. La bulle d'une réserve suit la couche allumée : La ligue -> les observations de la ligue dedans ;
//    aucune couche d'oiseaux -> la fiche seule ; Hotspots -> ses hotspots (vrai eBird, gardé 7 jours par le relais).
// 2. Le survol d'un carré de hotspot donne un aperçu (faux eBird pour les hotspots de Loire-Atlantique).
// node outils/verif/_essai-reserves-couches.mjs [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
let defauts = 0;
const ecart = m => { console.log('   ÉCART : ' + m); defauts++; };
async function page(fauxEbird){
  const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR' });
  if(fauxEbird) await bouchonEbird(ctx);
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  p.erreurs = []; p.on('pageerror', e => p.erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  return p;
}
const pastille = (p, k) => p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).click(), k);
const attendReserves = async p => { for(let i = 0; i < 20 && !(await p.evaluate(() => document.querySelectorAll('.leaflet-ctReserves-pane path').length)); i++) await p.waitForTimeout(500); };
// Clique la réserve au point donné (un vrai clic à l'écran) et rend le contenu de sa bulle.
const bulle = async (p, nomRes, attendre = 1000) => {
  await p.evaluate(() => window.__carte.closePopup());
  const sur = await p.evaluate(nomRes => {
    let cible = null; window.__carte.eachLayer(l => { const f = l.feature; if(f && f.properties && f.properties.n === nomRes && l.getBounds && !cible) cible = l; });
    if(!cible) return 'réserve introuvable';
    window.__carte.fitBounds(cible.getBounds(), { animate:false, maxZoom:12 });
    return 'ok';
  }, nomRes);
  if(sur !== 'ok') return { erreur:sur };
  await p.waitForTimeout(800);
  // Un point de la forme qui tombe bien sur elle à l'écran (pas sur un point d'oiseau posé dessus).
  const ok = await p.evaluate(nomRes => {
    let cible = null; window.__carte.eachLayer(l => { const f = l.feature; if(f && f.properties && f.properties.n === nomRes && l._path && !cible) cible = l; });
    const r = cible._path.getBoundingClientRect();
    for(let i = 0; i < 400; i++){
      const x = r.left + r.width * ((i * 37 % 100) / 100), y = r.top + r.height * ((i * 61 % 100) / 100);
      if(document.elementFromPoint(x, y) === cible._path){ cible._path.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, clientX:x, clientY:y })); return true; }
    }
    return false;
  }, nomRes);
  if(!ok) return { erreur:'aucun point cliquable' };
  await p.waitForTimeout(attendre);
  for(let i = 0; i < 40 && await p.evaluate(() => !!document.querySelector('.leaflet-popup.ct-rb .ct-rb-attente')); i++) await p.waitForTimeout(500);
  return p.evaluate(() => { const b = document.querySelector('.leaflet-popup.ct-rb'); if(!b) return null;
    return { titre:b.querySelector('.ct-hb-t')?.textContent, partie:b.querySelector('.ct-hb-it')?.textContent || '(rien)', compte:b.querySelector('.ct-rb-hs .ct-gl-t')?.textContent || '',
      lignes:[...b.querySelectorAll('.ct-rb-hs .ct-gl-l, .ct-rb-hs .ct-rb-h')].slice(0, 4).map(x => x.textContent.replace(/\s+/g, ' ').trim()) }; });
};

// 1. La ligue (faux eBird : la ligue de la démo vient de ses propres données).
let p = await page(true);
await pastille(p, 'ligue'); await p.waitForTimeout(1500);
await pastille(p, 'res'); await attendReserves(p);
// La réserve qui a le plus de points de la ligue dans sa boîte.
const meilleure = await p.evaluate(() => {
  const pts = []; window.__carte.eachLayer(l => { if(l.getAllChildMarkers) pts.push(...l.getAllChildMarkers()); else if(l._ligue) pts.push(l); });
  const lls = [...new Set(pts)].map(m => m.getLatLng());
  let best = null, n0 = 0;
  // Vraiment dedans (les points de la démo sont souvent au centre de leur département, hors des réserves).
  const dans = (f, lat, lng) => f.geometry.coordinates.some(p => { const r = p[0]; let c = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const [xa, ya] = r[i], [xb, yb] = r[j]; if((ya > lat) !== (yb > lat) && lng < (xb - xa) * (lat - ya) / (yb - ya) + xa) c = !c; } return c; });
  window.__carte.eachLayer(l => { const f = l.feature; if(!(f && f.properties && f.properties.t && l.getBounds)) return; const b = l.getBounds(); const n = lls.filter(ll => b.contains(ll) && dans(f, ll.lat, ll.lng)).length; if(n > n0){ n0 = n; best = f.properties.n; } });
  return [best, n0, lls.length];
});
console.log('réserve la plus visitée par la ligue :', JSON.stringify(meilleure));
let b = await bulle(p, meilleure[0]);
console.log('La ligue allumée :', JSON.stringify(b));
if(!b || !/La ligue dans la réserve/.test(b.partie) || !b.lignes.length) ecart('la bulle ne suit pas La ligue');
await p.screenshot({ path:`${SORTIE}/reserve-ligue.png` });
// Aucune couche d'oiseaux : la fiche seule.
await pastille(p, 'ligue'); await p.waitForTimeout(800);
b = await bulle(p, meilleure[0]);
console.log('sans couche d\'oiseaux :', JSON.stringify(b));
if(!b || b.partie !== '(rien)') ecart('la fiche seule attendue');
// 2. Survol d'un hotspot (faux eBird, Loire-Atlantique).
await p.evaluate(() => window.__carte.closePopup());
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL-44'); await p.waitForTimeout(2500);
await pastille(p, 'hot');
for(let i = 0; i < 30 && !(await p.evaluate(() => document.querySelectorAll('.ct-hs-ico').length)); i++) await p.waitForTimeout(500);
await p.waitForTimeout(800);
const carre = await p.evaluate(() => { const e = document.querySelector('.ct-hs-ico'); if(!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
if(!carre) ecart('aucun carré de hotspot');
else {
  await p.mouse.move(carre[0], carre[1]); await p.waitForTimeout(600);
  const sv = await p.evaluate(() => { const t = document.querySelector('.leaflet-tooltip.ct-sv'); return t ? [...t.children].map(c => c.textContent.trim()).slice(0, 6).join(' | ') : null; });
  console.log('survol d\'un hotspot :', sv);
  if(!sv) ecart('pas d\'aperçu au survol');
  await p.screenshot({ path:`${SORTIE}/hotspot-survol.png` });
  await p.mouse.move(5, 5); await p.waitForTimeout(400);
  if(await p.evaluate(() => !!document.querySelector('.leaflet-tooltip.ct-sv'))) ecart('l\'aperçu reste après la sortie de la souris');
}
console.log('erreurs :', p.erreurs.length ? p.erreurs : 'aucune'); if(p.erreurs.length) defauts++;
await p.context().close();

// 3. Hotspots allumés, vrai eBird : Grand-Lieu.
p = await page(false);
await pastille(p, 'hot'); await p.waitForTimeout(500);
await pastille(p, 'res'); await attendReserves(p);
b = await bulle(p, 'Lac de Grand-Lieu', 2000);
console.log('Hotspots allumés, Grand-Lieu :', JSON.stringify(b));
if(!b || !/Hotspots dans la réserve/.test(b.partie)) ecart('la bulle ne suit pas Hotspots');
console.log('erreurs :', p.erreurs.length ? p.erreurs : 'aucune'); if(p.erreurs.length) defauts++;
await nav.close();
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
