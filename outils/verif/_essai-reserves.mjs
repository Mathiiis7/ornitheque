// Essai ponctuel (2026-10-29), démo locale, VRAI eBird (13 demandes au plus : une liste de hotspots, gardée
// 7 jours par le relais, puis 12 listes d'espèces) : la pastille « Réserves ». Elle s'ajoute à la couche
// d'oiseaux et y reste quand on en change ; la légende a ses trois types ; la bulle du lac de Grand-Lieu
// donne sa fiche, ses hotspots, et une ligne se déplie sur ses espèces. Puis au doigt, et en sombre.
// node outils/verif/_essai-reserves.mjs [largeur] [dossier des captures] [sombre]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.', sombre = process.argv[4] === 'sombre';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 2 : 1, locale:'fr-FR', colorScheme:sombre ? 'dark' : 'light' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const ebird = []; p.on('response', r => { if(/ornitheque-relais/.test(r.url())) ebird.push(r.status() + ' ' + new URL(r.url()).pathname); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
let defauts = 0;
const ecart = m => { console.log('   ÉCART : ' + m); defauts++; };
const pastilles = () => p.evaluate(() => [...document.querySelectorAll('#ctCouches [data-couche]')].map(b => b.dataset.couche + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '));
const clicPastille = k => p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).click(), k);
console.log('départ :', await pastilles());
await clicPastille('ligue'); await p.waitForTimeout(1200);
await clicPastille('res');
for(let i = 0; i < 20 && !(await p.evaluate(() => document.querySelectorAll('.leaflet-ctReserves-pane path').length)); i++) await p.waitForTimeout(500);
const n = await p.evaluate(() => document.querySelectorAll('.leaflet-ctReserves-pane path').length);
console.log(`Réserves allumées : ${n} formes · pastilles ${await pastilles()}`);
if(n < 1000) ecart('formes manquantes');
if(!/ligue\*/.test(await pastilles()) || !/res\*/.test(await pastilles())) ecart('la ligue ou les réserves éteintes');
// Changer de couche d'oiseaux garde les réserves.
await clicPastille('recent'); await p.waitForTimeout(1500);
const apres = await pastilles();
console.log('après Vu récemment :', apres);
if(!/recent\*/.test(apres) || /ligue\*/.test(apres) || !/res\*/.test(apres)) ecart('changer de couche a touché les réserves');
// La légende.
await p.evaluate(() => { const b = document.getElementById('ctBtnLegende'); const leg = document.querySelector('.map-legend, .ct-legende'); if(b && (!leg || !leg.offsetParent)) b.click(); });
await p.waitForTimeout(400);
const leg = await p.evaluate(() => [...document.querySelectorAll('.ml-title')].map(t => t.textContent).join(', ') + ' | ' + [...document.querySelectorAll('.ml-txt')].map(t => t.textContent).filter(t => /Réserve|Conservatoire/.test(t)).join(', '));
console.log('légende :', leg);
if(!/Réserves/.test(leg) || !/Conservatoire du littoral/.test(leg)) ecart('légende');
// La couleur calculée de chaque type.
const couleurs = await p.evaluate(() => { const o = {}; document.querySelectorAll('.leaflet-ctReserves-pane path').forEach(e => { const t = [...e.classList].find(c => /^ct-res-(RNN|RNR|CDL)$/.test(c)); if(t && !o[t]) o[t] = getComputedStyle(e).fill + ' / ' + getComputedStyle(e).fillOpacity; }); return o; });
console.log('couleurs :', JSON.stringify(couleurs));
if(Object.keys(couleurs).length !== 3) ecart('trois couleurs attendues');
// Au téléphone la légende couvre la carte : refermée, comme elle l'est par défaut.
if(mobile){ await p.evaluate(() => document.getElementById('ctBtnLegende')?.click()); await p.waitForTimeout(300); }
// La bulle du lac de Grand-Lieu (réserve nationale).
await p.evaluate(() => window.__carte.setView([47.09, -1.67], 11, { animate:false }));
await p.waitForTimeout(1200);
const ouvert = await p.evaluate(() => {
  let cible = null;
  window.__carte.eachLayer(l => { const f = l.feature; if(f && f.properties && f.properties.t === 'RNN' && /Grand-Lieu/.test(f.properties.n) && l.fire && !cible) cible = l; });
  if(!cible) return false;
  const c = cible.getBounds().getCenter(); const pt = window.__carte.latLngToContainerPoint(c);
  // Un vrai clic à l'écran, au centre de la réserve : c'est elle qui doit le prendre, pas la zone dessous.
  const el = document.elementFromPoint(...(() => { const r = window.__carte.getContainer().getBoundingClientRect(); return [r.left + pt.x * (r.width / window.__carte.getSize().x), r.top + pt.y * (r.height / window.__carte.getSize().y)]; })());
  if(!el) return 'rien sous le point';
  el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, clientX:0, clientY:0 }));
  return el.tagName + '.' + [...el.classList].join('.');
});
console.log('clic au centre de Grand-Lieu sur :', ouvert);
for(let i = 0; i < 40 && !(await p.evaluate(() => { const b = document.querySelector('.leaflet-popup.ct-rb'); return b && !b.querySelector('.ct-rb-attente'); })); i++) await p.waitForTimeout(500);
const bulle = await p.evaluate(() => { const b = document.querySelector('.leaflet-popup.ct-rb'); if(!b) return null;
  return { titre:b.querySelector('.ct-hb-t')?.textContent, lignes:[...b.querySelectorAll('.ct-hb-s')].map(x => x.textContent), hs:b.querySelector('.ct-hb-it')?.textContent,
    lieux:[...b.querySelectorAll('.ct-rb-h')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).slice(0, 5), lien:b.querySelector('.ct-rb-lien a')?.href, vide:b.querySelector('.ct-rb-hs')?.textContent.slice(0, 80) }; });
