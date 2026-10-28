// Essai ponctuel (2026-10-28) : les trous des zones de la Carte, pays par pays.
// Une grille de points dans le contour du pays (data/carte-pays.json) : la part qui ne tombe dans aucune
// zone (data/carte-zones/<cc>.json), et où. Mer et lacs comptent pour rien : seuls les points DANS le
// contour du pays sont testés ; un trou de quelques points le long de la côte vient des simplifications.
// node outils/verif/_trous-zones.mjs [pas en degrés, 0.05 par défaut]
import fs from 'fs';
const R = new URL('../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const PAS = +(process.argv[2] || 0.05);
const pays = JSON.parse(fs.readFileSync(R + 'data/carte-pays.json', 'utf8'));
const dans = (x, y, ring) => { let c = false; for(let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const [xi, yi] = ring[i], [xj, yj] = ring[j]; if(((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const polys = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const prep = g => polys(g).map(p => { let s = 90, n = -90, o = 180, e = -180; for(const [x, y] of p[0]){ if(y < s) s = y; if(y > n) n = y; if(x < o) o = x; if(x > e) e = x; } return { p, s, n, o, e }; });
const dansGeo = (x, y, pp) => pp.some(({ p, s, n, o, e }) => y >= s && y <= n && x >= o && x <= e && dans(x, y, p[0]) && !p.slice(1).some(h => dans(x, y, h)));
const res = [];
for(const f of fs.readdirSync(R + 'data/carte-zones')){
  const cc = f.replace('.json', '').toUpperCase();
  const fc = pays.features.find(x => x.properties.cc === cc);
  if(!fc){ res.push({ cc, note:'pas de contour de pays' }); continue; }
  const z = JSON.parse(fs.readFileSync(R + 'data/carte-zones/' + f, 'utf8'));
  const zones = z.features.map(x => ({ code:x.properties.ebird, pp:prep(x.geometry) }));
  const pp = prep(fc.geometry);
  let s = 90, n = -90, o = 180, e = -180; for(const q of pp){ s = Math.min(s, q.s); n = Math.max(n, q.n); o = Math.min(o, q.o); e = Math.max(e, q.e); }
  // Pas adapté : au moins ~4 000 points par pays, au plus ~60 000.
  const aire = (n - s) * (e - o), pas = Math.max(PAS * Math.sqrt(aire / 400), Math.min(PAS, Math.sqrt(aire / 4000)));
  let total = 0; const trous = [];
  for(let y = s + pas / 2; y < n; y += pas) for(let x = o + pas / 2; x < e; x += pas){
    if(!dansGeo(x, y, pp)) continue;
    total++;
    if(!zones.some(zz => dansGeo(x, y, zz.pp))) trous.push([x, y]);
  }
  // Un vrai trou est loin de toute zone : à moins de 8 km d'un bord de zone, c'est la bande que laissent
  // deux contours simplifiés différemment (côte, frontière). Distance au sommet de zone le plus proche.
  const sommets = zones.flatMap(zz => zz.pp.flatMap(q => q.p.flatMap(r => r)));
  const km = ([x, y], [a, b]) => Math.hypot((x - a) * 111 * Math.cos(y * Math.PI / 180), (y - b) * 111);
  const vrais = trous.filter(t => { for(const v of sommets) if(km(t, v) < 8) return false; return true; });
  trous.length = 0; trous.push(...vrais);
  // Grappes de trous : cases de 0,5° (ou 2° pour les grands pays).
  const c = aire > 2000 ? 2 : 0.5, gr = new Map();
  for(const [x, y] of trous){ const k = Math.floor(y / c) * c + ',' + Math.floor(x / c) * c; gr.set(k, (gr.get(k) || 0) + 1); }
  const top = [...gr.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ':' + v);
  if(process.env.DETAIL && process.env.DETAIL.split(',').includes(cc)) console.log(cc, 'trous :', trous.map(([x, y]) => y.toFixed(2) + ',' + x.toFixed(2)).join(' '));
  res.push({ cc, zones:zones.length, points:total, trous:trous.length, part:total ? +(100 * trous.length / total).toFixed(1) : 0, ou:top.join(' ') });
}
res.sort((a, b) => (b.part || 0) - (a.part || 0));
for(const r of res) console.log(r.note ? `${r.cc} ${r.note}` : `${r.cc.padEnd(3)} ${String(r.part).padStart(5)} %  (${r.trous}/${r.points} points, ${r.zones} zones)  ${r.part >= 0.5 ? r.ou : ''}`);
