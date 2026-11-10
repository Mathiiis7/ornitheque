#!/usr/bin/env node
/*
  zones-monde-noms.mjs - Le nom français des zones des pays du monde (2026-11-09).

  POURQUOI. eBird nomme ses zones en anglais ou en langue locale (« Eastern Cape », « Barisal bibhag »,
  « Central »). Natural Earth porte un nom français pour beaucoup (« Cap-Oriental », « Mer-Rouge ») :
  il passe en premier, débarrassé des préfixes administratifs (« Préfecture d'Aichi » devient
  « Aichi »). Sinon, le nom d'eBird, avec les points cardinaux et quelques suffixes traduits.

  Entrée : outils/config/pays-a-ajouter.json, Natural Earth admin-1.
  Sortie : outils/config/zones-monde-noms.json = { code: nom }
  Usage : node outils/build/zones-monde-noms.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const liste = JSON.parse(readFileSync(join(RACINE, 'outils', 'config', 'pays-a-ajouter.json'), 'utf8'));
const ne = JSON.parse(readFileSync(join(RACINE, 'notes-privees', 'contours-monde', 'ne_10m_admin_1_states_provinces.geojson'), 'utf8'));
const NE_FR = {}, NE_NOMS = {};
for (const f of ne.features) if (f.properties.iso_3166_2) {
  const p = f.properties;
  if (p.name_fr) NE_FR[p.iso_3166_2] = p.name_fr;
  NE_NOMS[p.iso_3166_2] = [p.name, p.name_en, p.name_alt, p.woe_name, p.gn_name].flatMap(n => String(n || '').split('|'));
}
// Le nom français de Natural Earth n'est pris que si sa région porte le MÊME nom qu'eBird : au Vietnam, en
// Tanzanie, en Corée, les codes sont décalés et VN-24 (Bac Ninh chez eBird) est Quảng Bình chez Natural
// Earth (outils/verif/_zones-noms-croises.mjs, 2026-11-10).
const sansAccent = s => String(s || '').split(',')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const proches = (a, b) => { a = sansAccent(a); b = sansAccent(b); return !!a && !!b && (a.includes(b) || b.includes(a) || a.slice(0, 4) === b.slice(0, 4)); };

const PREFIXES = /^(Préfecture|Province|Région|Gouvernorat|État|District|Département|Division|Comté|Paroisse|Municipalité|Territoire|Oblast|Wilaya|Émirat|Canton|Commune|Île|Zone)\s+(de la |de l'|de l’|du |des |d'|d’|de )/i;
const CARDINAUX = { 'Central': 'Centre', 'Eastern': 'Est', 'Western': 'Ouest', 'Northern': 'Nord',
  'Southern': 'Sud', 'North': 'Nord', 'South': 'Sud', 'East': 'Est', 'West': 'Ouest',
  'North-East': 'Nord-Est', 'North-West': 'Nord-Ouest', 'South-East': 'Sud-Est', 'South-West': 'Sud-Ouest',
  'Northeast': 'Nord-Est', 'Northwest': 'Nord-Ouest', 'Southeast': 'Sud-Est', 'Southwest': 'Sud-Ouest' };
function depuisEbird(nom) {
  let n = String(nom).split(',')[0].trim();          // « Boké, Gouvernorat de » -> « Boké »
  n = n.replace(/\s+bibhag$/i, '');                   // Bangladesh : « Barisal bibhag » -> « Barisal »
  if (CARDINAUX[n]) return CARDINAUX[n];
  n = n.replace(/^(North|South|East|West|Central|Northern|Southern|Eastern|Western) (Province|Region|District|Division)$/i,
    (_, c) => CARDINAUX[c[0].toUpperCase() + c.slice(1).toLowerCase()] || c);
  return n;
}

const sortie = {};
let neUtilises = 0;
for (const p of liste) for (const [code, nom] of Object.entries(p.noms || {})) {
  const fr = NE_FR[code];
  const memeRegion = (NE_NOMS[code] || []).some(n => proches(n, nom)) || proches(fr, nom);
  if (fr && memeRegion && !/^[A-Z]{2}-/.test(fr)) { sortie[code] = fr.replace(PREFIXES, '').trim(); neUtilises++; }
  else sortie[code] = depuisEbird(nom);
}
writeFileSync(join(RACINE, 'outils', 'config', 'zones-monde-noms.json'), JSON.stringify(sortie, null, 1));
console.log(`${Object.keys(sortie).length} zones nommees, dont ${neUtilises} par Natural Earth en francais.`);
for (const cc of ['JP', 'UG', 'BD', 'EG', 'ZA', 'GN'])
  console.log(cc, Object.entries(sortie).filter(([k]) => k.startsWith(cc + '-')).slice(0, 5).map(([, v]) => v).join(' | '));
