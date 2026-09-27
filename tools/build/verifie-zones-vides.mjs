/*
  « Zone vide » ou « scrape raté » : la question se tranche zone par zone, et une seule chose
  tranche - la page barchart ouverte dans un vrai navigateur. Les deux sondes de l'API mentent
  chacune a sa facon (obs/recent donne 0 pour une commune rurale en septembre, spplist compte
  toute l'histoire d'eBird quand le bar chart s'arrete a la fenetre courante).

  Ce script prend les zones qu'etat-exotiques.mjs declare manquantes et va les regarder. Aucun
  compte : les icones exotiques et le compte d'especes se lisent en visiteur anonyme, seul
  barchartData au format tsv exige une session.

      node tools/build/verifie-zones-vides.mjs SI LV

  Il ouvre une VRAIE FENETRE : le mur anti-robot refuse le mode invisible, voir le commentaire
  du lancement plus bas.

  Il commence par un TEMOIN connu. Si le temoin ne rend pas ses especes, le mur est devant et
  tout le reste du run ne vaut rien : c'est arrive le 2026-09-28, ou toutes les zones
  repondaient 0 alors que SI-061 en rendait 295. Dans ce cas le script s'arrete au lieu de
  remplir un fichier de faux « vides ».

  La page affiche son compte meme quand la zone est vide : l'en-tete annonce « 0 especes ». On
  lit le premier nombre du premier element, ce qui ne depend d'aucune langue.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JETON = 'dbflh4atmsom';
const TEMOIN = { zone: 'SI-061', minimum: 200 };   // rendait 295 le 2026-09-28

const VIDES_CONNUES = new Set([
  'GB-ENG-HAL',
  'HU-DE', 'HU-MI', 'HU-NY', 'HU-SN', 'HU-SD', 'HU-ST', 'HU-SK', 'HU-EG', 'HU-HV', 'HU-DU',
  'HU-KM', 'HU-TB', 'HU-GY', 'HU-SH', 'HU-ZE', 'HU-NK', 'HU-VM', 'HU-KV', 'HU-PS', 'HU-SS',
  'HU-SF', 'HU-BC',
  'MK-809', 'MK-704', 'MK-208', 'MK-311', 'MK-202', 'MK-204',
]);

function recoltees(cc){
  const f = join(RACINE, 'tools', 'build', 'exotic-by-region-' + cc.toLowerCase() + '.generated.js');
  const src = readFileSync(f, 'utf8');
  const i = src.indexOf('= {');
  return new Set(Object.keys(JSON.parse(src.slice(i + 2, src.lastIndexOf('}') + 1))));
}

async function zonesEbird(cc){
  const r = await fetch('https://api.ebird.org/v2/ref/region/list/subnational1/' + cc + '.json',
                        { headers: { 'X-eBirdApiToken': JETON } });
  if(!r.ok) throw new Error(cc + ' : eBird repond ' + r.status);
  return (await r.json()).map(z => z.code);
}

// Rend le nombre d'especes de la zone, ou null si la page n'a rien voulu dire.
async function compte(page, zone){
  const url = 'https://ebird.org/barchart?r=' + zone + '&bmo=1&emo=12&byr=2019&eyr=2026';
  try{
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.SpeciesName, span.species', { timeout: 20000 });
    return await page.evaluate(() => {
      const n = document.querySelectorAll('.SpeciesName, span.species').length;
      const premier = document.querySelector('.SpeciesName, span.species');
      const t = (premier && premier.innerText) || '';
      const m = t.match(/(\d+)/);
      // Une zone peuplee rend une ligne par espece ; une zone vide rend le seul en-tete, qui
      // annonce son compte. On croit l'en-tete quand il est seul, le nombre de lignes sinon.
      return n > 1 ? n : (m ? parseInt(m[1], 10) : 0);
    });
  }catch{ return null; }
}

const PAYS = process.argv.slice(2).map(p => p.toUpperCase());
if(!PAYS.length){ console.error('usage : node tools/build/verifie-zones-vides.mjs SI LV'); process.exit(1); }

// FENETRE VISIBLE OBLIGATOIRE. Anubis, le mur anti-robot d'eBird, refuse le mode invisible :
// mesure du 2026-09-28 sur le meme temoin a la minute pres, headless chrome et headless
// chromium rendent tous deux « Oops! A problem occurred while trying to determine if you are
// a bot » et 0 espece, quand la fenetre visible rend les 295 especes de SI-061. Une zone qui
// repond 0 en headless ne dit donc RIEN sur la zone - seulement sur le mur.
const navigateur = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await navigateur.newContext({ locale: 'fr-FR' });
const page = await ctx.newPage();

const t = await compte(page, TEMOIN.zone);
console.log('temoin ' + TEMOIN.zone + ' : ' + t + ' especes');
if(!(t >= TEMOIN.minimum)){
  console.error('DEFAUT : le temoin ne rend pas ses especes, eBird bride. Rien ne sera conclu.');
  await navigateur.close();
  process.exit(1);
}

const vides = [], peuplees = [], muettes = [];
for(const cc of PAYS){
  const officiel = await zonesEbird(cc);
  const ont = recoltees(cc);
  const manque = officiel.filter(z => !ont.has(z) && !VIDES_CONNUES.has(z));
  console.log('');
  console.log(cc + ' : ' + manque.length + ' zone(s) a verifier sur ' + officiel.length);
  for(const z of manque){
    const n = await compte(page, z);
    if(n === null){ muettes.push(z); process.stdout.write('?'); }
    else if(n === 0){ vides.push(z); process.stdout.write('.'); }
    else { peuplees.push(z + ' (' + n + ')'); process.stdout.write('!'); }
  }
  console.log('');
}

await navigateur.close();

console.log('');
console.log('vides (rien a y recolter)   : ' + vides.length);
console.log('PEUPLEES (a recolter)       : ' + peuplees.length + (peuplees.length ? ' -> ' + peuplees.join(', ') : ''));
console.log('muettes (a rejouer)         : ' + muettes.length + (muettes.length ? ' -> ' + muettes.join(', ') : ''));

const sortie = join(RACINE, 'tools', 'build', 'zones-vides-verifiees.json');
writeFileSync(sortie, JSON.stringify({ date: new Date().toISOString().slice(0, 10),
  temoin: { zone: TEMOIN.zone, especes: t }, vides, peuplees, muettes }, null, 2) + '\n', 'utf8');
console.log('');
console.log('detail ecrit dans ' + sortie);
console.log(peuplees.length ? 'IL RESTE A RECOLTER.' : 'RIEN A RECOLTER : toutes les zones absentes sont vides chez eBird.');
