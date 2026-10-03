#!/usr/bin/env node
/*
  ajouter-dependances-gb.mjs - Ajoute Jersey, Guernesey et l'ile de Man au fichier
  Natural Earth admin-1 utilise par simplify-regions-multi.mjs.

  POURQUOI
  Ces trois territoires sont des dependances de la Couronne : ils ne font pas partie du
  Royaume-Uni, et Natural Earth les traite donc comme des PAYS. Le fichier admin-1, qui ne
  contient que des subdivisions, n'en garde que des fragments - une seule des dix-huit iles
  feroiennes, et Sercq seule pour Guernesey. Leurs contours complets sont dans le fichier
  admin-0 (unites cartographiques).

  L'app, elle, les affiche comme trois zones britanniques (cf. ABSORBE dans
  build-rarity-multi-country.mjs). On les recopie donc dans le flux admin-1, etiquetees
  comme des subdivisions du Royaume-Uni, pour que le generateur de contours les voie.

  Sources :
    ne_10m_admin_1_states_provinces.geojson   (deja utilise)
    ne_10m_admin_0_map_units.geojson          https://raw.githubusercontent.com/
      nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_map_units.geojson

  Usage : node outils/build/ajouter-dependances-gb.mjs <admin1.geojson> <admin0.geojson> <sortie.geojson>
*/
import { readFileSync, writeFileSync } from 'node:fs';

const [, , cheminAdmin1, cheminAdmin0, sortie] = process.argv;
if (!cheminAdmin1 || !cheminAdmin0 || !sortie) {
  console.error('Usage : node ajouter-dependances-gb.mjs <admin1> <admin0> <sortie>');
  process.exit(1);
}

// Nom tel que Natural Earth l'ecrit dans admin-0 -> code de zone eBird.
const DEPENDANCES = { 'Jersey': 'JE', 'Guernsey': 'GG', 'Isle of Man': 'IM' };

const a1 = JSON.parse(readFileSync(cheminAdmin1, 'utf8'));
const a0 = JSON.parse(readFileSync(cheminAdmin0, 'utf8'));

const nomDe = p => p.NAME || p.name || p.NAME_EN || p.admin || '';
let ajoutes = 0;
for (const f of a0.features) {
  const code = DEPENDANCES[nomDe(f.properties)];
  if (!code) continue;
  a1.features.push({
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      // Etiquetage minimal : c'est tout ce que resolveCodeBrut lit.
      adm0_a3: 'GBR',
      iso_3166_2: code,
      name: nomDe(f.properties),
      region: null,
      region_cod: null,
    },
  });
  ajoutes++;
}

if (ajoutes !== Object.keys(DEPENDANCES).length) {
  console.error(`Attendu ${Object.keys(DEPENDANCES).length} dependances, ${ajoutes} trouvees dans ${cheminAdmin0}.`);
  process.exit(1);
}

writeFileSync(sortie, JSON.stringify(a1));
console.log(`${ajoutes} dependances ajoutees. ${a1.features.length} features ecrites dans ${sortie}.`);
