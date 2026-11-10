#!/usr/bin/env node
/*
  osm-zones-monde.mjs - Contours OpenStreetMap (© contributeurs OSM, ODbL 1.0) des zones eBird qu'aucune
  autre source n'a (2026-11-10) : régions récentes (Songwe, Tanzanie, 2016), districts que Natural Earth
  fond (Daman et Diu en Inde), îles (Aldabra). Interroge Nominatim, une requête par seconde comme sa
  politique d'usage le demande, et garde le polygone de chaque résultat.

  Sortie : notes-privees/contours-monde/osm-monde.geojson, une entité par zone eBird (propriété ebird),
  qu'une zone soit faite d'un ou de plusieurs morceaux OSM.
  Usage : node outils/build/osm-zones-monde.mjs
*/
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SORTIE = join(RACINE, 'notes-privees', 'contours-monde', 'osm-monde.geojson');
// zone eBird -> recherches Nominatim (plusieurs morceaux possibles), et le type d'objet attendu.
export const CIBLES = {
  'TZ-30': ['Songwe Region, Tanzania'],
  'TZ-14': ['Mbeya Region, Tanzania'],                 // l'ancienne Mbeya de Natural Earth couvrait Songwe
  'IN-DD': ['Daman district, India', 'Diu district, India'],
  'IN-DN': ['Dadra and Nagar Haveli district, India'], // Natural Earth fond les trois en un
  'BS-GT': ['North Abaco, Bahamas', 'Grand Cay, Bahamas'],
  'SC-98': ['Aldabra, Seychelles'],
  'SC-26': ['Ile Perseverance 1, Seychelles', 'Ile Perseverance 2, Seychelles'],   // eBird : une zone pour l'île entière
  // Kingman Reef (UM-89, 3 listes) : essayé et retiré, son éloignement élargissait le cadre des îles
  // mineures américaines au point d'effacer les 8 autres au tracé (2026-11-10).
  'AZ-SAK': ['Şəki rayonu, Azərbaycan'],
  'AZ-SA': ['Şəki İnzibati Ərazisi'],                  // la ville : Natural Earth lui donnait aussi le district
};
const attendre = ms => new Promise(r => setTimeout(r, ms));
const features = [];
for (const [ebird, recherches] of Object.entries(CIBLES)) {
  const morceaux = [];
  for (const q of recherches) {
    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q, format: 'json', polygon_geojson: '1', polygon_threshold: '0.0005', limit: '3' });
    const r = await fetch(url, { headers: { 'User-Agent': 'ornitheque-contours/1.0 (outil de recherche ponctuel)' } });
    const j = r.ok ? await r.json() : [];
    const bon = j.find(x => x.geojson && /Polygon/.test(x.geojson.type));
    console.log(`${ebird} « ${q} » -> ${bon ? `${bon.display_name.slice(0, 70)} (${bon.class}/${bon.type}, ${bon.geojson.type})` : 'RIEN'}`);
    if (bon) morceaux.push(bon.geojson);
    await attendre(1100);
  }
  if (!morceaux.length) continue;
  const coords = morceaux.flatMap(g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
  features.push({ type: 'Feature', properties: { ebird }, geometry: { type: 'MultiPolygon', coordinates: coords } });
}
writeFileSync(SORTIE, JSON.stringify({ type: 'FeatureCollection', features }));
console.log(`${features.length} zones écrites dans ${SORTIE}`);
