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
const NE_FR = {}, NE_NOMS = {}, NE_PRINC = {};
for (const f of ne.features) if (f.properties.iso_3166_2) {
  const p = f.properties;
  if (p.name_fr) NE_FR[p.iso_3166_2] = p.name_fr;
  NE_NOMS[p.iso_3166_2] = [p.name, p.name_en, p.name_alt, p.woe_name, p.gn_name].flatMap(n => String(n || '').split('|'));
  // Le nom principal seul : les autres champs portent parfois le nom de la province mère (« Hamgyŏng-bukto »
  // pour Rason), qu'il ne faut pas prendre pour un code échangé.
  NE_PRINC[p.iso_3166_2] = [p.name, p.name_en].filter(Boolean);
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

// Un nom qui commence encore par un article ou un « de » : reste d'un titre que PREFIXES ne connaît pas
// (« du Caire », « de Beyrouth », « du Nord-Est », « l'Ouest » : 24 zones, audit du 2026-11-10). On le
// retire et on met la majuscule ; « La Mecque » garde son article, qui fait partie du nom.
const GARDENT_ARTICLE = new Set(['la mecque']);
const ARTICLE_REFAIT = { 'du caire': 'Le Caire' };   // « du » = « de le » : l'article revient
function sansArticle(n) {
  if (ARTICLE_REFAIT[n.toLowerCase()]) return ARTICLE_REFAIT[n.toLowerCase()];
  if (GARDENT_ARTICLE.has(n.toLowerCase())) return n[0].toUpperCase() + n.slice(1);
  const m = n.replace(/^(de la |de l'|de l’|du |des |de |d'|d’|la |le |les |l'|l’)/, '');
  return m === n ? n : m[0].toUpperCase() + m.slice(1);
}

// Deux zones d'un pays qui portent le même nom en français : une ville et sa province, deux districts
// homonymes. On les distingue entre parenthèses, pour qu'elles restent voisines dans une liste triée.
const NOMS_DISTINCTS = {
  'AR-B':'Buenos Aires (province)', 'AR-C':'Buenos Aires (ville)',
  'AZ-LAN':'Lankaran (district)', 'AZ-LA':'Lankaran (ville)',
  'MX-DIF':'Mexico (ville)', 'MX-MEX':'Mexico (État)',
  'SC-13':"Grand'Anse (Mahé)", 'SC-14':"Grand'Anse (Praslin)",
  'TW-CYI':'Chiayi (ville)', 'TW-CYQ':'Chiayi (comté)', 'TW-HSZ':'Hsinchu (ville)', 'TW-HSQ':'Hsinchu (comté)',
  'UZ-TO':'Tachkent (province)', 'UZ-TK':'Tachkent (ville)',
  // Natural Earth donne à cette forme le nom français de toute la région (« péninsule de Zamboanga »).
  'PH-ZAN':'Zamboanga du Nord',
  // Noms français de Natural Earth réduits à un fragment (« fédéral », « nations », « département Central »).
  'BR-DF':'District fédéral', 'ET-SN':'Nations, nationalités et peuples du Sud', 'PY-11':'Central',
  'NG-FC':'Territoire de la capitale fédérale', 'TG-P':'Plateaux',
};

const sortie = {};
let neUtilises = 0;
for (const p of liste) {
  const autres = code => Object.entries(p.noms || {}).filter(([c]) => c !== code).map(([, n]) => sansAccent(n));
  for (const [code, nom] of Object.entries(p.noms || {})) {
    const fr = NE_FR[code];
    // Un nom de Natural Earth qui EST le nom eBird d'une autre zone du pays dit un code échangé : Paktia et
    // Paktika en Afghanistan, que la règle des quatre premières lettres laissait passer l'un pour l'autre
    // (audit du 2026-11-10).
    const echange = (NE_PRINC[code] || []).some(n => n && autres(code).includes(sansAccent(n)) && sansAccent(n) !== sansAccent(nom));
    const memeRegion = !echange && ((NE_NOMS[code] || []).some(n => proches(n, nom)) || proches(fr, nom));
    if (fr && memeRegion && !/^[A-Z]{2}-/.test(fr)) {
      // Le titre fait parfois partie du nom : « District fédéral », « Gouvernorat méridional », « Région des
      // nations, nationalités et peuples du Sud » devenaient « fédéral », « méridional », « nations » (30 zones,
      // 2026-11-10). Un reste qui commence par une minuscule garde donc son titre.
      const court = fr.replace(PREFIXES, '').trim();
      sortie[code] = /^\p{Ll}/u.test(court) && court !== fr ? fr.trim() : sansArticle(court);
      neUtilises++;
    }
    else sortie[code] = depuisEbird(nom);
  }
  // Deux zones au même nom français : celle dont le nom eBird ne ressemble pas à ce nom l'a reçu par erreur
  // (Natural Earth nomme « Mahaica-Berbice » en français la zone « Essequibo Islands-West Demerara » du
  // Guyana) et reprend le sien.
  const parNom = {};
  for (const code of Object.keys(p.noms || {})) (parNom[sortie[code]] ||= []).push(code);
  for (const codes of Object.values(parNom)) if (codes.length > 1)
    for (const code of codes) if (!proches(sortie[code], p.noms[code])) sortie[code] = depuisEbird(p.noms[code]);
  // Une zone se lit seule dans une liste : majuscule initiale (« méridional », « île Baker » chez Natural Earth).
  for (const code of Object.keys(p.noms || {})) sortie[code] = NOMS_DISTINCTS[code] || sortie[code].charAt(0).toUpperCase() + sortie[code].slice(1);
}
writeFileSync(join(RACINE, 'outils', 'config', 'zones-monde-noms.json'), JSON.stringify(sortie, null, 1));
console.log(`${Object.keys(sortie).length} zones nommees, dont ${neUtilises} par Natural Earth en francais.`);
for (const cc of ['JP', 'UG', 'BD', 'EG', 'ZA', 'GN'])
  console.log(cc, Object.entries(sortie).filter(([k]) => k.startsWith(cc + '-')).slice(0, 5).map(([, v]) => v).join(' | '));
