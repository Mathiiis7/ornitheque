// Essai (2026-10-30), démo locale : trophées à découvrir de bout en bout. Au premier passage rien n'attend ;
// on retire des trophées des « vus », ils reviennent en attente ; pastilles, silhouettes, scène, série.
// node outils/verif/_essai-trophees-attente.mjs DOSSIER_CAPTURES [LARGEUR] [HAUTEUR]
import { chromium } from 'playwright';
const DOS = process.argv[2], W = +process.argv[3] || 1300, H = +process.argv[4] || 850, mobile = W < 600;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:W, height:H }, locale:'fr-FR', serviceWorkers:'block', ...(mobile ? { isMobile:true, hasTouch:true } : {}) });
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
p.on('console', m => { if(m.type() === 'error' && !/favicon|ERR_|Failed to load/.test(m.text())) erreurs.push(m.text()); });
let defauts = 0;
const verifie = (ok, txt) => { console.log((ok ? 'ok    ' : 'DÉFAUT') + ' ' + txt); if(!ok) defauts++; };
const pret = async () => { await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape'); await p.waitForTimeout(13500); };
const cle = () => p.evaluate(() => Object.keys(localStorage).find(k => k.startsWith('mb-trophees-')));
const lit = k => p.evaluate(k => JSON.parse(localStorage.getItem(k)), k);
const badge = v => p.evaluate(v => document.querySelector(`.tab[data-view="${v}"] .tab-count`)?.textContent ?? null, v);

await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await pret();
const k = await cle();
verifie(!!k, 'état enregistré : ' + k);
let e = await lit(k);
verifie(e.vus.length > 0 && e.attente.length === 0, `premier passage : ${e.vus.length} déjà vus, ${e.attente.length} en attente`);
verifie(await badge('trophies') === null, 'pas de pastille Trophées');

// Choix : un palier avec précédent, un premier palier, un unique ; plusieurs paliers d'une même famille.
const noms = e.vus;
console.log('possédés :', noms.slice(0, 30).join(' | '));
const uid = k.replace('mb-trophees-', '');
await p.evaluate(([k, uid, noms]) => {
  const e = JSON.parse(localStorage.getItem(k));
  e.vus = e.vus.filter(n => !noms.includes(n));
  localStorage.setItem(k, JSON.stringify(e));
  localStorage.setItem('mb-a-decouvrir-' + uid, JSON.stringify(['turdus merula', 'pas une espece de ma liste']));
}, [k, uid, noms.slice(0, 5)]);
await p.reload({ waitUntil:'load' });
await pret();
e = await lit(k);
console.log('en attente :', e.attente.join(' | '));
verifie(e.attente.length > 0 && e.attente.length <= 5, e.attente.length + ' en attente');
verifie(await badge('trophies') === String(e.attente.length), 'pastille Trophées = ' + await badge('trophies'));
console.log('pastille Birdydex =', await badge('pokedex'));
const couleur = await p.evaluate(() => getComputedStyle(document.querySelector('.tab[data-view="trophies"] .tab-count')).backgroundColor);
console.log('couleur', couleur);
await p.screenshot({ path:`${DOS}/1-onglets-${W}.png`, clip:{ x:0, y:0, width:W, height:200 } });

await p.evaluate(() => document.querySelector('.tab[data-view="trophies"]').click());
await p.waitForTimeout(1200);
const nbCases = await p.locator('#trophyGrid .tro-attend').count();
verifie(nbCases === e.attente.length, nbCases + ' cases en silhouette');
await p.screenshot({ path:`${DOS}/2-cases-${W}.png` });

// La grande scène du premier, puis la série en cartes seules.
const total = e.attente.length;
await p.locator('#trophyGrid .tro-attend').first().click();
for(const [t, n] of [[1400, 'jauge'], [1700, 'tremble'], [1300, 'coupe'], [2300, 'coupe-tard'], [1500, 'carte']]){
  await p.waitForTimeout(t);
  await p.screenshot({ path:`${DOS}/3-${n}-${W}.png` });
}
verifie(await p.evaluate(() => document.querySelector('.tro-sc').classList.contains('tro-sc-posee')), 'carte posée');
verifie(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'pas de débordement');
e = await lit(k);
verifie(e.attente.length === total - 1, 'pastille baisse : ' + await badge('trophies'));
for(let i = 1; i < total; i++){
  console.log('bouton :', await p.locator('[data-tro-suite]').textContent());
  await p.locator('[data-tro-suite]').click();
  await p.waitForTimeout(900);
  if(i === total - 1) await p.screenshot({ path:`${DOS}/4-derniere-${W}.png` });
}
verifie(await p.locator('[data-tro-suite]').textContent() === 'Continuer', 'dernier bouton : Continuer');
await p.locator('[data-tro-suite]').click();
await p.waitForTimeout(500);
verifie(await p.evaluate(() => !document.getElementById('troDialog').open), 'fermé');
verifie(await p.locator('#trophyGrid .tro-attend').count() === 0, 'plus aucune silhouette');
verifie(await badge('trophies') === null, 'pastille Trophées retirée');
verifie((await lit(k)).attente.length === 0, 'plus rien en attente');
// Rechargé, rien ne revient.
await p.reload({ waitUntil:'load' });
await pret();
verifie((await lit(k)).attente.length === 0, 'rechargé : rien ne revient');
verifie(!erreurs.length, 'erreurs : ' + erreurs.slice(0, 4).join(' / '));
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
