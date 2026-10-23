/*
  Les ronds de palier et de statut exotique : leur chiffre ou leur lettre doit etre centre.

  CE QU ILS ONT DEJA RATE
  Quatre fois. Les trois premieres, en centrant la BOITE du texte au lieu de son ENCRE : pour
  une capitale ou un chiffre, l'encre va de la ligne de base a la hauteur de capitale, la boite
  descend jusqu'a la descendante.
  La quatrieme, en corrigeant l'encre par le CALCUL : ce banc lisait les metriques de la fonte
  dans un canvas et en deduisait la place de l'encre. Il disait tout centre a 0,1 px pres
  pendant que les chiffres s'affichaient 1,3 a 1,5 px d'appareil trop haut (Mathis, 2026-10-22 :
  « pas vraiment au centre des cercles »). Les metriques du canvas ne sont pas celles que le
  navigateur emploie pour poser la ligne, et le rendu cale le texte sur la grille de pixels.

  On mesure donc les PIXELS : une capture de la page, et dans chaque rond, le centre du disque
  (pixels qui different du fond) contre le centre de l'encre (pixels plus clairs que le disque).
  A trois densites d'ecran (100, 125 et 150 %), au doigt en plus, et chaque rond pose a huit
  positions au huitieme de pixel pres : un rond non transforme tombe a un pixel pres d'une ligne a
  l'autre, selon la place de sa ligne de base sur la grille. On juge la MOYENNE de l'ecart ; le
  jeu d'une ligne a l'autre est imprime, il ne se corrige pas en CSS.
*/
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { page as squelette, rapport, serveurDepot } from './_banc.mjs';

export const nom = 'pastilles';
export const titre = 'Centrage dans les ronds';
export const quoi = 'l encre des chiffres et des lettres, mesuree au pixel, partout ou un rond en porte';

// Seuils en pixels d'APPAREIL. 0,65 et non moins : a 100 %, un rond de 17 px d'ecran (nombre
// impair) porte un chiffre de 8 px (pair), et leurs centres tombent forcement a un demi-pixel
// l'un de l'autre - le balayage du 2026-10-22 n'a trouve que +0,53 ou -0,54, jamais entre les
// deux. Les reglages d'avant mesuraient 1,1 a 2,4 px : le seuil les attrape largement.
const SEUIL_V = 0.65, SEUIL_H = 0.6;

const GRIS = '#7e8a99', TEAL = 'hsl(177 72% 30%)';
const SANS_BORD = 'border-color:transparent;box-shadow:none;background-clip:padding-box';
// L'œil des points du récent, recopié de CT_OEIL dans app.js.
const OEIL = '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.9" fill="#fff" stroke="none"/></svg>';
const CHIFFRES = ['1', '4', '5', '8', '10'], LETTRES = ['N', 'P', 'X', 'C'];

