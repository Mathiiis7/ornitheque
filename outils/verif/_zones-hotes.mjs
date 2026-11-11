// Les zones de carte qu'eBird connaît mais où il n'a jamais rien rangé (0 espèce, notes-privees/zones-muettes.json) :
// leurs observations sont-elles rangées dans une zone voisine ? On demande au relais eBird les sites
// d'observation du pays (ref/hotspot/<pays>) et on garde ceux qui tombent DEDANS : la zone eBird qui
// les range en majorité est l'« hôte » (Louxor -> Qena). Aucun site dedans : la zone n'a jamais été visitée.
// Sortie : notes-privees/zones-hotes.json. Usage : node outils/verif/_zones-hotes.mjs
import fs from 'node:fs';
import { geoContains, geoArea } from 'd3-geo';
// Un anneau tourné dans le mauvais sens se lit comme la Terre entière moins la zone : tous les sites du pays
// tombaient « dedans » (Afghanistan, premier essai). On retourne les polygones de plus d'une demi-sphère.
function remettreDroit(feat){
  const g = feat.geometry, brut = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const ok = brut.map(p => geoArea({ type:'Polygon', coordinates:p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
  return { type:'Feature', properties: feat.properties, geometry: { type:'MultiPolygon', coordinates: ok } };
}
const RELAIS = 'https://ornitheque-relais.vercel.app/v2/';
const muettes = JSON.parse(fs.readFileSync('notes-privees/zones-muettes.json', 'utf8')).filter(z => z.especes === 0);
const appel = async chemin => {
  for(let essai = 0; essai < 3; essai++){
    const r = await fetch(RELAIS + chemin, { headers: { Origin: 'http://localhost:8765' } });
    if(r.status === 429){ await new Promise(x => setTimeout(x, 5000)); continue; }
    return r.ok ? r.json() : null;
  }
  return null;
};
const sortie = [], sitesPays = {};
for(const z of muettes){
  const f = `data/carte-zones/${z.cc.toLowerCase()}.json`;
  const feat = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')).features || []).find(x => (x.properties.ebird || x.properties.code) === z.code) : null;
  if(!feat){ sortie.push({ ...z, hote: null, raison: 'pas de contour en lon/lat' }); console.log(z.code, 'pas de contour'); continue; }
  // Tous les sites du pays (le relais ne passe pas ref/hotspot/geo), un appel par pays.
  if(!(z.cc in sitesPays)){ sitesPays[z.cc] = await appel(`ref/hotspot/${z.cc}?fmt=json`) || []; await new Promise(x => setTimeout(x, 350)); }
  const sites = sitesPays[z.cc];
  const forme = remettreDroit(feat);
  const dedans = sites.filter(h => geoContains(forme, [h.lng, h.lat]));
  const compte = {};
  for(const h of dedans) compte[h.subnational1Code] = (compte[h.subnational1Code] || 0) + 1;
  const tri = Object.entries(compte).sort((a, b) => b[1] - a[1]);
  const r = { ...z, sitesAutour: sites.length, sitesDedans: dedans.length, hotes: tri, hote: tri.length && tri[0][0] !== z.code ? tri[0][0] : null };
  sortie.push(r);
  console.log(z.code.padEnd(8), (z.nom || '').padEnd(24), `${dedans.length} sites dedans sur ${sites.length} autour`, tri.map(([c, n]) => c + ':' + n).join(' '));
}
fs.writeFileSync('notes-privees/zones-hotes.json', JSON.stringify(sortie, null, 1));
const avecHote = sortie.filter(x => x.hote);
console.log(`\n${sortie.length} zones : ${avecHote.length} rangées ailleurs, ${sortie.length - avecHote.length} jamais visitées (ou sans contour)`);
console.log(avecHote.map(x => `'${x.code}':'${x.hote}'`).join(', '));
