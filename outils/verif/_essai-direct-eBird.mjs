// Essai ponctuel (2026-10-29), démo locale, VRAI eBird (pas de bouchon) : ce que les essais sur le faux
// eBird n'ont pas pu voir. 1) Jersey, Guernesey, l'île de Man : le Récent, les Hotspots, et la rareté
// mesurée sur « Zone ». 2) La recherche d'une espèce quand le relais rend les listes en entier.
// Ordinateur seulement, une passe : le quota de la clé est commun à toute la ligue.
// node outils/verif/_essai-direct-eBird.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1300, height:900 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
// Chaque réponse du relais et d'eBird, avec son statut.
const reponses = [];
p.on('response', r => { const u = r.url(); if(/ornitheque-relais|api\.ebird\.org/.test(u)) reponses.push(`${r.status()} ${new URL(u).pathname.replace(/^\/(v2|api)\//, '')}`); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
let defauts = 0;
const attendre = async (max = 60) => {
  for(let i = 0; i < max; i++){
    await p.waitForTimeout(1000);
    const t = await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '') + (document.getElementById('ctRecEtat')?.textContent || '') + (document.getElementById('ctListeHot')?.textContent || '').slice(0, 200));
    if(!t.includes('…') && i > 2) break;
  }
  await p.waitForTimeout(1000);
};
const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && !pr.ebird === (cle === 'cc') && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
const onglet = o => p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), o);
const portee = (sel, v) => p.evaluate(([sel, v]) => document.querySelector(`${sel} [data-ct-portee="${v}"]`)?.click(), [sel, v]);
// Les paliers de la liste du Récent, dans l'ordre : ils doivent changer (ou non) avec la mesure.
const recent = () => p.evaluate(() => {
  const l = document.getElementById('ctListeRecent');
  const rangs = [...l.querySelectorAll('.ct-rang')];
  return { tete:(l.querySelector('.ct-compte, .ct-vide, p')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), n:rangs.length,
    paliers:rangs.slice(0, 12).map(r => (r.querySelector('.tier-rond, .ct-rang-n')?.textContent || '?').trim() + ' ' + (r.querySelector('.nom')?.textContent || '').trim()).join(' ; '),
    pts:document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-pt-ico, .ct-carte .leaflet-marker-pane .ct-gr-ico').length,
    portee:[...document.querySelectorAll('#ctPortee [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' | ') };
});
const hot = () => p.evaluate(() => {
  const l = document.getElementById('ctListeHot');
  return { tete:(l?.querySelector('.ct-compte, .ct-vide, p')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), lignes:l ? l.querySelectorAll('.ct-rang, li').length : -1,
    carres:[...document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-hs-ico')].filter(e => e.style.display !== 'none').length };
});
const bulle = async () => {
  await p.evaluate(() => { window.__carte.closePopup(); let m = null; window.__carte.eachLayer(l => { if(l._hs && !m) m = l; }); if(m) m.openPopup(); });
  for(let i = 0; i < 20 && !(await p.evaluate(() => !!document.querySelector('.leaflet-popup.ct-hb .ct-hb-it'))); i++) await p.waitForTimeout(500);
  return p.evaluate(() => { const pop = document.querySelector('.leaflet-popup.ct-hb'); if(!pop) return null;
    return { nom:pop.querySelector('.ct-hb-t, b, strong')?.textContent.trim(), titre:pop.querySelector('.ct-hb-it')?.textContent.trim(), pli:pop.querySelector('.ct-hb-pli')?.textContent.trim(),
      especes:[...pop.querySelectorAll('.ct-gl-l')].slice(0, 6).map(li => (li.querySelector('.tier-rond')?.textContent || '?') + ' ' + li.querySelector('.ct-gl-nom')?.textContent + (li.querySelector('.ct-hb-vu')?.textContent ? ' (' + li.querySelector('.ct-hb-vu').textContent + ')' : '')).join(' ; ') }; });
};

// 1) Les trois îles.
for(const [cc, nom] of (process.env.SAUTE_ILES ? [] : [['JE', 'Jersey'], ['GG', 'Guernesey'], ['IM', 'île de Man']]).filter(([cc]) => !process.env.ILES || process.env.ILES.includes(cc))){
  await onglet('recent'); await p.waitForTimeout(500);
  const avant = reponses.length;
  if(!(await clicForme('cc', cc))){ console.log(`${nom} : forme introuvable DÉFAUT`); defauts++; continue; }
  await attendre();
  const bouton = await p.evaluate(() => (document.getElementById('ctEbPaysBtn')?.textContent || '').trim());
  await portee('#ctPortee', 'pays'); await p.waitForTimeout(800);
  const rp = await recent();
  await portee('#ctPortee', 'zone'); await p.waitForTimeout(800);
  const rz = await recent();
  console.log(`${nom} · bouton « ${bouton} »`);
  console.log(`   Récent, mesure Pays : « ${rp.tete} », ${rp.n} lignes, ${rp.pts} points/grappes · [${rp.portee}]`);
  console.log(`      ${rp.paliers}`);
  console.log(`   Récent, mesure Zone : « ${rz.tete} », ${rz.n} lignes · [${rz.portee}]`);
  console.log(`      ${rz.paliers}`);
  await portee('#ctPortee', 'pays'); await p.waitForTimeout(300);
  if(!rp.n || !/Royaume-Uni|Jersey|Guernesey|Man/.test(bouton)) { console.log('   ÉCART : Récent vide ou mauvaise zone'); defauts++; }
  await onglet('hot'); await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="hot"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await attendre();
  const h = await hot();
  console.log(`   Hotspots : « ${h.tete} », ${h.lignes} lignes, ${h.carres} carrés`);
  if(!h.carres) { console.log('   ÉCART : aucun hotspot'); defauts++; }
  else {
    const b = await bulle();
    console.log(`   bulle : ${JSON.stringify(b)}`);
    if(cc === 'JE') await p.screenshot({ path:`${SORTIE}/direct-jersey-hot.png` });
    if(!b || !b.especes) { console.log('   ÉCART : bulle vide'); defauts++; }
  }
  const mes = reponses.slice(avant);
  const ko = mes.filter(r => !/^200 /.test(r));
  console.log(`   ${mes.length} réponses, dont ${ko.length} pas 200${ko.length ? ' : ' + [...new Set(ko)].slice(0, 8).join(' · ') : ''}`);
  await p.evaluate(() => window.__carte.closePopup());
}

// 2) Recherche d'une espèce, Loire-Atlantique, eBird en direct : les listes lues en entier.
await onglet('recent'); await p.waitForTimeout(500);
await clicForme('cc', 'FR'); await attendre(10);
for(let i = 0; i < 5 && !/Pays de la Loire|Loire-Atlantique/.test(await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent || '')); i++){ await clicForme('ebird', 'FR-PDL'); await p.waitForTimeout(2500); }
for(let i = 0; i < 5 && !/Loire-Atlantique/.test(await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent || '')); i++){ await clicForme('ebird', 'FR-PDL-44'); await p.waitForTimeout(2500); }
await attendre();
const avant = reponses.length;
const sans = await recent();
console.log(`Loire-Atlantique, sans recherche : « ${sans.tete} », ${sans.n} lignes, ${sans.pts} points/grappes`);
// Une espèce de la liste (une qui manque : la recherche du Récent ne propose qu'elles).
const ESP = await p.evaluate(() => document.querySelector('#ctListeRecent .ct-rang .nom')?.textContent.trim() || 'Aigrette garzette');
await p.click('#mapSearch'); await p.keyboard.type(ESP, { delay:5 }); await p.waitForTimeout(600);
const pris = await p.evaluate(nm => { const it = [...document.querySelectorAll('.map-search-suggest-item')].find(x => x.textContent.includes(nm)); if(it) it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); return it ? 'pris' : 'suggestions : ' + [...document.querySelectorAll('.map-search-suggest-item')].map(x => x.textContent.trim()).slice(0, 6).join(' | '); }, ESP);
console.log(`recherche « ${ESP} » : ${pris}`);
await attendre();
const avec = await recent();
const etat = await p.evaluate(() => (document.getElementById('ctRecEtat')?.textContent || '').trim());
console.log(`avec « ${ESP} » : « ${avec.tete} », ${avec.n} ligne(s), ${avec.pts} points/grappes · état « ${etat} »`);
const g = await p.evaluate(() => { let c = null, n = 0; window.__carte.eachLayer(l => { if(l.getAllChildMarkers && l._icon && l.getChildCount() > n){ n = l.getChildCount(); c = l; } }); if(!c) return 'aucune grappe'; c._icon.dispatchEvent(new MouseEvent('click', { bubbles:true })); return `grappe de ${n}`; });
await p.waitForTimeout(800);
const pop = await p.evaluate(() => { const pp = document.querySelector('.leaflet-popup.ct-gl'); return pp ? `${pp.querySelector('.ct-gl-t')?.textContent}, détail ${pp.querySelectorAll('.ct-gl-obs:not([hidden]) li').length} lignes` : 'pas de liste'; });
console.log(`   clic : ${g} → ${pop}`);
await p.screenshot({ path:`${SORTIE}/direct-recherche-44.png` });
const listes = reponses.slice(avant).concat(reponses.slice(0, avant)).filter(r => /listes/.test(r));
console.log(`   demandes de listes au relais : ${listes.length}, statuts ${[...new Set(listes.map(r => r.split(' ')[0]))].join(', ') || '-'}`);
if(avec.n !== 1 || !(avec.tete + avec.paliers).includes(ESP)) { console.log('   ÉCART : recherche'); defauts++; }
if(!listes.some(r => /^200 /.test(r))) { console.log('   ÉCART : aucune liste lue en entier'); defauts++; }
console.log(`total : ${reponses.length} réponses relais / eBird`);
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
