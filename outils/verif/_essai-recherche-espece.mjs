// Essai ponctuel (2026-10-29), démo locale, eBird bouchonné (_bouchon-ebird.mjs) : la recherche d'une
// espèce doit se comporter comme la carte sans recherche. Zone par zone (pays, région, département,
// dessin) et onglet par onglet, on relève ce que montrent la carte et le panneau sans espèce, puis avec :
// le voile, la liste sous les filtres, les points, et ce qu'ouvre un clic sur une grappe.
// node outils/verif/_essai-recherche-espece.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const SORTIE = process.argv[3] || '.';
const TRIANGLE = [[47.45, -1.85], [47.45, -1.25], [47.05, -1.55]];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
await bouchonEbird(ctx);
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

const attendre = async () => {
  for(let i = 0; i < 30; i++){
    await p.waitForTimeout(500);
    const t = await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '') + (document.getElementById('ctRecEtat')?.textContent || ''));
    if(!t.includes('…') && i > 1) break;
  }
  await p.waitForTimeout(1200);
};
const onglet = async o => { await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), o); await attendre(); };
const clicForme = async (cle, val) => {
  const ok = await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  if(!ok) console.log(`   (forme ${val} introuvable)`);
  await attendre();
};
const dessine = async () => {
  await p.evaluate(() => document.querySelector('#mapDrawStart').click()); await p.waitForTimeout(300);
  for(const ll of TRIANGLE){ await p.evaluate(ll => { window.__carte.fire('click', { latlng:L.latLng(ll[0], ll[1]) }); }, ll); await p.waitForTimeout(150); }
  await p.keyboard.press('Enter'); await attendre();
};
// Ce que montrent la carte et le panneau.
const etat = () => p.evaluate(() => {
  let voile = 0; window.__carte.eachLayer(l => { if(l.options && l.options.pane === 'ctVoile' && l.getLatLngs) voile = l.getLatLngs().length - 1; });
  const ouvert = document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet || '?';
  const liste = document.querySelector({ recent:'#ctListeRecent', hot:'#ctListeHot', ligue:'#ctListeLigue' }[ouvert] || '#rien');
  const lignes = liste ? liste.querySelectorAll('.ct-rang').length : -1;
  const tete = liste ? (liste.querySelector('.ct-compte, .ct-vide, p')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  const zone = (document.getElementById('ctEbPaysBtn')?.textContent || '').trim();
  const pts = [...document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-pt-ico')].filter(e => e.style.display !== 'none').length;
  const grappes = document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-gr-ico').length;
  const hs = [...document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-hs-ico')].filter(e => e.style.display !== 'none').length;
  const champ = document.getElementById('mapSearch').value, etatRec = (document.getElementById('ctRecEtat')?.textContent || '').slice(0, 80);
  return { ouvert, zone, voile, lignes, tete, pts, grappes, hs, champ, etatRec };
});
// Un clic sur la plus grosse grappe : la liste de ses espèces (et le détail), ou la fiche ?
const clicGrappe = async () => {
  // Pas de grappe à ce zoom : on dézoome jusqu'à trois crans pour en former une.
  for(let i = 0; i < 3 && !(await p.evaluate(() => document.querySelectorAll('.leaflet-marker-pane .ct-gr-ico').length)); i++){ await p.evaluate(() => window.__carte.setZoom(window.__carte.getZoom() - 1, { animate:false })); await p.waitForTimeout(600); }
  const ok = await p.evaluate(() => {
    let c = null, n = 0;
    window.__carte.eachLayer(l => { if(l.getAllChildMarkers && l._icon && l.getChildCount() > n){ n = l.getChildCount(); c = l; } });
    if(!c) return false;
    document.querySelectorAll('.ct-gr-vise').forEach(e => e.classList.remove('ct-gr-vise')); c._icon.classList.add('ct-gr-vise'); return true;
  });
  if(!ok) return 'aucune grappe';
  // Un vrai clic sur l'icône, comme Mathis (au doigt : un toucher).
  // Au téléphone le tiroir peut couvrir l'icône : le clic part de l'icône elle-même.
  await p.evaluate(() => document.querySelector('.ct-gr-vise').dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true })));
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => {
    const pop = document.querySelector('.leaflet-popup.ct-gl');
    const fiche = !!document.getElementById('speciesModal') && !document.getElementById('speciesModal').hidden;
    if(pop){
      const fl = pop.querySelector('.ct-gl-n'); if(fl && fl.getAttribute('aria-expanded') !== 'true') fl.click();
      return `liste « ${pop.querySelector('.ct-gl-t')?.textContent || ''} », détail ${pop.querySelectorAll('.ct-gl-obs:not([hidden]) li').length} ligne(s)`;
    }
    return fiche ? 'FICHE de l\'espèce' : 'rien';
  });
  await p.evaluate(() => { window.__carte.closePopup(); });
  // Pas d'Échap : dans la barre de recherche, il l'efface (champ de type search).
  await p.evaluate(() => { const m = document.getElementById('speciesModal'); if(m && !m.hidden) closeSpeciesModal?.(); document.activeElement?.blur(); }).catch(() => {});
  await p.waitForTimeout(400);
  return r;
};
// Chercher une espèce. Récent : une espèce de sa liste (les suggestions proposent toutes celles qui
// manquent, la plupart sans observation). Ailleurs : la première suggestion de l'onglet.
const cherche = async () => {
  const ouvert = await p.evaluate(() => document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet);
  let noms = ouvert === 'recent' ? await p.evaluate(() => [...document.querySelectorAll('#ctListeRecent .ct-rang .nom')].map(x => x.textContent.trim())) : [];
  if(!noms.length){
    await p.fill('#mapSearch', ''); await p.click('#mapSearch'); await p.waitForTimeout(400);
    noms = await p.evaluate(() => [...document.querySelectorAll('.map-search-suggest-item')].map(x => x.querySelector('span:nth-child(2)')?.textContent.trim()).filter(t => t && !/reset/.test(t)));
  }
  for(const nm of noms.slice(0, 10)){
    await p.fill('#mapSearch', ''); await p.click('#mapSearch'); await p.keyboard.type(nm, { delay:5 }); await p.waitForTimeout(400);
    const pris = await p.evaluate(nm => { const it = [...document.querySelectorAll('.map-search-suggest-item')].find(x => x.textContent.includes(nm)); if(it){ it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); return true; } return false; }, nm);
    if(pris){ await attendre(); return nm; }
  }
  return '';
};
const efface = async () => { await p.fill('#mapSearch', ''); await p.evaluate(() => { document.getElementById('mapSearch').dispatchEvent(new Event('input', { bubbles:true })); document.activeElement?.blur(); document.getElementById('mapSearchSuggest')?.classList.remove('open'); }); await attendre(); };
const ligne = (quoi, e, g) => console.log(`   ${quoi.padEnd(30)} [${e.zone}] voile ${String(e.voile).padStart(2)} · liste ${String(e.lignes).padStart(3)} « ${e.tete} » · points ${e.pts} · grappes ${e.grappes} · hotspots ${e.hs} · champ « ${e.champ} » · état « ${e.etatRec} »${g ? '\n' + ' '.repeat(34) + 'clic grappe : ' + g : ''}`);
let defauts = 0;
const juge = (a, b) => {
  const ecarts = [];
  if(a.voile !== b.voile) ecarts.push(`voile ${a.voile} -> ${b.voile}`);
  if(a.lignes > 0 && b.lignes <= 0) ecarts.push('liste vide');
  if(a.ouvert === 'recent' && b.lignes !== 1) ecarts.push('la liste du Récent ne montre pas la seule espèce cherchée');
  if(a.ouvert === 'recent' && b.grappes && !/détail [1-9]/.test(b.clic || '')) ecarts.push('clic grappe sans détail');
  if(b.grappes === 0 && b.pts === 0 && b.hs === 0 && a.ouvert !== 'hot') ecarts.push('rien sur la carte');
  console.log('   ' + (ecarts.length ? 'ÉCART : ' + ecarts.join(', ') : 'pareil'));
  defauts += ecarts.length;
};
let espece = '';
const compare = async (titre, poser) => {
  console.log(`== ${titre}`);
  await efface(); await poser();
  const a = await etat(); ligne('sans recherche', a, await clicGrappe());
  espece = await cherche();
  if(!espece){ console.log('   (aucune espèce trouvée dans les suggestions)'); defauts++; return a; }
  const b = await etat(); b.clic = await clicGrappe(); ligne(`avec « ${espece} »`, b, b.clic);
  juge(a, b);
  return a;
};

