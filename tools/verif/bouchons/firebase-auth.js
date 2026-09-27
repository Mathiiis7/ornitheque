/*
  Bouchon de firebase-auth. Aucun reseau, aucun compte : le banc declenche lui-meme la
  connexion par window.__auth.connecter(uid), avec isAnonymous a false puisque app.js ne
  demarre que pour un vrai compte (isRealAccount).
*/
const etat = { cb: null };

export function getAuth(){ return { currentUser: null }; }
// Firebase appelle l'observateur une premiere fois avec l'etat connu : ici, deconnecte.
export function onAuthStateChanged(auth, cb){ etat.cb = cb; cb(null); return () => {}; }
export function createUserWithEmailAndPassword(){ return Promise.reject(new Error('bouchon')); }
export function signInWithEmailAndPassword(){ return Promise.reject(new Error('bouchon')); }
export function signOut(){ return Promise.resolve(); }
export function sendPasswordResetEmail(){ return Promise.resolve(); }
export const EmailAuthProvider = { credential: () => ({ __cred: true }) };
export function linkWithCredential(){ return Promise.reject(new Error('bouchon')); }

window.__auth = {
  connecter(uid){
    if(!etat.cb) throw new Error('onAuthStateChanged pas encore appele par app.js');
    etat.cb({ uid, isAnonymous: false, email: 'banc@exemple.test', emailVerified: true,
              displayName: 'Banc', providerData: [{ providerId: 'password' }] });
  }
};
