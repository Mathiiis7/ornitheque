// Table des jeux GBIF d'observations humaines d'oiseaux depuis 2015 (2026-10-21), pour lire le
// téléchargement « toutes bases » (notes-privees/essai-cartes/gbif-requete-tout.json), dont chaque ligne
// ne garde que les 8 premiers caractères de la clé du jeu (colonne « jeu »).
// Pour chaque jeu : préfixe, clé, titre, éditeur, licence, nombre d'oiseaux, et une classe :
//   ebird    le jeu eBird (listes complètes, mais sans numéro de liste sur GBIF)
//   listes   atlas à listes complètes connus (protocole avec effort)
//   ecarter  baguage, comptages à poste fixe, listes par commune et par année : faussent une fréquence
//   isolees  tout le reste : observations isolées (une photo, une espèce notée)
// Les jeux « listes » et « ecarter » sont nommés à la main d'après docs/sources-donnees-oiseaux.md ; les
// mots-clés ne servent qu'à signaler des candidats, à relire avant de s'en servir.
// Sortie : notes-privees/essai-cartes/gbif-jeux.json, et les collisions de préfixe à l'écran.
import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const SORTIE = path.join(RACINE, 'notes-privees', 'essai-cartes', 'gbif-jeux.json');
const G = 'https://api.gbif.org/v1';
const FILTRE = 'taxonKey=212&year=2015,2026&basisOfRecord=HUMAN_OBSERVATION&occurrenceStatus=PRESENT&hasCoordinate=true&hasGeospatialIssue=false';
const EBIRD = '4fa7b334-ce0d-4e88-aaae-2e0c138d049e';
// atlas à listes complètes, clés lues sur GBIF le 2026-10-21 (docs/sources-donnees-oiseaux.md)
const LISTES = new Set([
  '906e6978-e292-4a8b-9c39-adf6bb0f3323',   // SABAP2, Afrique australe
  'ae857486-36ca-4669-9c7f-1d3aab6d2ce2',   // Nigeria Bird Atlas, Full Protocol Submissions (2015-2022)
  '993982f8-3883-435d-af0a-4b3fdd9a0295',   // Nigerian Bird Atlas Project « Adhoc Records » : en fait des listes
                                            // complètes 2016-2025, en double avec le précédent pour 2016-2021
  '1cd0cb6d-d8ab-4e4c-9672-70d22fec96b3',   // Kenya Bird Map
]);
const json = async url => {
  for (let e = 0; e < 4; e++) {
    try { const r = await fetch(url); if (r.ok) return r.json(); if (r.status === 404) return null; } catch (_) {}
    await new Promise(r => setTimeout(r, 2000 * (e + 1)));
  }
  throw new Error('GBIF ne répond pas : ' + url);
};

// tous les jeux, par paquets de 1 000 (facette paginée)
const jeux = [];
for (let off = 0; ; off += 1000) {
  const r = await json(`${G}/occurrence/search?${FILTRE}&limit=0&facet=datasetKey&facetLimit=1000&facetOffset=${off}`);
  const c = r.facets[0]?.counts || [];
  jeux.push(...c.map(x => ({ cle: x.name, oiseaux: x.count })));
  if (c.length < 1000) break;
}
console.log(jeux.length, 'jeux');
// titres, éditeurs, licences : 10 requêtes à la fois
for (let i = 0; i < jeux.length; i += 10) {
  await Promise.all(jeux.slice(i, i + 10).map(async j => {
    const d = await json(`${G}/dataset/${j.cle}`);
    j.titre = d?.title || '';
    j.licence = (d?.license || '').replace(/^https?:\/\/creativecommons\.org\/(licenses|publicdomain)\//, '').replace(/\/legalcode$/, '');
    j.editeur = d?.publishingOrganizationKey || '';
  }));
}
// À écarter, liste relue le 2026-10-21 sur les jeux de plus de 5 000 oiseaux : le baguage (TIPU, NRM,
// CRBPO, SEO, Operation Baltic...), le Batumi Raptor Count (comptages de migration au même poste) et les
// cinq jeux Faune-France 2017-2021 (une ligne par espèce, par commune et par année). Le simple mot « ring »
// attrapait aussi « wintering », « during » ou « neighboring » (RU-BIRDS) : d'où ces formes précises.
const ECARTER = /ringing|ring-recovery|ringed|baguage|anillamiento|captured by ringers|raptor count|faune-france/i;
const motsEcarter = /ring|band|bagu|bander|raptor count|migration count|telemetr|tracking|gps|communes?\b/i;
const motsListes = /atlas|full protocol|complete checklist|bird ?map|point count|transect|stoc|breeding bird survey/i;
for (const j of jeux) {
  j.prefixe = j.cle.slice(0, 8);
  j.classe = j.cle === EBIRD ? 'ebird' : LISTES.has(j.cle) ? 'listes' : ECARTER.test(j.titre) ? 'ecarter' : 'isolees';
  if (j.classe === 'isolees' && motsEcarter.test(j.titre)) j.candidat = 'ecarter ?';
  else if (j.classe === 'isolees' && motsListes.test(j.titre)) j.candidat = 'listes ?';
}
const parPrefixe = new Map();
for (const j of jeux) parPrefixe.set(j.prefixe, [...(parPrefixe.get(j.prefixe) || []), j.cle]);
const collisions = [...parPrefixe].filter(([, c]) => c.length > 1);
console.log('collisions de préfixe :', collisions.length ? JSON.stringify(collisions) : 'aucune');
jeux.sort((a, b) => b.oiseaux - a.oiseaux);
fs.writeFileSync(SORTIE, JSON.stringify(jeux, null, 1));
const somme = cl => jeux.filter(j => j.classe === cl).reduce((s, j) => s + j.oiseaux, 0);
console.log('oiseaux : ebird', somme('ebird'), '| listes', somme('listes'), '| isolees', somme('isolees'), '| ecarter', somme('ecarter'));
console.log('écartés :', jeux.filter(j => j.classe === 'ecarter').length, 'jeux');
console.log('licences :', JSON.stringify(jeux.reduce((m, j) => (m[j.licence] = (m[j.licence] || 0) + j.oiseaux, m), {})));
console.log('candidats à relire :', jeux.filter(j => j.candidat).length);
