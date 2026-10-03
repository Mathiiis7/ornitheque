#!/usr/bin/env node
/*
  poids-tables.mjs - ce que pese chaque grande table d'app.js, en brut et en gzip.

  POURQUOI CE SCRIPT
  « Avant de sortir une autre table, mesurer » : le gain est dans l'octet telecharge avant le
  premier rendu, pas dans le temps d'analyse - creer 1,87 Mo en memoire ne coute que 29 ms.
  La seule colonne qui compte pour decider est donc GZIP, la taille reellement servie.

      node outils/build/poids-tables.mjs           les tables de plus de 10 Ko
      node outils/build/poids-tables.mjs 50        seuil en Ko

  Une constante d'app.js tient sur une seule ligne quand elle est generee : on releve donc
  « const NOM = ... ; » ligne par ligne, ce qui evite d'analyser 2,4 Mo de JavaScript.
  Le gzip est mesure sur la table SEULE, ce qui surestime un peu son cout reel : sortie du
  fichier, elle se compresserait un peu moins bien qu'au milieu du reste. C'est le bon sens
  de l'erreur - on ne surestimera pas le gain.
*/
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SEUIL = (parseInt(process.argv[2], 10) || 10) * 1024;

const src = readFileSync(join(RACINE, 'app.js'), 'utf8');
const lignes = src.split(/\r?\n/);

const tables = [];
for(let i = 0; i < lignes.length; i++){
  const l = lignes[i];
  if(Buffer.byteLength(l, 'utf8') < SEUIL) continue;
  const m = l.match(/^\s*(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/);
  tables.push({
    nom: m ? m[1] : '(ligne ' + (i + 1) + ', sans nom)',
    ligne: i + 1,
    brut: Buffer.byteLength(l, 'utf8'),
    gzip: gzipSync(Buffer.from(l, 'utf8'), { level: 6 }).length,
  });
}
tables.sort((a, b) => b.gzip - a.gzip);

const ko = (n) => (n / 1024).toFixed(0).padStart(6) + ' Ko';
const totalFichier = Buffer.byteLength(src, 'utf8');
const totalGzip = gzipSync(Buffer.from(src, 'utf8'), { level: 6 }).length;

console.log('app.js : ' + ko(totalFichier) + ' brut, ' + ko(totalGzip) + ' servi en gzip');
console.log('');
console.log('table'.padEnd(42) + 'ligne'.padStart(7) + 'brut'.padStart(10) + 'gzip'.padStart(10) + '  % du gzip');
let sommeBrut = 0, sommeGzip = 0;
for(const t of tables){
  sommeBrut += t.brut; sommeGzip += t.gzip;
  console.log(t.nom.slice(0, 41).padEnd(42) + String(t.ligne).padStart(7) +
    ko(t.brut) + ko(t.gzip) + (100 * t.gzip / totalGzip).toFixed(1).padStart(9) + ' %');
}
console.log('');
console.log(tables.length + ' tables : ' + ko(sommeBrut) + ' brut, ' + ko(sommeGzip) +
  ' gzip, soit ' + (100 * sommeGzip / totalGzip).toFixed(0) + ' % de ce qui est servi.');
console.log('Le reste du code : ' + ko(totalGzip - sommeGzip) + ' gzip.');
