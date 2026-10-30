// Essai ponctuel (2026-10-30), démo locale, faux eBird : la recherche propose tous les oiseaux, déjà vues grisées ;
// sans pays elle lit le monde (eBird ou GBIF selon la source) ; les carrés des Hotspots sont rangés par score et
// paraissent au fur et à mesure.
// node outils/verif/_essai-recherche-monde.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird, ESPECES } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
const demandes = []; await bouchonEbird(ctx, demandes);
// La vraie taxonomie (une lecture, gardée 7 jours par le relais), plus les codes du faux eBird : une espèce sans code
// n'est pas proposée, et le faux eBird n'en connaît que 11.
const vraie = await (await fetch('https://ornitheque-relais.vercel.app/v2/ref/taxonomy/ebird?fmt=json&locale=en&cat=species', { headers:{ Origin:'https://mathiiis7.github.io' } })).json();
const faux = new Set(ESPECES.map(e => e[1]));
const taxo = [...vraie.filter(t => !faux.has(t.sciName)), ...ESPECES.map(([speciesCode, sciName, comName]) => ({ speciesCode, sciName, comName, category:'species' }))];
await ctx.route(/ref\/taxonomy\/ebird/, r => r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(new URL(r.request().url()).searchParams.get('cat') === 'species' ? taxo : []) }));
// Le monde : deux observations sur deux continents. Listes de hotspots ralenties : le faux eBird répond d'un coup.
const mondeVues = [];
await ctx.route(/data\/obs\/[A-Za-z]{2,5}\/recent\/[a-z0-9]+/, r => { const u = r.request().url(), cc = u.match(/obs\/([A-Za-z]+)\/recent/)[1], code = u.match(/recent\/([a-z0-9]+)/)[1]; mondeVues.push(cc);
  const lieux = { JP:['Tokyo', 35.6, 139.7], AU:['Sydney', -33.8, 151.2] };
  const l = lieux[cc] || (cc === 'FR' ? ['Nantes', 47.2, -1.5] : cc === 'ES' ? ['Madrid', 40.4, -3.7] : null);
  r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(l ? [{ speciesCode:code, comName:'x', sciName:'Egretta garzetta', locId:'L' + cc, locName:l[0], obsDt:'2026-10-29 08:00', howMany:2, lat:l[1], lng:l[2], obsValid:true, subId:'S' + cc }] : []) }); });
const gbifVues = [];
await ctx.route(/api\.gbif\.org\/v1\/occurrence\/search/, r => { gbifVues.push(r.request().url());
  r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify({ count:1, endOfRecords:true, results:[{ decimalLatitude:35.6, decimalLongitude:139.7, eventDate:'2020-05-01', locality:'Tokyo', individualCount:1 }] }) }); });