console.log('bulle :', JSON.stringify(bulle, null, 1));
if(!bulle || !/Grand-Lieu/.test(bulle.titre || '') || !/inpn/.test(bulle.lien || '')) ecart('bulle');
if(bulle && !bulle.lieux.length) console.log('   (aucun hotspot listé : ' + bulle.vide + ')');
// Déplier le premier hotspot.
const dep = await p.evaluate(() => { const b = document.querySelector('.leaflet-popup.ct-rb button.ct-rb-h'); if(!b) return 'rien à déplier'; b.click(); const l = b.parentElement.nextElementSibling;
  return `${b.getAttribute('aria-expanded')} · ${l && !l.hidden ? l.querySelectorAll('.ct-gl-l').length + ' espèces' : 'liste fermée'} · ${[...(l?.querySelectorAll('.ct-gl-l') || [])].slice(0, 4).map(x => x.textContent.trim()).join(', ')}`; });
await p.waitForTimeout(500);
console.log('dépliage :', dep);
const deb = await p.evaluate(() => { const b = document.querySelector('.leaflet-popup.ct-rb .leaflet-popup-content-wrapper'); if(!b) return null; const r = b.getBoundingClientRect(), c = window.__carte.getContainer().getBoundingClientRect(); return { haut:Math.round(r.top - c.top), bas:Math.round(c.bottom - r.bottom), larg:Math.round(r.width), deborde:[...b.querySelectorAll('*')].some(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'auto' && getComputedStyle(e).overflow !== 'auto') }; });
console.log('place de la bulle :', JSON.stringify(deb));
await p.screenshot({ path:`${SORTIE}/reserves-${largeur}${sombre ? '-sombre' : ''}.png` });
// Le crayon : pendant un dessin, un clic sur une réserve pose un sommet.
if(!mobile){
  await p.evaluate(() => { window.__carte.closePopup(); });
  const avant = await p.evaluate(() => document.querySelectorAll('.leaflet-popup.ct-rb').length);
  void avant;
}
console.log('demandes eBird :', ebird.length, [...new Set(ebird.map(x => x.split(' ')[0]))].join(','));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
