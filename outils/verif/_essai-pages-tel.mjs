// Étape 3b (2026-11-08) : les pages reprises au téléphone, dans la démo, à 390 et 360 px.
// Ma liste à plat (pas de boîte qui défile), Classement sans débord, Qui a vu quoi en tableau, Trophées en
// lignes, couches de la Carte sur une rangée, Tchat à plat avec la saisie visible au-dessus de la barre.
// node outils/verif/_essai-pages-tel.mjs -> captures dans notes-privees/chantier-telephone/pages-ok/
import { chromium } from 'playwright';
import fs from 'fs';
const SORTIE = 'notes-privees/chantier-telephone/pages-ok';
fs.mkdirSync(SORTIE, { recursive:true });
const nav = await chromium.launch();
let defauts = 0;
const ko = m => { defauts++; console.log('  DÉFAUT', m); };
for(const [larg, haut] of [[390, 844], [360, 740]]){
  console.log(`\n== ${larg} px`);
  const ctx = await nav.newContext({ viewport:{ width:larg, height:haut }, isMobile:true, hasTouch:true, locale:'fr-FR' });
  await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'load'); }catch(_){} });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(3000);
  const va = async v => { await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), v); await p.waitForTimeout(1800);
    await p.evaluate(() => { const d = document.getElementById('ctChoixDialog'); if(d?.open) d.close(); }); };
  const largeur = () => p.evaluate(() => document.documentElement.scrollWidth);
  const cap = async nom => { if(larg === 390) await p.screenshot({ path:`${SORTIE}/${nom}.png` }); };

  await va('load');
  const ml = await p.evaluate(() => {
    const b = document.getElementById('myListBody'), ic = document.querySelector('.ml-box .ml-ic').getBoundingClientRect();
    const boites = [...document.querySelectorAll('.ml-box')].map(x => x.getBoundingClientRect());
    return { defile:b.scrollHeight > b.clientHeight + 2, ic:[Math.round(ic.width), Math.round(ic.height)], uneLigne:new Set(boites.map(r => Math.round(r.top))).size === 1,
      fond:getComputedStyle(document.querySelector('.ml-box:not(.ml-box-charger) .ml-ic')).backgroundColor };
  });
  console.log(`  Ma liste : boîte qui défile ${ml.defile ? 'OUI' : 'non'}, carré d'icône ${ml.ic.join('x')}, boutons sur une ligne ${ml.uneLigne}, fond ${ml.fond}`);
  if(ml.defile) ko('la liste défile encore dans sa boîte');
  if(ml.ic[0] < 36 || ml.ic[1] < 36) ko('le carré de l\'icône a rétréci');
  if(!ml.uneLigne) ko('les boutons ne tiennent pas sur une ligne');
  if(await largeur() > larg) ko('Ma liste déborde');
  await cap('ma-liste');

  await va('ranking');
  const cl = await p.evaluate(() => {
    const t = document.querySelector('#boardList .board-sheet').getBoundingClientRect();
    const tbl = document.querySelector('#matrix .tbl-scroll'), cartes = document.getElementById('matrixCards');
    return { tableau:[Math.round(t.left), Math.round(t.right)], qui:getComputedStyle(tbl).display, cartes:getComputedStyle(cartes).display,
      quiH:Math.round(tbl.getBoundingClientRect().height), sp:Math.round(document.querySelector('#matrix .tbl-scroll tbody td.sp')?.getBoundingClientRect().width || 0) };
  });
  console.log(`  Classement : tableau ${cl.tableau.join('..')} px, Qui a vu quoi ${cl.qui} (${cl.quiH} px de haut, colonne Espèce ${cl.sp} px), cartes ${cl.cartes}`);
  if(cl.tableau[1] > larg) ko('le tableau du Classement dépasse');
  if(cl.qui === 'none' || cl.cartes !== 'none') ko('Qui a vu quoi n\'est pas en tableau');
  if(cl.quiH > haut) ko('le tableau de Qui a vu quoi dépasse l\'écran');
  if(await largeur() > larg) ko('Classement déborde : ' + await largeur());
  await cap('classement');
  await p.evaluate(() => { const el = document.querySelector('#matrix .tbl-scroll'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 120); });
  await p.waitForTimeout(400); await cap('qui-a-vu-quoi');

  await va('trophies');
  const tr = await p.evaluate(() => { const f = [...document.querySelectorAll('.tro-family')].slice(0, 6).map(x => x.getBoundingClientRect());
    return { h:Math.round(Math.max(...f.map(r => r.height))), col:new Set(f.map(r => Math.round(r.left))).size }; });
  console.log(`  Trophées : ${tr.col} colonne(s), ligne la plus haute ${tr.h} px`);
  if(tr.col !== 1 || tr.h > 130) ko('les trophées ne sont pas en lignes');
  if(await largeur() > larg) ko('Trophées déborde');
  await p.evaluate(() => { const el = document.querySelector('.tro-families'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 80); });
  await p.waitForTimeout(300); await cap('trophees');

  await va('map');
  const ca = await p.evaluate(() => { const c = [...document.querySelectorAll('#ctCouches .ct-couche')].map(x => x.getBoundingClientRect());
    return { lignes:new Set(c.map(r => Math.round(r.top))).size, min:Math.round(Math.min(...c.map(r => r.width))), h:Math.round(c[0].height),
      coupe:[...document.querySelectorAll('#ctCouches .ct-couche')].some(x => x.scrollWidth > x.clientWidth + 1) }; });
  console.log(`  Carte : couches sur ${ca.lignes} ligne(s), case la plus étroite ${ca.min} px, ${ca.h} px de haut, mot coupé ${ca.coupe}`);
  if(ca.lignes !== 1) ko('les couches ne tiennent pas sur une ligne');
  if(ca.coupe) ko('un mot de couche est coupé');
  if(await largeur() > larg) ko('Carte déborde');
  await cap('carte');

  await va('chat');
  await p.waitForTimeout(600);
  const ch = await p.evaluate(() => { const c = document.querySelector('.chat-compose').getBoundingClientRect(), b = document.getElementById('barreBas').getBoundingClientRect();
    const box = document.getElementById('chatMessages');
    const band = document.getElementById('demoBandeau')?.getBoundingClientRect();
    return { compose:[Math.round(c.top), Math.round(c.bottom)], barre:Math.round(b.top), bandeau:band ? Math.round(band.top) : null,
      boiteDefile:box.scrollHeight > box.clientHeight + 2, enBas:Math.round(document.documentElement.scrollHeight - scrollY - innerHeight) }; });
  console.log(`  Tchat : saisie ${ch.compose.join('..')}, bandeau dès ${ch.bandeau}, barre dès ${ch.barre}, boîte qui défile ${ch.boiteDefile}, reste sous l'écran ${ch.enBas} px`);
  const plancher = ch.bandeau ?? ch.barre;
  if(ch.compose[1] > plancher + 1) ko(`la saisie passe sous ${ch.bandeau ? 'le bandeau' : 'la barre'} de ${ch.compose[1] - plancher} px`);
  if(ch.compose[0] < 0) ko('la saisie est hors de l\'écran');
  if(ch.boiteDefile) ko('les messages défilent encore dans une boîte');
  if(ch.enBas > 200) ko('le Tchat n\'arrive pas sur les derniers messages');
  if(await largeur() > larg) ko('Tchat déborde');
  await cap('tchat');

  console.log('  erreurs :', erreurs.length ? erreurs : 'aucune');
  if(erreurs.length) defauts++;
  await ctx.close();
}
console.log(defauts ? `\n${defauts} DÉFAUT(S)` : '\nCONFORME');
await nav.close();
