/*
  Le demarrage connecte : les trophees ne doivent pas se calculer avant build().

  CE QUE CE BANC A ATTRAPE
  Quatre « TypeError: Cannot read properties of undefined (reading 'values') » a chaque
  chargement, en production depuis longtemps : statsFor() lisait me._active, que seul build()
  pose. renderResults() differe build() d'une frame (requestAnimationFrame) et les snapshots
  Firestore votes, reactions et photos arrivent par le meme flux que members, donc dans la MEME
  tache : ils appelaient renderTrophies() alors que state.people venait d'etre remplace et que
  personne n'avait encore son _active. Trois erreurs. La quatrieme est _detectTrophyEventsCore,
  declenche par un setTimeout 12,5 s apres le chargement : un timer tourne meme quand la frame
  n'est jamais venue - onglet en arriere-plan, fenetre masquee - et build() non plus.
  Mesure du 2026-09-27 : 3 erreurs en marche normale, 4 avec les frames gelees. Zero depuis.

  COMMENT IL FAIT TOURNER L'APP SANS COMPTE
  Firebase est bouchonne (tools/verif/bouchons/) et branche par une importmap : app.js importe
  ses modules depuis gstatic, l'importmap redirige ces trois URL vers les bouchons. Le banc
  decide alors qui se connecte et dans quel ordre les snapshots arrivent. Rien ne sort sur le
  reseau, aucun compte, et les ecritures sont comptees au lieu de partir dans la vraie ligue.

  DEUX PIEGES QUI M'ONT COUTE DU TEMPS
  - index.html n'a pas de balise <head> : le mot n'apparait que dans un commentaire, et une
    premiere version du banc a injecte son importmap DANS ce commentaire. Rien ne le signalait :
    la page se chargeait, app.js ne demarrait pas, et le banc attendait des bouchons qui
    n'arrivaient jamais. L'ancre est donc le charset, et sa position est verifiee.
  - le service worker du site sert un app.js en cache : le banc mesurerait un autre fichier que
    celui du disque. Il est bloque au niveau du contexte.

  Un serveur http local est indispensable : sous file://, un module ES et une importmap sont
  refuses par le navigateur (origine opaque). Les autres bancs, eux, n'ont que du script inline.
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { RACINE, rapport } from './_banc.mjs';

export const nom = 'trophees';
export const titre = 'Trophees au demarrage';
export const quoi = 'aucune erreur quand les snapshots arrivent avant la frame de build()';

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const LIGUE = 'leagues/merlin-bird/';

// Deux membres, quelques especes : de quoi debloquer un trophee et avoir un classement.
const MEMBRES = [
  { id: 'uid-moi', data: { name: 'Moi', joinedAt: { seconds: 1 }, species: [
      { k: 'merle noir', c: 'Merle noir', s: 'Turdus merula', d: '2025-01-02', l: 'Paris', f: true, co: 'FR', a: 1 },
      { k: 'chouette hulotte', c: 'Chouette hulotte', s: 'Strix aluco', d: '2025-01-03', l: 'Paris', f: true, co: 'FR', a: 2 },
      { k: 'buse variable', c: 'Buse variable', s: 'Buteo buteo', d: '2025-01-04', l: 'Paris', f: true, co: 'FR', a: 3 } ] } },
  { id: 'uid-autre', data: { name: 'Autre', joinedAt: { seconds: 2 }, species: [
      { k: 'merle noir', c: 'Merle noir', s: 'Turdus merula', d: '2025-02-02', l: 'Lyon', f: true, co: 'FR', a: 4 } ] } }
];

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.html': 'text/html' };

function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: {
    [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js',
    [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js',
    [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  // L'importmap doit preceder tout module. Ancre : le charset - voir l'entete pour le piege.
  const ancre = '<meta charset="utf-8">';
  if(!html.includes(ancre)) throw new Error('ancre introuvable dans index.html : ' + ancre);
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  if(!/^[\s\S]{0,400}importmap/.test(html)) throw new Error('importmap posee trop loin dans la page');
  // Une seule version d'app.js : celle du disque, sans son numero de cache.
  return html.replace(/app\.js\?v=\d+/g, 'app.js');
}

function serveur(){
  const s = createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const envoyer = (corps, type) => { res.writeHead(200, { 'content-type': type + '; charset=utf-8' }); res.end(corps); };
    try{
      if(u === '/' || u === '/index.html') return envoyer(pageHtml(), 'text/html');
      if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'tools', 'verif', u.slice(1))), 'text/javascript');
      const f = join(RACINE, u.replace(/^\/+/, ''));
      if(!existsSync(f)){ res.writeHead(404); return res.end('rien'); }
      return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
    }catch(e){ res.writeHead(500); res.end(String(e.message)); }
  });
  return s;
}

/*
  Joue un chargement complet et rend ses chiffres.
  geler : requestAnimationFrame ne rend plus la main, exactement ce que fait un onglet en
  arriere-plan. build() n'a alors JAMAIS tourne, et on voit ce que devient la detection de
  trophees, qui part sur un setTimeout - un timer, lui, tourne sans frame.
*/
async function jouer(navigateur, { geler }){
  // serviceWorkers bloques : sinon le SW du site sert un app.js en cache (voir l'entete).
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
  // Horloge pilotee : la detection attend 10 s apres le chargement puis 2 s de debounce. On
  // avance le temps au lieu de l'attendre, sinon le banc durerait 14 s a lui seul.
  await ctx.clock.install();
  const page = await ctx.newPage();
  if(geler) await page.addInitScript(() => {
    const file = [];
    window.requestAnimationFrame = cb => file.push(cb);
    window.__frames = { taille: () => file.length,
                        liberer(){ for(const f of file.splice(0)) f(0); } };
  });
  const horsCallback = [];
  page.on('pageerror', e => horsCallback.push(String(e.stack || e).split('\n').slice(0, 3).join(' | ')));
  // Avancer le temps fait tourner les timers de la page : une exception non rattrapee dans l'un
  // d'eux remonte jusqu'ici et ferait rater le banc sans un seul chiffre. On la compte comme la
  // console du navigateur le ferait, et on continue - c'est exactement ce que l'app fait.
  const avancer = async ms => {
    try{ await ctx.clock.runFor(ms); }
    catch(e){ horsCallback.push(String((e && e.message) || e).split('\n')[0]); }
  };

  const srv = serveur();
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  try{
    await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 15000 });

    // 1. Connexion : app.js s'abonne a tout.
    await page.evaluate(() => window.__auth.connecter('uid-moi'));
    // 2. Les snapshots dans la MEME tache, members d'abord : c'est le cas reel, ils arrivent par
    //    le meme flux, donc avant la frame ou renderResults() fait son build().
    const touches = await page.evaluate(m => ({
      members: window.__fs.livrer('leagues/merlin-bird/members', m),
      votes: window.__fs.livrer('leagues/merlin-bird/votes', []),
      reactions: window.__fs.livrer('leagues/merlin-bird/reactions', []),
      photos: window.__fs.livrer('leagues/merlin-bird/photos', []),
      trophyEvents: window.__fs.livrer('leagues/merlin-bird/trophyEvents', [])
    }), MEMBRES);
    // 3. Le temps passe : le timer de _detectTrophyEvents tombe (10 s de grace + 2 s).
    await avancer(14000);
    // 4. La frame arrive enfin (ou pour la premiere fois, en mode gele). On laisse passer de quoi
    //    couvrir le debounce de 2 s de la detection, qui se represente tant que build() n'a pas
    //    tourne : c'est apres cette frame qu'elle doit enfin aller au bout.
    if(geler) await page.evaluate(() => window.__frames.liberer());
    await avancer(5000);

    // 5. Les trophees s'affichent-ils quand on ouvre l'onglet ?
    await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
    await avancer(500);

    const vu = await page.evaluate(() => ({
      erreurs: window.__erreurs,
      cartes: document.querySelectorAll('#trophyGrid [class*="tro-"]').length,
      resume: (document.getElementById('trophySummary')?.textContent || '').trim(),
      // La detection ecrit son point de comparaison dans localStorage : s'il est la, elle est
      // allee au bout. Une garde qui la bloquerait pour toujours se verrait ici.
      comp: (() => { try{ const s = localStorage.getItem('mb-comp-state');
                          return s ? Object.keys(JSON.parse(s).unlocked || {}).length : 0; }catch(_){ return 0; } })()
    }));
    return { ...vu, touches, horsCallback };
  }finally{
    await ctx.close();
    srv.close();
  }
}

