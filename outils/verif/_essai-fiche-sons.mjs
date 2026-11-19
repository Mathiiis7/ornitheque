// Essai (2026-11-19, ticket qg#84) : la fiche espèce quand xeno-canto ne répond plus.
//   node outils/verif/_essai-fiche-sons.mjs
// Sur la démo locale (localhost:8765), l'API de xeno-canto est remplacée par une route : elle ne
// répond jamais (la panne du 2026-11-18 : 504 au bout de 60 s), ou refuse tout de suite. Aucune
// demande ne part vers le vrai xeno-canto : ses fichiers et sonagrammes sont servis par des copies
// locales, et on note seulement quelles adresses la page a demandées.
// Mesure, pour un oiseau de parcours (Mésange charbonnière, chant copié) et un oiseau hors parcours
// (Tichodrome) : le temps avant que le chant et le cri s'affichent, d'où vient chaque son, s'il a
// un sonagramme, et ce que dit la console (une règle CSP qui bloquerait GBIF s'y verrait).
import { chromium } from 'playwright';
import fs from 'node:fs';

const RACINE = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const MP3 = fs.readFileSync(RACINE + 'data/chants/1100272.mp3');
const PNG = fs.readFileSync(RACINE + 'assets/icons/aigle.png');

async function essai(navigateur, { nom, api, gbif = 'vrai', taille = 'ordi', especes, rouvrir = false }) {
  const tel = taille === 'tel';
  const ctx = await navigateur.newContext({ viewport: tel ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: tel, hasTouch: tel, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const console_ = [], demandes = [];
  page.on('console', m => { if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) console_.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => console_.push('ERREUR ' + e.message));
  await page.route('https://xeno-canto.org/api/**', route => {
    demandes.push('api');
    if (api === 'muet') return;                       // jamais de réponse : le délai de la page tranche
    if (api === 'refus') return route.abort('failed');
    return route.fulfill({ status: 504, body: 'Gateway Timeout' });
  });
  await page.route('https://xeno-canto.org/sounds/uploaded/**', route => { demandes.push('fichier ' + route.request().url().slice(36, 90)); return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: MP3 }); });
  await page.route('https://xeno-canto.org/sounds/spectrograms/**', route => { demandes.push('sono'); return route.fulfill({ status: 200, contentType: 'image/png', body: PNG }); });
  await page.route('https://xeno-canto.org/*/download', route => { demandes.push('download'); });
  await page.route('https://api.gbif.org/v1/occurrence/search**', route => {
    demandes.push('gbif');
    if (gbif === 'refus') return route.abort('failed');
    return route.continue();
  });
  await page.route('https://api.inaturalist.org/**', route => { demandes.push('inat'); return route.abort('failed'); });
  await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const lignes = [];
  for (const sci of especes) {
    for (let fois = 1; fois <= (rouvrir ? 2 : 1); fois++) {
      const avant = demandes.length;
      const t0 = Date.now();
      await page.evaluate(sci => {
        document.querySelectorAll('dialog[open]').forEach(d => d.close());
        const a = document.createElement('a'); a.href = '#'; a.className = 'sp-link'; a.dataset.sci = sci; a.textContent = 'x';
        document.querySelector('main, body').appendChild(a); a.click(); a.remove();
      }, sci);
      await page.evaluate(() => document.querySelector('.sm-tab[data-sm-tab="sound"]')?.click());
      let tChant = null, tCri = null, tFin = null;
      while (Date.now() - t0 < 30000) {
        const e = await page.evaluate(() => ({
          chant: !document.querySelector('#smSongRow').hidden && !!document.querySelector('#smSongRow .xa-player'),
          cri: !document.querySelector('#smCallRow').hidden && !!document.querySelector('#smCallRow .xa-player'),
          attente: !document.querySelector('#smAudioHint').hidden && /Recherche/.test(document.querySelector('#smAudioHint').textContent),
        }));
        if (e.chant && tChant === null) tChant = Date.now() - t0;
        if (e.cri && tCri === null) tCri = Date.now() - t0;
        if (!e.attente && (e.cri || (tChant !== null && Date.now() - t0 > 12000) || (!e.chant && !e.cri))) { tFin = Date.now() - t0; break; }
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(800);
      const etat = await page.evaluate(() => {
        const p = s => { const el = document.querySelector(s + ' .xa-player'); return el ? { src: el.dataset.xaSrc, sono: !!el.querySelector('img.xa-bar-sono'), autres: el.closest('.xa-block')?.parentElement.querySelectorAll('.xa-more .xa-player').length || 0, meta: el.closest('.xa-block')?.querySelector('.xa-hdr-meta')?.textContent.trim().slice(0, 70) } : null; };
        const h = document.querySelector('#smAudioHint');
        return { chant: p('#smSongRow'), cri: p('#smCallRow'), message: h.hidden ? '' : h.textContent };
      });
      if (tel) await page.screenshot({ path: RACINE + 'notes-privees/essai-fiche-sons-' + nom + '.png' });
      const court = s => (s || '').replace('https://xeno-canto.org/sounds/uploaded/', 'xc/').slice(0, 70);
      lignes.push(`  ${sci}${rouvrir ? ' (ouverture ' + fois + ')' : ''} : chant à ${tChant ?? '-'} ms, cri à ${tCri ?? '-'} ms, fin à ${tFin ?? '>30000'} ms`);
      lignes.push(`    chant : ${etat.chant ? court(etat.chant.src) + (etat.chant.sono ? ', sonagramme' : ', SANS sonagramme') + ', ' + etat.chant.autres + ' autres · ' + etat.chant.meta : 'aucun'}`);
      lignes.push(`    cri   : ${etat.cri ? court(etat.cri.src) + (etat.cri.sono ? ', sonagramme' : ', SANS sonagramme') + ', ' + etat.cri.autres + ' autres · ' + etat.cri.meta : 'aucun'}`);
      if (etat.message) lignes.push(`    message : ${etat.message}`);
      const d = demandes.slice(avant); const compte = {}; for (const x of d) { const k = x.split(' ')[0]; compte[k] = (compte[k] || 0) + 1; }
      lignes.push(`    demandes : ${JSON.stringify(compte)}`);
    }
  }
  console.log(`\n${nom} (API ${api}, GBIF ${gbif}, ${taille})`);
  console.log(lignes.join('\n'));
  console.log('  console : ' + (console_.length ? console_.slice(0, 6).join(' | ') : 'rien'));
  await ctx.close();
}

const navigateur = await chromium.launch();
await essai(navigateur, { nom: 'muet-ordi', api: 'muet', especes: ['parus major', 'tichodroma muraria'] });
await essai(navigateur, { nom: 'refus-ordi', api: 'refus', especes: ['tichodroma muraria'] });
await essai(navigateur, { nom: 'muet-tel', api: 'muet', taille: 'tel', especes: ['tichodroma muraria'] });
await essai(navigateur, { nom: 'tout-en-panne', api: 'refus', gbif: 'refus', especes: ['tichodroma muraria'], rouvrir: true });
await navigateur.close();
