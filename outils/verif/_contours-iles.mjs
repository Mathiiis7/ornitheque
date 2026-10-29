// Mesure ponctuelle (2026-10-29) : les villes et les hotspots eBird de Jersey, Guernesey et l'île de Man
// tombent-ils dans leur contour ? Trois contours comparés : Natural Earth brut (1:10 M), la zone publiée
// (data/carte-zones/gb.json) et la forme cliquable du monde (data/carte-pays.json). Pour chaque point
// dehors, sa distance au trait en mètres. Trois demandes au relais eBird (ref/hotspot), gardées 7 jours.
// node outils/verif/_contours-iles.mjs
import fs, { readFileSync } from 'node:fs';
const lire = f => JSON.parse(readFileSync(new URL('../../' + f, import.meta.url), 'utf8'));
const NE = lire('notes-privees/contours-monde/ne_10m_admin_1_states_provinces.geojson');
const ZONES = lire('data/carte-zones/gb.json'), PAYS = lire('data/carte-pays.json');
const ISO = { JE:'JE', GG:'GG', IM:'IM' };
const anneaux = g => g.type === 'Polygon' ? g.coordinates : g.coordinates.flat();
const dans = (rs, lng, lat) => { let c = false; for(const r of rs) for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const [xa, ya] = r[i], [xb, yb] = r[j]; if((ya > lat) !== (yb > lat) && lng < (xb - xa) * (lat - ya) / (yb - ya) + xa) c = !c; } return c; };
// Distance au trait, en mètres (équirectangulaire locale, assez juste à cette échelle).
const dist = (rs, lng, lat) => {
  const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540; let m = Infinity;
  for(const r of rs) for(let i = 0; i < r.length - 1; i++){
    const ax = (r[i][0] - lng) * kx, ay = (r[i][1] - lat) * ky, bx = (r[i + 1][0] - lng) * kx, by = (r[i + 1][1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    m = Math.min(m, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return Math.round(m);
};
const VILLES = { JE:[['Saint-Hélier', 49.1858, -2.1100], ['Saint-Aubin', 49.1880, -2.1680], ['Gorey', 49.1990, -2.0220]],
  GG:[['Saint-Pierre-Port', 49.4565, -2.5363], ['Aurigny (Sainte-Anne)', 49.7140, -2.2050], ['Sercq', 49.4300, -2.3600]],
  IM:[['Douglas', 54.1500, -4.4833], ['Ramsey', 54.3220, -4.3830], ['Castletown', 54.0740, -4.6530]] };
const sommets = rs => rs.reduce((s, r) => s + r.length, 0);
for(const cc of ['JE', 'GG', 'IM']){
  const ne = NE.features.filter(f => f.properties.iso_a2 === ISO[cc]).flatMap(f => anneaux(f.geometry));
  const zo = anneaux(ZONES.features.find(f => f.properties.ebird === cc).geometry);
  const pa = anneaux(PAYS.features.find(f => f.properties.cc === cc).geometry);
  const hs = await (await fetch(`https://ornitheque-relais.vercel.app/v2/ref/hotspot/${cc}?fmt=json`, { headers:{ origin:'http://localhost:8765' } })).json();
  const points = [...VILLES[cc].map(([n, la, lo]) => [n, la, lo]), ...hs.map(h => [h.locName, h.lat, h.lng])];
  console.log(`${cc} : sommets NE ${sommets(ne)}, zone ${sommets(zo)}, monde ${sommets(pa)} · ${hs.length} hotspots`);
    // Un contour à essayer : GB_ILES=dossier contenant GGY.geojson, IMN.geojson, JEY.geojson.
  const A3 = { JE:'JEY', GG:'GGY', IM:'IMN' }, essai = process.env.GB_ILES && fs.existsSync(`${process.env.GB_ILES}/${A3[cc]}.geojson`)
    ? JSON.parse(fs.readFileSync(`${process.env.GB_ILES}/${A3[cc]}.geojson`, 'utf8')).features.flatMap(f => anneaux(f.geometry)) : null;
  for(const [nom, rs] of [['NE brut', ne], ['zone', zo], ['monde', pa], ...(essai ? [['essai', essai]] : [])]){
    const dehors = points.filter(([, la, lo]) => !dans(rs, lo, la)).map(([n, la, lo]) => [n, dist(rs, lo, la)]);
    const villes = dehors.filter(([n]) => VILLES[cc].some(v => v[0] === n));
    const loin = dehors.filter(([, d]) => d > 300);
    console.log(`   ${nom.padEnd(7)} : ${dehors.length}/${points.length} dehors, ${loin.length} à plus de 300 m` +
      (villes.length ? ` · villes dehors : ${villes.map(([n, d]) => `${n} ${d} m`).join(', ')}` : '') +
      (loin.length ? ` · les plus loin : ${loin.sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, d]) => `${n.slice(0, 30)} ${d} m`).join(' ; ')}` : ''));
  }
}
