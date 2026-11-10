// Le vrai contour de la France et de ses 13 regions, a donner comme modele a l'outil d'images de Mathis pour
// refaire la planche du trophee Terroir (10/11 : la planche dessinee a une Bretagne trop basse, le coin des
// Alpes rogne, le Nord en pointe). Projection Lambert-93 (conique conforme, celle de l'IGN), contours IGN.
// Sortie : un carre de 1264 px, France calee a la place de l'ancienne planche (x 389 a 831), sans la Corse (sa piece a part reste celle d avant).
//   node outils/build/_contour-france.mjs <sortie.png> [--planche[=<image>] <gauche> <droite> <haut>]
//   --planche : le contour en rouge par-dessus une planche, cale sur la largeur et le haut donnes (en px)
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [SORTIE, option = '', ...cadre] = process.argv.slice(2);
const PLANCHE = option.startsWith('--planche') ? (option.split('=')[1] || 'notes-privees/trophees/images/terroir/planche-vierge.png') : null;
const [G, D, HAUT] = cadre.length ? cadre.map(Number) : [389, 831, null];
const geo = JSON.parse(readFileSync('outils/config/regions-ign.geojson', 'utf8'));

// Lambert-93 : GRS80, paralleles 44 et 49, origine 46,5 N / 3 E
const a = 6378137, e = 0.0818191910428158, rad = d => d * Math.PI / 180;
const t = p => Math.tan(Math.PI / 4 - p / 2) / Math.pow((1 - e * Math.sin(p)) / (1 + e * Math.sin(p)), e / 2);
const m = p => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
const p1 = rad(44), p2 = rad(49), p0 = rad(46.5), l0 = rad(3);
const n = (Math.log(m(p1)) - Math.log(m(p2))) / (Math.log(t(p1)) - Math.log(t(p2)));
const F = m(p1) / (n * Math.pow(t(p1), n)), r0 = a * F * Math.pow(t(p0), n);
const lambert = ([lon, lat]) => { const r = a * F * Math.pow(t(rad(lat)), n), th = n * (rad(lon) - l0); return [r * Math.sin(th), r0 - r * Math.cos(th)]; };

const anneaux = [];   // [code, [[x,y]...]]
for(const f of geo.features){
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for(const poly of polys) for(const ring of poly) anneaux.push(ring.map(lambert));
}
// Cadre du continent seul : la Corse commence a ~465 km a l est du meridien 3 E, Lauterbourg est a ~383 km
const cont = anneaux.flat().filter(([x]) => x < 420e3);
const x0 = Math.min(...cont.map(p => p[0])), x1 = Math.max(...cont.map(p => p[0]));
const y0 = Math.min(...cont.map(p => p[1])), y1 = Math.max(...cont.map(p => p[1]));
console.log('continent : largeur', ((x1 - x0) / 1000).toFixed(0), 'km, hauteur', ((y1 - y0) / 1000).toFixed(0), 'km, L/H', ((x1 - x0) / (y1 - y0)).toFixed(3));
// Meme largeur et meme bas que l'ancienne planche (x 389 a 831, bas a 882) : la nouvelle tient sur le meme socle
const k = (D - G) / (x1 - x0);
const px = ([x, y]) => [G + (x - x0) * k, HAUT === null ? 882 - (y - y0) * k : HAUT + (y1 - y) * k];
console.log('hauteur a cette largeur :', ((y1 - y0) * k).toFixed(0), 'px');
// La Corse reste a part : sur le trophee, elle a sa propre piece (avec son aliment), la planche n en a pas
const d = anneaux.filter(r => r.some(([x]) => x < 420e3)).map(r => 'M' + r.map(p => px(p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
const fond = PLANCHE
  ? `<image href="data:image/png;base64,${readFileSync(PLANCHE).toString('base64')}" width="1264" height="1264"/>`
  : '<rect width="1264" height="1264" fill="#fff"/>';
const trait = PLANCHE ? 'stroke="#e00" stroke-width="2.5" fill="none"' : 'stroke="#222" stroke-width="2" fill="#f2ede4" stroke-linejoin="round"';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1264" height="1264">${fond}<path d="${d}" ${trait} fill-rule="evenodd"/></svg>`;
const nav = await chromium.launch(); const page = await nav.newPage({ viewport: { width: 1264, height: 1264 } });
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.screenshot({ path: SORTIE });
await nav.close();
