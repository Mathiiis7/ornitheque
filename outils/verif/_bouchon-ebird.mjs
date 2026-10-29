// Un faux eBird pour les essais de la Carte (2026-10-29) : le quota de la clé est commun à toute la
// ligue, et un essai qui le vide laisse les amis de Mathis devant « eBird ne répond pas ». Les réponses
// sont inventées, mais au format d'eBird : quelques espèces, trois lieux par département, plusieurs
// observations au même lieu pour que les grappes se forment. Les listes du relais (carte/listes)
// répondent 503 : le Récent retombe sur « une observation par espèce », son chemin de secours.
// import { bouchonEbird } from './_bouchon-ebird.mjs'; await bouchonEbird(ctx);
const ESPECES = [
  ['barwar1', 'Curruca nisoria', 'Barred Warbler'],
  ['wallcr1', 'Tichodroma muraria', 'Wallcreeper'],
  ['snobun', 'Plectrophenax nivalis', 'Snow Bunting'],
  ['shelar1', 'Eremophila alpestris', 'Horned Lark'],
  ['lapbun', 'Calcarius lapponicus', 'Lapland Longspur'],
  ['purhsa', 'Calidris maritima', 'Purple Sandpiper'],
  ['grnsan', 'Tringa ochropus', 'Green Sandpiper'],
  ['graher1', 'Ardea cinerea', 'Gray Heron'],
  ['eurrob1', 'Erithacus rubecula', 'European Robin'],
  ['rinphe1', 'Phasianus colchicus', 'Ring-necked Pheasant'],
  ['litegr', 'Egretta garzetta', 'Little Egret'],
];
// Trois lieux par département, à quelques kilomètres : dézoomés, ils se rejoignent en grappe.
const DEPS = {
  'FR-PDL-44':[47.25, -1.65], 'FR-PDL-85':[46.70, -1.40], 'FR-PDL-49':[47.45, -0.55],
  'FR-BRE-29':[48.30, -4.10], 'FR-BRE-35':[48.10, -1.70], 'FR-GES-67':[48.55, 7.65],
};
const jour = n => { const d = new Date(Date.now() - n * 86400000); return d.toISOString().slice(0, 10) + ' 08:30'; };
function observations(){
  const out = [];
  let k = 0;
  for(const [dep, [la, lo]] of Object.entries(DEPS)){
    for(let l = 0; l < 3; l++){
      const lat = +(la + l * 0.03).toFixed(4), lng = +(lo + l * 0.04).toFixed(4), locId = `L${dep.replace(/\W/g, '')}${l}`;
      ESPECES.forEach(([code, sci, en], i) => {
        if((i + l) % 3 === 2) return;   // chaque lieu n'a pas toutes les espèces
        out.push({ speciesCode:code, comName:en, sciName:sci, locId, locName:`Lieu ${l + 1} (${dep})`, obsDt:jour((k++ % 12) + 1),
          howMany:1 + (k % 4), lat, lng, obsValid:true, obsReviewed:false, locationPrivate:false, subId:`S${k}`, _dep:dep });
      });
    }
  }
  return out;
}
const OBS = observations();
const dansZone = (o, z) => z === 'FR' || o._dep === z || o._dep.startsWith(z + '-');
const propre = o => { const { _dep, ...r } = o; return r; };
export async function bouchonEbird(ctx, compte = []){
  await ctx.route(/ornitheque-relais|api\.ebird\.org/, route => {
    const u = new URL(route.request().url()), ch = u.pathname.replace(/^\/v2\//, '');
    compte.push(ch);
    const json = v => route.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(v) });
    let m;
    if(/^ref\/taxonomy\/ebird/.test(ch)) return json(u.searchParams.get('cat') === 'species' ? ESPECES.map(([speciesCode, sciName, comName]) => ({ speciesCode, sciName, comName, category:'species' })) : []);
    if((m = ch.match(/^data\/obs\/([^/]+)\/recent\/([^/]+)$/))) return json(OBS.filter(o => (dansZone(o, m[1]) || o.locId === m[1]) && o.speciesCode === m[2]).map(propre));
    if((m = ch.match(/^data\/obs\/([^/]+)\/recent$/))){
      // Comme eBird : la dernière observation de chaque espèce dans la zone.
      const der = new Map();
      for(const o of OBS) if(dansZone(o, m[1]) || o.locId === m[1]){ const d = der.get(o.speciesCode); if(!d || o.obsDt > d.obsDt) der.set(o.speciesCode, o); }
      return json([...der.values()].map(propre));
    }
    if((m = ch.match(/^ref\/hotspot\/([^/]+)$/))){
      const lieux = new Map();
      for(const o of OBS) if(dansZone(o, m[1]) && !lieux.has(o.locId)) lieux.set(o.locId, { locId:o.locId, locName:o.locName, lat:o.lat, lng:o.lng, countryCode:'FR',
        subnational1Code:o._dep.split('-').slice(0, 2).join('-'), subnational2Code:o._dep, latestObsDt:jour(1), numSpeciesAllTime:150 });
      return json([...lieux.values()]);
    }
    if((m = ch.match(/^product\/spplist\/([^/]+)$/))) return json([...new Set(OBS.filter(o => o.locId === m[1]).map(o => o.speciesCode))]);
    if((m = ch.match(/^ref\/region\/info\/([^/]+)$/))) return json({ result:m[1], bounds:{ minX:-5, maxX:8, minY:42, maxY:51 } });
    if(/^carte\//.test(ch)) return route.fulfill({ status:503, headers:{ 'access-control-allow-origin':'*' }, body:'' });
    return json([]);
  });
}
