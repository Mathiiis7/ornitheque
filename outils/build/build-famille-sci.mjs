#!/usr/bin/env node
/*
  build-famille-sci.mjs

  Genere FAMILLE_SCI dans app.js : intitule de famille du Birdydex -> nom scientifique de
  la famille, mis en forme francaise (Calcariidae -> Calcariidés). Le Birdydex l'affiche a
  droite du titre, pour qu'un intitule d'usage (« Plectrophanes et Bruants des neiges »)
  garde son nom savant (demande de Mathis le 2026-10-12).

  On croise GENUS_FAMILY et FAMILY_EN_TO_FR, tels qu'ils sont dans app.js, avec le champ
  familySciName de la taxonomie eBird. Mesure du 2026-10-12 : 249 intitules sur 251 ne
  couvrent qu'une famille ; « Océanites » en couvre deux (Oceanitidae et Hydrobatidae),
  « Autres » ramasse les hybrides et les « sp. », sans famille propre.

  Usage :
    node outils/build/build-famille-sci.mjs
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EBIRD_API_KEY as EBIRD_KEY } from './cle-ebird.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const APP_JS = path.join(path.resolve(__dir, '..', '..'), 'app.js');

let app = fs.readFileSync(APP_JS, 'utf8');
const NL = app.includes('\r\n') ? '\r\n' : '\n';

// Les deux tables telles que l'appli s'en sert
const ligneGenre = app.split(/\r?\n/).find(l => l.startsWith('const GENUS_FAMILY = '));
const GENUS_FAMILY = JSON.parse(ligneGenre.slice('const GENUS_FAMILY = '.length).replace(/;\s*$/, ''));
const debut = app.indexOf('const FAMILY_EN_TO_FR');
const FAMILY_EN_TO_FR = new Function(app.slice(debut, app.indexOf('};', debut) + 2)
  .replace(/const FAMILY_EN_TO_FR\s*=/, 'return'))();
const familyOf = sci => {
  const raw = GENUS_FAMILY[sci.split(' ')[0].toLowerCase()] || 'Autres';
  return FAMILY_EN_TO_FR[raw] || raw;
};

console.log('Taxonomie eBird...');
const r = await fetch('https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json', {
  headers: { 'X-eBirdApiToken': EBIRD_KEY }
});
if(!r.ok){ console.error('HTTP', r.status); process.exit(1); }
const taxa = await r.json();

// Intitule -> familles scientifiques, dans l'ordre ou eBird les rencontre
const parIntitule = new Map();
for(const t of taxa){
  if(t.category !== 'species' || !t.familySciName) continue;
  const fr = familyOf(t.sciName);
  if(fr === 'Autres') continue;
  if(!parIntitule.has(fr)) parIntitule.set(fr, []);
  const l = parIntitule.get(fr);
  if(!l.includes(t.familySciName)) l.push(t.familySciName);
}

// Mise en forme francaise : -idae -> -idés, et un e en fin de syllabe ouverte prend
// l'accent aigu (Ardeidae -> Ardéidés, Emberizidae -> Embérizidés), comme dans l'usage.
// Une syllabe est ouverte quand le e est suivi d'une voyelle autre que u (eu), ou d'une
// seule consonne (ch, ph, th, qu comptent pour une), ou d'une consonne suivie de r ou l.
const VOY = 'aeiouy';
function franciser(lat){
  let s = lat.replace(/idae$/, 'idés');
  if(s === lat) s = lat.replace(/ae$/, 'és');
  let out = '';
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(c !== 'e' || i === 0){ out += c; continue; }
    const suite = s.slice(i + 1).toLowerCase();
    const a = suite[0], b = suite[1], c2 = suite[2];
    let ouverte = false;
    if(a && VOY.includes(a) && a !== 'u') ouverte = true;
    else if(a && !VOY.includes(a) && a !== 'é'){
      const digraphe = /^(ch|ph|th|qu)/.test(suite);
      const apres = digraphe ? c2 : b;
      if(apres && (VOY.includes(apres) || apres === 'é')) ouverte = true;
      else if(!digraphe && (b === 'r' || b === 'l') && a !== b && 'bcdfgkpt'.includes(a)
        && c2 && VOY.includes(c2)) ouverte = true;
    }
    // ae et oe a l'interieur d'un mot latin se lisent é : pas d'accent sur leur e
    if(i > 0 && 'ao'.includes(s[i - 1].toLowerCase())) ouverte = false;
    out += ouverte ? 'é' : 'e';
  }
  return out;
}

const table = {};
for(const [fr, fams] of parIntitule) table[fr] = fams.map(franciser).join(', ');

const ligne = 'const FAMILLE_SCI = ' + JSON.stringify(table) + ';';
const rx = /^const FAMILLE_SCI = .*$/m;
if(rx.test(app)) app = app.replace(rx, ligne);
else {
  // Juste apres FAMILY_EN_TO_FR, qui sert a la meme chose
  const fin = app.indexOf('};', debut) + 2;
  app = app.slice(0, fin) + NL + '// Genere par outils/build/build-famille-sci.mjs' + NL + ligne + app.slice(fin);
}
fs.writeFileSync(APP_JS, app);
for(const [fr, sci] of Object.entries(table)) console.log(fr + '  ->  ' + sci);
console.log(Object.keys(table).length + ' intitules');
