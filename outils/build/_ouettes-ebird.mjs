// Quel nom latin eBird donne-t-il aujourd'hui aux deux ouettes que le site appelle Oressochen ?
// On cherche dans la taxonomie complete par le nom anglais, pour ne pas deviner les codes.
import { EBIRD_API_KEY } from './cle-ebird.mjs';
const r = await fetch('https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json', { headers: { 'X-eBirdApiToken': EBIRD_API_KEY } });
const t = await r.json();
console.log('Entrees de la taxonomie :', t.length);
for(const x of t.filter(x => /^(Orinoco Goose|Andean Goose)$/.test(x.comName) || /oressochen|neochen|chloephaga melanopt/i.test(x.sciName)))
  console.log(x.speciesCode, '|', x.sciName, '|', x.comName, '|', x.familySciName, '|', x.category);
