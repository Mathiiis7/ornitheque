/*
  Retablit la date d'arrivee (joinedAt) d'un membre. Les regles la gelent pour tout le monde,
  seul l'Admin SDK peut la remettre. Sert quand un compte a ete supprime puis recree pour un
  test : la recreation repose joinedAt a la date du jour, et le profil affiche une arrivee
  fausse (Mathis, 2026-10-19). La bonne date se lit dans une sauvegarde d'outils/backups/.
  Usage : node outils/build/retablir-arrivee.mjs <ligue> <uid> <date ISO>
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Imports par sous-chemin, comme backup-firestore.mjs : l'import par defaut n'expose pas credential en ESM.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KEY_PATH = path.join(ROOT, 'outils', 'config', 'firebase-admin-key.json');
const [ligue, uid, iso] = process.argv.slice(2);
if(!ligue || !uid || !iso || isNaN(Date.parse(iso))){ console.error('Usage : <ligue> <uid> <date ISO>'); process.exit(1); }

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const ref = getFirestore().doc(`leagues/${ligue}/members/${uid}`);
const avant = await ref.get();
if(!avant.exists){ console.error('Fiche introuvable'); process.exit(1); }
console.log('Nom :', avant.get('name'), '| avant :', avant.get('joinedAt')?.toDate().toISOString());
await ref.update({ joinedAt: Timestamp.fromDate(new Date(iso)) });
console.log('après :', (await ref.get()).get('joinedAt').toDate().toISOString());
