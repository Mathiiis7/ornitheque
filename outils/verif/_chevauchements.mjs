// Mesure ponctuelle (2026-10-29) : les régions de la Carte (data/carte-zones/<cc>.json) se chevauchent-elles ?
// Une grille de points sur chaque pays ; un point dans deux régions ou plus est un chevauchement. On donne
// la part des points couverts qui tombent dans au moins deux régions, en pour dix mille.
// node outils/verif/_chevauchements.mjs [cc,cc...]
import { readFileSync, readdirSync } from 'node:fs';
const DOS = new URL('../../data/carte-zones/', import.meta.url);
const liste = process.argv[2] ? process.argv[2].toLowerCase().split(',') : readdirSync(DOS).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5));
const dansAnneau = (x, y, r) => { let c = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const [xi, yi] = r[i], [xj, yj] = r[j]; if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
let total = 0, doubles = 0;
for(const cc of liste){
  // Un chemin (data/carte-departements.json) se lit tel quel ; un code de pays, dans data/carte-zones/.
  const fc = JSON.parse(readFileSync(cc.endsWith('.json') ? cc : new URL(cc + '.json', DOS), 'utf8'));
  for(const f of fc.features) f.properties.ebird = f.properties.ebird || f.properties.code;
  // Les anneaux de chaque zone, avec leur cadre pour aller vite.
  const zones = fc.features.map(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(p => {
    const r = p[0]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for(const [x, y] of r){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { r, x0, x1, y0, y1 };
  }));
  let X0 = 1e9, X1 = -1e9, Y0 = 1e9, Y1 = -1e9;
  for(const z of zones) for(const a of z){ X0 = Math.min(X0, a.x0); X1 = Math.max(X1, a.x1); Y0 = Math.min(Y0, a.y0); Y1 = Math.max(Y1, a.y1); }
  // Les grands pays (Russie, États-Unis) s'étendent sur 360° : on plafonne la grille à 400 x 400.
  const pas = Math.max((X1 - X0) / 400, (Y1 - Y0) / 400);
  let couverts = 0, deux = 0; const paires = new Map();
  for(let x = X0 + pas / 2; x < X1; x += pas) for(let y = Y0 + pas / 2; y < Y1; y += pas){
    // Une zone compte une fois, même si plusieurs de ses anneaux (trous mis à plat) contiennent le point.
    const ici = [];
    zones.forEach((z, i) => { if(z.some(a => x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1 && dansAnneau(x, y, a.r))) ici.push(fc.features[i].properties.ebird); });
    if(ici.length) couverts++;
    if(ici.length > 1){ deux++; const k = ici.sort().join(' + '); paires.set(k, (paires.get(k) || 0) + 1); }
  }
  total += couverts; doubles += deux;
  // Les paires en cause (une enclave, Vienne dans la Basse-Autriche, est voulue : ses trous sont mis à plat).
  const tete = [...paires].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k} ${n}`).join(', ');
  console.log(`${cc.toUpperCase()} : ${(deux / couverts * 1e4).toFixed(1).padStart(6)} pour 10 000 (${deux} sur ${couverts})${tete ? '  ' + tete : ''}`);
}
console.log(`TOUS : ${(doubles / total * 1e4).toFixed(1)} pour 10 000`);
