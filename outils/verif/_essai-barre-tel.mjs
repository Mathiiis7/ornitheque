// Chantier téléphone (2026-11-07) : la barre du bas et la page Plus, sur la démo.
// À 390 et 360 px (iPhone, petit Android), clair et sombre, au doigt (isMobile) :
// la barre est là et la rangée d'onglets cachée, chaque case ouvre sa page et s'allume, Plus ouvre ses
// lignes et chacune sa page, les mots de la barre tiennent sans être coupés, rien ne déborde, le texte
// est à sa vraie taille, la carte tient entre l'entête et la barre, le guide pointe des cibles visibles.
// node outils/verif/_essai-barre-tel.mjs   (captures dans notes-privees/chantier-telephone/essai/)
import { chromium } from 'playwright';
import fs from 'fs';
const SORTIE = 'notes-privees/chantier-telephone/essai';
fs.mkdirSync(SORTIE, { recursive:true });
const nav = await chromium.launch();
let defauts = 0;
const ko = m => { defauts++; console.log('  DÉFAUT', m); };
for(const [larg, haut] of [[390, 844], [360, 740]]) for(const theme of ['light', 'dark']){
  console.log(`\n== ${larg} px, ${theme}`);
  const ctx = await nav.newContext({ viewport:{ width:larg, height:haut }, isMobile:true, hasTouch:true, locale:'fr-FR' });
  await ctx.addInitScript(t => { try{ localStorage.setItem('mb-last-tab', 'load'); localStorage.setItem('mb-theme', t); }catch(_){} }, theme);
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(3000);
  // Le guide, lancé comme depuis Plus : on le parcourt, chaque étape doit montrer une cible visible.
  const guide = await p.evaluate(async () => {
    const att = ms => new Promise(r => setTimeout(r, ms));
    document.querySelector('#barreBas [data-view="plus"]').click();
    await att(400);
    document.querySelector('#plusListe [data-clic="hamGuide"]').click();
    const out = [];
    for(let i = 0; i < 30 && !document.getElementById('guide').hidden; i++){
      await att(700);
      const t = document.getElementById('guideTitre').textContent;
      const trou = document.getElementById('guideTrou').getBoundingClientRect();
      const sans = document.getElementById('guide').classList.contains('sans-cible');
      out.push(`${t}${sans ? ' [centre]' : ` [${Math.round(trou.left)},${Math.round(trou.top)} ${Math.round(trou.width)}x${Math.round(trou.height)}]`}`);
      document.getElementById('guideSuivant').click();
    }
    return out;
  });
  console.log('  guide :', guide.join(' | '));
  for(const g of guide.slice(1)) if(g.includes('[centre]') && !/Bienvenue/.test(g)) ko('étape du guide sans cible : ' + g);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  const etat = () => p.evaluate(() => {
    const barre = document.getElementById('barreBas'), r = barre.getBoundingClientRect();
    const mots = [...barre.querySelectorAll('button')].map(b => {
      const s = document.createRange(); s.selectNodeContents(b); const t = [...b.childNodes].find(n => n.nodeType === 3);
      const rg = document.createRange(); rg.selectNodeContents(t); const rt = rg.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return { mot:t.textContent.trim(), large:Math.round(rt.width), place:Math.round(rb.width), on:b.classList.contains('on') };
    });
    return { vue:document.querySelector('.tab.on')?.dataset.view, barreVisible:getComputedStyle(barre).display !== 'none', barreHaut:Math.round(r.top), barreH:Math.round(r.height),
      ongletsCaches:getComputedStyle(document.querySelector('nav.tabs')).display === 'none', zoom:getComputedStyle(document.body).zoom,
      largeur:document.documentElement.scrollWidth, ecran:innerWidth, mots,
      texte:parseFloat(getComputedStyle(document.querySelector('.mylist-note, p.help, body')).fontSize) };
  });
  let e = await etat();
  if(!e.barreVisible) ko('barre cachée');
  if(!e.ongletsCaches) ko('rangée d\'onglets visible');
  if(String(e.zoom) !== '1') ko('zoom ' + e.zoom);
  console.log(`  barre en ${e.barreHaut} px, ${e.barreH} px de haut ; mots : ${e.mots.map(m => `${m.mot} ${m.large}/${m.place}`).join(', ')}`);
  for(const m of e.mots) if(m.large > m.place - 4) ko(`« ${m.mot} » ne tient pas : ${m.large} px pour ${m.place}`);
  for(const v of ['ranking', 'pokedex', 'map', 'quiz']){
    await p.evaluate(v => document.querySelector(`#barreBas [data-view="${v}"]`).click(), v);
    await p.waitForTimeout(1800);
    await p.evaluate(() => { const d = document.getElementById('ctChoixDialog'); if(d?.open) d.close(); });
    e = await etat();
    const on = e.mots.filter(m => m.on).map(m => m.mot);
    if(e.vue !== v) ko(`case ${v} : vue ${e.vue}`);
    if(on.length !== 1) ko(`case ${v} : ${on.length} cases allumées`);
    if(e.largeur > e.ecran) ko(`${v} : la page fait ${e.largeur} px pour ${e.ecran}`);
    if(v === 'map'){
      const c = await p.evaluate(() => { const ent = document.querySelector('.entete-fixe').getBoundingClientRect(); const carte = document.getElementById('ctCarte');
        carte.scrollIntoView(); scrollBy(0, -ent.height); const r = carte.getBoundingClientRect(); return { haut:Math.round(r.top), bas:Math.round(r.bottom), barre:Math.round(document.getElementById('barreBas').getBoundingClientRect().top), ent:Math.round(ent.bottom) }; });
      console.log(`  carte de ${c.haut} à ${c.bas}, entête jusqu'à ${c.ent}, barre dès ${c.barre}`);
      if(c.bas > c.barre + 1) ko(`la carte passe sous la barre de ${c.bas - c.barre} px`);
    }
    await p.evaluate(() => scrollTo(0, 0));
    if(theme === 'light' || v === 'pokedex') await p.screenshot({ path:`${SORTIE}/${larg}-${theme}-${v}.png` });
  }
  // Plus et ses lignes
  await p.evaluate(() => document.querySelector('#barreBas [data-view="plus"]').click());
  await p.waitForTimeout(800);
  const lignes = await p.evaluate(() => [...document.querySelectorAll('#plusListe .plus-ligne, #plusListe .plus-sortie')].map(b => (b.dataset.view || b.dataset.clic) + ':' + b.textContent.replace('›', '').trim()));
  console.log('  Plus :', lignes.join(' ; '));
  if(lignes.length < 10) ko('Plus n\'a que ' + lignes.length + ' lignes');
  await p.screenshot({ path:`${SORTIE}/${larg}-${theme}-plus.png` });
  for(const v of ['load', 'trophies', 'feed', 'photos', 'chat', 'profil', 'requests', 'about']){
    await p.evaluate(() => document.querySelector('#barreBas [data-view="plus"]').click());
    await p.waitForTimeout(400);
    await p.evaluate(v => document.querySelector(`#plusListe [data-view="${v}"]`)?.click(), v);
    await p.waitForTimeout(1500);
    e = await etat();
    if(e.vue !== v) ko(`Plus > ${v} : vue ${e.vue}`);
    if(!e.mots.find(m => m.mot === 'Plus').on) ko(`Plus > ${v} : la case Plus n'est pas allumée`);
    if(e.largeur > e.ecran) ko(`${v} : la page fait ${e.largeur} px pour ${e.ecran}`);
    const flottant = await p.evaluate(() => !!document.querySelector('.fab-open'));
    if(flottant) ko(`${v} : un panneau flottant est ouvert`);
    if(theme === 'light' && larg === 390) await p.screenshot({ path:`${SORTIE}/${larg}-${theme}-${v}.png` });
  }
  // Le clavier : un champ qui a le focus cache la barre
  await p.evaluate(() => document.querySelector('#barreBas [data-view="pokedex"]').click());
  await p.waitForTimeout(1200);
  await p.focus('#pkdxSearch, #viewPokedex input[type="search"]').catch(() => {});
  const cachee = await p.evaluate(() => getComputedStyle(document.getElementById('barreBas')).display === 'none');
  const taille = await p.evaluate(() => parseFloat(getComputedStyle(document.activeElement).fontSize));
  console.log(`  champ en focus : barre ${cachee ? 'cachée' : 'VISIBLE'}, texte du champ ${taille} px`);
  if(!cachee) ko('la barre reste au-dessus du clavier');
  if(taille < 16) ko('champ sous 16 px : iOS zoomerait');
  console.log('  erreurs :', erreurs.length ? erreurs : 'aucune');
  if(erreurs.length) defauts++;
  await ctx.close();
}
console.log(defauts ? `\n${defauts} DÉFAUT(S)` : '\nCONFORME');
await nav.close();