await onglet('recent');
// La couche du Récent allumée, pour comparer des points à des points.
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
await compare('Récent · France entière', () => clicForme('cc', 'FR'));
await compare('Récent · région Pays de la Loire', () => clicForme('ebird', 'FR-PDL'));
const dep = await compare('Récent · département Loire-Atlantique', () => clicForme('ebird', 'FR-PDL-44'));
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/recherche-${largeur}.png` });
// La zone changée PENDANT la recherche : c'est là que Mathis a vu le voile manquer.
console.log('== Récent · recherche gardée, puis la Bretagne cliquée');
await clicForme('ebird', 'FR-BRE');
const bre = await etat(); ligne(`avec « ${espece} »`, bre, await clicGrappe());
console.log('   ' + (bre.voile !== dep.voile && bre.voile > 0 ? 'voile suivi' : 'ÉCART : voile resté sur l\'ancienne zone'));
if(!(bre.voile !== dep.voile && bre.voile > 0)) defauts++;
await compare('Récent · zone dessinée', () => dessine());
await p.evaluate(() => document.getElementById('mapDrawClear')?.click()); await attendre();
await onglet('hot');
await compare('Hotspots · région Pays de la Loire', () => clicForme('ebird', 'FR-PDL'));
console.log('== Hotspots · recherche gardée, puis la Bretagne cliquée');
await clicForme('ebird', 'FR-BRE'); ligne(`avec « ${espece} »`, await etat());
await onglet('ligue');
await compare('Ligue · région Pays de la Loire', () => clicForme('ebird', 'FR-PDL'));
console.log('== Ligue · recherche gardée, puis la Bretagne cliquée');
await clicForme('ebird', 'FR-BRE'); ligne(`avec « ${espece} »`, await etat());
// Changer d'onglet en gardant l'espèce écrite : le Récent doit la retrouver (liste d'une ligne, ses points).
console.log('== Ligue avec « ' + espece + ' », puis onglet Récent');
await clicForme('ebird', 'FR-PDL');
await onglet('recent'); await attendre();
const r1 = await etat(); ligne('Récent', r1);
if(r1.lignes !== 1 && !r1.etatRec.includes(espece)){ console.log('   ÉCART : le Récent ne montre pas l’espèce gardée'); defauts++; }
console.log('== puis Ligue, puis retour au Récent');
await onglet('ligue'); await onglet('recent'); await attendre();
const r2 = await etat(); ligne('Récent', r2);
if(r2.lignes !== 1 && !r2.etatRec.includes(espece)){ console.log('   ÉCART : le Récent ne montre pas l’espèce gardée'); defauts++; }
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
