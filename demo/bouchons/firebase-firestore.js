/*
  Demo du portfolio : bouchon de firebase-firestore, VIVANT.

  C est la difference de fond avec le bouchon des bancs (outils/verif/bouchons/), qui compte
  les ecritures et les jette. Ici elles sont appliquees a une petite base tenue en memoire,
  et les abonnes du chemin touche sont rappeles aussitot. Resultat : le visiteur ecrit dans
  le chat et son message apparait, coche une espece et le classement bouge. Rien ne sort
  jamais de son navigateur - il n y a pas une ligne de reseau ici - et rien n est garde :
  recharger la page remet la demo a zero.

  Ce choix a ete tranche par Mathis le 2026-09-28 : un bouton qui a l air de marcher et qui
  echoue en silence est le defaut maison. Dans une demo, soit le bouton agit, soit il est
  desactive avec une explication.

  Forme des chemins : un nombre PAIR de morceaux designe un document
  (leagues/merlin-bird/members/uid-moi), un nombre IMPAIR une collection
  (leagues/merlin-bird/members). C est la regle de Firestore, et elle suffit ici pour savoir
  quoi livrer a un abonne.
*/
import { DONNEES } from '../donnees.js';

// chemin complet du document -> ses donnees
const base = new Map();
// chemin abonne -> [{ cb, errCb, tri, limite, filtres }]
const abonnes = new Map();
let compteurId = 0;

/* ---------------- horodatages ---------------- */
// app.js lit selon les endroits .toDate(), .seconds et .toMillis() : les trois existent.
export function horodatage(ms){
  return { seconds: Math.floor(ms / 1000), nanoseconds: 0,
           toDate(){ return new Date(ms); }, toMillis(){ return ms; },
           valueOf(){ return ms; } };
}
function estHorodatage(v){ return v && typeof v.toMillis === 'function'; }

/* ---------------- la base ---------------- */
function morceaux(chemin){ return chemin.split('/'); }
function estDocument(chemin){ return morceaux(chemin).length % 2 === 0; }
function parent(chemin){ const m = morceaux(chemin); m.pop(); return m.join('/'); }

// Documents enfants DIRECTS d une collection. Une sous-collection ne remonte pas : dans
// Firestore non plus, lister une collection ne descend pas dedans.
function documentsDe(cheminCollection){
  const prefixe = cheminCollection + '/';
  const profondeur = morceaux(cheminCollection).length + 1;
  const out = [];
  for(const [chemin, donnees] of base){
    if(!chemin.startsWith(prefixe)) continue;
    if(morceaux(chemin).length !== profondeur) continue;
    out.push({ id: morceaux(chemin).pop(), data: donnees });
  }
  return out;
}

/* ---------------- snapshots ---------------- */
function snapshot(docs){
  const arr = docs.map(d => ({ id: d.id, exists: () => true, data: () => d.data,
                               get: k => d.data[k] }));
  return {
    forEach: f => arr.forEach(f),
    docs: arr, size: arr.length, empty: arr.length === 0,
    docChanges: () => arr.map(d => ({ type: 'added', doc: d })),
    // Snapshot de document unique : le premier document livre fait office de contenu, et
    // une liste vide veut dire "ce document n existe pas".
    exists: () => arr.length > 0,
    // arr[0].data est une FONCTION (le SDK rend les donnees par appel) : il faut l appeler,
    // sinon un getDoc sur un document existant rend la fonction elle-meme. Attrape le
    // 2026-09-29 par le banc photos, sur le bouchon jumeau de outils/verif/.
    data: () => (arr.length ? arr[0].data() : undefined),
    id: arr.length ? arr[0].id : 'inconnu',
    metadata: { fromCache: false, hasPendingWrites: false }
  };
}

function valeurTri(d, champ){
  const v = d.data[champ];
  if(estHorodatage(v)) return v.toMillis();
  if(typeof v === 'number') return v;
  if(typeof v === 'string') return v;
  return 0;
}

