// Audit (2026-11-10) : les noms latins des pays du monde absents de FR_NAMES. Pour chacun, l'espèce
// eBird qui porte ce nom aujourd'hui (code espèce, nom français) et, s'il existe, le nom latin que
// le site utilise pour ce même code dans la version 2024 de la taxonomie eBird.
// Usage : node outils/verif/_noms-manquants.mjs  -> %TEMP%/essai-monde/noms-manquants.json
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EBIRD_API_KEY } from '../build/cle-ebird.mjs';
const R = new URL('../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const app = readFileSync(R + 'app.js', 'utf8');
const table = nom => JSON.parse(app.match(new RegExp(`^const ${nom} = (\\{.*\\});`, 'm'))[1]);
const MONDE = table('PAYS_MONDE'), FR = table('FR_NAMES');
const manquants = {};
for (const cc of Object.keys(MONDE)) {
  const f = R + `data/countries/${cc.toLowerCase()}/pays.json`;
  if (!existsSync(f)) continue;
  for (const s of Object.keys(JSON.parse(readFileSync(f, 'utf8')).freq)) if (!FR[s]) (manquants[s] ||= []).push(cc);
}
const tax = async v => (await (await fetch(`https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=fr_FR${v ? '&version=' + v : ''}`,
  { headers: { 'X-eBirdApiToken': EBIRD_API_KEY } })).json());
const actuelle = await tax(''), v2024 = await tax('2024');
const parSci = Object.fromEntries(actuelle.map(t => [t.sciName.toLowerCase(), t]));
const parCode2024 = Object.fromEntries(v2024.map(t => [t.speciesCode, t]));
const sortie = Object.entries(manquants).map(([s, pays]) => {
  const t = parSci[s], ancien = t && parCode2024[t.speciesCode];
  const anc = ancien && ancien.sciName.toLowerCase();
  return { sci: s, pays: pays.length, code: t?.speciesCode, cat: t?.category, fr: t?.comName,
    ancien: anc && anc !== s ? anc : null, ancienConnu: !!(anc && FR[anc]) };
}).sort((a, b) => b.pays - a.pays);
const d = join(tmpdir(), 'essai-monde'); mkdirSync(d, { recursive: true });
writeFileSync(join(d, 'noms-manquants.json'), JSON.stringify(sortie, null, 1));
console.log(sortie.length, 'noms latins absents de FR_NAMES ;',
  sortie.filter(x => x.ancienConnu).length, 'sont un RENOMMAGE d\'une espèce que le site connaît sous son ancien nom ;',
  sortie.filter(x => !x.ancien).length, 'sans ancien nom (espèce nouvelle ou séparée) ;',
  sortie.filter(x => x.cat && x.cat !== 'species').length, 'qui ne sont pas des espèces.');
for (const x of sortie.slice(0, 25)) console.log(`  ${x.sci.padEnd(32)} ${String(x.pays).padStart(3)} pays  ${x.ancien ? '<- ' + x.ancien + (x.ancienConnu ? ' (connu)' : '') : '(nouveau)'}  ${x.fr || '?'}`);
