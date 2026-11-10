// Audit (2026-11-10) : les noms français de zones (outils/config/zones-monde-noms.json) qui ressemblent plus
// au nom eBird d'une AUTRE zone du même pays qu'au leur - signe d'une traduction posée sur la mauvaise zone
// (Guyana : « Essequibo Islands-West Demerara » appelée « Mahaica-Berbice »).
// Usage : node outils/verif/_zones-noms-fautifs.mjs
import { readFileSync } from 'node:fs';
const R = new URL('../../', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const FR = JSON.parse(readFileSync(R + 'outils/config/zones-monde-noms.json', 'utf8'));
const PAYS = JSON.parse(readFileSync(R + 'outils/config/pays-a-ajouter.json', 'utf8'));
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Ressemblance : part des trigrammes partagés.
const tri = s => { const t = new Set(), x = '  ' + norm(s) + ' '; for (let i = 0; i < x.length - 2; i++) t.add(x.slice(i, i + 3)); return t; };
const sim = (a, b) => { const A = tri(a), B = tri(b); let n = 0; for (const x of A) if (B.has(x)) n++; return n / Math.max(1, Math.min(A.size, B.size)); };
let n = 0;
for (const p of PAYS) {
  for (const [code, nomEbird] of Object.entries(p.noms || {})) {
    const fr = FR[code]; if (!fr) continue;
    const soi = sim(fr, nomEbird);
    for (const [autre, nomAutre] of Object.entries(p.noms)) {
      if (autre === code) continue;
      const s = sim(fr, nomAutre);
      if (s > soi + 0.25 && s > 0.6) { console.log(`${code} « ${nomEbird} » -> « ${fr} » ressemble à ${autre} « ${nomAutre} » (${s.toFixed(2)} contre ${soi.toFixed(2)})`); n++; }
    }
  }
}
console.log(n, 'suspect(s).');
