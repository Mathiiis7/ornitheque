/*
  lire-xlsx.mjs - Lit un classeur .xlsx sans aucune dependance npm.

  POURQUOI. Le paquet `xlsx` n'est pas installe et ne l'est plus sur le registre officiel ;
  `build-habitats-avonet.mjs` l'importait et ne tourne donc plus. Un .xlsx n'est qu'un zip
  de fichiers XML : node sait le decompresser tout seul avec zlib. Ce module fait les deux
  choses dont on a besoin - ouvrir le zip, et rendre une feuille sous forme de tableau de
  lignes.

  PIEGE. `tar` refuse le .xlsx sous Windows et `Expand-Archive` exige l'extension .zip ;
  c'est pour ca qu'on decompresse ici plutot que d'appeler un outil du systeme.

  Usage :
    import { ouvrir } from './lire-xlsx.mjs';
    const wb = ouvrir('outils/birdbase.xlsx');
    const lignes = wb.feuille('Data');   // tableau de tableaux de chaines
*/
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

// --- Le zip -----------------------------------------------------------------

function entrees(buf){
  // Le repertoire central se trouve via l'enregistrement de fin, cherche a rebours.
  let eocd = -1;
  for(let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--){
    if(buf.readUInt32LE(i) === 0x06054b50){ eocd = i; break; }
  }
  if(eocd < 0) throw new Error('ce fichier n est pas un zip (donc pas un xlsx)');
  let p = buf.readUInt32LE(eocd + 16);
  const n = buf.readUInt16LE(eocd + 10);
  const out = {};
  for(let k = 0; k < n; k++){
    if(buf.readUInt32LE(p) !== 0x02014b50) throw new Error('repertoire central abime');
    const methode = buf.readUInt16LE(p + 10);
    const taille  = buf.readUInt32LE(p + 20);
    const lNom    = buf.readUInt16LE(p + 28);
    const lExtra  = buf.readUInt16LE(p + 30);
    const lComm   = buf.readUInt16LE(p + 32);
    const debut   = buf.readUInt32LE(p + 42);
    const nom     = buf.toString('utf8', p + 46, p + 46 + lNom);
    out[nom] = { methode, taille, debut };
    p += 46 + lNom + lExtra + lComm;
  }
  return out;
}

function extraire(buf, e){
  if(buf.readUInt32LE(e.debut) !== 0x04034b50) throw new Error('entete de fichier abime');
  // L'entete local porte ses propres longueurs : celles du repertoire central peuvent
  // differer, et lire les mauvaises decale tout le flux.
  const lNom   = buf.readUInt16LE(e.debut + 26);
  const lExtra = buf.readUInt16LE(e.debut + 28);
  const d = e.debut + 30 + lNom + lExtra;
  const brut = buf.subarray(d, d + e.taille);
  return e.methode === 0 ? brut : inflateRawSync(brut);
}

// --- Le classeur ------------------------------------------------------------

function deshtml(s){
  return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
          .replace(/&apos;/g,"'")
          .replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCodePoint(parseInt(h,16)))
          .replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d))
          .replace(/&amp;/g,'&');   // en dernier, sinon on deshtmlise deux fois
}

// A1 -> 0, AB12 -> 27.
function colonne(ref){
  let n = 0;
  for(const c of ref){
    if(c >= '0' && c <= '9') break;
    n = n * 26 + (c.charCodeAt(0) - 64);
  }
  return n - 1;
}

export function ouvrir(chemin){
  const buf = readFileSync(chemin);
  const zip = entrees(buf);
  const lire = nom => {
    const e = zip[nom];
    if(!e) throw new Error('absent du classeur : ' + nom);
    return extraire(buf, e).toString('utf8');
  };

  // Les chaines partagees. Un <si> peut contenir plusieurs <t> quand le texte est enrichi ;
  // ne prendre que le premier tronque les cellules.
  let SS = null;
  const chaines = () => {
    if(SS) return SS;
    SS = [];
    let src = '';
    try { src = lire('xl/sharedStrings.xml'); } catch(e){ return SS; }
    for(const si of src.split('<si>').slice(1)){
      const fin = si.indexOf('</si>');
      const bloc = fin >= 0 ? si.slice(0, fin) : si;
      let txt = '';
      for(const m of bloc.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) txt += m[1];
      SS.push(deshtml(txt));
    }
    return SS;
  };

  // Nom de feuille -> fichier, via workbook.xml et ses relations.
  const wb = lire('xl/workbook.xml');
  const rels = lire('xl/_rels/workbook.xml.rels');
  const cible = {};
  for(const m of rels.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)) cible[m[1]] = m[2];
  const fichierDe = {};
  for(const m of wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)){
    fichierDe[deshtml(m[1])] = 'xl/' + (cible[m[2]] || '').replace(/^\/?xl\//, '');
  }

  return {
    feuilles: () => Object.keys(fichierDe),
    feuille(nom, maxLignes){
      const f = fichierDe[nom];
      if(!f) throw new Error('feuille introuvable : ' + nom + ' (il y a ' + Object.keys(fichierDe).join(', ') + ')');
      const src = lire(f);
      const S = chaines();
      const lignes = [];
      for(const mr of src.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)){
        const cells = [];
        for(const mc of mr[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g)){
          const i = colonne(mc[1]);
          const type = /t="([^"]+)"/.exec(mc[2]);
          const v = /<v>([\s\S]*?)<\/v>/.exec(mc[3]);
          let val = '';
          if(type && type[1] === 's') val = v ? (S[+v[1]] ?? '') : '';
          else if(type && type[1] === 'inlineStr'){
            const t = /<t[^>]*>([\s\S]*?)<\/t>/.exec(mc[3]);
            val = t ? deshtml(t[1]) : '';
          } else val = v ? deshtml(v[1]) : '';
          cells[i] = val;
        }
        lignes.push(cells);
        if(maxLignes && lignes.length >= maxLignes) break;
      }
      return lignes;
    },
  };
}
