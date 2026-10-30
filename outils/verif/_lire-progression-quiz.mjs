// Lecture seule (2026-10-26) : les fiches de progression du Quiz (leagues/<ligue>/quizProgress/<uid>),
// en comptes seulement : date de mise à jour, oiseaux joués, réponses, séries, parcours. Pour savoir si une
// progression signalée perdue existe encore en ligne. Aucune écriture.
// Par collectionGroup (2026-10-30) : le document de la ligue n'existe pas lui-même, seules ses sous-collections,
// donc lister « leagues » ne rendait rien et le script finissait muet.
// node outils/verif/_lire-progression-quiz.mjs
import fs from 'node:fs';
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
initializeApp({ credential: cert(JSON.parse(fs.readFileSync('outils/config/firebase-admin-key.json', 'utf8'))) });
const db = getFirestore();
const fiches = await db.collectionGroup('quizProgress').get();
console.log(`${fiches.size} fiche(s) de progression`);
for(const f of fiches.docs){
  const d = f.data();
  let rep = {}, parc = {};
  try{ rep = JSON.parse(d.reponses || '{}'); }catch(_){}
  try{ parc = JSON.parse(d.parcours || '{}'); }catch(_){}
  const esp = Object.values(rep.esp || {});
  const personne = (await f.ref.parent.parent.collection('members').doc(f.id).get()).data();
  console.log(`  ${(personne && personne.name) || '?'} (${f.id.slice(0, 6)}…) : mise à jour ${d.maj ? d.maj.toDate().toISOString().slice(0, 16) : '?'}, ` +
    `${esp.length} oiseaux, ${esp.reduce((s, e) => s + (e[0] || 0), 0)} réponses, ${Object.keys(rep.serie || {}).length} séries, ` +
    `meilleure série ${Math.max(0, ...Object.values(rep.serie || {}).map(s => s[1] || 0))}, ${Object.keys(parc).length} parcours`);
}
process.exit(0);
