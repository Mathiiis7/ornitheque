// Essai (2026-10-30), démo locale : trophées à découvrir de bout en bout. Au premier passage rien n'attend ;
// on retire des trophées des « vus », ils reviennent en attente. La page montre le palier d'avant, les
// scènes se jouent seules en arrivant sur l'onglet et s'enchaînent ; Échap garde le reste pour plus tard.
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
const ouvert = () => p.evaluate(() => !!document.getElementById('troDialog')?.open);
const nomCarte = () => p.evaluate(() => document.querySelector('.tro-sc-txt b')?.textContent);
const dansLaGrille = n => p.evaluate(n => document.getElementById('trophyGrid').textContent.includes(n), n);
const onglet = v => p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), v);

await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await pret();
const k = await cle();
let e = await lit(k);
verifie(e.vus.length > 0 && e.attente.length === 0, `premier passage : ${e.vus.length} déjà vus, ${e.attente.length} en attente`);
await onglet('trophies'); await p.waitForTimeout(700);
verifie(!await ouvert(), 'rien en attente : pas de scène');
await onglet('load');

// Un palier de progression (plusieurs paliers de la famille) et un de famille d'espèces.
const noms = e.vus.filter(n => /Ornithologue chevronné|Grand seigneur|Rapaces diurnes Or/.test(n));
await p.evaluate(([k, noms]) => {
  const e = JSON.parse(localStorage.getItem(k));
  e.vus = e.vus.filter(n => !noms.includes(n));
  localStorage.setItem(k, JSON.stringify(e));
}, [k, noms]);
await p.reload({ waitUntil:'load' });
await pret();
e = await lit(k);
console.log('en attente :', e.attente.join(' | '));
verifie(e.attente.length === noms.length, e.attente.length + ' en attente');
verifie(await badge('trophies') === String(noms.length), 'pastille Trophées = ' + await badge('trophies'));
verifie(!await ouvert(), 'pas de scène hors de la page Trophées');

// Arrivée sur l'onglet : la scène part seule.
await onglet('trophies');
await p.waitForTimeout(150);
await p.evaluate(() => 0);
verifie(!await dansLaGrille('Ornithologue chevronné') && await dansLaGrille('Ornithologue confirmé'), 'la case reste sur le palier d\'avant (Ornithologue confirmé)');
await p.waitForTimeout(600);
verifie(await ouvert(), 'la scène démarre seule');
await p.screenshot({ path:`${DOS}/a-debut-${W}.png` });
await p.waitForTimeout(7300);
await p.screenshot({ path:`${DOS}/b-carte-${W}.png` });
verifie(await p.evaluate(() => document.querySelector('.tro-sc').classList.contains('tro-sc-posee')), 'carte posée');
verifie(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'pas de débordement');
verifie(await dansLaGrille('Ornithologue chevronné'), 'derrière, la case est passée au nouveau palier');
const premier = await nomCarte();

// La suivante rejoue toute la scène (la jauge reparaît).
console.log('bouton :', await p.locator('[data-tro-suite]').textContent());
await p.locator('[data-tro-suite]').click();
await p.waitForTimeout(900);
verifie(await p.evaluate(() => { const j = document.querySelector('.tro-sc-jauge'); return !!j && getComputedStyle(j).display !== 'none' && !document.querySelector('.tro-sc').classList.contains('tro-sc-fini'); }), 'le suivant a toute sa scène');
verifie(await nomCarte() !== premier, 'autre trophée : ' + await nomCarte());
// Un clic saute à la carte.
await p.mouse.click(30, H / 2);
await p.waitForTimeout(300);
verifie(await p.evaluate(() => document.querySelector('.tro-sc').classList.contains('tro-sc-fini')), 'un clic saute à la carte');
await p.screenshot({ path:`${DOS}/c-saut-${W}.png` });
// Échap sur la carte : le reste attend.
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
verifie(!await ouvert(), 'Échap ferme');
const reste = (await lit(k)).attente.length;
verifie(reste === 1, 'il en reste ' + reste);
await p.waitForTimeout(3000);
verifie(!await ouvert(), 'ne se rouvre pas tout seul sur la même page');
// Retour sur l'onglet : le dernier joue, puis Continuer.
await onglet('load'); await onglet('trophies');
await p.waitForTimeout(900);
verifie(await ouvert(), 'le dernier repart au retour sur l\'onglet');
await p.mouse.click(30, H / 2); await p.waitForTimeout(300);
verifie(await p.locator('[data-tro-suite]').textContent() === 'Continuer', 'dernier bouton : Continuer');
await p.locator('[data-tro-suite]').click();
await p.waitForTimeout(500);
verifie(!await ouvert(), 'fermé');
verifie(await badge('trophies') === null, 'pastille Trophées retirée');
verifie(await p.locator('.tro-attend, [data-tro-attente]').count() === 0, 'plus de silhouette dans la page');
await p.reload({ waitUntil:'load' });
await pret();
verifie((await lit(k)).attente.length === 0 && !await ouvert(), 'rechargé : rien ne revient');
verifie(!erreurs.length, 'erreurs : ' + erreurs.slice(0, 4).join(' / '));
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();