function contenuPour(chemin, opts){
  if(estDocument(chemin)){
    return base.has(chemin) ? [{ id: morceaux(chemin).pop(), data: base.get(chemin) }] : [];
  }
  let docs = documentsDe(chemin);
  for(const f of (opts && opts.filtres) || []){
    docs = docs.filter(d => d.data[f.champ] === f.valeur);
  }
  if(opts && opts.tri){
    const { champ, sens } = opts.tri;
    docs.sort((a, b) => {
      const va = valeurTri(a, champ), vb = valeurTri(b, champ);
      const c = va < vb ? -1 : va > vb ? 1 : 0;
      return sens === 'desc' ? -c : c;
    });
  }
  if(opts && opts.limite) docs = docs.slice(0, opts.limite);
  return docs;
}

function livrer(chemin, inscrit){
  try{ inscrit.cb(snapshot(contenuPour(chemin, inscrit))); }
  catch(e){ console.error('[demo] erreur dans un observateur de ' + chemin, e); }
}

// Apres une ecriture, seuls deux chemins peuvent avoir change de contenu : le document
// lui-meme et la collection qui le contient. Rappeler TOUS les abonnes relancerait le
// rendu complet a chaque frappe dans le chat.
function notifier(cheminDoc){
  for(const chemin of [cheminDoc, parent(cheminDoc)]){
    for(const inscrit of abonnes.get(chemin) || []) livrer(chemin, inscrit);
  }
}

/* ---------------- l API que app.js appelle ---------------- */
function ref(parts, opts){
  return { __chemin: parts.join('/'), __parts: parts, id: parts[parts.length - 1] || '',
           tri: (opts && opts.tri) || null, limite: (opts && opts.limite) || 0,
           filtres: (opts && opts.filtres) || [] };
}
function assemble(a){
  const out = [];
  for(const x of a){
    if(x && x.__parts) out.push(...x.__parts);
    else if(typeof x === 'string') out.push(x);
  }
  return out;
}

export function getFirestore(){ return { __db: true }; }
// app.js passe par initializeFirestore depuis le 2026-09-29, pour pouvoir demander
// experimentalForceLongPolling. Le bouchon ignore le reglage, il n a pas de reseau.
export function initializeFirestore(){ return { __db: true }; }
export function collection(...a){ return ref(assemble(a)); }
// doc(collection(...)) sans identifiant : le vrai SDK en fabrique un sur-le-champ, sans
// aller au reseau. app.js s en sert pour donner le MEME identifiant a une photo et aux
// deux documents qui portent ses images. Un chemin de collection a un nombre impair de
// segments (leagues/X/photos), un chemin de document un nombre pair.
let _compteurAuto = 0;
export function doc(...a){
  const parts = assemble(a);
  if(parts.length % 2 === 1) parts.push('auto' + (++_compteurAuto) + Date.now().toString(36));
  return ref(parts);
}
export function orderBy(champ, sens){ return { __contrainte: 'orderBy', champ, sens: sens || 'asc' }; }
export function limit(n){ return { __contrainte: 'limit', n }; }
export function where(champ, op, valeur){ return { __contrainte: 'where', champ, op, valeur }; }
export function serverTimestamp(){ return { __ts: true }; }
export function deleteField(){ return { __del: true }; }

export function query(r, ...contraintes){
  const opts = { tri: r.tri, limite: r.limite, filtres: [...(r.filtres || [])] };
  for(const c of contraintes){
    if(!c || !c.__contrainte) continue;
    if(c.__contrainte === 'orderBy') opts.tri = { champ: c.champ, sens: c.sens };
    if(c.__contrainte === 'limit') opts.limite = c.n;
    // Seul '==' est utilise par app.js (la suppression de compte, qui cherche ses propres
    // documents). Un autre operateur passerait ici sans filtrer : on le dit plutot que de
    // rendre trop de documents en silence.
    if(c.__contrainte === 'where'){
      if(c.op !== '==') console.warn('[demo] where ' + c.op + ' non gere, filtre ignore');
      else opts.filtres.push({ champ: c.champ, valeur: c.valeur });
    }
  }
  return ref(r.__parts, opts);
}

