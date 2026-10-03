#!/usr/bin/env node
/*
  verif-avant-fin.mjs - crochet Stop : empeche d annoncer un travail fini sans l avoir verifie.

  Quand une reponse se termine et qu app.js, index.html ou styles.css ont change (git status),
  ce script rejoue « node outils/verif/tous.mjs ». Si un banc sort en DEFAUT, il rend le code 2 :
  Claude Code refuse alors de s arreter et relit le message ecrit sur stderr.

  POURQUOI TOUT REJOUER, ET PAS SEULEMENT LES BANCS DU FICHIER TOUCHE
  Mesure du 2026-09-29 : les 9 bancs prennent 11,5 s en tout. Sous les 30 s au-dela desquels un
  crochet devient penible, donc aucune raison de deviner quel banc concerne quel fichier - et
  deviner ferait rater la regression a distance, celle qu une classe partagee provoque ailleurs.

  DEUXIEME PASSAGE
  Apres un blocage, Claude Code rappelle le crochet avec stop_hook_active a true. On sort 0 :
  sinon la conversation ne pourrait plus jamais se terminer.

  CE QUI EST ENVOYE
  Pas toute la sortie des bancs - seules les lignes en DEFAUT, avec le nom de leur banc et la
  section ou elles tombent. Une sortie complete fait dix ecrans dont trois lignes comptent.
*/
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// La racine se deduit de l emplacement du script (.claude/hooks/), jamais du repertoire
// courant : un crochet peut etre lance depuis ailleurs.
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Les trois fichiers servis tels quels : eux seuls changent ce que voit un visiteur.
const SURVEILLES = ['app.js', 'index.html', 'styles.css'];

const COULEURS = /\u001b\[[0-9;]*m/g;

function entree(){
  try{ return JSON.parse(readFileSync(0, 'utf8')); }
  catch(_){ return {}; }
}

// git status --porcelain : deux caracteres d etat, puis le chemin. Un renommage s ecrit
// « ancien -> nouveau » et c est la destination qui compte ; un chemin a espaces vient
// entoure de guillemets.
function fichiersChanges(){
  let brut = '';
  try{ brut = execFileSync('git', ['status', '--porcelain'], { cwd: RACINE, encoding: 'utf8' }); }
  catch(_){ return []; }
  const vus = [];
  for(const ligne of brut.split(/\r?\n/)){
    if(!ligne.trim()) continue;
    let chemin = ligne.slice(3).trim();
    const fleche = chemin.indexOf(' -> ');
    if(fleche >= 0) chemin = chemin.slice(fleche + 4).trim();
    chemin = chemin.replace(/^"/, '').replace(/"$/, '');
    if(SURVEILLES.includes(chemin) && !vus.includes(chemin)) vus.push(chemin);
  }
  return vus;
}

/*
  Les lignes utiles de la sortie des bancs. Le decoupage tient a l indentation, pas au tiret de
  l entete : tous.mjs prefixe de deux espaces tout ce qu un banc imprime, et laisse en marge
  gauche les entetes de banc et le total final.
*/
function lignesUtiles(texte){
  const lignes = texte.replace(COULEURS, '').split(/\r?\n/);
  const blocs = new Map();
  let banc = '(avant le premier banc)';
  let section = null, sectionDite = null, total = '';

  for(const ligne of lignes){
    if(!ligne.trim()) continue;
    if(!/^\s/.test(ligne)){
      if(/banc\(s\)/.test(ligne) || /bancs sont conformes/.test(ligne)){ total = ligne.trim(); continue; }
      banc = ligne.split(' — ')[0].trim();
      section = sectionDite = null;
      continue;
    }
    const nu = ligne.trim();
    // Le verdict d un banc - CONFORME, DEFAUT, « 3 DEFAUT(S) » - n apprend rien que le total
    // final ne dise deja : le garder ferait remonter sa section avec lui, pour rien.
    if(/^(CONFORME|DEFAUT|DÉFAUT|\d+ DEFAUT\(S\))$/.test(nu)) continue;
    const rate = /DEFAUT$/.test(nu) || /DÉFAUT$/.test(nu)
      || nu.startsWith('le banc n a pas rendu son verdict')
      || nu.startsWith('erreur de page');
    // Une ligne ni ok ni DEFAUT est un commentaire de section (note()) : on la garde de cote
    // pour situer la panne, et on ne l imprime que si une panne suit.
    if(!rate){
      if(!/\bok$/.test(nu)){ section = nu; sectionDite = false; }
      continue;
    }
    if(!blocs.has(banc)) blocs.set(banc, []);
    const bloc = blocs.get(banc);
    if(section && !sectionDite){ bloc.push('  [' + section + ']'); sectionDite = true; }
    bloc.push('  ' + nu);
  }

  const sortie = [];
  for(const [nom, bloc] of blocs){
    sortie.push('banc ' + nom + ' :');
    const garde = bloc.slice(0, 12);
    sortie.push(...garde);
    if(bloc.length > garde.length) sortie.push('  … et ' + (bloc.length - garde.length) + ' autre(s) ligne(s)');
  }
  if(total) sortie.push('', total);
  return sortie.join('\n');
}

const json = entree();

// Deuxieme passage : on laisse finir, sinon la reponse ne se termine jamais.
if(json.stop_hook_active === true) process.exit(0);

const changes = fichiersChanges();
if(!changes.length) process.exit(0);

const res = spawnSync(process.execPath, [join(RACINE, 'outils', 'verif', 'tous.mjs')],
  { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

if(res.status === 0) process.exit(0);

const message = [];
message.push('Travail non vérifié. Fichiers modifiés : ' + changes.join(', ') + '.');
message.push(res.status === 1
  ? 'node outils/verif/tous.mjs sort en défaut :'
  : 'node outils/verif/tous.mjs ne s\'est pas terminé normalement (code ' + res.status + ') :');
message.push('');

const utiles = lignesUtiles(String(res.stdout || ''));
if(utiles) message.push(utiles);
else {
  const fin = String(res.stderr || res.stdout || '').replace(COULEURS, '').trimEnd().split(/\r?\n/).slice(-15);
  message.push('sortie brute (fin) :', ...fin);
}

// Le banc demo compare demo/index.html a index.html : quand il tombe, c est souvent que le
// generateur n a pas ete repasse.
if(changes.includes('index.html')){
  message.push('', 'index.html a changé : repasser aussi « node outils/build/genere-demo.mjs ».');
}
message.push('', 'Rejouer : node outils/verif/tous.mjs');

process.stderr.write(message.join('\n') + '\n');
process.exit(2);
