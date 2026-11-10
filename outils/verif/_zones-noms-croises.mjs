// Essai (2026-11-10) : pour chaque zone tracée des pays du monde, compare le nom qu'eBird donne à son code
// et le nom de la région Natural Earth qui porte ce code. Un écart signale un code ISO qui ne désigne pas
// la même région chez les deux (codes renumérotés : Vietnam, Tanzanie...).
// Usage : node outils/verif/_zones-noms-croises.mjs
import { readFileSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const pays = JSON.parse(readFileSync(R + 'outils/config/pays-a-ajouter.json', 'utf8'));
const ne = JSON.parse(readFileSync(R + 'notes-privees/contours-monde/ne_10m_admin_1_states_provinces.geojson', 'utf8')).features;
const parIso = {};
for (const f of ne) if (f.properties.iso_3166_2) (parIso[f.properties.iso_3166_2] ||= []).push(f.properties);
const norm = s => String(s || '').split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
// Deux noms « vont ensemble » si l'un contient l'autre, ou s'ils partagent leurs 4 premières lettres.
const proches = (a, b) => { a = norm(a); b = norm(b); return !!a && !!b && (a.includes(b) || b.includes(a) || a.slice(0, 4) === b.slice(0, 4)); };
const parPays = {};
for (const p of pays) for (const [code, nom] of Object.entries(p.noms || {})) {
  const cands = parIso[code];
  if (!cands) continue;
  const ok = cands.some(c => [c.name, c.name_en, c.name_fr, c.name_alt, c.woe_name, c.gn_name].some(n => String(n || '').split('|').some(m => proches(m, nom))));
  if (!ok) (parPays[p.cc] ||= []).push(`${code} eBird « ${nom} » / carte « ${cands[0].name} »`);
}
let n = 0;
for (const [cc, l] of Object.entries(parPays)) { n += l.length; console.log(`${cc} (${l.length}) : ${l.slice(0, 6).join(' | ')}${l.length > 6 ? ' ...' : ''}`); }
console.log(`\n${n} zones dont le nom ne correspond pas, dans ${Object.keys(parPays).length} pays`);
