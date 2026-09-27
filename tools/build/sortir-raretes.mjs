#!/usr/bin/env node
/*
  sortir-raretes.mjs - Sort d'app.js les tables REAL_RARITY_XX_EBIRD des pays etrangers et
  les rassemble dans data/rarity_pays.json. Jumeau de sortir-freq-mensuelles.mjs, meme
  raison : 443 Ko de moins a telecharger avant le premier affichage.

  DEUX TABLES RESTENT EN DUR.
  - REAL_RARITY (la France, sans suffixe) : une quinzaine d'endroits la lisent directement.
  - REAL_RARITY_ME_EBIRD (le Montenegro) : trois endroits anterieurs au registre la nomment
    en clair, dont deux sans garde `typeof`. La sortir aurait demande de reecrire du code
    metier pour 7 Ko.

  Idempotent : relance sans effet si les tables sont deja sorties.

  Usage : node tools/build/sortir-raretes.mjs [--verifier]
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const APP = join(RACINE, 'app.js');
const SORTIE = join(RACINE, 'data', 'rarity_pays.json');
const VERIF = process.argv.includes('--verifier');
const EN_DUR = new Set(['ME']);

const brut = readFileSync(APP, 'utf8');
const crlf = brut.includes('\r\n');
const lignes = brut.split(/\r?\n/);

const DECL = /^\s*(?:const|let|var)\s+REAL_RARITY_([A-Z]{2})_EBIRD\s*=\s*(\{.*\})\s*;\s*$/;
const REF  = /^(\s*)barTier:\s*\(\)\s*=>\s*\(typeof REAL_RARITY_([A-Z]{2})_EBIRD !== 'undefined'\) \? REAL_RARITY_\2_EBIRD : \{\},\s*$/;

const tables = {};
const aSupprimer = new Set();
const aReecrire = new Map();
let octets = 0;

lignes.forEach((l, i) => {
  const d = l.match(DECL);
  if (d) {
    if (EN_DUR.has(d[1])) return;                 // laissee sur place, volontairement
    let obj;
    try { obj = JSON.parse(d[2]); }
    catch (e) { console.error('ARRET : ' + d[1] + ' ligne ' + (i + 1) + ' n est pas du JSON : ' + e.message); process.exit(1); }
    tables[d[1]] = obj;
    aSupprimer.add(i);
    octets += Buffer.byteLength(l, 'utf8') + 1;
    return;
  }
  const r = l.match(REF);
  if (r && !EN_DUR.has(r[2])) aReecrire.set(i, r[1] + "barTier: () => _RARETE_PAYS['" + r[2] + "'] || {},");
});

const pays = Object.keys(tables).sort();
if (!pays.length) {
  console.log('Aucune table REAL_RARITY_XX_EBIRD a sortir : deja fait, rien a faire.');
  process.exit(0);
}

const ccRef = new Set([...aReecrire.values()].map(l => l.match(/'([A-Z]{2})'/)[1]));
const sansRef = pays.filter(cc => !ccRef.has(cc));
const sansTable = [...ccRef].filter(cc => !tables[cc]);
if (sansRef.length || sansTable.length) {
  console.error('ARRET : correspondance rompue entre tables et registre.');
  if (sansRef.length) console.error('  tables sans reference : ' + sansRef.join(', '));
  if (sansTable.length) console.error('  references sans table : ' + sansTable.join(', '));
  process.exit(1);
}

let especes = 0;
for (const cc of pays) especes += Object.keys(tables[cc]).length;
console.log(pays.length + ' pays, ' + especes + ' paliers, ' + Math.round(octets / 1024) + ' Ko retires');
console.log('Laissees en dur : ' + [...EN_DUR].join(', ') + ' (plus la France, sans suffixe)');

if (VERIF) { console.log('\n--verifier : rien n a ete ecrit.'); process.exit(0); }

const ordonne = {};
for (const cc of pays) ordonne[cc] = tables[cc];
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(ordonne), 'utf8');

const sorties = [];
lignes.forEach((l, i) => {
  if (aSupprimer.has(i)) return;
  sorties.push(aReecrire.has(i) ? aReecrire.get(i) : l);
});
writeFileSync(APP, sorties.join(crlf ? '\r\n' : '\n'), 'utf8');

const ko = n => Math.round(n / 1024) + ' Ko';
const avant = Buffer.byteLength(brut, 'utf8');
const apres = Buffer.byteLength(readFileSync(APP, 'utf8'), 'utf8');
console.log('');
console.log('Ecrit ' + SORTIE + ' : ' + ko(Buffer.byteLength(JSON.stringify(ordonne), 'utf8')));
console.log('app.js : ' + ko(avant) + ' -> ' + ko(apres));
console.log(aReecrire.size + ' lignes barTier reecrites vers _RARETE_PAYS.');