// Chaque rond dans son VRAI contexte : les regles qui le reglent dependent souvent de son parent
// (#matrix, #tierChips, .pkdx-card). t = le texte, c = la couleur.
const SORTES = [
  { nom: 'rond de palier (fiche, zones)', textes: CHIFFRES, html: (t, c) => `<span class="tier-chip tier-rond" style="background:${c}">${t}</span>` },
  { nom: 'colonne Rarete, palier', textes: CHIFFRES, html: (t, c) => `<table id="matrix" class="rar-ronds"><tbody><tr><td><span class="rar-cell"><span class="tier-chip tier-rond" style="background:${c}">${t}</span></span></td></tr></tbody></table>` },
  { nom: 'colonne Rarete, statut', textes: LETTRES, html: t => `<table id="matrix" class="rar-ronds"><tbody><tr><td><span class="rar-cell"><span class="pkdx-exo">${t}</span></span></td></tr></tbody></table>` },
  { nom: 'filtre de palier', textes: CHIFFRES, html: (t, c) => `<div id="tierChips"><button type="button" class="rar-chip on" data-tier="r${t}" data-rar style="background:${c};color:#fff">${t}</button></div>` },
  { nom: 'filtre de statut', textes: ['X', 'P', 'N'], html: t => `<div id="tierChips"><button type="button" class="rar-chip on" data-cat="${t}" style="background:${GRIS};color:#fff">${t}</button></div>` },
  { nom: 'jeton de statut (fiche)', textes: LETTRES, html: t => `<span class="pkdx-exo">${t}</span>` },
  { nom: 'vignette Birdydex, palier', textes: CHIFFRES, html: (t, c) => `<div class="pkdx-card" style="width:70px;height:40px"><span class="pkdx-tier" style="background:${c}">${t}</span></div>` },
  { nom: 'vignette Birdydex, statut', textes: LETTRES, html: t => `<div class="pkdx-card" style="width:110px;height:110px"><div class="pkdx-exos"><span class="pkdx-exo">${t}</span></div></div>` },
  { nom: 'la plus rare (classement)', textes: CHIFFRES, html: (t, c) => `<span class="board-pal"><i style="background:${c}">${t}</i></span>` },
  { nom: 'choix de rarete du fil', textes: CHIFFRES, html: (t, c) => `<span class="cp-item-chip" style="background:${c}">${t}</span>` },
  { nom: 'fil, ligne', textes: CHIFFRES, html: (t, c) => `<span class="feed-pas" style="background:${c}">${t}</span>` },
  { nom: 'favori du profil', textes: CHIFFRES, html: (t, c) => `<div style="position:relative;width:52px;height:52px"><span class="prof-fav-tier" style="background:${c};top:4px;right:4px">${t}</span></div>` },
  { nom: 'bulle du tri', textes: CHIFFRES, html: (t, c) => `<span class="tb-n" style="background:${c}">${t}</span>` },
  // La Carte : les points (initiale de l'ami ou œil) et leur symbole des boutons de couche et de la
  // légende. L'œil « n'est pas au centre de son cercle » (Mathis, 2026-10-23, bouton Vu récemment).
  // Leur bord blanc, sur la case blanche, se confondait avec l'encre et faussait la mesure : on le
  // rend transparent (il garde sa place), et l'ombre, qui déborde vers le bas, part.
  { nom: 'Carte, point de la ligue', textes: ['S', 'A', 'M'], html: (t, c) => `<span class="ct-pt ct-pt-lettre" style="background:${c};${SANS_BORD}">${t}</span>` },
  { nom: 'Carte, point du récent (œil)', textes: ['oeil'], html: (_, c) => `<span class="ct-pt" style="background:${c};${SANS_BORD}">${OEIL}</span>` },
  { nom: 'Carte, symbole ligue', textes: ['S', 'A'], html: (t, c) => `<span class="ct-pt ct-pt-lettre ct-pt-sym" style="background:${c};${SANS_BORD}">${t}</span>` },
  // Le survol des points et la liste du Récent : palier et statut exotique dans leur vrai parent.
  { nom: 'Carte, survol, palier', textes: CHIFFRES, html: (t, c) => `<div class="leaflet-tooltip ct-sv" style="position:static"><span class="ct-sv-l"><span class="tier-chip tier-rond" style="background:${c}">${t}</span></span></div>` },
  { nom: 'Carte, survol, statut', textes: ['N', 'X'], html: t => `<div class="leaflet-tooltip ct-sv" style="position:static"><span class="ct-sv-l"><span class="pkdx-exo">${t}</span></span></div>` },
  // Le palier de la liste du Récent : le jeton rond du site depuis le 2026-10-23 (il avait son rond à part).
  { nom: 'Carte, liste du Récent, palier', textes: CHIFFRES, html: (t, c) => `<div class="ct-rang ct-rang-rec"><span class="tier-chip tier-rond" style="background:${c}">${t}</span></div>` },
  // Le nombre au cœur d'une grappe : encre sombre sur disque clair, que la mesure ne sait pas lire ; on
  // inverse les couleurs du disque intérieur, ce qui ne déplace rien. Sur la carte, Leaflet la pose dans un
  // calque déplacé en translate3d, qui cale le texte autrement : on l'y met aussi.
  { nom: 'Carte, grappe', textes: ['3', '8', '14', '157'], html: (t, c) => `<div style="transform:translate3d(0,0,0)"><div class="ct-gr" style="width:${t.length < 2 ? 34 : t.length < 3 ? 40 : 46}px;height:${t.length < 2 ? 34 : t.length < 3 ? 40 : 46}px;background:${c};box-shadow:none"><span style="background:#333;color:#fff">${t}</span></div></div>` },
  { nom: 'Carte, liste du Récent, statut', textes: ['N', 'X'], html: t => `<div class="ct-rang"><span class="col"><span class="nom">Ibis</span> <span class="pkdx-exo">${t}</span></span></div>` },
  // Le symbole œil est un seul dessin (app.js, _ctSymbole) : recopié ici, son bord blanc retiré.
  { nom: 'Carte, symbole récent (œil)', textes: ['oeil'], html: (_, c) => `<svg class="ct-sym-oeil" style="filter:none" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8.25" fill="${c}"/><g transform="translate(3.5 3.5) scale(.6875)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.9" fill="#fff" stroke="none"/></g></svg>` },
];
// px CSS, pour voir le jeu sur la grille de pixels. Huit et non quatre : a quatre, la moyenne
// des ronds non transformes variait de 0,3 px d'un passage a l'autre.
const DECALAGES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

