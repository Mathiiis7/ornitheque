// Essai ponctuel (2026-10-30), démo locale, eBird bouchonné : plus de tri dans les Hotspots, et la bulle montre
// toujours d'abord les espèces vues ces 30 jours, le reste replié. Mathis : « retirer ce filtre et toujours
// afficher les 30 jours en premier ». Aussi : une seule demande à eBird par bulle, et un refus d'eBird ne doit
// pas faire dire « pas vue ici ».
// node outils/verif/_essai-hotspots-bulle-30j.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 2 : 1, locale:'fr-FR', serviceWorkers:'block' });
const demandes = []; await bouchonEbird(ctx, demandes);
let refuse = false;
await ctx.route(/ornitheque-relais|api\.ebird\.org/, route => {
  if(refuse && /data\/obs\/L[^/]+\/recent/.test(route.request().url())) return route.fulfill({ status:503, headers:{ 'access-control-allow-origin':'*' }, body:'' });
  return route.fallback();
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
const clic = async (cle, val) => { await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]); await p.waitForTimeout(3000); };
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click()); await p.waitForTimeout(800);
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="hot"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
await clic('cc', 'FR');
for(let i = 0; i < 5 && !/Grand Est/.test(await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent || '')); i++) await clic('ebird', 'FR-GES');
await p.waitForTimeout(3000);
await p.evaluate(() => { const d = document.getElementById('ctPliHot'); if(d) d.open = true; });
let defauts = 0;
const ecart = t => { console.log('   ÉCART :', t); defauts++; };
const filtres = await p.evaluate(() => ({ tri:document.querySelectorAll('#mapEbSortLbl, [data-ct-tri]').length,
  lignes:[...document.querySelectorAll('#ctPliHot .ct-k')].filter(x => x.offsetWidth).map(x => x.textContent) }));
console.log('filtres :', JSON.stringify(filtres));
if(filtres.tri) ecart('le tri est encore là');
if(filtres.lignes.includes('Trier par')) ecart('« Trier par » affiché');
if(!filtres.lignes.includes('Quand')) ecart('« Quand » a disparu');
const hotspots = await p.evaluate(() => { const ids = []; window.__carte.eachLayer(l => { if(l._hs) ids.push(l._hotspotId); }); return ids; });
console.log('hotspots :', hotspots.length);
if(!hotspots.length) ecart('aucun hotspot');
const bulle = async id => {
  await p.evaluate(id => { window.__carte.closePopup(); window.__carte.eachLayer(l => { if(l._hotspotId === id) l.openPopup(); }); }, id);
  await p.waitForTimeout(800);
  return p.evaluate(() => { const pop = document.querySelector('.leaflet-popup.ct-hb'); if(!pop) return null;
    const visibles = sel => [...pop.querySelectorAll(sel)].filter(x => x.offsetWidth);
    return { titre:pop.querySelector('.ct-hb-it')?.textContent || null, pli:pop.querySelector('.ct-hb-pli')?.textContent.trim() || null,
      lignes:visibles('.ct-hb-e').map(r => ({ nom:r.querySelector('.ct-gl-nom').textContent, date:r.querySelector('.ct-hb-vu')?.textContent || '' })) }; });
};
const id = hotspots[0];
// Le premier hotspot qui a à la fois des espèces récentes et des plus vieilles.
let choisi = null, b = null;
for(const h of hotspots){ const x = await bulle(h); if(x && x.pli){ choisi = h; b = x; break; } }
console.log('bulle :', JSON.stringify(b));
if(!b) ecart('aucune bulle avec un repli');
else {
  if(!/^Vues ici ces 30 jours/.test(b.titre || '')) ecart('titre');
  if(!b.lignes.length || b.lignes.some(l => !l.date)) ecart('une ligne visible sans date');
  if(!/pas vues? ici ces 30 jours/.test(b.pli)) ecart('ligne de repli');
  if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/hs-bulle-replie-${largeur}.png` });
  await p.evaluate(() => document.querySelector('.ct-hb-pli').click()); await p.waitForTimeout(300);
  const d = await p.evaluate(() => { const r = document.querySelector('.ct-hb-autres'); return { ouvert:!r.hidden, lignes:[...r.querySelectorAll('.ct-hb-e')].filter(x => x.offsetWidth).map(x => ({ nom:x.querySelector('.ct-gl-nom').textContent, date:x.querySelector('.ct-hb-vu')?.textContent || '' })) }; });
  console.log('déplié :', JSON.stringify(d));
  if(!d.ouvert || !d.lignes.length || d.lignes.some(l => l.date)) ecart('le déplié');
  await p.screenshot({ path:`${SORTIE}/hs-bulle-deplie-${largeur}.png` });
  // Une nouvelle ouverture repart rangée, et sans redemander par espèce.
  const avant = demandes.length;
  const r = await bulle(choisi);
  const parEspece = demandes.slice(avant).filter(c => /data\/obs\/[^/]+\/recent\/[^/]+$/.test(c)).length;
  console.log('rouverte :', r?.titre, '· demandes par espèce :', parEspece);
  if(!/^Vues ici/.test(r?.titre || '') || !r.pli) ecart('rouverte, plus rangée');
  if(parEspece) ecart('encore une demande par espèce');
}
// Un refus d'eBird sur une bulle jamais ouverte : toute la liste, sans rien dire des 30 jours.
refuse = true;
const autre = hotspots.find(h => h !== choisi);
const f = autre ? await bulle(autre) : null;
console.log('refus :', JSON.stringify(f));
refuse = false;
if(!f || f.titre || f.pli || !f.lignes.length) ecart('refus : la liste entière, sans titre ni repli');
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
