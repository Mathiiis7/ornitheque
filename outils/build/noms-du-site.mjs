/*
  noms-du-site.mjs - Ramène les noms latins de la taxonomie eBird du jour aux noms qu'emploie le site.

  POURQUOI. L'API d'eBird donne les noms de sa taxonomie du jour (Schoeniclus schoeniclus) ; les tables du
  site, FR_NAMES en tête, gardent souvent l'ancien (Emberiza schoeniclus), et SCI_ALIAS (app.js) fait le lien
  à l'affichage. Des données rangées sous le nom du jour ne se retrouvent pas depuis le nom du site : la fiche
  du Bruant des roseaux ouverte depuis la France le disait absent des 30 pays du monde où il vit (audit du
  2026-11-10).

  Règle : on renomme QUE si le nom du jour est inconnu de FR_NAMES, que SCI_ALIAS mène à un nom connu, et
  que ce nom n'est pas déjà présent parmi les noms traités. SCI_ALIAS sert aussi aux espèces séparées
  (« cecropis daurica » -> « cecropis rufula ») : sans ce dernier garde-fou, les deux Hirondelles rousselines
  de Russie étaient fondues en une (essai du même jour).

  Utilisé par build-rarity-multi-country.mjs et inject-exotic-by-region.mjs.
*/
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app.js'), 'utf8');
const FR_SITE = new Set(Object.keys(JSON.parse(app.match(/^const FR_NAMES = (\{.*\});/m)[1])));
const debut = app.indexOf('const SCI_ALIAS = {');
const ALIAS_SITE = Object.fromEntries([...app.slice(debut, app.indexOf('\n};', debut))
  .matchAll(/^\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/gm)].map(m => [m[1], m[2]]));

// Vrai pour un ancien nom que SCI_ALIAS sait résoudre (« bubulcus ibis » -> « ardea ibis »).
export const estAlias = sci => sci in ALIAS_SITE;

// { nom du jour : nom du site } pour une liste de noms (ceux d'un bar chart, d'une zone).
export function renommages(noms){
  const presents = new Set(noms), r = {};
  for(const s of presents){
    const cible = ALIAS_SITE[s];
    if(!FR_SITE.has(s) && cible && FR_SITE.has(cible) && !presents.has(cible)) r[s] = cible;
  }
  return r;
}
// Le même objet, clés renommées.
export const renommer = (obj, r = renommages(Object.keys(obj))) =>
  Object.fromEntries(Object.entries(obj).map(([s, v]) => [r[s] || s, v]));
