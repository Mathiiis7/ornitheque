// Mesure ponctuelle (2026-10-29) : un chargement déjà fait se refait-il de mémoire ? Démo locale, faux eBird
// (réponses instantanées : le temps mesuré est celui de la page et de sa file d'attente). Pour chaque geste,
// le temps jusqu'à la liste affichée et le nombre de demandes parties vers le relais / eBird.
// node outils/verif/_perf-caches.mjs
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR' });
// VRAI=1 : le vrai eBird, par le relais (les demandes comptées au départ du navigateur).
const demandes = [];
if(process.env.VRAI) ctx.on('request', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url())) demandes.push(r.url()); });
else await bouchonEbird(ctx, demandes);
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const ouvre = async () => {
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2000);
};
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
const pastille = k => p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).click(), k);
// Prêt : le Récent a sa liste sans « … », les Hotspots ont leurs carrés et plus rien en cours.
const pret = k => p.evaluate(k => {
  if(k === 'recent'){ const t = document.querySelector('#ctListeRecent .ct-compte')?.textContent || ''; return /espèce/.test(t) && !/lecture|…/.test(t); }
  const t = document.getElementById('ctListeHot')?.textContent || ''; return document.querySelectorAll('.ct-hs-ico').length > 0 && !/…|Chargement/.test(t);
}, k);
const lignes = [];
async function geste(nom, k, fn){
  const n0 = demandes.length, t0 = Date.now();
  await fn();
  let ok = false;
  for(let i = 0; i < 300 && !ok; i++){ await p.waitForTimeout(100); ok = await pret(k); }
  await p.waitForTimeout(1500);   // ce qui part encore après l'affichage (dates des espèces...)
  lignes.push(`${nom.padEnd(44)} ${ok ? String(Date.now() - t0 - 1500).padStart(6) + ' ms' : '  jamais prêt'} · ${demandes.length - n0} demandes`);
}
await ouvre();
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2500);
await geste('Récent, Loire-Atlantique, 1re fois', 'recent', async () => { await clic('ebird', 'FR-PDL-44'); await pastille('recent'); });
await geste('Hotspots, Loire-Atlantique, 1re fois', 'hot', () => pastille('hot'));
await geste('retour au Récent (même zone)', 'recent', () => pastille('recent'));
await geste('retour aux Hotspots (même zone)', 'hot', () => pastille('hot'));
if(!process.env.VRAI) await geste('Hotspots, Vendée', 'hot', () => clic('ebird', 'FR-PDL-85'));
if(!process.env.VRAI) await geste('Hotspots, retour Loire-Atlantique', 'hot', () => clic('ebird', 'FR-PDL-44'));
await geste('Récent, retour Loire-Atlantique', 'recent', () => pastille('recent'));
const ls = await p.evaluate(() => { let n = 0, o = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); o += (localStorage.getItem(k) || '').length + k.length; if(/^ebc:/.test(k)) n++; } return { cles_ebird:n, ko:Math.round(o * 2 / 1024) }; });
lignes.push('stockage du navigateur : ' + JSON.stringify(ls));
// La page rechargée, comme le lendemain matin.
await ouvre();
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2500);
await geste('page rechargée : Récent Loire-Atlantique', 'recent', async () => { await clic('ebird', 'FR-PDL-44'); await pastille('recent'); });
await geste('page rechargée : Hotspots Loire-Atlantique', 'hot', () => pastille('hot'));
console.log(lignes.join('\n'));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
// Les adresses des dernières demandes, regroupées par forme (VRAI=1 seulement).
if(process.env.VRAI){
  const formes = new Map();
  for(const u of demandes.slice(-40)){ const f = new URL(u).pathname.replace(/L\d+/g, 'L…').replace(/S\d+/g, 'S…').replace(/\/[a-z]{4,6}\d?$/, '/<espèce>'); formes.set(f, (formes.get(f) || 0) + 1); }
  console.log('40 dernières demandes :', JSON.stringify([...formes]));
}
