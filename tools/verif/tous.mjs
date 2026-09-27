#!/usr/bin/env node
/*
  tous.mjs - rejoue tous les bancs de mesure et imprime leurs chiffres.

      node tools/verif/tous.mjs              tout
      node tools/verif/tous.mjs entete       un seul
      node tools/verif/tous.mjs --garder     garde les pages HTML pour les ouvrir a la main

  A LANCER apres toute retouche de l'entete du panneau, des selecteurs, des pastilles, des
  cartes ou du curseur. Un banc attrape en trois secondes ce qu'une capture d'ecran ne montre
  pas : deux pixels d'ecart, une colonne qui a bouge, un element devenu incliquable.

  Sort en code 1 si un banc echoue, pour qu'un enchainement de commandes s'arrete.
*/
import { chromium } from 'playwright';
import { writeFileSync, unlinkSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const args = process.argv.slice(2);
const GARDER = args.includes('--garder');
const filtre = args.filter(a => !a.startsWith('--'));

const modules = [];
for(const f of readdirSync(__dir).sort()){
  if(!f.endsWith('.mjs') || f.startsWith('_') || f === 'tous.mjs') continue;
  const m = await import(pathToFileURL(join(__dir, f)).href);
  if(!m.nom || typeof m.html !== 'function') continue;
  if(filtre.length && !filtre.includes(m.nom)) continue;
  modules.push(m);
}
if(!modules.length){
  console.error(filtre.length ? `aucun banc nommé « ${filtre.join(', ')} »` : 'aucun banc trouvé');
  process.exit(1);
}

// La page vit a la racine du depot : ses chemins relatifs - styles.css - doivent resoudre
// comme sur le site. Un file:// suffit, aucun serveur a lancer.
const navigateur = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await navigateur.newContext({ locale: 'fr-FR' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(String(e).split('\n')[0]));

let rates = 0;
for(const m of modules){
  const fichier = join(RACINE, `verif-${m.nom}.html`);
  erreurs.length = 0;
  let ok = false, sortie = '';
  try{
    writeFileSync(fichier, m.html());
    await page.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__fini === true, null, { timeout: 15000 });
    ok = await page.evaluate(() => window.__ok);
    sortie = await page.evaluate(() => document.getElementById('mesure').textContent);
  }catch(e){
    sortie = 'le banc n a pas rendu son verdict : ' + String(e).split('\n')[0];
    if(erreurs.length) sortie += '\n' + erreurs.map(x => '  erreur de page : ' + x).join('\n');
  }finally{
    if(!GARDER) { try{ unlinkSync(fichier); }catch(_){} }
  }
  if(!ok) rates++;
  console.log(`\n\x1b[1m${m.nom}\x1b[0m — ${m.quoi}`);
  console.log(sortie.split('\n').map(l => '  ' + l).join('\n'));
}

await navigateur.close();
console.log(rates
  ? `\n\x1b[31m${rates} banc(s) en défaut sur ${modules.length}.\x1b[0m`
  : `\n\x1b[32mLes ${modules.length} bancs sont conformes.\x1b[0m`);
if(GARDER) console.log('Pages gardées à la racine : verif-*.html');
process.exit(rates ? 1 : 0);
