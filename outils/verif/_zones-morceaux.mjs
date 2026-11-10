// Essai (2026-11-10) : pour des pays donnés, quelles régions Natural Earth (nom, code) composent chaque zone
// eBird, en reproduisant le résolveur de simplify-regions-multi.mjs. Usage : node _zones-morceaux.mjs AR,CO
import { readFileSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const pays = JSON.parse(readFileSync(R + 'outils/config/pays-a-ajouter.json', 'utf8'));
const ne = JSON.parse(readFileSync(R + 'notes-privees/contours-monde/ne_10m_admin_1_states_provinces.geojson', 'utf8')).features;
function normNomMonde(s){
  return String(s || '').split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\b(gouvernorat|bibhag|division|province|provincia|region|regione|district|state|division|department|departement|departamento|governorate|prefecture|municipality|municipio|parish|county|oblast|autonomous|special|capital|territory|city|of|the|de|du|la|le|des)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}
for (const cc of (process.argv[2] || '').split(',')) {
  const p = pays.find(x => x.cc === cc);
  const parNom = {}; for (const [code, nom] of Object.entries(p.noms)) parNom[normNomMonde(nom)] = code;
  const compo = {};
  for (const f of ne.filter(f => f.properties.iso_a2 === cc)) {
    const pr = f.properties, iso = pr.iso_3166_2;
    let code = null;
    for (const n of [pr.name, pr.name_en, pr.name_alt, pr.woe_name, pr.gn_name]) for (const m of String(n || '').split('|')) { if (!code && parNom[normNomMonde(m)]) code = parNom[normNomMonde(m)]; }
    const parIso = p.zones.includes(iso) ? iso : null;
    const final = code || parIso;
    (compo[final || '(aucune)'] ||= []).push(`${pr.name}${parIso && code && code !== parIso ? ' [code ' + iso + ']' : ''}`);
  }
  console.log(`\n${cc}`);
  for (const [z, l] of Object.entries(compo)) if (l.length > 1 || /\[code/.test(l.join())) console.log(`  ${z} ${p.noms[z] || ''} <- ${l.join(' + ')}`);
}
