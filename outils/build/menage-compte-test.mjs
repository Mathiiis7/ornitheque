#!/usr/bin/env node
/*
  menage-compte-test.mjs

  Liste les fiches membres et les codes d invitation, et sait retirer une fiche de test.

      node outils/build/menage-compte-test.mjs                 ne fait que LIRE
      node outils/build/menage-compte-test.mjs --supprime CODE  retire la fiche entree avec
                                                               CODE, puis le code lui-meme

  La fiche a retirer est designee par son CODE D INVITATION, jamais par le nom : deux lignes
  peuvent porter le meme prenom - c est meme la raison d etre de la collection accounts - et
  se tromper de ligne effacerait des annees de cochages. Le champ invite, lui, est unique.

  Les DEUX suppressions comptent. Retirer la seule fiche laisserait le code au nom de ce
  compte, qui pourrait donc revenir tout seul : c est le defaut d exclusion trouve a l audit
  du 2026-09-28, voir notes-privees/AUDIT-SECURITE.md.

  Passe par le Admin SDK, donc AU-DESSUS des regles Firestore. Lancer une sauvegarde avant :
  node outils/build/backup-firestore.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIGUE = 'merlin-bird';

const cle = JSON.parse(fs.readFileSync(path.join(RACINE, 'outils/config/firebase-admin-key.json'), 'utf8'));
initializeApp({ credential: cert(cle) });
const db = getFirestore();

const iSup = process.argv.indexOf('--supprime');
const CODE = iSup >= 0 ? process.argv[iSup + 1] : null;

const membres = await db.collection('leagues/' + LIGUE + '/members').get();
const invites = await db.collection('leagues/' + LIGUE + '/invites').get();

const date = ts => (ts && ts.toDate ? ts.toDate().toISOString().slice(0, 10) : '-');

console.log('\nMEMBRES (' + membres.size + ')\n');
console.log('  ' + 'identifiant'.padEnd(30) + 'nom'.padEnd(14) + 'especes'.padStart(8)
            + '  ' + 'entre le'.padEnd(12) + 'code utilise');
const lignes = [];
membres.forEach(d => {
  const m = d.data();
  lignes.push({ id: d.id, nom: m.name || '?', n: (m.species || []).length,
                entre: date(m.joinedAt), invite: m.invite || '' });
});
lignes.sort((a, b) => b.n - a.n);
for(const l of lignes){
  console.log('  ' + l.id.padEnd(30) + String(l.nom).padEnd(14) + String(l.n).padStart(8)
              + '  ' + l.entre.padEnd(12) + (l.invite || '-'));
}

console.log('\nCODES D INVITATION (' + invites.size + ')\n');
invites.forEach(d => {
  const i = d.data();
  console.log('  ' + d.id.padEnd(26) + (i.usedBy ? 'pris par ' + i.usedBy : 'LIBRE'));
});

if(!CODE){
  console.log('\nRien supprime. Pour retirer une fiche de test :');
  console.log('  node outils/build/menage-compte-test.mjs --supprime PLUME-XXXX-XXXX-XXXX\n');
  process.exit(0);
}

const cible = lignes.filter(l => l.invite === CODE);
// Plus d une fiche pour un code ne devrait jamais arriver : on s arrete plutot que de
// choisir au hasard laquelle effacer.
if(cible.length > 1){
  console.log('\nARRET : ' + cible.length + ' fiches portent le code ' + CODE + ', il en faut au plus une.');
  process.exit(1);
}
if(!invites.docs.some(d => d.id === CODE)){
  console.log('\nARRET : le code ' + CODE + ' n existe pas.');
  process.exit(1);
}

console.log('\n--- SUPPRESSION ---');
const f = cible[0] || null;
if(f){
  console.log('  fiche membre : ' + f.id + '  (' + f.nom + ', ' + f.n + ' especes, entre le ' + f.entre + ')');
} else {
  // Cas courant d un essai interrompu : le code a ete PRIS - premiere etape - mais la fiche
  // n a jamais ete creee. Le code reste alors au nom de ce compte, qui pourrait s en servir
  // plus tard : il faut donc le retirer quand meme.
  console.log('  fiche membre : aucune (code pris, mais inscription jamais terminee)');
}
console.log('  code         : ' + CODE);

if(f){
  await db.doc('leagues/' + LIGUE + '/members/' + f.id).delete();
  console.log('  fiche membre supprimee');
}
await db.doc('leagues/' + LIGUE + '/invites/' + CODE).delete();
console.log('  code supprime');

// La ligne accounts porte l email rattache a cette fiche : elle n a plus d objet.
if(f){
  const compte = db.doc('leagues/' + LIGUE + '/accounts/' + f.id);
  if((await compte.get()).exists){ await compte.delete(); console.log('  ligne accounts supprimee'); }
}

console.log('\nFait. Le compte Firebase, lui, existe toujours : il se supprime dans la console,');
console.log('et ce n est pas necessaire - sans fiche ni code, il ne voit plus rien.\n');
