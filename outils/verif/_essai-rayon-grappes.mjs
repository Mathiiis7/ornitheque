// Essai ponctuel (2026-11-07), démo locale : la Ligue en grappes, à plusieurs zooms. Combien de grappes,
// et combien de points regroupés alors que leur pastille (22 px) ne touche aucune autre de la grappe ?
// node outils/verif/_essai-rayon-grappes.mjs          rayon actuel (_ctRayonGrappe)
// ANCIEN=45 node outils/verif/_essai-rayon-grappes.mjs   l'ancien rayon fixe, pour comparer
import { chromium } from 'playwright';
const ANCIEN = process.env.ANCIEN ? Number(process.env.ANCIEN) : 0;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(ancien => {
  const att = () => {
    if(window.L && L.Map && !L.Map.__pris){
      L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; });
    }
    if(window.L && L.MarkerClusterGroup && !L.MarkerClusterGroup.__pris){
      L.MarkerClusterGroup.__pris = true;
      if(ancien) L.MarkerClusterGroup.addInitHook(function(){ this.options.maxClusterRadius = ancien; });
    }
    if(!window.L || !L.MarkerClusterGroup) setTimeout(att, 5);
  };
  att();
  try{ localStorage.setItem('mb-ligue-grappes', '1'); localStorage.setItem('mb-last-tab', 'load'); }catch(_){}
}, ANCIEN);
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(1500);
await p.evaluate(() => document.getElementById('ctChoixDialog')?.close());
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="ligue"]').click());
await p.waitForTimeout(2500);
const PAST = 22;
for(const [z, c] of [[5, [46.6, 2.4]], [6, [46.6, 2.4]], [7, [47.2, -1.6]], [8, [47.2, -1.6]], [9, [47.2, -1.6]], [10, [47.2, -1.6]], [11, [47.2, -1.6]], [12, [47.22, -1.55]]]){
  const r = await p.evaluate(([z, c, PAST]) => new Promise(ok => {
    window.__carte.setView(c, z, { animate:false });
    setTimeout(() => {
      const m = window.__carte;
      let grappes = 0, regroupes = 0, isoles = 0, seuls = 0;
      m.eachLayer(l => {
        if(l.getAllChildMarkers && l._icon){
          grappes++;
          const pts = l.getAllChildMarkers().map(x => m.latLngToContainerPoint(x.getLatLng()));
          regroupes += pts.length;
          // Une grappe qui réunit des paquets de pastilles qui ne se touchent pas : plus d'un bloc
          // quand on relie les points dont les pastilles se chevauchent.
          const bloc = pts.map((_, i) => i);
          const tete = i => bloc[i] === i ? i : (bloc[i] = tete(bloc[i]));
          pts.forEach((a, i) => pts.forEach((b, j) => { if(j > i && a.distanceTo(b) < PAST) bloc[tete(i)] = tete(j); }));
          if(new Set(pts.map((_, i) => tete(i))).size > 1) isoles++;
        } else if(l._icon && l.options && l.options.w !== undefined && !l.getAllChildMarkers) seuls++;
      });
      ok({ z, grappes, regroupes, isoles, seuls });
    }, 900);
  }), [z, c, PAST]);
  console.log(`zoom ${r.z} : ${r.grappes} grappes (${r.regroupes} points dedans, ${r.isoles} grappes de points qui ne se touchent pas), ${r.seuls} points seuls`);
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
