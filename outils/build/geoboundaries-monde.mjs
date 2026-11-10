#!/usr/bin/env node
/*
  geoboundaries-monde.mjs - Télécharge les contours geoBoundaries (gbOpen, ADM1 et ADM2) des pays du monde
  dont des zones eBird n'ont aucun contour dans Natural Earth (2026-11-10, demande de Mathis : « pareil
  dans tous les pays »). Natural Earth ne connaît pas les découpages qu'eBird emploie en Libye (34 districts
  de 2007), au Somaliland, au Vietnam, au Qatar... geoBoundaries (William & Mary, licences ouvertes
  CC BY 4.0 / ODbL selon le pays, citées dans ses métadonnées) en a souvent un niveau qui correspond.

  Sortie : notes-privees/contours-monde/geoBoundaries-<ISO3>-<ADM1|ADM2>.geojson (version simplifiée),
           et la licence de chacun dans outils/config/geoboundaries-licences.json.
  Usage : node outils/build/geoboundaries-monde.mjs CC[,CC...]
*/
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER = join(RACINE, 'notes-privees', 'contours-monde');
const ne = JSON.parse(readFileSync(join(DOSSIER, 'ne_50m_admin_0_countries.geojson'), 'utf8'));
const ISO3 = Object.fromEntries(ne.features.map(f => [f.properties.ISO_A2_EH, f.properties.ISO_A3_EH]));
const pays = (process.argv[2] || '').split(',').filter(Boolean);
const fLic = join(RACINE, 'outils', 'config', 'geoboundaries-licences.json');
const licences = existsSync(fLic) ? JSON.parse(readFileSync(fLic, 'utf8')) : {};

for (const cc of pays) {
  const iso3 = ISO3[cc];
  if (!iso3) { console.warn(`${cc} : code à trois lettres inconnu`); continue; }
  for (const niveau of ['ADM1', 'ADM2']) {
    const sortie = join(DOSSIER, `geoBoundaries-${iso3}-${niveau}.geojson`);
    if (existsSync(sortie)) { console.log(`${cc} ${niveau} : déjà là`); continue; }
    try {
      const meta = await (await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${niveau}/`)).json();
      const url = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;
      if (!url) { console.log(`${cc} ${niveau} : pas de contour`); continue; }
      const g = await (await fetch(url)).text();
      writeFileSync(sortie, g);
      licences[`${iso3}-${niveau}`] = { licence: meta.boundaryLicense, source: meta.boundarySource, annee: meta.boundaryYearRepresented };
      console.log(`${cc} ${niveau} : ${JSON.parse(g).features.length} morceaux, ${meta.boundaryLicense}`);
    } catch (e) { console.warn(`${cc} ${niveau} : échec (${e.message})`); }
  }
}
writeFileSync(fLic, JSON.stringify(licences, null, 1));
