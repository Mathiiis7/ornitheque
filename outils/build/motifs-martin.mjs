// Reporte les motifs de la planche Arrow (points de la calotte, points et traits de l'aile)
// sur le martin dessiné par Mathis dans Figma. Demandé le 2026-10-05.
//
// Source des motifs : assets/logos/sources/arrow-motifs.svg, la pose au carnet (en bas à
// droite de la planche de six). Cible : assets/logos/sources/martin-figma.svg, inchangé.
// Sortie : assets/logos/sources/martin-motifs.svg, que lit icones-martin.mjs.
//
// Les deux oiseaux n'ont pas la même forme (la tête Figma est plus plate : 2,1 unités du
// sommet à l'œil contre 3,5), donc un simple déplacement ferait sortir les points de la tête.
// Chaque motif est reporté par rapport à un BORD : sa position le long du bord (en
// proportion de la longueur) et sa distance au bord sont gardées, son angle suit le bord.
//   calotte : le bord supérieur de la tête, de la nuque au bec
//   aile    : le bord intérieur de la bande claire, de l'épaule à la queue
// Puis chaque groupe est découpé par la forme qui le porte : rien ne déborde.
//
// Usage : node outils/build/motifs-martin.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const RACINE = process.cwd();
const SRC = join(RACINE, 'assets', 'logos', 'sources');
const arrow = readFileSync(join(SRC, 'arrow-motifs.svg'), 'utf8');
const figma = readFileSync(join(SRC, 'martin-figma.svg'), 'utf8');
// La couleur claire du martin Figma, pour ne pas ajouter une sixième teinte de bleu-vert.
const CLAIR = '#29C2BD';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<div id="a">${arrow}</div><div id="f">${figma}</div>`);

const motifs = await page.evaluate(() => {
  const A = [...document.querySelectorAll('#a svg > *')];
  const F = [...document.querySelectorAll('#f svg > *')];
  const d = (el) => el.getAttribute('d') || '';
  const parD = (els, debut) => els.find((e) => d(e).startsWith(debut));

  // Échantillonne un chemin, du point de longueur l0 à l1.
  function ech(p, l0, l1, n = 200) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const q = p.getPointAtLength(l0 + ((l1 - l0) * i) / n);
      pts.push([q.x, q.y]);
    }
    return pts;
  }
  // Longueur cumulée d'une polyligne.
  function cumul(pts) {
    const c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return c;
  }
  // Position (proportion s) et distance signée d d'un point à une polyligne. Au-delà des
  // bouts, on prolonge la tangente : s sort de [0,1], ce qui garde les points d'extrémité.
  function projette(pts, P) {
    const c = cumul(pts), L = c[c.length - 1];
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const vx = bx - ax, vy = by - ay, l = Math.hypot(vx, vy) || 1e-9;
      let t = ((P[0] - ax) * vx + (P[1] - ay) * vy) / (l * l);
      const bout = i === 0 ? t < 0 : i === pts.length - 2 ? t > 1 : false;
      if (!bout) t = Math.max(0, Math.min(1, t));
      const qx = ax + t * vx, qy = ay + t * vy;
      const dist = Math.hypot(P[0] - qx, P[1] - qy);
      const signe = Math.sign(vx * (P[1] - ay) - vy * (P[0] - ax)) || 1;
      if (!best || dist < Math.abs(best.d)) best = { s: (c[i] + t * l) / L, d: signe * dist, ang: Math.atan2(vy, vx) };
    }
    return { ...best, L };
  }
  // Point, tangente à la proportion s d'une polyligne (prolongée au-delà des bouts).
  function place(pts, s) {
    const c = cumul(pts), L = c[c.length - 1], cible = s * L;
    let i = 0;
    while (i < pts.length - 2 && c[i + 1] < cible) i++;
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const l = c[i + 1] - c[i] || 1e-9;
    const t = (cible - c[i]) / l;
    return { x: ax + t * (bx - ax), y: ay + t * (by - ay), ang: Math.atan2(by - ay, bx - ax), L };
  }

  // --- les bords ---
  // Calotte Arrow (pose au carnet) : le contour commence au bec et passe par le sommet ;
  // on le suit jusqu'au point le plus en arrière (la nuque), puis on le retourne.
  const tA = parD(A, 'm59.72 48.09');
  let pa = ech(tA, 0, tA.getTotalLength() * 0.6, 300);
  const iNuqueA = pa.reduce((m, p, i) => (p[0] < pa[m][0] ? i : m), 0);
  const bordTeteA = pa.slice(0, iNuqueA + 1).reverse();
  // Calotte Figma : le contour part du sommet vers la nuque, puis revient par le bec.
  const tF = parD(F, 'M15.62 3.9');
  const LF = tF.getTotalLength();
  const tout = ech(tF, 0, LF, 400);
  const iNuqueF = tout.reduce((m, p, i) => (p[0] < tout[m][0] ? i : m), 0);
  const iBecF = tout.reduce((m, p, i) => (p[0] > tout[m][0] ? i : m), 0);
  const bordTeteF = [...tout.slice(0, iNuqueF + 1).reverse(), ...tout.slice(iBecF)];

  // Aile : le premier tronçon de la bande claire, côté corps, de l'épaule à la queue.
  const bA = parD(A, 'm52.81 59.54');
  const bF = parD(F, 'M13.42 9.51C13.51');
  const premier = (p, fin) => { // longueur jusqu'au point le plus proche de « fin »
    const L = p.getTotalLength(); let lm = 0, dm = 1e9;
    for (let l = 0; l <= L; l += L / 400) { const q = p.getPointAtLength(l); const dd = Math.hypot(q.x - fin[0], q.y - fin[1]); if (dd < dm) { dm = dd; lm = l; } }
    return lm;
  };
  const bordAileA = ech(bA, 0, premier(bA, [42.19, 66.47]));
  const bordAileF = ech(bF, 0, premier(bF, [4.06, 19.62]));

  // --- les motifs Arrow ---
  // Une ellipse porte une matrice de rotation : son vrai centre et son angle en sortent.
  function ellipse(e) {
    const cx = +e.getAttribute('cx'), cy = +e.getAttribute('cy');
    const m = (e.getAttribute('transform') || 'matrix(1 0 0 1 0 0)').match(/-?[\d.]+(e-?\d+)?/g).map(Number);
    const [a, b, c, dd, ee, f] = m;
    return { x: a * cx + c * cy + ee, y: b * cx + dd * cy + f, rx: +e.getAttribute('rx'), ry: +e.getAttribute('ry'), ang: Math.atan2(b, a) };
  }
  const dans = (o, x0, x1, y0, y1) => o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1;
  const ell = A.filter((e) => e.tagName === 'ellipse' && e.getAttribute('fill') === '#33C6BA').map(ellipse);
  const pointsTete = ell.filter((o) => dans(o, 48, 58, 45, 50));
  const pointsAile = ell.filter((o) => dans(o, 42, 53, 55, 63));
  // Le petit trait de l'aile dessiné en chemin (45.68 60.97) : une ellipse comme ses voisins.
  pointsAile.push({ x: 45.12, y: 61.5, rx: 0.2, ry: 0.55, ang: ellipse(A.find((e) => e.getAttribute('cx') === '46.84')).ang });
  // Les deux traits fins de l'aile (plumes), opacité 0,2.
  const traits = A.filter((e) => /^m(49\.35|50\.09) /.test(d(e))).map((e) => {
    const n = d(e).match(/-?[\d.]+/g).map(Number);
    return [[n[0], n[1]], [n[0] + n[2], n[1] + n[3]]];
  });

  // --- le report ---
  const k = { tete: cumul(bordTeteF).at(-1) / cumul(bordTeteA).at(-1), aile: cumul(bordAileF).at(-1) / cumul(bordAileA).at(-1) };
  // Pour la tête, un repère de plus : le sommet. Chez Arrow il est au milieu de la calotte,
  // chez Figma aux deux tiers vers le bec ; sans lui, les points glissaient tous vers l'avant
  // et la nuque restait nue. On répartit donc nuque -> sommet et sommet -> bec séparément.
  const sommet = (b) => { const c = cumul(b); const i = b.reduce((m, p, j) => (p[1] < b[m][1] ? j : m), 0); return c[i] / c.at(-1); };
  const sA = { tete: sommet(bordTeteA) }, sF = { tete: sommet(bordTeteF) };
  const viaSommet = (s, a, f) => (s <= a ? (s / a) * f : f + ((s - a) / (1 - a)) * (1 - f));
  const reporte = (P, bA, bF, kk) => {
    const pr = projette(bA, P);
    const s = bA === bordTeteA ? viaSommet(pr.s, sA.tete, sF.tete) : pr.s;
    const q = place(bF, s);
    const nx = -Math.sin(q.ang), ny = Math.cos(q.ang); // normale du même côté que le signe
    return { x: q.x + nx * pr.d * kk, y: q.y + ny * pr.d * kk, rot: q.ang - pr.ang };
  };
  const svgEll = (o, bA, bF, kk) => {
    const r = reporte([o.x, o.y], bA, bF, kk);
    const deg = ((o.ang + r.rot) * 180) / Math.PI;
    return `<ellipse cx="${r.x.toFixed(3)}" cy="${r.y.toFixed(3)}" rx="${(o.rx * kk).toFixed(3)}" ry="${(o.ry * kk).toFixed(3)}" transform="rotate(${deg.toFixed(1)} ${r.x.toFixed(3)} ${r.y.toFixed(3)})"/>`;
  };
  const tete = pointsTete.map((o) => svgEll(o, bordTeteA, bordTeteF, k.tete));
  const aile = pointsAile.map((o) => svgEll(o, bordAileA, bordAileF, k.aile));
  const plumes = traits.map(([p, q]) => {
    const a = reporte(p, bordAileA, bordAileF, k.aile), b = reporte(q, bordAileA, bordAileF, k.aile);
    return `<path d="M${a.x.toFixed(3)} ${a.y.toFixed(3)}L${b.x.toFixed(3)} ${b.y.toFixed(3)}" stroke="#1B1B1B" stroke-width="${(0.1366 * k.aile).toFixed(4)}" opacity=".2"/>`;
  });
  return { tete, aile, plumes, k, n: { tete: pointsTete.length, aile: pointsAile.length, traits: traits.length } };
});
await browser.close();
console.log('motifs', motifs.n, 'echelles', motifs.k);

// --- insertion dans le dessin Figma ---
// Calotte : juste après les deux formes bleu-vert de la tête, découpée par elles ; l'œil,
// le bec et les bandes orange passent par-dessus. Aile : juste après la forme de l'aile,
// sous la bande claire et la queue.
const lignes = figma.split(/\r?\n/);
const iCalotte = lignes.findIndex((l) => l.includes('d="M15.62 3.9'));
const iJoue = lignes.findIndex((l) => l.includes('d="M18.29 6.51'));
const iAile = lignes.findIndex((l) => l.includes('d="M12.04 8.99'));
if ([iCalotte, iJoue, iAile].some((i) => i < 0)) throw new Error('forme Figma introuvable');
const dDe = (l) => l.match(/ d="([^"]+)"/)[1];
const defs = `<defs>
<clipPath id="m-tete"><path d="${dDe(lignes[iCalotte])}"/><path d="${dDe(lignes[iJoue])}"/></clipPath>
<clipPath id="m-aile"><path d="${dDe(lignes[iAile])}"/></clipPath>
</defs>`;
const gTete = `<g clip-path="url(#m-tete)" fill="${CLAIR}">\n${motifs.tete.join('\n')}\n</g>`;
const gAile = `<g clip-path="url(#m-aile)">\n<g fill="${CLAIR}">\n${motifs.aile.join('\n')}\n</g>\n${motifs.plumes.join('\n')}\n</g>`;

const sortie = [];
lignes.forEach((l, i) => {
  sortie.push(l);
  if (i === 0) sortie.push(defs);
  if (i === iJoue) sortie.push(gTete);
  if (i === iAile) sortie.push(gAile);
});
writeFileSync(join(SRC, 'martin-motifs.svg'), sortie.join('\n'));
console.log('ecrit  assets/logos/sources/martin-motifs.svg');