await ctx.route(/api\.gbif\.org\/v1\/species\/match/, r => r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify({ matchType:'EXACT', usageKey:123, speciesKey:123 }) }));
await ctx.route(/product\/spplist\//, async r => { await new Promise(f => setTimeout(f, 700)); r.fallback(); });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
const ecrit = async txt => { await p.evaluate(txt => { const s = document.getElementById('mapSearch'); s.value = txt; s.dispatchEvent(new Event('input', { bubbles:true })); s.dispatchEvent(new Event('focus')); }, txt); await p.waitForTimeout(300); };
const lignes = () => p.evaluate(() => [...document.querySelectorAll('#mapSearchSuggest .map-search-suggest-item')].map(x => ({ nom:x.children[1]?.textContent || x.textContent, deja:x.classList.contains('ss-deja'), info:x.classList.contains('ss-info') })));
const noms = l => l.map(x => x.nom);
// 1. Ce qui est proposé.
const coul = await p.evaluate(() => 0);
await ecrit('merle'); const merle = await lignes();
console.log('merle :', merle.length, noms(merle).slice(0, 5).join(', '));
const noir = merle.find(x => x.nom === 'Merle noir');
if(!noir) ecart('Merle noir absent'); else if(!noir.deja) console.log('   (Merle noir pas dans la liste de démo)');
await ecrit('pic'); const pic = await lignes();
console.log('pic :', pic.length, noms(pic).slice(1, 6).join(', '));
if(noms(pic).some(n => /Ibis sacré|Fauvette à lunettes|Macreuse/.test(n))) ecart('le latin au milieu d\'un mot revient');
const motPic = n => /(^|[\s'-])pic/i.test(n);
const premierLatin = noms(pic).slice(1).findIndex(n => !motPic(n));
const dernierPic = noms(pic).slice(1).map(motPic).lastIndexOf(true);
if(premierLatin !== -1 && premierLatin < dernierPic) ecart('un nom latin passe devant un nom français');
await ecrit('paruline tigr'); if(!noms(await lignes()).some(n => /Paruline tigrée/.test(n))) ecart('Paruline tigrée absente');
await ecrit('rougegorge'); const rg = await lignes(); console.log('rougegorge :', JSON.stringify(rg.slice(1, 3)));
if(!rg.some(x => /Rougegorge/.test(x.nom))) ecart('Rougegorge absent');
const nbDeja = rg.filter(x => x.deja).length;
const styleDeja = await p.evaluate(() => { const d = document.querySelector('.ss-deja'); return d ? { c:getComputedStyle(d).color, o:getComputedStyle(d.querySelector('.ss-dot')).opacity } : null; });
console.log('déjà vues grisées :', nbDeja, JSON.stringify(styleDeja));
await ecrit('a'); const t0 = await p.evaluate(() => { const s = document.getElementById('mapSearch'); s.value = 'm'; const d = performance.now(); s.dispatchEvent(new Event('input', { bubbles:true })); return performance.now() - d; });
console.log('une seule lettre :', Math.round(t0), 'ms');
// 2. Espèce renommée par eBird, le nom de nos tables doit trouver son code.
await ecrit('troglodyte mignon'); const tro = await lignes(); console.log('troglodyte :', noms(tro).join(', '));
if(!noms(tro).includes('Troglodyte mignon')) ecart('Troglodyte mignon absent');
// 3. Sans pays, eBird : le monde.
const choisir = async nom => { await ecrit(nom); await p.evaluate(nom => { const it = [...document.querySelectorAll('#mapSearchSuggest .map-search-suggest-item')].find(x => x.children[1]?.textContent === nom); it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); }, nom); await p.waitForTimeout(2500); };
// Le faux eBird ne connaît que quelques espèces : on en prend une.
const debut = Date.now();
await ecrit('Aigrette garzette'); await p.evaluate(() => { const it = [...document.querySelectorAll('#mapSearchSuggest .map-search-suggest-item')].find(x => x.children[1]?.textContent === 'Aigrette garzette'); it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); });
await p.waitForTimeout(300);
const message = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent);
console.log('pendant la lecture :', message);
await p.waitForFunction(() => /observation/.test(document.querySelector('#ctListeRecent')?.textContent || ''), null, { timeout:30000 }).catch(() => {});
console.log('résultat en', Date.now() - debut, 'ms');
await p.waitForTimeout(800);
const vue = () => p.evaluate(() => { const c = window.__carte; const pts = []; c.eachLayer(l => { if(l.getLatLng && l._rec) pts.push(l._rec.lieu); });
  return { pts, liste:document.querySelector('#ctListeRecent')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 90), etat:document.getElementById('ctRecEtat')?.textContent, zoom:c.getZoom() }; });
