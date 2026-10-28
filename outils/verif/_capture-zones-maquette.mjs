// Capture ponctuelle (2026-10-28) : la Carte avec plusieurs réglages du fond et du dessin des zones,
// pour la maquette notes-privees/maquettes/zones-carte/ (Mathis voyait mal les pays et les zones).
// Rien n'est changé dans app.js : chaque variante est posée dans la page, photographiée, puis retirée.
// Le serveur local doit tourner (localhost:8765). node outils/verif/_capture-zones-maquette.mjs
import { chromium } from 'playwright';
import fs from 'fs';
const DOSSIER = 'notes-privees/maquettes/zones-carte';
fs.mkdirSync(DOSSIER + '/img', { recursive:true });

// fond : CSS posée sur les tuiles du plan. zones : réglage des traits, appliqué dans la page.
const VARIANTES = [
  { id:'actuel', fond:'', zones:null },
  { id:'f60', fond:'opacity:.6!important', zones:null },
  { id:'f40', fond:'opacity:.4!important', zones:null },
  { id:'fgris', fond:'filter:grayscale(1) contrast(.85) brightness(1.08); opacity:.8!important', zones:null },
  { id:'zfonce', fond:'', zones:'fonce' },
  { id:'zhalo', fond:'', zones:'halo' },
  { id:'zteinte', fond:'', zones:'teinte' },
  { id:'mix', fond:'filter:grayscale(1) contrast(.85) brightness(1.08); opacity:.8!important', zones:'halo' },
];

const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1440, height:900 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(3000); await p.keyboard.press('Escape');

const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);

async function poseVariante(v){
  await p.evaluate(v => {
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    let st = document.getElementById('__maquette');
    if(!st){ st = document.createElement('style'); st.id = '__maquette'; document.head.appendChild(st); }
    let regles = '';
    // Fond pâli : le blanc de la page doit passer à travers, pas le gris de Leaflet.
    if(v.fond) regles += '#mapEl.leaflet-container{background:' + css('--surface') + '} #mapEl .ct-fond-plan{' + v.fond + '}';
    // Liseré blanc : une ombre blanche serrée autour de chaque trait, sur les calques des pays et des zones.
    if(v.zones === 'halo') regles += '.leaflet-ctPays-pane svg,.leaflet-ctDeps-pane svg{filter:drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff) drop-shadow(0 0 .5px #fff)}';
    st.textContent = regles;
    const accent = css('--accent'), ink = css('--ink'), ink2 = css('--ink-2');
    window.__carte.eachLayer(l => {
      if(!l.feature || !l.setStyle || !l.options) return;
      const o = l.options;
      if(!l.__orig) l.__orig = { color:o.color, weight:o.weight, opacity:o.opacity, fillColor:o.fillColor, fillOpacity:o.fillOpacity, fill:o.fill };
      l.setStyle(l.__orig);
      if(!v.zones) return;
      const g = l.__orig;
      if(!g.opacity) return;                                       // forme cachée
      const choisie = g.weight >= 2 && g.opacity === 1;              // zone ou pays ouvert
      const pays = o.pane === 'ctPays', muet = g.fill === false;
      if(v.zones === 'fonce'){
        if(choisie) l.setStyle({ weight:g.weight + .5 });
        else if(pays) l.setStyle(muet ? { color:ink2, weight:1, opacity:.6 } : { color:accent, weight:2.2, opacity:.95 });
        else l.setStyle({ color:ink, weight:g.weight + .6, opacity:.85 });
      } else if(v.zones === 'halo'){
        if(choisie) l.setStyle({ weight:g.weight + .5 });
        else if(pays) l.setStyle(muet ? { color:ink2, weight:1, opacity:.55 } : { color:accent, weight:2, opacity:1 });
        else l.setStyle({ color:accent, weight:g.weight + .3, opacity:.9 });
      } else if(v.zones === 'teinte'){
        if(choisie) l.setStyle({ weight:g.weight + .5, fillOpacity:0 });
        else if(pays) l.setStyle(muet ? {} : { color:'#fff', weight:2, opacity:1, fillColor:accent, fillOpacity:.14 });
        else l.setStyle({ color:'#fff', weight:g.weight + .8, opacity:1, fillColor:accent, fillOpacity:.14 });
      }
    });
  }, v);
  await p.waitForTimeout(400);
}

const SCENES = [
  { id:'europe', titre:'Ouverture : les pays', prepare:async () => {} },
  { id:'france', titre:'France ouverte : les régions', prepare:async () => { await clicForme('cc', 'FR'); } },
  { id:'region', titre:'Région choisie : les départements', prepare:async () => { await clicForme('ebird', 'FR-PDL'); } },
];
for(const s of SCENES){
  await s.prepare();
  await p.waitForTimeout(3500);   // tuiles et contours
  for(const v of VARIANTES){
    await poseVariante(v);
    await p.locator('#mapEl').screenshot({ path:`${DOSSIER}/img/${s.id}-${v.id}.png` });
  }
  await poseVariante({ fond:'', zones:null });
  console.log(s.id, 'fait');
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