function corps(){
  // Le meme reglage d'ecran que index.html : sans lui, le telephone dessine une page de 980 px
  // reduite, et la capture ne tombe plus sur les coordonnees des ronds.
  let h = '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">', id = 0;
  for(const s of SORTES){
    h += `<h3>${s.nom}</h3><div class="rangee">`;
    for(const t of s.textes) for(const c of [GRIS, TEAL]) for(const d of DECALAGES)
      h += `<div class="case" style="margin-top:${d}px;margin-left:${d}px" data-sorte="${s.nom}" data-texte="${t}" data-m="${id++}">${s.html(t, c)}</div>`;
    h += '</div>';
  }
  return h;
}

// Dans la page : pour chaque case ENTIEREMENT visible et pas encore mesuree, l'ecart entre le
// centre de l'encre et celui du disque, lu sur la capture de l'ecran (base64), en pixels
// d'appareil.
async function analyse(b64){
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const dpr = window.devicePixelRatio;
  const res = [];
  for(const cas of document.querySelectorAll('.case:not([data-fait])')){
    const el = cas.querySelector('.tier-chip, .rar-chip, .pkdx-exo, .pkdx-tier, .board-pal i, .cp-item-chip, .feed-pas, .prof-fav-tier, .tb-n, .ct-pt, .ct-sym-oeil, .ct-gr > span');
    const b = el.getBoundingClientRect();
    if(b.top < 4 || b.bottom > innerHeight - 4) continue;
    cas.dataset.fait = '1';
    const x0 = Math.floor(b.left * dpr) - 3, y0 = Math.floor(b.top * dpr) - 3;
    const W = Math.ceil(b.width * dpr) + 6, H = Math.ceil(b.height * dpr) + 6;
    const d = g.getImageData(x0, y0, W, H).data;
    const fr = d[0], fg = d[1], fb = d[2];
    let sw = 0, cx = 0, cy = 0;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      const o = (y * W + x) * 4;
      const w = Math.min(1, (Math.abs(d[o] - fr) + Math.abs(d[o + 1] - fg) + Math.abs(d[o + 2] - fb)) / 120);
      sw += w; cx += w * x; cy += w * y;
    }
    cx /= sw; cy /= sw;
    const rayon = Math.sqrt(sw / Math.PI) - 1.5;
    let lmin = 999, lmax = 0;
    const lum = o => (d[o] + d[o + 1] + d[o + 2]) / 3;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      if(Math.hypot(x - cx, y - cy) > rayon) continue;
      const l = lum((y * W + x) * 4); if(l < lmin) lmin = l; if(l > lmax) lmax = l;
    }
    let ix0 = 1e9, ix1 = -1, iy0 = 1e9, iy1 = -1;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
      if(Math.hypot(x - cx, y - cy) > rayon) continue;
      if((lum((y * W + x) * 4) - lmin) / (lmax - lmin) > 0.5){
        if(x < ix0) ix0 = x; if(x > ix1) ix1 = x; if(y < iy0) iy0 = y; if(y > iy1) iy1 = y;
      }
    }
    res.push({ sorte: cas.dataset.sorte, texte: cas.dataset.texte, dx: (ix0 + ix1) / 2 - cx, dy: (iy0 + iy1) / 2 - cy });
  }
  return res;
}

