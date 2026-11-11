#!/usr/bin/env node
/*
  purge-ebird-cache.mjs

  Efface les vieilles copies des reponses eBird gardees dans Firestore
  (leagues/<id>/ebirdCache). Le site ne s'en sert que 6 h (EBIRD_TTL_MS), puis comme
  secours quand eBird ne repond pas ; il ne les efface jamais, donc elles s'empilent :
  10 748 des 13 328 documents de la base le 2026-10-04.

  Pourquoi par paquets plafonnes : chaque copie trouvee coute une LECTURE (50 000 par jour
  au plan gratuit) et chaque effacement une SUPPRESSION (20 000 par jour). Le 2026-11-10, une
  sauvegarde complete a bute sur le quota de lecture et le site avec. On s'arrete donc a
  --max (8 000 par defaut : 16 % des lectures et 40 % des suppressions du jour), et on relance
  le lendemain s'il en reste.

  Usage :
    node outils/build/purge-ebird-cache.mjs --compter        compte seulement (quasi gratuit :
                                                             une lecture par tranche de 1 000)
    node outils/build/purge-ebird-cache.mjs                  efface les copies de plus de 3 jours
    node outils/build/purge-ebird-cache.mjs --jours=7 --max=5000

  3 jours par defaut : c'est le delai que le site applique deja a sa copie locale
  (IndexedDB, purgee au-dela de 3 jours). Une copie plus vieille ne sert plus de secours utile.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..', '..');
const KEY_PATH = path.join(ROOT, 'outils', 'config', 'firebase-admin-key.json');

const arg = (nom, defaut) => {
  const a = process.argv.find(x => x.startsWith(`--${nom}=`));
  return a ? Number(a.split('=')[1]) : defaut;
};
const COMPTER = process.argv.includes('--compter');
const JOURS = arg('jours', 3);
const MAX = arg('max', 8000);
const PAQUET = 400;          // documents lus puis effaces a la fois
const PAUSE_MS = 250;        // entre deux paquets : la file d'ecritures de Firestore deborde sinon (2026-09-29)

const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const limite = Timestamp.fromMillis(Date.now() - JOURS * 864e5);
const dort = ms => new Promise(r => setTimeout(r, ms));

const ligues = await db.collection('leagues').listDocuments();
let totalEfface = 0;

for (const ligue of ligues) {
  const coll = ligue.collection('ebirdCache');
  const vieilles = coll.where('updatedAt', '<', limite);
  const [tout, vieux] = await Promise.all([coll.count().get(), vieilles.count().get()]);
  console.log(`Ligue ${ligue.id} : ${tout.data().count} copies, dont ${vieux.data().count} de plus de ${JOURS} jours`);
  if (COMPTER) continue;

  while (totalEfface < MAX) {
    const n = Math.min(PAQUET, MAX - totalEfface);
    // select() sans champ : on ne rapatrie que les identifiants (la lecture est comptee quand meme)
    const snap = await vieilles.select().limit(n).get();
    if (snap.empty) break;
    const lot = db.batch();
    snap.docs.forEach(d => lot.delete(d.ref));
    await lot.commit();
    totalEfface += snap.size;
    process.stdout.write(`\r  effacees : ${totalEfface}`);
    await dort(PAUSE_MS);
  }
  if (!COMPTER) console.log('');
}

if (!COMPTER) {
  console.log(`\n=== ${totalEfface} copies effacees ===`);
  if (totalEfface >= MAX) console.log(`Plafond de ${MAX} atteint : relancer demain pour la suite.`);
}