const v1 = await vue(); console.log('monde eBird :', mondeVues.length, 'demande(s) :', mondeVues.join(','), JSON.stringify(v1));
if(mondeVues.includes('world')) ecart('demande au monde, qu\'eBird refuse');
if(!mondeVues.includes('FR') || !mondeVues.includes('ES')) ecart('France ou Espagne pas lues');
if(!mondeVues.length) ecart('pas de demande au monde'); if(!/Aigrette garzette/.test(v1.liste || '')) ecart('la liste ne dit pas l\'espèce');
if(/pas affichée/.test(v1.liste || '')) ecart('la couche reste éteinte');
await p.screenshot({ path:`${SORTIE}/recherche-monde-${largeur}.png` });
// 4. Sans pays, années passées : GBIF sans pays.
const avantGbif = await p.evaluate(() => ({ source:document.getElementById('mapEbSource')?.value, btn:!!document.querySelector('[data-ct-source="gbif"]') }));
await p.evaluate(() => { const d = document.getElementById('ctPliRecent'); if(d) d.open = true; document.querySelector('[data-ct-source="gbif"]').click(); }); await p.waitForTimeout(2500);
console.log('source :', JSON.stringify(avantGbif), '->', await p.evaluate(() => document.getElementById('mapEbSource')?.value), '· barre :', await p.evaluate(() => document.getElementById('mapSearch').value), '· état :', await p.evaluate(() => (document.getElementById('ctRecEtat')?.textContent || '') + ' / ' + (document.getElementById('mapEbCount')?.textContent || '')));
const u = gbifVues.at(-1) || ''; console.log('monde GBIF :', gbifVues.length, 'demande(s),', u.includes('country=') ? 'AVEC pays' : 'sans pays');
if(!gbifVues.length || u.includes('country=')) ecart('GBIF ne lit pas le monde');
await p.evaluate(() => document.querySelector('[data-ct-source="ebird"]').click()); await p.waitForTimeout(600);
await ecrit(''); await p.waitForTimeout(1500);
// 5. Hotspots sans pays : la barre le dit. Points du Récent : aucun dessous pendant une recherche.
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click()); await p.waitForTimeout(800);
await ecrit('merle'); const hsSans = await lignes(); console.log('hotspots sans pays :', JSON.stringify(hsSans));
if(!hsSans[0]?.info) ecart('pas de message sans pays');
await ecrit('');
// 6. Pays ouvert : chargement au fur et à mesure, ordre des carrés.
const clic = async (cle, val, att = 2500) => { await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]); await p.waitForTimeout(att); };
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click());
const nb = () => p.evaluate(() => { let n = 0; window.__carte.eachLayer(l => { if(l._hs) n++; }); return n; });
await clic('cc', 'FR', 0);
const t = Date.now(); let premier = 0, dernier = 0, pris = new Set();
for(let i = 0; i < 300 && Date.now() - t < 30000; i++){ const n = await nb(); pris.add(n); if(n && !premier) premier = Date.now() - t; if(n >= 18 && !dernier){ dernier = Date.now() - t; break; } await p.waitForTimeout(50); }
console.log('carrés au fil du temps : premier à', premier, 'ms, tous à', dernier, 'ms, paliers', [...pris].join(','));
if(!premier || !dernier || pris.size < 3) ecart('les carrés n\'arrivent pas au fur et à mesure');
await p.waitForTimeout(2500);
await p.evaluate(() => { const d = document.getElementById('ctPliHot'); if(d) d.open = true; document.querySelector('[data-ct-compte="30"]').click(); }); await p.waitForTimeout(2500);
const ordre = await p.evaluate(() => { const r = []; window.__carte.eachLayer(l => { if(l._hs){ const el = l.getElement(); r.push({ nb:l._hs.nb, z:+el.style.zIndex, y:el.getBoundingClientRect().y }); } }); return r.sort((a, b) => b.nb - a.nb); });
console.log('ordre (nombre, rang) :', ordre.map(o => `${o.nb}:${o.z}`).join(' '));
for(let i = 1; i < ordre.length; i++) if(ordre[i].nb < ordre[i - 1].nb && !(ordre[i].z < ordre[i - 1].z)) ecart(`rang : ${ordre[i - 1].nb} n'est pas devant ${ordre[i].nb}`);
const recentDessous = await p.evaluate(() => { let n = 0; window.__carte.eachLayer(l => { if(l._rec && l.getLatLng) n++; }); return n; });
await ecrit('alouette'); await p.waitForTimeout(400); const rd2 = await p.evaluate(() => { let n = 0; window.__carte.eachLayer(l => { if(l._rec && l.getLatLng) n++; }); return n; });
console.log('points du Récent sous les Hotspots :', recentDessous, '/', rd2);
if(recentDessous || rd2) ecart('des points du Récent restent sous les Hotspots');
// Une ligne du volet ouvre toujours la bulle de son carré.
await ecrit('');
const bulle = await p.evaluate(async () => { document.querySelector('#ctListeHot .ct-rang-hs')?.click(); await new Promise(f => setTimeout(f, 800)); return !!document.querySelector('.leaflet-popup.ct-hb'); });
console.log('ligne du volet -> bulle :', bulle); if(!bulle) ecart('la ligne n\'ouvre plus la bulle');
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
