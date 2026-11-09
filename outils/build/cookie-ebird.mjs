#!/usr/bin/env node
/*
  cookie-ebird.mjs - Récupère le cookie d'une session eBird connectée, sans rien copier à la main.

  POURQUOI. Les bar charts (/barchartData) exigent un compte connecté. Le cookie qui compte,
  EBIRD_SESSIONID, est « HttpOnly » : ni document.cookie dans la console, ni un copier-coller
  facile ne le donnent (méthode des DevTools jugée impraticable par Mathis le 2026-11-09).

  CE QUE FAIT LE SCRIPT. Il ouvre une vraie fenêtre Chrome sur la page de connexion d'eBird.
  Mathis s'y connecte lui-même (le script ne voit ni ne tape aucun mot de passe). Le script
  vérifie toutes les 3 s qu'un bar chart répond, puis écrit TOUS les cookies d'ebird.org,
  HttpOnly compris, au format « nom=valeur; nom=valeur » dans un fichier HORS DU DÉPÔT.

  Ce fichier sert aux deux familles de scripts :
    - EBIRD_COOKIE_FILE=<fichier> pour les scrapers Playwright ;
    - EBIRD_COOKIE="$(cat <fichier>)" pour les téléchargeurs de bar charts.

  Usage : node outils/build/cookie-ebird.mjs [fichier]
  Défaut : C:\Users\mathi\Documents\.ebird-cookie.txt
*/
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const SORTIE = process.argv[2] || 'C:/Users/mathi/Documents/.ebird-cookie.txt';
// Témoin : un petit pays, réponse rapide. Connecté, la réponse est un TSV qui commence
// par le nom des colonnes ; déconnecté, c'est une redirection vers la page de connexion.
const TEMOIN = 'https://ebird.org/barchartData?byr=2019&eyr=2026&bmo=1&emo=12&r=LU&fmt=tsv';

const navigateur = await chromium.launch({ channel: 'chrome', headless: false });
const ctx = await navigateur.newContext();
const page = await ctx.newPage();
await page.goto('https://ebird.org/home');
console.log('Connecte-toi à eBird dans la fenêtre qui vient de s\'ouvrir (« Sign in » en haut à droite).');
console.log('Le script attend tout seul, jusqu\'à 10 minutes.\n');

const sonde = await ctx.newPage();
let ok = false;
for (let i = 0; i < 200 && !ok; i++) {
  await new Promise(r => setTimeout(r, 3000));
  try {
    const rep = await sonde.request.get(TEMOIN, { maxRedirects: 0 });
    const texte = rep.status() === 200 ? await rep.text() : '';
    ok = texte.includes('\t') && !/<html/i.test(texte.slice(0, 500));
  } catch { /* la fenêtre est peut-être en train de changer de page */ }
}
await sonde.close();

if (!ok) {
  console.error('Pas de connexion détectée au bout de 10 minutes. Rien n\'a été écrit.');
  await navigateur.close();
  process.exit(1);
}

const cookies = (await ctx.cookies()).filter(c => /ebird\.org$/.test(c.domain.replace(/^\./, '')) || c.domain.endsWith('.ebird.org'));
writeFileSync(SORTIE, cookies.map(c => `${c.name}=${c.value}`).join('; '), 'utf8');
console.log(`Connexion vérifiée sur un vrai bar chart. ${cookies.length} cookies écrits dans ${SORTIE}`);
console.log('Tu peux fermer la fenêtre.');
await navigateur.close();
