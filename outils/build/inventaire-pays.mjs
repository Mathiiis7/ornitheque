#!/usr/bin/env node
/*
  inventaire-pays.mjs - Les pays qu'eBird connaît et que le site n'a pas encore, avec leurs zones.

  POURQUOI. Avant d'ajouter « tous les pays restants » (décision de Mathis, 2026-11-09), savoir
  combien ils sont, combien de zones ils comptent, et donc combien de temps prendra la récolte
  (5 s par page chez eBird, par courtoisie).

  Pays déjà présents : ceux qui ont data/countries/<cc>/freq_48.json.
  Sortie : outils/config/pays-a-ajouter.json = [{ cc, nom, zones: [codes] }], et un résumé à l'écran.
  Usage : node outils/build/inventaire-pays.mjs
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = readFileSync('C:/Users/mathi/Documents/.Renviron', 'utf8');
const CLE = process.env.EBIRD_API_KEY || (env.match(/^EBIRD_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
const api = async chemin => {
  const r = await fetch('https://api.ebird.org/v2/' + chemin, { headers: { 'X-eBirdApiToken': CLE } });
  if (!r.ok) throw new Error(chemin + ' : HTTP ' + r.status);
  return r.json();
};

const pays = await api('ref/region/list/country/world.json?locale=fr');
const restants = pays.filter(p => !existsSync(join(RACINE, 'data', 'countries', p.code.toLowerCase(), 'freq_48.json')));
const sortie = [];
for (const p of restants) {
  const zones = await api(`ref/region/list/subnational1/${p.code}.json`);
  // noms : ceux d'eBird, qui servent à apparier un contour quand le code ISO ne correspond pas.
  sortie.push({ cc: p.code, nom: p.name, zones: zones.map(z => z.code), noms: Object.fromEntries(zones.map(z => [z.code, z.name])) });
}
writeFileSync(join(RACINE, 'outils', 'config', 'pays-a-ajouter.json'), JSON.stringify(sortie, null, 1));
const nZones = sortie.reduce((a, p) => a + p.zones.length, 0);
console.log(`${pays.length} pays chez eBird, ${pays.length - restants.length} deja sur le site, ${restants.length} restants.`);
console.log(`${nZones} zones au total -> ${restants.length + nZones} pages de bar chart, ~${Math.round((restants.length + nZones) * 6 / 60)} min a 5 s par page.`);
console.log('Les plus decoupes :', [...sortie].sort((a, b) => b.zones.length - a.zones.length).slice(0, 12).map(p => `${p.cc} ${p.zones.length}`).join(', '));
