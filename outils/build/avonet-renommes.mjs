#!/usr/bin/env node
// Les oiseaux du site absents d'Avonet parce que leur genre a changé depuis 2022 (Aerospiza tachiro = Accipiter
// tachiro). Écrit outils/config/avonet-renommes.json { notre nom : nom Avonet }, lu par build-avonet-traits.mjs.
// Un même nom d'espèce ne suffit pas : ce contrôle a déjà manqué sur un autre fichier, où un pouillot avait pris les
// mesures d'un ganga. Il faut donc la même famille selon GBIF et un seul candidat. Refuser, c'est laisser l'oiseau
// sans carte, jamais lui donner les mesures d'un autre.
// node outils/build/avonet-renommes.mjs CHEMIN/sans-traits-monde.txt
import XLSX from 'xlsx';
import fs from 'node:fs';
const wb = XLSX.readFile('data/generated/avonet.xlsx');
const candidats = new Map();
for(const [feuille, col, fam] of [['AVONET1_BirdLife', 'Species1', 'Family1'], ['AVONET2_eBird', 'Species2', 'Family2'], ['AVONET3_BirdTree', 'Species3', 'Family3']]){
  for(const r of XLSX.utils.sheet_to_json(wb.Sheets[feuille])){
    const s = String(r[col] || '').trim().toLowerCase(); if(!s) continue;
    const e = s.split(' ')[1], l = candidats.get(e) || new Map();
    l.set(s, String(r[fam] || '').toLowerCase()); candidats.set(e, l);
  }
}
const sans = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map(l => l.split('\t')[0]);
const pause = () => new Promise(r => setTimeout(r, 100));
const res = {}, refus = {};
for(const s of sans){
  const proches = candidats.get(s.split(' ')[1]);
  if(!proches || proches.has(s)){ continue; }
  const j = await (await fetch(`https://api.gbif.org/v1/species/match?class=Aves&name=${encodeURIComponent(s)}`)).json(); await pause();
  const fam = String(j.family || '').toLowerCase();
  const memes = [...proches].filter(([, f]) => f && f === fam).map(([n]) => n);
  if(fam && memes.length === 1) res[s] = memes[0];
  else refus[s] = `${fam || 'famille inconnue'} : ${[...proches.keys()].slice(0, 4).join(', ')}`;
}
fs.writeFileSync('outils/config/avonet-renommes.json', JSON.stringify(res, null, 0).replace(/,"/g, ',\n"'));
console.log('rattachés', Object.keys(res).length, '| refusés', Object.keys(refus).length);
console.log(Object.entries(res).slice(0, 30).map(([a, b]) => `${a} <- ${b}`).join(' ; '));
console.log('REFUS', Object.entries(refus).slice(0, 15).map(([a, b]) => `${a} (${b})`).join(' ; '));