/* ---------------- lectures ---------------- */
export function getDoc(r){ return Promise.resolve(snapshot(contenuPour(r.__chemin, r))); }
export function getDocs(r){ return Promise.resolve(snapshot(contenuPour(r.__chemin, r))); }

export function onSnapshot(r, cb, errCb){
  const chemin = r.__chemin;
  const inscrit = { cb, errCb, tri: r.tri, limite: r.limite, filtres: r.filtres };
  if(!abonnes.has(chemin)) abonnes.set(chemin, []);
  abonnes.get(chemin).push(inscrit);
  // Livraison differee, comme Firestore qui repond toujours apres la frame courante.
  // Le banc trophees a montre qu un snapshot arrive trop tot casse le demarrage.
  setTimeout(() => livrer(chemin, inscrit), 0);
  return () => {
    const l = abonnes.get(chemin) || [];
    const i = l.indexOf(inscrit);
    if(i >= 0) l.splice(i, 1);
  };
}

/* ---------------- ecritures ---------------- */
// Remplace les marqueurs serverTimestamp() par un vrai horodatage et retire les champs
// marques deleteField(). Recursif : app.js ecrit des objets imbriques (replyTo).
function applique(cible, donnees){
  for(const [k, v] of Object.entries(donnees)){
    if(v && v.__del){ delete cible[k]; continue; }
    if(v && v.__ts){ cible[k] = horodatage(Date.now()); continue; }
    if(v && typeof v === 'object' && !Array.isArray(v) && !estHorodatage(v)
       && cible[k] && typeof cible[k] === 'object' && !Array.isArray(cible[k])){
      applique(cible[k], v);
      continue;
    }
    cible[k] = v;
  }
  return cible;
}
function nettoie(donnees){ return applique({}, donnees); }

export function setDoc(r, donnees, opts){
  const fusion = !!(opts && opts.merge);
  const actuel = fusion ? (base.get(r.__chemin) || {}) : {};
  base.set(r.__chemin, applique({ ...actuel }, donnees || {}));
  notifier(r.__chemin);
  return Promise.resolve();
}
export function updateDoc(r, donnees){
  if(!base.has(r.__chemin)){
    // Firestore refuse un update sur un document absent, et app.js compte la-dessus :
    // la prise d un code d invitation echoue ainsi quand le code n existe pas.
    return Promise.reject(Object.assign(new Error('document absent'), { code: 'not-found' }));
  }
  base.set(r.__chemin, applique({ ...base.get(r.__chemin) }, donnees || {}));
  notifier(r.__chemin);
  return Promise.resolve();
}
export function deleteDoc(r){
  base.delete(r.__chemin);
  notifier(r.__chemin);
  return Promise.resolve();
}
export function addDoc(r, donnees){
  const id = 'demo-' + (++compteurId);
  const chemin = r.__chemin + '/' + id;
  base.set(chemin, nettoie(donnees || {}));
  notifier(chemin);
  return Promise.resolve({ id, __chemin: chemin, __parts: morceaux(chemin) });
}
export function writeBatch(){
  const ops = [];
  return {
    set(r, d, o){ ops.push(() => setDoc(r, d, o)); return this; },
    update(r, d){ ops.push(() => updateDoc(r, d)); return this; },
    delete(r){ ops.push(() => deleteDoc(r)); return this; },
    commit(){ return Promise.all(ops.map(f => f().catch(() => {}))).then(() => {}); }
  };
}

/* ---------------- la fausse ligue ---------------- */
// Chargee une fois, au chargement du module, donc avant le premier abonnement d app.js.
for(const [chemin, donnees] of Object.entries(DONNEES)) base.set(chemin, donnees);

// Utile pour regarder ce que contient la demo depuis la console du navigateur.
window.__demo = { base, abonnes, chemins: () => [...abonnes.keys()] };
