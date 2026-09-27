/*
  Ce qu'une session connectee coute en lectures Firestore.

  POURQUOI CE BANC
  Le plan gratuit Firebase donne 50 000 lectures de documents par jour. C'est ce plafond qui
  cedera le premier si l'appli se democratise, bien avant la bande passante de GitHub Pages :
  mesure du 2026-09-27, une premiere visite pese 1 473 Ko servis, soit 71 000 premieres visites
  par mois dans les 100 Go de GitHub, quand 50 000 lectures par jour ne font que quelques
  milliers de sessions. Le nombre de lectures par session est donc le chiffre qui decide, et il
  ne se devine pas : il depend du nombre d'abonnements ouverts au demarrage.

  COMMENT FIRESTORE FACTURE
  A l'abonnement, CHAQUE document du premier snapshot compte une lecture. Ensuite, une lecture
  par document modifie. Deux onSnapshot sur le meme chemin coutent donc DEUX fois la collection,
  et c'est le gaspillage que ce banc cherche en premier. Un getDoc compte une lecture meme quand
  le document n'existe pas.

  CE QU'IL MESURE, ET CE QU'IL NE PEUT PAS MESURER
  Il mesure exactement la STRUCTURE : combien d'abonnements, sur quels chemins, combien de
  doublons, combien d'appels ponctuels, et si naviguer dans l'appli en ouvre d'autres. Il ne
  peut pas connaitre la taille reelle des collections de la vraie ligue - le banc ne la touche
  pas, c'est tout son objet. Il livre donc une ligue temoin de TAILLE connue et rend le cout
  en clair, a multiplier par la vraie taille.

  Meme montage que le banc trophees, dont il est copie : Firebase bouchonne
  (tools/verif/bouchons/), branche par une importmap, aucun reseau, aucun compte. Voir son
  entete pour les deux pieges du montage - l'ancre de l'importmap et le service worker.
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { RACINE, rapport } from './_banc.mjs';

export const nom = 'firestore';
export const titre = 'Lectures Firestore d une session';
export const quoi = 'aucun chemin abonne deux fois, et naviguer n ouvre pas d abonnement';

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const LIGUE = 'leagues/merlin-bird/';

// Ligue temoin de taille CONNUE : 10 membres, pour que le cout se lise en clair. Les vraies
// tailles sont a mettre a la place au moment de decider, elles se lisent dans la console
// Firebase.
const TAILLES = { members: 10, votes: 40, reactions: 60, photos: 25, trophyEvents: 15 };

function membres(n){
  const out = [];
  for(let i = 0; i < n; i++){
    out.push({ id: 'uid-' + i, data: { name: 'Joueur ' + i, joinedAt: { seconds: i + 1 }, species: [
      { k: 'merle noir', c: 'Merle noir', s: 'Turdus merula', d: '2025-01-02', l: 'Paris', f: true, co: 'FR', a: i * 3 + 1 },
      { k: 'buse variable', c: 'Buse variable', s: 'Buteo buteo', d: '2025-01-04', l: 'Paris', f: true, co: 'FR', a: i * 3 + 2 } ] } });
  }
  return out;
}

// Des documents quelconques : seule leur QUANTITE compte pour la facture.
function bourrage(n, prefixe){
  const out = [];
  for(let i = 0; i < n; i++) out.push({ id: prefixe + i, data: { uid: 'uid-' + (i % TAILLES.members), v: 1 } });
  return out;
}

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.html': 'text/html' };

function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: {
    [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js',
    [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js',
    [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  const ancre = '<meta charset="utf-8">';
  if(!html.includes(ancre)) throw new Error('ancre introuvable dans index.html : ' + ancre);
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  if(!/^[\s\S]{0,400}importmap/.test(html)) throw new Error('importmap posee trop loin dans la page');
  return html.replace(/app\.js\?v=\d+/g, 'app.js');
}

function serveur(){
  return createServer((req, res) => {
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
}

async function jouer(navigateur){
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
  await ctx.clock.install();
  const page = await ctx.newPage();
  const srv = serveur();
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  try{
    await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 15000 });

    // Avant connexion : ce qu'un simple visiteur non connecte coute deja.
    const avantConnexion = await page.evaluate(() => ({
      abonnements: window.__lectures.abonnements.slice(),
      ponctuelles: window.__lectures.ponctuelles.slice() }));

    await page.evaluate(() => window.__auth.connecter('uid-0'));

    // Les snapshots arrivent dans la meme tache, members d'abord : le cas reel.
    await page.evaluate(d => {
      window.__fs.livrer('leagues/merlin-bird/members', d.members);
      window.__fs.livrer('leagues/merlin-bird/votes', d.votes);
      window.__fs.livrer('leagues/merlin-bird/reactions', d.reactions);
      window.__fs.livrer('leagues/merlin-bird/photos', d.photos);
      window.__fs.livrer('leagues/merlin-bird/trophyEvents', d.trophyEvents);
    }, { members: membres(TAILLES.members), votes: bourrage(TAILLES.votes, 'v'),
         reactions: bourrage(TAILLES.reactions, 'r'), photos: bourrage(TAILLES.photos, 'p'),
         trophyEvents: bourrage(TAILLES.trophyEvents, 't') });

    try{ await ctx.clock.runFor(14000); }catch(_){}
    try{ await ctx.clock.runFor(5000); }catch(_){}

    const apresDemarrage = await page.evaluate(() => ({
      abonnements: window.__lectures.abonnements.slice(),
      ponctuelles: window.__lectures.ponctuelles.slice(),
      docsLivres: window.__lectures.docsLivres,
      ecritures: window.__ecritures.slice() }));

    // Naviguer : chaque onglet de l'appli, l'un apres l'autre. Un abonnement ouvert ici serait
    // paye a chaque changement de vue, donc plusieurs fois par session.
    const onglets = await page.evaluate(() => [...document.querySelectorAll('.tab[data-view]')].map(t => t.dataset.view));
    for(const v of onglets){
      await page.evaluate(x => document.querySelector('.tab[data-view="' + x + '"]')?.click(), v);
      try{ await ctx.clock.runFor(600); }catch(_){}
    }

    // Le temps reel, et c est la ou une appli qui marche devient chere : un seul document
    // modifie - quelqu un qui tape, qui arrive, qui poste - coute une lecture a CHAQUE
    // client connecte. Cout mesure ici pour UN client ; multiplier par le nombre de
    // connectes simultanes.
    const avantTempsReel = await page.evaluate(() => window.__lectures.docsLivres);
    await page.evaluate(() => {
      // UN seul document : une frappe de quelqu un d autre dans le chat.
      window.__fs.livrer('leagues/merlin-bird/typing', [{ id: 'uid-1', data: { at: 1 } }]);
    });
    try{ await ctx.clock.runFor(600); }catch(_){}
    const coutTempsReel = await page.evaluate(() => window.__lectures.docsLivres) - avantTempsReel;

    const apresNavigation = await page.evaluate(() => ({
      abonnements: window.__lectures.abonnements.slice(),
      ponctuelles: window.__lectures.ponctuelles.slice(),
      docsLivres: window.__lectures.docsLivres,
      ecritures: window.__ecritures.slice() }));

    return { avantConnexion, apresDemarrage, apresNavigation, onglets, coutTempsReel };
  }finally{
    await ctx.close();
    srv.close();
  }
}

export async function mesure({ navigateur }){
  const r = rapport();
  const m = await jouer(navigateur);
  const ab = m.apresDemarrage.abonnements;

  // Un chemin abonne plusieurs fois se paie autant de fois : c'est le gaspillage a trouver.
  const parChemin = new Map();
  for(const c of ab) parChemin.set(c, (parChemin.get(c) || 0) + 1);
  const doublons = [...parChemin].filter(([, n]) => n > 1);

  r.note('Visiteur non connecte');
  r.verif('  abonnements ouverts', m.avantConnexion.abonnements.length,
          m.avantConnexion.abonnements.length === 0);
  r.verif('  lectures ponctuelles', m.avantConnexion.ponctuelles.length,
          m.avantConnexion.ponctuelles.length === 0);

  r.note('Session connectee, ligue temoin de ' + TAILLES.members + ' membres');
  r.verif('  abonnements ouverts', ab.length, ab.length > 0);
  for(const [c, n] of parChemin) r.note('    ' + c.replace(LIGUE, '') + (n > 1 ? '  x' + n + ' <- paye ' + n + ' fois' : ''));
  r.verif('  chemins abonnes plus d une fois', doublons.length, doublons.length === 0);
  r.verif('  lectures ponctuelles (getDoc/getDocs)', m.apresDemarrage.ponctuelles.length,
          m.apresDemarrage.ponctuelles.length < 10);
  for(const p of m.apresDemarrage.ponctuelles) r.note('    ' + p.replace(LIGUE, ''));
  r.verif('  ecritures au demarrage (presence attendue)', m.apresDemarrage.ecritures.length,
          m.apresDemarrage.ecritures.length <= 1);
  for(const e of m.apresDemarrage.ecritures) r.note('    ' + e.replace(LIGUE, ''));

  const litDemarrage = m.apresDemarrage.docsLivres + m.apresDemarrage.ponctuelles.length;
  r.note('  documents lus au demarrage : ' + litDemarrage +
         ' (somme des collections livrees, doublons compris)');

  r.note('Navigation dans les ' + m.onglets.length + ' onglets');
  const nouveaux = m.apresNavigation.abonnements.slice(ab.length);
  for(const c of nouveaux) r.note('    abonnement ouvert en naviguant : ' + c.replace(LIGUE, ''));
  const enPlus = m.apresNavigation.ecritures.slice(m.apresDemarrage.ecritures.length);
  for(const e of enPlus) r.note('    ecriture en naviguant : ' + e.replace(LIGUE, ''));
  // Un abonnement ouvert a la demande, UNE seule fois, est un bon comportement : la vue le
  // demande quand on y entre. Ce qui serait fautif, c est de le rouvrir a chaque passage.
  r.verif('  abonnements ouverts en naviguant', nouveaux.length, nouveaux.length <= 1);
  const ponctuellesEnPlus = m.apresNavigation.ponctuelles.length - m.apresDemarrage.ponctuelles.length;
  r.verif('  lectures ponctuelles en plus', ponctuellesEnPlus, ponctuellesEnPlus === 0);
  const ecrituresEnPlus = enPlus.length;
  r.verif('  ecritures en naviguant', ecrituresEnPlus, ecrituresEnPlus <= 2);

  // Le chiffre qui sert a decider : combien de sessions le plan gratuit supporte.
  const PLAFOND = 50000;
  r.note('Ce que ca donne sur le plan gratuit (' + PLAFOND.toLocaleString('fr-FR') + ' lectures par jour)');
  r.note('  cout d une session       : ' + litDemarrage + ' lectures pour ' + TAILLES.members + ' membres');
  r.note('  sessions par jour        : ' + Math.floor(PLAFOND / Math.max(litDemarrage, 1)).toLocaleString('fr-FR'));
  r.note('Temps reel : un seul document modifie (une frappe dans le chat)');
  r.verif('  lectures chez UN client abonne', m.coutTempsReel, m.coutTempsReel === 1);
  r.note('  chaque client abonne paie la meme lecture, donc le cout suit le nombre de connectes :');
  for(const n of [10, 50, 200]){
    const parEvt = m.coutTempsReel * n;
    r.note('    ' + String(n).padStart(3) + ' connectes : ' + String(parEvt).padStart(3) +
           ' lectures par frappe, soit ' + Math.floor(PLAFOND / Math.max(parEvt, 1)).toLocaleString('fr-FR') +
           ' frappes par jour avant le plafond');
  }
  r.note('  a taille reelle, remplacer TAILLES en tete de ce banc par les vraies collections');
  return r.rendu();
}
