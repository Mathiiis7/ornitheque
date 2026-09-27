/*
  _banc.mjs - le socle commun des bancs de mesure.

  UN BANC, C'EST QUOI
  Une page qui charge la VRAIE CSS du site et les VRAIES fonctions d'app.js, les fait tourner
  dans un vrai navigateur, et imprime des chiffres. Pas une capture d'ecran qu'on regarde de
  pres : des nombres qu'on compare.

  Chaque banc exporte { nom, titre, quoi, page() }. `page()` rend le HTML complet.
  Dans la page, deux fonctions sont fournies :

    verif(libelle, valeur, ok)   empile une ligne de resultat
    fini()                       affiche tout et rend le verdict au lanceur

  Le lanceur (tous.mjs) attend `window.__fini`, lit `window.__ok` et `#mesure`.

  LES BANCS PILOTES
  Un banc peut aussi exporter { nom, titre, quoi, mesure({ navigateur }) } au lieu de page() :
  c'est lui qui conduit le navigateur, parce qu'il a besoin de plus qu'une page a regarder -
  charger app.js en entier, choisir l'ordre d'arrivee des donnees, avancer le temps. Il rend
  { ok, sortie } et se sert de rapport() pour ecrire ses lignes comme les autres.
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Extrait une fonction d'app.js par son nom, telle quelle. Les bancs jouent le vrai code,
// jamais une copie : une copie divergerait, et un banc qui teste autre chose que le site ne
// sert a rien.
let _lignes = null;
function lignesApp(){
  if(!_lignes) _lignes = readFileSync(join(RACINE, 'app.js'), 'utf8').split(/\r?\n/);
  return _lignes;
}
export function fonction(nom){
  const L = lignesApp();
  const i = L.findIndex(l => l.startsWith('function ' + nom + '('));
  if(i < 0) throw new Error(`fonction introuvable dans app.js : ${nom}`);
  if(L[i].trimEnd().endsWith('}')) return L[i];
  const fin = L.findIndex((l, j) => j > i && l === '}');
  if(fin < 0) throw new Error(`fin de fonction introuvable : ${nom}`);
  return L.slice(i, fin + 1).join('\n');
}
export function fonctions(...noms){ return noms.map(fonction).join('\n\n'); }

/*
  Une constante d'app.js, telle quelle. Elle peut valoir n'importe quoi - un objet, un
  tableau, une chaine, un nombre - alors on lit de `= ` jusqu'au `;` de fin, en suivant la
  profondeur des parentheses et en sautant ce qui est entre guillemets. Une premiere version
  ne savait ouvrir que { et [ : sur `const _CORPS_ENCART_APP = 27;` elle partait chercher une
  accolade bien plus loin et ramenait du code sans rapport.
*/
export function constante(nom){
  const src = readFileSync(join(RACINE, 'app.js'), 'utf8');
  const i = src.indexOf('const ' + nom + ' = ');
  if(i < 0) throw new Error(`constante introuvable : ${nom}`);
  let j = src.indexOf('=', i) + 1, d = 0, chaine = null;
  const debut = j;
  for(; j < src.length; j++){
    const c = src[j];
    if(chaine){
      if(c === '\\'){ j++; continue; }
      if(c === chaine) chaine = null;
      continue;
    }
    if(c === "'" || c === '"' || c === '`'){ chaine = c; continue; }
    if(c === '/' && src[j + 1] === '/'){ j = src.indexOf('\n', j); if(j < 0) break; continue; }
    if('{[('.includes(c)) d++;
    else if('}])'.includes(c)) d--;
    else if(c === ';' && d === 0) break;
  }
  return 'const ' + nom + ' =' + src.slice(debut, j) + ';';
}

/*
  Le meme verif() / note() / verdict, mais cote Node, pour les bancs pilotes. La mise en forme
  est ecrite une seule fois : celle de fini(), plus bas, est sa jumelle dans la page.
*/
export function rapport(){
  const C = [];
  return {
    verif(libelle, valeur, ok){ C.push({ libelle, valeur: String(valeur), ok: !!ok }); },
    note(texte){ C.push({ note: texte }); },
    rendu(){
      const larg = Math.max(...C.filter(c => c.libelle).map(c => c.libelle.length), 0) + 2;
      const rates = C.filter(c => c.libelle && !c.ok).length;
      const lignes = C.map(c => c.note !== undefined ? c.note
        : c.libelle.padEnd(larg) + c.valeur.padEnd(26) + (c.ok ? 'ok' : 'DEFAUT'));
      return { ok: rates === 0,
               sortie: lignes.join('\n') + '\n\n' + (rates ? rates + ' DEFAUT(S)' : 'CONFORME') };
    }
  };
}

// Le squelette de page. `corps` est le HTML a mesurer, `script` le code qui mesure.
export function page({ titre, styleEnPlus = '', corps, source = '', script }){
  return `<!doctype html><meta charset="utf-8"><title>${titre}</title>
<link rel="stylesheet" href="styles.css">
<style>
  body { font:14px system-ui; padding:16px; background:#eef1f0; }
  h3 { font:700 11px system-ui; color:#888; margin:16px 0 5px; text-transform:uppercase; letter-spacing:.5px; }
  #mesure { font:12px ui-monospace; background:#fff; padding:12px; border-radius:10px;
    white-space:pre; display:block; margin-top:16px; line-height:1.5; }
${styleEnPlus}
</style>
${corps}
<div id="mesure"></div>
<script>
const SL = String.fromCharCode(10);
const __C = [];
// Une ligne de resultat : ok a false suffit a faire echouer le banc.
function verif(libelle, valeur, ok){ __C.push({ libelle, valeur: String(valeur), ok: !!ok }); }
// Un simple commentaire dans la sortie, qui ne juge rien.
function note(texte){ __C.push({ note: texte }); }
function fini(){
  const larg = Math.max(...__C.filter(c => c.libelle).map(c => c.libelle.length), 0) + 2;
  const lignes = __C.map(c => c.note !== undefined ? c.note
    : c.libelle.padEnd(larg) + c.valeur.padEnd(26) + (c.ok ? 'ok' : 'DEFAUT'));
  const rates = __C.filter(c => c.libelle && !c.ok).length;
  window.__ok = rates === 0;
  document.getElementById('mesure').textContent = lignes.join(SL) + SL + SL
    + (rates ? rates + ' DEFAUT(S)' : 'CONFORME');
  window.__fini = true;
}
${source}
${script}
</script>`;
}
