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
    data: () => (arr.length ? arr[0].data : undefined),
    id: arr.length ? arr[0].id : 'inconnu',
    metadata: { fromCache: false, hasPendingWrites: false }
  };
}

export function getFirestore(){ return { __db: true }; }
export function collection(...a){ return ref(morceaux(a)); }
export function doc(...a){ return ref(morceaux(a)); }
export function query(r){ return r; }
export function orderBy(){ return { __contrainte: 'orderBy' }; }
export function limit(){ return { __contrainte: 'limit' }; }
export function where(){ return { __contrainte: 'where' }; }
export function serverTimestamp(){ return { __ts: true }; }
export function deleteField(){ return { __del: true }; }
export function getDoc(){ return Promise.resolve(snapshot([])); }
export function getDocs(){ return Promise.resolve(snapshot([])); }

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
  if(!abonnes.has(c)) abonnes.set(c, []);
  abonnes.get(c).push(cb);
  return () => {};
}

window.__erreurs = [];
window.__fs = {
  chemins(){ return [...abonnes.keys()]; },
  // Livre un snapshot a TOUS les abonnes d'un chemin, et retourne leur nombre : 0 veut dire que
  // le banc s'est trompe de chemin, et il doit le voir plutot que de mesurer le vide.
  //
  // Chaque callback est isole, comme chez Firestore : une exception dans un observateur remonte
  // a la console et n'empeche pas les suivants de tourner. Sans cette isolation le banc
  // s'arretait a la premiere erreur et n'en voyait qu'une sur trois.
  livrer(chemin, docs){
    const cbs = abonnes.get(chemin) || [];
    const s = snapshot(docs || []);
    for(const cb of cbs){
      try{ cb(s); }
      catch(e){ window.__erreurs.push({ chemin, message: String((e && e.message) || e),
                                        pile: String((e && e.stack) || '').split('\n').slice(0, 4).join(' | ') }); }
    }
    return cbs.length;
  }
};
