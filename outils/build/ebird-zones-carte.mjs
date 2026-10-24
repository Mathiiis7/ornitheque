#!/usr/bin/env node
/*
  ebird-zones-carte.mjs - Les codes des zones d'eBird que la Carte peut appeler, pays par pays :
  subnational1, et subnational2 pour le Royaume-Uni (dont la Carte montre les comtés). Lus par le
  relais, écrits dans outils/config/ebird-zones-carte.json, que simplify-regions-multi.mjs --carte
  lit pour écarter tout morceau de Natural Earth qu'eBird ne connaît pas (2026-10-24).

  Usage : node outils/build/ebird-zones-carte.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RELAIS = 'https://ornitheque-relais.vercel.app/v2/';
const SORTIE = join(__dir, '..', 'config', 'ebird-zones-carte.json');
// Les pays que traite simplify-regions-multi.mjs (sa table ADM0).
const src = readFileSync(join(__dir, 'simplify-regions-multi.mjs'), 'utf8');
const adm0 = src.slice(src.indexOf('const ADM0 = {'), src.indexOf('};', src.indexOf('const ADM0 = {')));
const PAYS = [...new Set([...adm0.matchAll(/\b([A-Z]{2}):'[A-Z]{3}'/g)].map(m => m[1]))];
const NIVEAU2 = new Set(['GB']);

const lire = async chemin => {
  const r = await fetch(RELAIS + chemin, { headers: { Origin: 'https://mathiiis7.github.io' } });
  if(!r.ok) throw new Error(chemin + ' : ' + r.status);
  return r.json();
};
const out = {};
for(const cc of PAYS){
  const niveau = NIVEAU2.has(cc) ? 'subnational2' : 'subnational1';
  out[cc] = (await lire(`ref/region/list/${niveau}/${cc}`)).map(z => z.code);
  console.log(cc, niveau, out[cc].length);
}
// Le Danemark : ses 13 zones se dessinent avec les 98 communes de geoBoundaries, qu'on rattache par
// leur nom aux communes d'eBird, dont le code nomme la zone parente (DK-07-01 dépend de DK-07).
out._communesDK = (await lire('ref/region/list/subnational2/DK')).map(z => [z.code, z.name]);
console.log('DK communes eBird', out._communesDK.length);
writeFileSync(SORTIE, JSON.stringify(out));
console.log('->', SORTIE);
