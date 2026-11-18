#!/usr/bin/env node
/*
  chants-heberges.mjs - copie sur le site un extrait de 20 s de chaque chant du quiz, pour ne plus
  dependre de xeno-canto a la lecture.

      node outils/build/chants-heberges.mjs          (apres chants-gardes.mjs, a chaque nouveau parcours)
      node outils/build/chants-heberges.mjs --infos  (licences seulement, sans rien telecharger)

  Pourquoi : le 2026-11-18 au soir, xeno-canto repondait 504 (au bout de 60 s) a tous ses liens
  /download et a son API, alors que ses images repondaient : le premier chant du quiz restait muet,
  bouton sur « lecture ». Ses fichiers eux-memes (xeno-canto.org/sounds/uploaded/...) repondaient
  en 0,3 s. Et un <audio preload="auto"> telechargeait le fichier entier : 4,4 Mo pour un mp3 de
  110 s a 320 kbit/s, quand le quiz n'en lit que 20 s (PC_DUREE_MAX).

  Ce que fait le script, pour chaque chant de data/parcours-*.json :
  1. la licence et le lien direct du fichier viennent de GBIF, qui republie xeno-canto (jeu
     b1047888-ae52-4179-9dd5-5448ea342a24) : il repond quand xeno-canto est en panne. A defaut,
     l'API de xeno-canto ;
  2. ffmpeg lit les 20 premieres secondes du fichier direct (il s'arrete la, sans tout telecharger)
     et ecrit data/chants/<id>.mp3, mono, 96 kbit/s ;
  3. data/chants/licences.json garde auteur et licence de chaque chant (la page des sources les
     liste), et chaque chant de data/parcours-*.json recoit "mp3", que le quiz lit avant "file".

  Licences : toutes celles de xeno-canto sont Creative Commons non commerciales. Meme la plus
  stricte (BY-NC-ND 4.0) permet de partager l'oeuvre « in whole or in part » (2(a)(1)(A)), et un
  changement de format est une « technical modification » qui ne fait jamais une adaptation
  (2(a)(4)) : texte officiel lu le 2026-11-18. Pour les versions 3.0 et 2.5 (11 chants « ND » ce
  jour-la), la FAQ de Creative Commons (« Can I reuse an excerpt of a larger work that is licensed
  with the NoDerivs restriction? ») dit qu'un extrait non retouche n'est pas une adaptation : « a
  person could make copies of one chapter of an ND-licensed book ». Conditions : citer l'auteur, la licence, la source,
  et dire que c'est un extrait. Un chant sans licence connue n'est pas copie : il reste lu chez
  xeno-canto.

  Un fichier a la fois, 2 s de pause : xeno-canto refuse les rafales (429 des 6 demandes
  simultanees, mesure le 2026-11-17). Relancer ne refait que ce qui manque.
*/
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER = join(RACINE, 'data', 'chants');
const LICENCES = join(DOSSIER, 'licences.json');
const DUREE = 20;            // = PC_DUREE_MAX dans app.js
const DEBIT = '96k';
const JEU_GBIF = 'b1047888-ae52-4179-9dd5-5448ea342a24';
const CLE_XC = 'a082ff6c2adafb02ea6b275da67cd903988f82ea';   // la meme que app.js (XC_API_KEY)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const infosSeules = process.argv.includes('--infos');
const pause = ms => new Promise(ok => setTimeout(ok, ms));

fs.mkdirSync(DOSSIER, { recursive: true });
const fichiers = fs.readdirSync(join(RACINE, 'data')).filter(f => /^parcours-.+\.json$/.test(f));
const parcours = Object.fromEntries(fichiers.map(f => [f, JSON.parse(fs.readFileSync(join(RACINE, 'data', f), 'utf8'))]));
const chants = new Map();   // id -> { rec }
for (const p of Object.values(parcours)) for (const liste of Object.values(p)) for (const r of liste) chants.set(String(r.id), r);
const lic = fs.existsSync(LICENCES) ? JSON.parse(fs.readFileSync(LICENCES, 'utf8')) : {};
const direct = {};          // id -> lien du fichier chez xeno-canto (pas publie)
console.log(chants.size, 'chants dans', fichiers.join(', '));

// « http://creativecommons.org/licenses/by-nc-sa/4.0/ » -> « by-nc-sa/4.0 » ;
// « .../publicdomain/zero/1.0/ » -> « cc0/1.0 » (8 chants sur 142, le 2026-11-18)
const codeLicence = url => {
  const u = String(url || '');
  if (/publicdomain\/zero\/1\.0/i.test(u)) return 'cc0/1.0';
  return (u.match(/licenses\/([a-z-]+\/[\d.]+)/i) || [])[1]?.toLowerCase() || null;
};

