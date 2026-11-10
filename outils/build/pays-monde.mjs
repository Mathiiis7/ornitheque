/*
  pays-monde.mjs - La liste commune des pays du monde ajoutés à partir du 2026-11-09, lue par tous les
  scripts de la chaîne (téléchargement, rareté, exotiques, contours), pour qu'aucun n'en oublie.

  Source : outils/config/pays-a-ajouter.json (inventaire-pays.mjs), moins les pays ÉCARTÉS ci-dessous.
  Chaque script l'ajoute à ses propres listes quand on lui passe --monde.
*/
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'config', 'pays-a-ajouter.json');

// Écartés, avec leur raison. Le Monténégro est déjà sur le site (ses tables sont en dur, d'où son
// absence de freq_48.json qui le faisait compter comme « restant »). Les micro-États suivent la
// décision du 2026-09-26 (« de 2 à 470 km², ça ne fait pas un birdydex »). Complété après mesure
// des bar charts nationaux.
export const ECARTES = {
  ME: 'déjà sur le site',
  VA: 'micro-État (décision du 2026-09-26)', MC: 'micro-État (décision du 2026-09-26)',
  SM: 'micro-État (décision du 2026-09-26)', LI: 'micro-État (décision du 2026-09-26)',
  AD: 'micro-État (décision du 2026-09-26)',
  XX: 'haute mer : pas un pays',
};

export const PAYS_MONDE = existsSync(CONFIG)
  ? JSON.parse(readFileSync(CONFIG, 'utf8')).filter(p => !ECARTES[p.cc])
  : [];
export const CODES_MONDE = PAYS_MONDE.map(p => p.cc);
export const ZONES_MONDE = Object.fromEntries(PAYS_MONDE.map(p => [p.cc, p.zones]));
export const AVEC_MONDE = process.argv.includes('--monde');
