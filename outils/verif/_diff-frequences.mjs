// Compare des fichiers de fréquences ({sci:[...]} ou {zone:{sci:[...]}}) entre git HEAD et le dossier de
// travail : espèces ajoutées / retirées, valeurs non nulles modifiées, zéros devenus des petites valeurs.
// Usage : node outils/verif/_diff-frequences.mjs <fichier> [...]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const R = new URL('../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const aplatir = o => {
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) r[k] = v;
    else for (const [s, w] of Object.entries(v)) r[k + ' | ' + s] = w;
  }
  return r;
};
for (const f of process.argv.slice(2)) {
  const avant = aplatir(JSON.parse(execFileSync('git', ['-C', R, 'show', 'HEAD:' + f], { maxBuffer: 1e9 }).toString()));
  const apres = aplatir(JSON.parse(readFileSync(R + f, 'utf8')));
  const ajout = Object.keys(apres).filter(k => !(k in avant)), retrait = Object.keys(avant).filter(k => !(k in apres));
  let zerosRemplis = 0, valeursChangees = 0; const exemples = [];
  for (const k of Object.keys(apres)) if (k in avant) apres[k].forEach((v, i) => {
    const a = avant[k][i];
    if (a === v) return;
    if (!a && v) zerosRemplis++;
    else { valeursChangees++; if (exemples.length < 3) exemples.push(`${k}[${i}] ${a} -> ${v}`); }
  });
  console.log(`${f} : +${ajout.length} -${retrait.length} entrées, ${zerosRemplis} zéros remplis, ${valeursChangees} valeurs changées`);
  if (ajout.length) console.log('   ajoutées :', ajout.slice(0, 5).join(' ; '));
  if (retrait.length) console.log('   retirées :', retrait.slice(0, 5).join(' ; '));
  if (exemples.length) console.log('   ex. :', exemples.join(' ; '));
}
