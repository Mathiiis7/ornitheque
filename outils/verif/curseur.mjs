/*
  Le curseur dessine - un « ? » - et la regle qui va avec : il ne doit apparaitre QUE la ou
  une infobulle va suivre.

  CE QU IL A DEJA RATE
  - trois `cursor:help` ecrits a la main plus bas dans la feuille annulaient la regle
    generale, a specificite egale ; trois autres dormaient encore dans le quiz, trouves le
    2026-09-29 - .qz-pill, .qz-daily-streak et .qz-stats-scope, tous les trois avec un title ;
  - un attribut vide - title="" sur un GIF sans titre - donnait un « ? » et aucune bulle ;
  - le nom de zone gardait son data-tip meme entier, donc le « ? » promettait une
    explication que rien ne suivait.
*/
import { page, RACINE } from './_banc.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const nom = 'curseur';
export const titre = 'Curseur dessine et infobulles';
export const quoi = 'le « ? » n apparaît que si une bulle suit';

export function html(){
  const css = readFileSync(join(RACINE, 'styles.css'), 'utf8');
  // Depuis le 2026-10-05 l'image vit dans la variable --curseur-aide (reprise par les tris du
  // Classement, seuls boutons a montrer le « ? » malgre leur clic, a la demande de Mathis).
  const m = /--curseur-aide: url\("(data:image\/svg\+xml,[^"]+)"\)\s*([\d.]+)\s*([\d.]+), help;/.exec(css);
  if(!m) throw new Error('la règle du curseur est introuvable ou a changé de forme');

  return page({
    titre,
    styleEnPlus: '  .banc { background:#fff; padding:14px; border-radius:10px; display:flex; gap:18px; align-items:center; flex-wrap:wrap; }\n'
      + '  .sombre { background:#3e4c48; padding:10px; border-radius:8px; display:inline-flex; }',
    corps: `<h3>l image du curseur, taille réelle, agrandie, sur fond sombre</h3>
<div class="banc">
  <img id="img" src="${m[1]}" width="14" height="14">
  <img src="${m[1]}" width="120" height="120" style="image-rendering:pixelated;">
  <span class="sombre"><img src="${m[1]}" width="14" height="14"></span>
</div>
<h3>où le curseur doit apparaître</h3>
<div class="banc">
  <span data-tip="une explication" id="bulle">texte avec infobulle</span>
  <span class="pkdx-exo" data-tip="Introduit établi (N)" id="jeton">N</span>
  <button class="rar-chip on" data-tier="3" style="background:#22c55e;" id="bouton">3</button>
  <span id="nue">texte sans infobulle</span>
  <span data-tip="" id="vide">attribut vide</span>
  <span title="" id="vide2">title vide</span>
  <span class="qz-pill" title="Taux de bonnes réponses" id="pastilleQuiz">🎯 <b>72%</b></span>
  <div class="qz-daily-streak" title="Jours consécutifs joués" id="serieQuiz">🔥 <b>3</b></div>
  <span class="qz-stats-scope" title="Classement séparé par difficulté" id="porteeQuiz">🟢 Facile</span>
  <input value="un champ" id="champ">
</div>`,
    source: `const POINT_CHAUD = ${JSON.stringify(m[2] + ',' + m[3])};`,
    script: `
const curseur = (el) => { const c = getComputedStyle(el).cursor;
  return /^url\\(/.test(c) ? 'aide' : c === 'pointer' ? 'main' : c === 'text' ? 'texte'
    : (c === 'auto' || c === 'default') ? 'normal' : c; };

const suite = () => {
  const img = document.getElementById('img');
  verif('image du curseur valide', img.naturalWidth ? img.naturalWidth + '×' + img.naturalHeight + ', point chaud ' + POINT_CHAUD : 'INVALIDE',
    !!img.naturalWidth);
  // L'encre du « ? » : c'est elle qu'on voit, pas la boite de l'image.
  if (img.naturalWidth) {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    cv.getContext('2d').drawImage(img, 0, 0);
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++)
      if (d[(y * cv.width + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const h = y1 - y0 + 1;
    verif('taille de l encre', (x1 - x0 + 1) + ' × ' + h + ' px', h > 0 && h <= 14);
  }

  for (const [id, attendu] of [['bulle','aide'], ['jeton','aide'], ['bouton','main'],
      ['nue','normal'], ['vide','normal'], ['vide2','normal'], ['champ','texte'],
      ['pastilleQuiz','aide'], ['serieQuiz','aide'], ['porteeQuiz','aide']]) {
    const el = document.getElementById(id);
    const vu = curseur(el);
    verif(el.textContent.trim() || 'champ de saisie', vu, vu === attendu);
  }
  note('');
  note('(un attribut vide ne doit pas donner le « ? » : il n y aurait pas de bulle derrière ;');
  note(' un bouton garde la main, la bulle vient en plus du clic)');
  fini();
};
const img = document.getElementById('img');
if (img.complete) suite(); else { img.onload = suite; img.onerror = suite; }`,
  });
}
