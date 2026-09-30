// Jeton eBird API v2, lu hors du depot public : variable d'environnement EBIRD_API_KEY,
// sinon le fichier .Renviron de R (Documents\.Renviron sous Windows), le meme qui porte
// deja EBIRDST_KEY pour les scripts de tools/ebirdst. Une seule place pour les deux cles.
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const FICHIERS = [
  process.env.R_ENVIRON_USER,
  join(homedir(), 'Documents', '.Renviron'),
  join(homedir(), '.Renviron'),
];
for (const f of FICHIERS) {
  if (process.env.EBIRD_API_KEY) break;
  if (f && existsSync(f)) process.loadEnvFile(f);
}

export const EBIRD_API_KEY = process.env.EBIRD_API_KEY;
if (!EBIRD_API_KEY) {
  console.error('Jeton eBird absent : ajouter la ligne EBIRD_API_KEY=<jeton> dans Documents\\.Renviron');
  process.exit(1);
}