// 1. GBIF, par paquets de 40 numeros
const aChercher = [...chants.keys()].filter(id => !lic[id] || !fs.existsSync(join(DOSSIER, id + '.mp3')));
for (let i = 0; i < aChercher.length; i += 40) {
  const paquet = aChercher.slice(i, i + 40);
  const url = `https://api.gbif.org/v1/occurrence/search?datasetKey=${JEU_GBIF}&limit=300&` + paquet.map(id => 'catalogNumber=XC' + id).join('&');
  try {
    const j = await (await fetch(url)).json();
    for (const o of j.results || []) {
      const id = String(o.catalogNumber || '').replace(/^XC/i, '');
      const son = (o.media || []).find(m => m.type === 'Sound' && m.identifier);
      if (!chants.has(id) || !son || !codeLicence(son.license)) continue;
      direct[id] = son.identifier;
      lic[id] = { auteur: chants.get(id).rec, licence: codeLicence(son.license), via: 'GBIF' };
    }
  } catch (e) { console.log('GBIF ne repond pas :', e.message); }
  await pause(500);
}

// 2. A defaut, l'API de xeno-canto (lien direct = dossier du sonagramme + nom du fichier)
for (const id of aChercher.filter(id => !direct[id])) {
  try {
    const ctrl = AbortSignal.timeout(20000);
    const j = await (await fetch(`https://xeno-canto.org/api/3/recordings?query=nr:${id}&key=${CLE_XC}`, { signal: ctrl })).json();
    const r = j.recordings?.[0];
    const dossier = (String(r?.sono?.small || '').match(/spectrograms\/([^/]+)\//) || [])[1];
    if (r && r['file-name'] && dossier && codeLicence(r.lic)) {
      direct[id] = `https://xeno-canto.org/sounds/uploaded/${dossier}/${r['file-name']}`;
      lic[id] = { auteur: chants.get(id).rec, licence: codeLicence(r.lic), via: 'xeno-canto' };
    }
  } catch (e) { console.log('xeno-canto ne repond pas pour', id, ':', e.message); }
  await pause(2000);
}
const sansInfo = aChercher.filter(id => !direct[id]);
if (sansInfo.length) console.log('sans licence ni lien (restent lus chez xeno-canto) :', sansInfo.join(', '));

// 3. Les extraits
let faits = 0, rates = 0;
if (!infosSeules) {
  for (const id of aChercher.filter(id => direct[id])) {
    const sortie = join(DOSSIER, id + '.mp3'), tmp = sortie + '.tmp.mp3';
    if (fs.existsSync(sortie)) continue;
    try {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-user_agent', UA, '-i', direct[id], '-t', String(DUREE),
        '-vn', '-map_metadata', '-1', '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', DEBIT, tmp], { timeout: 120000 });
      fs.renameSync(tmp, sortie);
      faits++;
      if (faits % 20 === 0) console.log(faits, 'extraits');
    } catch (e) {
      rates++; console.log('rate', id, String(e.message).split('\n')[0]);
      try { fs.unlinkSync(tmp); } catch (_) {}
    }
    await pause(2000);
  }
}

// 4. Licences et champ "mp3" : seulement pour les chants dont l'extrait existe vraiment
const heberges = new Set([...chants.keys()].filter(id => lic[id] && fs.existsSync(join(DOSSIER, id + '.mp3'))));
const licPubliees = Object.fromEntries([...heberges].sort((a, b) => a - b).map(id => [id, lic[id]]));
fs.writeFileSync(LICENCES, JSON.stringify(licPubliees));
for (const [f, p] of Object.entries(parcours)) {
  for (const liste of Object.values(p)) for (const r of liste) {
    if (heberges.has(String(r.id))) r.mp3 = `data/chants/${r.id}.mp3`; else delete r.mp3;
  }
  fs.writeFileSync(join(RACINE, 'data', f), JSON.stringify(p));
}
const octets = [...heberges].reduce((t, id) => t + fs.statSync(join(DOSSIER, id + '.mp3')).size, 0);
const parLicence = {};
for (const id of heberges) parLicence[lic[id].licence] = (parLicence[lic[id].licence] || 0) + 1;
console.log(`termine : ${faits} extraits neufs, ${rates} rates ; ${heberges.size} sur ${chants.size} chants heberges, ${(octets / 1048576).toFixed(1)} Mo`);
console.log('licences :', JSON.stringify(parLicence));
