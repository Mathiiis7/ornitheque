/*
  Demo du portfolio : bouchon de firebase-auth. Aucun reseau, aucun compte.

  Difference avec le bouchon des bancs : ici la connexion se fait TOUTE SEULE. Le banc
  attend que son scenario appelle window.__auth.connecter(uid) ; un visiteur du portfolio,
  lui, ne doit rien avoir a faire. On connecte donc des qu app.js pose son observateur.

  isAnonymous vaut false parce qu app.js ne demarre que pour un vrai compte
  (isRealAccount). Le detour par un setTimeout de 0 reproduit le comportement de Firebase,
  qui repond toujours apres la frame courante : sans lui, boot() partirait avant la fin du
  chargement du module et les bancs ont deja montre que cet ordre-la casse des choses.
*/
import { UID_MOI } from '../donnees.js';

const etat = { cb: null, user: null };

function utilisateur(){
  return { uid: UID_MOI, isAnonymous: false, email: 'visiteur@demo.test', emailVerified: true,
           displayName: 'Visiteur', providerData: [{ providerId: 'password' }] };
}

export function getAuth(){ return { get currentUser(){ return etat.user; } }; }

export function onAuthStateChanged(auth, cb){
  etat.cb = cb;
  cb(null);                       // Firebase annonce d abord l etat connu : deconnecte.
  setTimeout(() => { etat.user = utilisateur(); cb(etat.user); }, 0);
  return () => {};
}

// La demo n a pas de portail de connexion : ces fonctions ne devraient jamais etre
// appelees. Elles echouent proprement plutot que de manquer et de casser l import.
export function createUserWithEmailAndPassword(){ return Promise.reject(new Error('demo')); }
export function signInWithEmailAndPassword(){ return Promise.reject(new Error('demo')); }
export function signOut(){ return Promise.resolve(); }
export function sendPasswordResetEmail(){ return Promise.resolve(); }
export const EmailAuthProvider = { credential: () => ({ __cred: true }) };
export function linkWithCredential(){ return Promise.reject(new Error('demo')); }
