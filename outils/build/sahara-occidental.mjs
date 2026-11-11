// Le Sahara occidental dans ses frontières reconnues (Mathis, 2026-11-11 : « rendre sa vraie emprise au Sahara
// occidental »). Natural Earth, au 1:50 M comme au 1:10 M, donne au Maroc tout ce qui est à l'ouest du mur de
// sable : son « Morocco » faisait 583 000 km² et son « W. Sahara » la seule bande de l'est, 91 000 km² sur ~266 000.
// eBird, lui, range sous EH tout ce qui est au sud de la frontière : ses 40 sites vont de 20,5 à 27,5° N, et sa zone
// marocaine MA-15 ne garde que la bande de Tarfaya, au nord (vérifié le 2026-11-11 via le relais, ref/hotspot).
// La frontière Maroc - Sahara occidental est le parallèle 27°40' N, de l'Atlantique à 8°40' O (l'Algérie).
// Servi à carte-pays.mjs (les pays) et à simplify-regions-multi.mjs (les régions du Maroc).
import * as polyclip from 'polyclip-ts';

export const LAT_FRONTIERE = 27 + 40 / 60;
export const LON_EST = -(8 + 40 / 60);
// Tout ce qui, au sud de la frontière et à l'ouest de 8°40' O, est au Sahara occidental.
const SUD = [[[-20, 19], [LON_EST, 19], [LON_EST, LAT_FRONTIERE], [-20, LAT_FRONTIERE], [-20, 19]]];

// Les géométries arrivent en coordonnées de polygone (Polygon : [anneaux], MultiPolygon : [[anneaux]...]).
const multi = coords => (typeof coords[0][0][0] === 'number' ? [coords] : coords);

// Le Maroc sans le Sahara occidental (liste de polygones, vide si tout était au sud).
export function sansSahara(coords){
  return polyclip.difference(multi(coords), SUD);
}
// La part d'une géométrie qui est au Sahara occidental.
export function partSaharienne(coords){
  return polyclip.intersection(multi(coords), SUD);
}
// Le Sahara occidental entier : sa bande de l'est, plus la part saharienne du « Maroc » de Natural Earth.
export function saharaEntier(coordsEH, coordsMA){
  return polyclip.union(multi(coordsEH), partSaharienne(coordsMA));
}
