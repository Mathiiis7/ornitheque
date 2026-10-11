#!/usr/bin/env node
/*
  exotiques-majoritaires.mjs - statut exotique d'un pays deduit de ses zones.

  A lancer depuis la racine du depot : node outils/build/exotiques-majoritaires.mjs [--ecrire]
  Sans --ecrire, affiche la liste et n'ecrit rien.
  A relancer apres inject-exotic-by-region.mjs ou inject-exotic-by-dep-fr.mjs.

  Entree : dans app.js, EXOTIQUES_EBIRD_PAR_PAYS, EXOTIC_STATUS_BY_REGION_MULTI et
           EXOTIC_STATUS_BY_DEP_FR ; data/countries/<cc>/freq_by_region.json
  Sortie : const EXOTIQUES_ZONES_MAJORITAIRES dans app.js, juste apres
           NATIVE_REGIONS_DESPITE_NATIONAL_TAG.
*/
// eBird ne donne pas toujours de statut au niveau du pays alors que ses zones en donnent un.
// Le Capucin bec-de-plomb en Italie : vu dans deux regions voisines, X en Toscane, rien
// ailleurs - la ligne Italie n'affichait aucune lettre, comme si l'oiseau y etait sauvage
// (Mathis, 2026-10-12).
//
// Faire remonter n'importe quelle lettre de zone au pays ne marche pas : 170 cas, dont l'Aigle
// royal et le Moineau domestique en Espagne, ou l'Oie cendree dans toute l'Europe, classes X
// dans une region sur quinze. La regle retenue : la lettre remonte quand AU MOINS LA MOITIE
// des zones ou l'espece est vue la classent. 96 cas au 2026-10-12, presque tous des echappes,
// des reintroductions ou des populations installees ; le seul douteux est l'Oie cendree au
// Montenegro (X dans 1 region sur 2).
import { readFileSync, writeFileSync, existsSync } from 'fs';
const ECRIRE = process.argv.includes('--ecrire');
const SEUIL = 0.5;
const ORDRE = ['N', 'P', 'X', 'C'];
let src = readFileSync('app.js', 'utf8');

const litObjet = (nom) => {
  const m = src.search(new RegExp('const ' + nom + ' = \\{'));
  if (m < 0) throw new Error('introuvable : ' + nom);
  const d = src.indexOf('{', m); let p = 0, j = d;
  for (; j < src.length; j++) { if (src[j] === '{') p++; else if (src[j] === '}') { p--; if (!p) break; } }
  return { debut: m, fin: j + 1, obj: JSON.parse(src.slice(d, j + 1)) };
};
const NAT = litObjet('EXOTIQUES_EBIRD_PAR_PAYS').obj;
const MULTI = litObjet('EXOTIC_STATUS_BY_REGION_MULTI').obj;
const DEP = litObjet('EXOTIC_STATUS_BY_DEP_FR').obj;

const sortie = {}; let n = 0;
for (const cc of Object.keys(MULTI)) {
  // France : eBird classe au departement, c'est aussi ce que montre la carte de la fiche
  const statuts = cc === 'FR' ? DEP : MULTI[cc];
  const f = 'data/countries/' + cc.toLowerCase() + '/freq_by_region.json';
  if (!existsSync(f)) continue;
  const freq = JSON.parse(readFileSync(f, 'utf8'));
  const parEspece = {};
  for (const [z, o] of Object.entries(statuts)) for (const [sci, c] of Object.entries(o)) (parEspece[sci] ||= {})[z] = c;
  for (const [sci, zs] of Object.entries(parEspece)) {
    if (NAT[cc] && NAT[cc][sci]) continue;        // eBird a deja tranche au national
    const vues = Object.keys(freq).filter(z => Array.isArray(freq[z][sci]) && freq[z][sci].some(v => v > 0));
    const toutes = new Set([...vues, ...Object.keys(zs)]);
    if (Object.keys(zs).length / toutes.size < SEUIL) continue;
    const lettres = ORDRE.filter(c => Object.values(zs).includes(c));
    (sortie[cc] ||= {})[sci] = lettres;
    n++;
    if (!ECRIRE) console.log(`${cc} ${sci} : ${Object.keys(zs).length}/${toutes.size} zones -> ${lettres.join(' ')}`);
  }
}
console.log(n + ' couples pays x espece');
if (!ECRIRE) { console.log('(essai a blanc - relancer avec --ecrire)'); process.exit(0); }

const ligne = 'const EXOTIQUES_ZONES_MAJORITAIRES = ' + JSON.stringify(sortie) + ';';
const deja = src.search(/const EXOTIQUES_ZONES_MAJORITAIRES = \{/);
if (deja >= 0) {
  const finLigne = src.indexOf(';', src.indexOf('};', deja)) + 1;
  src = src.slice(0, deja) + ligne + src.slice(finLigne);
} else {
  const nat = litObjet('NATIVE_REGIONS_DESPITE_NATIONAL_TAG');
  const fin = src.indexOf(';', nat.fin) + 1;
  // Le separateur de ligne se lit dans le fichier, il ne s'ecrit pas de memoire (CLAUDE.md)
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const entete = '// Statut exotique d un pays deduit de ses zones, quand eBird n en donne pas au national :'
    + nl + '// la lettre remonte si au moins la moitie des zones ou l espece est vue la classent.'
    + nl + '// Genere par outils/build/exotiques-majoritaires.mjs - ne pas editer a la main.' + nl;
  src = src.slice(0, fin) + nl + entete + ligne + src.slice(fin);
}
writeFileSync('app.js', src);
console.log('app.js ecrit');
