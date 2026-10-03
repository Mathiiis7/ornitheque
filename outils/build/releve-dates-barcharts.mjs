#!/usr/bin/env node
/*
  releve-dates-barcharts.mjs - Fige la date de telechargement de chaque bar chart dans
  dates-barcharts.json.

  POURQUOI
  Un bar chart ne dit nulle part jusqu'ou vont ses donnees. Or la derniere annee de sa
  fenetre est forcement incomplete, et savoir OU elle s'arrete est ce qui permet de
  ponderer honnetement les quinzaines (cf. annees-par-quinzaine.mjs). La seule trace
  disponible est la date du fichier - qu'un clone du depot ne conserverait pas. On la
  releve donc une fois et on la commet.

  Les dates deja presentes dans le fichier sont CONSERVEES : un re-telechargement met a
  jour les siennes, il n'efface pas la memoire des autres. Pour forcer, --tout.

  Usage : node outils/build/releve-dates-barcharts.mjs [--tout]
*/
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const BRUT = join(__dir, '..', 'ebird-barcharts-raw');
const SORTIE = join(__dir, 'dates-barcharts.json');
const TOUT = process.argv.includes('--tout');

const avant = existsSync(SORTIE) ? JSON.parse(readFileSync(SORTIE, 'utf8')) : {};
const apres = TOUT ? {} : { ...avant };
let ajoutes = 0, gardes = 0;
for(const f of readdirSync(BRUT)){
  if(!f.endsWith('.txt')) continue;
  if(apres[f]){ gardes++; continue; }
  apres[f] = statSync(join(BRUT, f)).mtime.toISOString().slice(0, 10);
  ajoutes++;
}
const tri = Object.fromEntries(Object.keys(apres).sort().map(k => [k, apres[k]]));
writeFileSync(SORTIE, JSON.stringify(tri, null, 1) + '\n');

const parDate = {};
for(const d of Object.values(tri)) parDate[d] = (parDate[d] || 0) + 1;
console.log(`${Object.keys(tri).length} bar charts dates (${ajoutes} releves, ${gardes} deja connus)`);
for(const d of Object.keys(parDate).sort()) console.log(`  ${d}  ${parDate[d]} fichiers`);