export async function mesure({ navigateur }){
  const r = rapport();
  for(const geler of [false, true]){
    const quand = geler ? 'frames gelees' : 'marche normale';
    const m = await jouer(navigateur, { geler });
    const abonnes = Object.values(m.touches).filter(n => n > 0).length;
    r.note(quand);
    r.verif('  snapshots livres a un abonne', abonnes + ' / 5', abonnes === 5);
    r.verif('  erreurs dans les callbacks', m.erreurs.length, m.erreurs.length === 0);
    for(const e of m.erreurs) r.note('    ' + e.chemin + ' : ' + e.pile.replace(/http:\/\/127\.0\.0\.1:\d+\//g, ''));
    r.verif('  erreurs hors callbacks', m.horsCallback.length, m.horsCallback.length === 0);
    for(const e of m.horsCallback) r.note('    ' + e.replace(/http:\/\/127\.0\.0\.1:\d+\//g, ''));
    r.verif('  cartes de trophees rendues', m.cartes, m.cartes > 100);
    r.verif('  resume', m.resume.replace(/^.*?bloqu\S* /, ''), /d.bloqu. \d+ troph/.test(m.resume));
    r.verif('  detection allee au bout', m.comp + ' joueur(s) compares', m.comp === MEMBRES.length);
  }
  r.note('(avant le correctif du 2026-09-27 : 3 erreurs en marche normale, 4 frames gelees)');
  return r.rendu();
}
