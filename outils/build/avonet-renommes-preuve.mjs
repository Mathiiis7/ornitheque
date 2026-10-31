#!/usr/bin/env node
// Deuxième passe sur les noms sans mesures : un même nom d'espèce ne prouve rien (le Courlis hudsonien y rencontrait une
// mésange). On n'imprime que les paires que GBIF rapporte à un même oiseau : l'ancien nom doit y être un synonyme du nôtre,
// ou les deux noms doivent mener à la même espèce. Rien n'est écrit ici : la liste se relit à la main avant d'entrer dans
// outils/config/avonet-renommes.json. node outils/build/avonet-renommes-preuve.mjs
import XLSX from 'xlsx';
import fs from 'node:fs';
const src = fs.readFileSync('app.js', 'utf8');
const FR = JSON.parse(src.match(/const FR_NAMES = (\{.*?\});/)[1]);
const ta = (0, eval)('(' + src.match(/const TRAITS_ALIAS = (\{[\s\S]*?\});/)[1] + ')');
const bloc = nom => { const i = src.indexOf(`const ${nom} = {`), j = src.indexOf('{', i); let n = 0, q = null; for(let k = j; k < src.length; k++){ const c = src[k]; if(q){ if(c === '\\') k++; else if(c === q) q = null; continue; } if(c === '"' || c === "'" || c === '`'){ q = c; continue; } if(c === '/' && src[k + 1] === '/'){ while(src[k] !== '\n') k++; continue; } if(c === '{') n++; if(c === '}' && !--n) return (0, eval)('(' + src.slice(j, k + 1) + ')'); } };
const SCI = bloc('SCI_ALIAS'), GBIF = bloc('GBIF_SCI_ALIAS');
const av = JSON.parse(fs.readFileSync('data/avonet_traits.json', 'utf8'));
const trouve = k => av[k] || av[String(ta[k] || SCI[k] || GBIF[k] || '').toLowerCase()];
const reste = Object.keys(FR).filter(k => !trouve(k));
const wb = XLSX.readFile('data/generated/avonet.xlsx');
const cand = new Map();
for(const [f, c] of [['AVONET1_BirdLife', 'Species1'], ['AVONET2_eBird', 'Species2'], ['AVONET3_BirdTree', 'Species3']]) for(const r of XLSX.utils.sheet_to_json(wb.Sheets[f])){ const s = String(r[c] || '').trim().toLowerCase(); if(!s || FR[s] || av[s]) continue; const e = s.split(' ')[1]; cand.set(e, new Set([...(cand.get(e) || []), s])); }
const pause = () => new Promise(r => setTimeout(r, 100));
const cache = new Map();
async function gbif(nom){ if(cache.has(nom)) return cache.get(nom); const j = await (await fetch(`https://api.gbif.org/v1/species/match?class=Aves&strict=true&name=${encodeURIComponent(nom)}`)).json(); await pause(); cache.set(nom, j); return j; }
const racine = j => j.acceptedUsageKey || j.speciesKey || j.usageKey;
const retenus = [], sansAvis = [];
let vus = 0;
for(const k of reste){
  for(const c of cand.get(k.split(' ')[1]) || []){
    vus++;
    const a = await gbif(k), b = await gbif(c);
    const memeGenreFamille = a.family && b.family && a.family === b.family;
    if(a.matchType === 'NONE' || b.matchType === 'NONE'){ if(a.family && !b.family || !a.family && b.family || (!a.family && !b.family)) sansAvis.push(`${FR[k]} : ${k} / ${c}`); continue; }
    if(racine(a) === racine(b)) retenus.push(`${FR[k]} : ${k} <- ${c} [${a.family || b.family}] ${b.status}`);
    else if(memeGenreFamille) sansAvis.push(`${FR[k]} : ${k} / ${c} [${a.family}] : deux espèces distinctes pour GBIF`);
  }
}
console.log('paires vues', vus, '| même oiseau selon GBIF', retenus.length, '| sans preuve, même famille ou inconnu', sansAvis.length);
console.log(retenus.join('\n'));
console.log('--- SANS PREUVE\n' + sansAvis.join('\n'));
