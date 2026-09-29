/*
  Bouchon de firebase-firestore. Aucun reseau : les references ne portent que leur chemin, et
  le banc livre les snapshots quand il veut, dans l'ordre qu'il veut. C'est tout l'objet du
  banc - l'ordre d'arrivee des snapshots au demarrage est justement ce qui cassait.

  Les ecritures ne partent nulle part et sont seulement comptees (window.__ecritures) : un banc
  ne doit jamais toucher la vraie ligue.
*/
const abonnes = new Map();   // chemin -> [callback]

function ref(parts){ return { __chemin: parts.join('/'), __parts: parts }; }
// collection(db, 'leagues', id, 'members') ou doc(refCollection, id) : on ne garde que les
// morceaux de chemin. Le db et les contraintes (orderBy, limit, where) n'en portent pas.
function morceaux(a){
  const out = [];
  for(const x of a){
    if(x && x.__parts) out.push(...x.__parts);
    else if(typeof x === 'string') out.push(x);
  }
  return out;
}

function snapshot(docs){
  const arr = docs.map(d => ({ id: d.id, exists: () => true, data: () => d.data,
                               get: k => d.data[k] }));
  return {
    forEach: f => arr.forEach(f),
    docs: arr, size: arr.length, empty: arr.length === 0,
    docChanges: () => arr.map(d => ({ type: 'added', doc: d })),
    // Snapshot de document unique : le premier doc livre fait office de contenu.
    exists: () => arr.length > 0,
    // arr[0].data est une FONCTION : il faut l appeler, sinon un snapshot de document
    // unique rend la fonction au lieu des donnees.
    data: () => (arr.length ? arr[0].data() : undefined),
    id: arr.length ? arr[0].id : 'inconnu',
    metadata: { fromCache: false, hasPendingWrites: false }
  };
}

/*
  Comptage des lectures, pour le banc firestore. Facturation reelle de Firestore : a
  l'abonnement, CHAQUE document du premier snapshot compte une lecture ; ensuite une lecture
  par document modifie. Un getDoc compte une lecture meme si le document n'existe pas.
  Ici on releve la STRUCTURE - combien d'abonnements, sur quels chemins, combien d'appels
  ponctuels - et le banc multiplie par la taille reelle des collections.
*/
window.__lectures = { abonnements: [], ponctuelles: [], docsLivres: 0 };
function compter(quoi, r){ window.__lectures.ponctuelles.push(quoi + ' ' + ((r && r.__chemin) || '?')); }

export function getFirestore(){ return { __db: true }; }
// app.js passe par initializeFirestore depuis le 2026-09-29, pour pouvoir demander
// experimentalForceLongPolling. Le bouchon ignore le reglage, il n a pas de reseau.
export function initializeFirestore(){ return { __db: true }; }
export function collection(...a){ return ref(morceaux(a)); }
// doc(collection(...)) sans identifiant : le vrai SDK en fabrique un sans aller au reseau.
// app.js s en sert pour donner le MEME identifiant a une photo et aux deux documents qui
// portent ses images. Un chemin de collection a un nombre IMPAIR de morceaux.
let compteurAuto = 0;
export function doc(...a){
  const parts = morceaux(a);
  if(parts.length % 2 === 1) parts.push('auto' + (++compteurAuto));
  return ref(parts);
}
export function query(r){ return r; }
export function orderBy(){ return { __contrainte: 'orderBy' }; }
export function limit(){ return { __contrainte: 'limit' }; }
export function where(){ return { __contrainte: 'where' }; }
export function serverTimestamp(){ return { __ts: true }; }
export function deleteField(){ return { __del: true }; }
// Documents lisibles un par un, poses d avance par le banc (window.__fs.poser). Sans eux
// getDoc rend du vide, ce qui reste le comportement par defaut pour les autres bancs.
const magasin = new Map();
export function getDoc(r){
  compter('getDoc', r);
  const chemin = (r && r.__chemin) || '';
  // Snapshot de document unique, construit ici et non par snapshot() : celui-la rend
  // arr[0].data, qui est la FONCTION data et non les donnees. Le piege m a coute une
  // mesure fausse - les vignettes etaient bien lues, et arrivaient vides.
  if(magasin.has(chemin)){
    const d = magasin.get(chemin);
    return Promise.resolve({ exists: () => true, data: () => d, get: k => d[k],
                             id: chemin.split('/').pop(),
                             metadata: { fromCache: false, hasPendingWrites: false } });
  }
  return Promise.resolve(snapshot([]));
}
export function getDocs(r){ compter('getDocs', r); return Promise.resolve(snapshot([])); }

window.__ecritures = [];
function ecrire(op, r){ window.__ecritures.push(op + ' ' + ((r && r.__chemin) || '?')); return Promise.resolve(); }
export function setDoc(r){ return ecrire('set', r); }
export function updateDoc(r){ return ecrire('update', r); }
export function deleteDoc(r){ return ecrire('delete', r); }
export function addDoc(r){ ecrire('add', r); return Promise.resolve({ id: 'bouchon' }); }
export function writeBatch(){
  return { set(r){ ecrire('batch.set', r); return this; }, update(r){ ecrire('batch.update', r); return this; },
           delete(r){ ecrire('batch.delete', r); return this; }, commit(){ return Promise.resolve(); } };
}

export function onSnapshot(r, cb){
  const c = (r && r.__chemin) || '?';
  window.__lectures.abonnements.push(c);
  if(!abonnes.has(c)) abonnes.set(c, []);
  abonnes.get(c).push(cb);
  return () => {};
}

window.__erreurs = [];
window.__fs = {
  chemins(){ return [...abonnes.keys()]; },
  // Pose le contenu d un document precis, pour que getDoc le rende. Sert au banc photos,
  // qui verifie que la vignette et l image pleine ne sont lues qu au moment de les regarder.
  poser(chemin, data){ magasin.set(chemin, data); },
  // Livre un snapshot a TOUS les abonnes d'un chemin, et retourne leur nombre : 0 veut dire que
  // le banc s'est trompe de chemin, et il doit le voir plutot que de mesurer le vide.
  //
  // Chaque callback est isole, comme chez Firestore : une exception dans un observateur remonte
  // a la console et n'empeche pas les suivants de tourner. Sans cette isolation le banc
  // s'arretait a la premiere erreur et n'en voyait qu'une sur trois.
  livrer(chemin, docs){
    const cbs = abonnes.get(chemin) || [];
    const s = snapshot(docs || []);
    window.__lectures.docsLivres += (docs || []).length * (abonnes.get(chemin) || []).length;
    for(const cb of cbs){
      try{ cb(s); }
      catch(e){ window.__erreurs.push({ chemin, message: String((e && e.message) || e),
                                        pile: String((e && e.stack) || '').split('\n').slice(0, 4).join(' | ') }); }
    }
    return cbs.length;
  }
};
