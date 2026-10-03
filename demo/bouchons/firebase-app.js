/*
  Demo du portfolio : bouchon de firebase-app, servi a la place du module gstatic par
  l importmap de demo/index.html. app.js ne se sert d initializeApp que pour passer son
  objet a getAuth et getFirestore.

  Jumeau de outils/verif/bouchons/firebase-app.js, et c est voulu : les bancs ont besoin de
  choisir l ordre d arrivee des snapshots, la demo a besoin qu ils arrivent tout seuls.
  Les faire cohabiter dans un seul fichier rendrait les deux illisibles.
*/
export function initializeApp(cfg){ return { name: 'demo', options: cfg }; }
