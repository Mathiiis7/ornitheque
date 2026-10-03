#!/usr/bin/env node
/*
  poids-publie.mjs - ce que GitHub Pages sert vraiment, face au plafond de 1 Go.

  POURQUOI CE SCRIPT
  Un `du -sh` sur le dossier de travail MENT : il compte ce que .gitignore exclut. Le
  2026-09-28, il annoncait 469 Mo et j'en ai conclu a tort qu'on approchait du plafond - alors
  que data/range-weekly (143 Mo) et data/generated (30 Mo) ne sont pas publies, les cartes de
  repartition vivant dans le depot separe ornitheque-data. Seuls les fichiers SUIVIS PAR
  GIT sont servis.

      node outils/build/poids-publie.mjs

  Limites GitHub Pages : 1 Go pour le site publie, 100 Go de trafic par mois (souples).
*/
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLAFOND = 1024 * 1024 * 1024;

const fichiers = execSync('git ls-files', { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean);

const parDossier = new Map();
let total = 0;
for (const f of fichiers) {
  let t = 0;
  try { t = statSync(join(RACINE, f)).size; } catch { continue; }
  total += t;
  const racine = f.includes('/') ? f.slice(0, f.indexOf('/')) : '(racine)';
  parDossier.set(racine, (parDossier.get(racine) || 0) + t);
}

const mo = (n) => (n / 1048576).toFixed(1).padStart(7) + ' Mo';
console.log(fichiers.length + ' fichiers suivis par git = ce que GitHub Pages sert.');
console.log('');
for (const [d, t] of [...parDossier].sort((a, b) => b[1] - a[1])) {
  console.log('  ' + d.padEnd(20) + mo(t));
}
console.log('');
console.log('TOTAL PUBLIE : ' + mo(total) + '   (' + (100 * total / PLAFOND).toFixed(1) + ' % du plafond de 1 Go)');
console.log('marge : ' + mo(PLAFOND - total));
