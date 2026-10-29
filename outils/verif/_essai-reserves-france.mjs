// Essai ponctuel (2026-10-29), démo locale, faux eBird : les réserves ne s'affichent qu'en France (Mathis).
// Monde : pastille grisée, le clic ne fait rien ; France : elle s'allume ; Espagne : les formes partent, la
// pastille se grise, la légende les oublie ; retour en France : elles reviennent sans rien recliquer.
// node outils/verif/_essai-reserves-france.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
await bouchonEbird(ctx);
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
let defauts = 0;
const etat = () => p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="res"]');
  return { grisee:b.getAttribute('aria-disabled') === 'true', pressee:b.getAttribute('aria-pressed') === 'true', tip:b.dataset.tip || '', formes:document.querySelectorAll('.leaflet-ctReserves-pane path').length,
    legende:[...document.querySelectorAll('.ml-title')].some(t => /Réserves/.test(t.textContent)) }; });
const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
const verifie = (nom, e, attendu) => { const ok = Object.entries(attendu).every(([k, v]) => e[k] === v); console.log(`${nom.padEnd(28)} ${JSON.stringify(e)} ${ok ? 'CONFORME' : 'DÉFAUT'}`); if(!ok) defauts++; };
verifie('monde', await etat(), { grisee:true, pressee:false, formes:0 });
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="res"]').click()); await p.waitForTimeout(1500);
verifie('monde, après un clic', await etat(), { grisee:true, formes:0 });
await clicForme('cc', 'FR'); await p.waitForTimeout(2500);
verifie('France', await etat(), { grisee:false, pressee:false });
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="res"]').click());
for(let i = 0; i < 20 && !(await etat()).formes; i++) await p.waitForTimeout(500);
verifie('France, allumées', await etat(), { grisee:false, pressee:true, formes:1195, legende:true });
await p.evaluate(() => document.querySelector('#ctAriane [data-carte="monde"]')?.click()); await p.waitForTimeout(2000);
await clicForme('cc', 'ES'); await p.waitForTimeout(2500);
verifie('Espagne', await etat(), { grisee:true, pressee:false, formes:0, legende:false });
await p.evaluate(() => document.querySelector('#ctAriane [data-carte="monde"]')?.click()); await p.waitForTimeout(2000);
await clicForme('cc', 'FR'); await p.waitForTimeout(2500);
verifie('retour en France', await etat(), { grisee:false, pressee:true, formes:1195 });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune'); if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
