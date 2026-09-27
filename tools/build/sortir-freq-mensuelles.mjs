#!/usr/bin/env node
/*
  sortir-freq-mensuelles.mjs - Sort d'app.js les 47 tables REAL_FREQ_MONTHLY_XX des pays
  etrangers et les rassemble dans data/freq_monthly_pays.json.

  POURQUOI. Ces 47 tables pesaient 1871 Ko, soit 37 % d'app.js, et le navigateur devait
  les analyser avant de peindre le premier pixel : 770 ms mesurees le 2026-09-27 sur un
  ordinateur de bureau, trois a cinq fois plus sur telephone. Le fichier commun est charge
  en tache de fond une fois la page affichee. Le volume telecharge ne baisse pas, c'est le
  temps d'analyse au demarrage qu'on recupere.

  UN SEUL FICHIER, ET NON UN PAR PAYS. Le selecteur de pays affiche, pour l'espece ouverte,
  sa frequence dans chacun des 48 pays : il les veut toutes a la fois. Un fichier par pays
  aurait fait 47 requetes a chaque ouverture.

  LA FRANCE RESTE EN DUR. REAL_FREQ_MONTHLY, sans suffixe, est lue directement a quatre
  endroits du code sans passer par COUNTRIES_REG, et c'est le pays par defaut.

  Idempotent : relance sans effet si les tables sont deja sorties.

  Usage : node tools/build/sortir-freq-mensuelles.mjs [--verifier]
          --verifier : ne reecrit rien, dit seulement ce qui serait fait.
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const APP = join(RACINE, 'app.js');
const SORTIE = join(RACINE, 'data', 'freq_monthly_pays.json');
const VERIF = process.argv.includes('--verifier');

const brut = readFileSync(APP, 'utf8');
const crlf = brut.includes('\r\n');
const lignes = brut.split(/\r?\n/);

// 1. Reperer les declarations et les references du registre.
const DECL = /^\s*(?:const|let|var)\s+REAL_FREQ_MONTHLY_([A-Z]{2})\s*=\s*(\{.*\})\s*;\s*$/;
const REF  = /^(\s*)monthly:\s*\(\)\s*=>\s*\(typeof REAL_FREQ_MONTHLY_([A-Z]{2}) !== 'undefined'\) \? REAL_FREQ_MONTHLY_\2 : \{\},\s*$/;

const tables = {};
const aSupprimer = new Set();
const aReecrire = new Map();          // index de ligne -> nouvelle ligne
let octetsLiberes = 0;

lignes.forEach((l, i) => {
  const d = l.match(DECL);
  if (d) {
    let obj;
    try { obj = JSON.parse(d[2]); }
    catch (e) {
      console.error('ARRET : la table ' + d[1] + ' (ligne ' + (i + 1) + ') n est pas du JSON : ' + e.message);
      process.exit(1);
    }
    tables[d[1]] = obj;
    aSupprimer.add(i);
    octetsLiberes += Buffer.byteLength(l, 'utf8') + 1;
    return;
  }
  const r = l.match(REF);
  if (r) aReecrire.set(i, r[1] + "monthly: () => _FREQ_MENSUELLE_PAYS['" + r[2] + "'] || {},");
});

const pays = Object.keys(tables).sort();
if (!pays.length) {
  console.log('Aucune table REAL_FREQ_MONTHLY_XX dans app.js : deja sorties, rien a faire.');
  process.exit(0);
}

// 2. Garde-fous : une table sans sa reference, ou l inverse, casserait le registre.
const ccRef = new Set([...aReecrire.values()].map(l => l.match(/'([A-Z]{2})'/)[1]));
const sansRef = pays.filter(cc => !ccRef.has(cc));
const sansTable = [...ccRef].filter(cc => !tables[cc]);
if (sansRef.length || sansTable.length) {
  console.error('ARRET : correspondance rompue entre tables et registre.');
  if (sansRef.length) console.error('  tables sans reference : ' + sansRef.join(', '));
  if (sansTable.length) console.error('  references sans table : ' + sansTable.join(', '));
  process.exit(1);
}

// 3. Compter les especes, pour verifier apres coup qu on n a rien perdu.
let especes = 0;
for (const cc of pays) especes += Object.keys(tables[cc]).length;

console.log(pays.length + ' pays, ' + especes + ' series mensuelles, ' +
            Math.round(octetsLiberes / 1024) + ' Ko retires d app.js');
console.log('Pays : ' + pays.join(' '));

if (VERIF) { console.log('\n--verifier : rien n a ete ecrit.'); process.exit(0); }

// 4. Ecrire le fichier de donnees. Pas d indentation : il est lu par la machine, et
// 1871 Ko n ont pas besoin de le devenir davantage.
const ordonne = {};
for (const cc of pays) ordonne[cc] = tables[cc];
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(ordonne), 'utf8');

// 5. Reecrire app.js.
const sorties = [];
lignes.forEach((l, i) => {
  if (aSupprimer.has(i)) return;
  sorties.push(aReecrire.has(i) ? aReecrire.get(i) : l);
});
writeFileSync(APP, sorties.join(crlf ? '\r\n' : '\n'), 'utf8');

const avant = Buffer.byteLength(brut, 'utf8');
const apres = Buffer.byteLength(readFileSync(APP, 'utf8'), 'utf8');
const ko = n => Math.round(n / 1024) + ' Ko';
console.log('');
console.log('Ecrit ' + SORTIE + ' : ' + ko(Buffer.byteLength(JSON.stringify(ordonne), 'utf8')));
console.log('app.js : ' + ko(avant) + ' -> ' + ko(apres) + '  (' +
            Math.round(100 * (avant - apres) / avant) + ' % en moins)');
console.log(aReecrire.size + ' lignes du registre reecrites vers _FREQ_MENSUELLE_PAYS.');
