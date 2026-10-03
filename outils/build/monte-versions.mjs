#!/usr/bin/env node
/*
  monte-versions.mjs - les trois numeros a monter avant tout commit qui touche app.js,
  styles.css ou index.html. En oublier un ne casse rien tout de suite, ce qui est pire :
  les visiteurs gardent l'ancienne version en cache.

      node outils/build/monte-versions.mjs                 monte de 1
      node outils/build/monte-versions.mjs mon-libelle     et date le cache avec ce libelle

  Les DEUX occurrences de app.js?v= dans index.html sont traitees, pas seulement la premiere :
  le modulepreload et le script. Une premiere version de ce script decoupait sur \r\n en dur
  et n'en voyait qu'une - le depot MELANGE les fins de ligne, app.js en CRLF, index.html et
  service-worker.js en LF. On detecte le separateur, on ne le suppose pas.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const libelle = (process.argv[2] || 'maj').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const separateur = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

// index.html : app.js?v=N -> N+1, partout.
const html = join(RACINE, 'index.html');
const brutHtml = readFileSync(html, 'utf8');
const sepHtml = separateur(brutHtml);
const actuel = brutHtml.match(/app\.js\?v=(\d+)/);
if(!actuel){ console.error('DEFAUT : aucun app.js?v= dans index.html'); process.exit(1); }
const avant = parseInt(actuel[1], 10), apres = avant + 1;

const lignesHtml = brutHtml.split(sepHtml);
let touchees = 0;
for(let i = 0; i < lignesHtml.length; i++){
  while(lignesHtml[i].includes('app.js?v=' + avant)){
    lignesHtml[i] = lignesHtml[i].replace('app.js?v=' + avant, 'app.js?v=' + apres);
    touchees++;
  }
}
if(touchees !== 2){ console.error('DEFAUT : ' + touchees + ' occurrence(s) au lieu de 2'); process.exit(1); }
writeFileSync(html, lignesHtml.join(sepHtml), 'utf8');

// service-worker.js : vNNN-AAAA-MM-JJ-libelle.
const sw = join(RACINE, 'service-worker.js');
const brutSw = readFileSync(sw, 'utf8');
const sepSw = separateur(brutSw);
const lignesSw = brutSw.split(sepSw);
const i = lignesSw.findIndex((l) => l.startsWith('const CACHE_VERSION = '));
if(i < 0){ console.error('DEFAUT : CACHE_VERSION introuvable'); process.exit(1); }
const vSw = (lignesSw[i].match(/v(\d+)-/) || [])[1];
// Date LOCALE : toISOString() rend l'UTC et datait la version de la veille en soiree.
const d = new Date();
const jour = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
lignesSw[i] = "const CACHE_VERSION = 'v" + (parseInt(vSw || '0', 10) + 1) + '-' + jour + '-' + libelle + "';";
writeFileSync(sw, lignesSw.join(sepSw), 'utf8');

console.log('app.js?v=' + avant + ' -> ' + apres + ' (' + touchees + ' occurrences)');
console.log(lignesSw[i]);
