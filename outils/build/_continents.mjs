// Table pays -> continent (7 continents) pour le trophee des continents (Mathis, 10/11 : « 5 sur 7 »).
// Source : le champ CONTINENT de Natural Earth (admin 0, 1:50m, notes-privees/contours-monde/), 242 pays.
//   node outils/build/_continents.mjs   -> imprime la constante CONTINENTS_7 a coller dans app.js
// Ce que Natural Earth ne tranche pas, choisi a la main :
//   - 8 territoires en « haute mer » : Seychelles, Maurice, Sainte-Helene -> Afrique ; Maldives, Territoire
//     britannique de l'ocean Indien -> Asie ; Terres australes francaises, Heard, Georgie du Sud -> Antarctique
//     (iles subantarctiques, celles des voyages « Antarctique ») ;
//   - les departements d'outre-mer, comptes dans la France par Natural Earth mais pays a part pour eBird :
//     Reunion, Mayotte -> Afrique ; Guyane -> Amerique du Sud ; Guadeloupe, Martinique -> Amerique du Nord ;
//     Bouvet (absent) -> Antarctique ;
//   - Chypre -> Europe, comme partout ailleurs sur le site (CONTINENT_BY_CC), Natural Earth la met en Asie ;
//   - Svalbard, Gibraltar, Caraibes neerlandaises, Christmas, Cocos, Tokelau, iles mineures des Etats-Unis :
//     absents de Natural Earth a cette echelle.
// Limite connue : un pays compte pour un seul continent (la Russie en Europe, la Turquie en Asie).
import { readFileSync } from 'node:fs';
const NOMS = { 'Africa':'Afrique', 'Antarctica':'Antarctique', 'Asia':'Asie', 'Europe':'Europe', 'North America':'Amérique du Nord',
  'Oceania':'Océanie', 'South America':'Amérique du Sud' };
const A_LA_MAIN = { SC:'Afrique', MU:'Afrique', SH:'Afrique', MV:'Asie', IO:'Asie', TF:'Antarctique', HM:'Antarctique', GS:'Antarctique',
  RE:'Afrique', YT:'Afrique', GF:'Amérique du Sud', GP:'Amérique du Nord', MQ:'Amérique du Nord', BV:'Antarctique', CY:'Europe',
  // Petits territoires absents de Natural Earth a cette echelle, mais codes pays pour eBird
  SJ:'Europe', GI:'Europe', BQ:'Amérique du Nord', CX:'Asie', CC:'Asie', TK:'Océanie', UM:'Océanie' };
const geo = JSON.parse(readFileSync('notes-privees/contours-monde/ne_50m_admin_0_countries.geojson', 'utf8'));
const table = {};
for(const f of geo.features){
  const p = f.properties, cc = [p.ISO_A2_EH, p.ISO_A2, p.WB_A2].find(c => c && c !== '-99');
  if(cc && NOMS[p.CONTINENT]) table[cc] = NOMS[p.CONTINENT];
}
Object.assign(table, A_LA_MAIN);
const parCont = {};
for(const [cc, c] of Object.entries(table)) (parCont[c] ||= []).push(cc);
const lignes = Object.keys(parCont).sort().map(c => `  '${c}': '${parCont[c].sort().join(' ')}',`);
console.log(`// Pays -> continent, 7 continents : genere par outils/build/_continents.mjs (Natural Earth + ${Object.keys(A_LA_MAIN).length} choix a la main), ${Object.keys(table).length} pays.`);
console.log('const CONTINENTS_7 = {\n' + lignes.join('\n') + '\n};');