const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(2);

export async function mesure({ navigateur, RACINE }){
  const r = rapport();
  const fichier = join(RACINE, 'verif-pastilles.html');
  writeFileSync(fichier, squelette({
    titre,
    styleEnPlus: '  .rangee { display:flex; flex-wrap:wrap; gap:4px; align-items:flex-start; }\n'
      + '  .case { background:#fff; padding:7px; display:flex; align-items:center; }\n'
      // content-visibility:auto saute le rendu des vignettes hors de l'ecran : la capture les
      // rendait vides, et le banc mesurait du vide (NaN).
      + '  .case .pkdx-card { margin:0; content-visibility:visible; }\n'
      // Pour essayer un reglage sans toucher a styles.css : PASTILLES_CSS="..." node tous.mjs pastilles
      + (process.env.PASTILLES_CSS || ''),
    corps: corps(),
    script: '',
  }));
  const srv = serveurDepot(RACINE);
  await new Promise(x => srv.listen(0, '127.0.0.1', x));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const ECRANS = [
    { nom: 'souris 100 %', o: { deviceScaleFactor: 1 } },
    { nom: 'souris 125 %', o: { deviceScaleFactor: 1.25 } },
    { nom: 'souris 150 %', o: { deviceScaleFactor: 1.5 } },
    // pointer:coarse ne se simule qu'avec isMobile (voir CLAUDE.md) ; les ronds y sont redessines.
    { nom: 'doigt 300 %', o: { deviceScaleFactor: 3, isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } } },
  ];
  try{
    for(const e of ECRANS){
      const ctx = await navigateur.newContext({ locale: 'fr-FR', viewport: { width: 1200, height: 900 }, ...e.o });
      const p = await ctx.newPage();
      await p.goto(base + '/verif-pastilles.html', { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      // Pas de capture fullPage : Playwright y retire l'emulation mobile le temps de la photo,
      // et le contexte « doigt » se mesurait en affichage souris sans le dire (2026-10-22). Pas
      // non plus de fenetre agrandie a la hauteur de la page : a 300 %, la capture depassait la
      // taille permise et le bas revenait vide. On mesure donc ecran par ecran.
      const coarse = await p.evaluate(() => matchMedia('(pointer: coarse)').matches);
      const res = [];
      const haut = await p.evaluate(() => document.documentElement.scrollHeight);
      const pas = p.viewportSize().height - 120;
      for(let y = 0; y < haut; y += pas){
        await p.evaluate(v => scrollTo(0, v), y);
        const png = await p.screenshot();
        res.push(...await p.evaluate(analyse, png.toString('base64')));
      }
      await ctx.close();
      r.note('');
      r.note(e.nom + '  (pixels d appareil ; dy > 0 = encre trop basse, dx > 0 = trop a droite)');
      const doigt = !!e.o.isMobile;
      r.verif('  ' + (doigt ? 'emulation tactile prise' : 'affichage souris'), coarse ? 'pointer:coarse' : 'pointer:fine', coarse === doigt);
      const par = new Map();
      for(const x of res){ if(!par.has(x.sorte)) par.set(x.sorte, []); par.get(x.sorte).push(x); }
      for(const [sorte, xs] of par){
        const moy = k => xs.reduce((a, x) => a + x[k], 0) / xs.length;
        const dy = moy('dy'), dx = moy('dx');
        const jeu = Math.max(...xs.map(x => x.dy)) - Math.min(...xs.map(x => x.dy));
        r.verif('  ' + sorte, 'dy ' + fmt(dy) + '  dx ' + fmt(dx) + '  jeu ' + jeu.toFixed(1),
                Math.abs(dy) <= SEUIL_V && Math.abs(dx) <= SEUIL_H);
      }
    }
  }finally{
    srv.close();
    try{ unlinkSync(fichier); }catch(_){}
  }
  r.note('');
  r.note('seuils : ecart moyen ' + SEUIL_V + ' px en hauteur, ' + SEUIL_H + ' px en largeur. Le jeu');
  r.note('(ecart le plus haut moins le plus bas, sur 8 positions et tous les textes) est imprime');
  r.note('sans etre juge : il vient du calage du texte sur la grille de pixels.');
  return r.rendu();
}
