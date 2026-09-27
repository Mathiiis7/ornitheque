/*
  Bouchon de firebase-app, servi a la place du module gstatic (voir l'importmap du banc).
  app.js ne se sert d'initializeApp que pour passer son objet a getAuth et getFirestore.
*/
export function initializeApp(cfg){ return { name: 'bouchon', options: cfg }; }
