/*
  Banc de la demo du portfolio (demo/). Deux questions, et la premiere compte plus que la
  seconde :

  1. Le double a-t-il pris du retard ? demo/index.html recopie le squelette d index.html.
     Un double qui diverge en silence est le piege maison - inject-exotic-by-region.mjs a
     coute deux jours pour ca le 2026-09-27. Le generateur sait se comparer au disque, ce
     banc lui pose la question.

  2. La demo demarre-t-elle vraiment ? On la charge dans un vrai navigateur, sans compte et
     sans reseau, et on verifie ce qu un visiteur du portfolio verra : les quinze
     abonnements servis, les cinq membres au classement, le bandeau, aucun service worker,
     et surtout un message envoye dans le chat qui APPARAIT - c est la promesse de la demo
     vivante, tranchee le 2026-09-28.

  Banc pilote : il exporte mesure() et non html(), comme trophees.
*/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { join, extname } from 'node:path';

export const nom = 'demo';
export const quoi = 'la demo du portfolio demarre seule, et ses boutons agissent';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
                '.json': 'application/json; charset=utf-8', '.png': 'image/png',
                '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
                '.geojson': 'application/json; charset=utf-8' };

// Sert le depot tel quel. Un serveur http est indispensable : sous file://, une importmap
// et un module ES sont refuses (voir l entete de trophees.mjs).
function serveur(RACINE){
  return createServer(async (req, res) => {
    let chemin = decodeURIComponent(req.url.split('?')[0]);
    if(chemin.endsWith('/')) chemin += 'index.html';
    try{
      const corps = await readFile(join(RACINE, chemin));
      res.writeHead(200, { 'Content-Type': TYPES[extname(chemin)] || 'application/octet-stream' });
      res.end(corps);
    }catch(_){ res.writeHead(404); res.end('absent'); }
  });
}

function generateurDitAJour(RACINE){
  return new Promise(resolve => {
    execFile(process.execPath, [join(RACINE, 'tools/build/genere-demo.mjs'), '--verifie'],
      { cwd: RACINE }, (err, out) => resolve({ ok: !err, sortie: String(out || '').trimEnd() }));
  });
}

export async function mesure({ navigateur, RACINE }){
  const lignes = [];
  let rates = 0;
  const verif = (libelle, valeur, ok) => {
    lignes.push('  ' + String(libelle).padEnd(32) + String(valeur).padEnd(26) + (ok ? 'ok' : 'DEFAUT'));
    if(!ok) rates++;
  };

  // --- 1. fraicheur -------------------------------------------------------
  lignes.push('fichiers generes');
  const frais = await generateurDitAJour(RACINE);
  for(const l of frais.sortie.split('\n')) if(l.trim()) lignes.push('  ' + l.trim());
  verif('demo a jour sur ses sources', frais.ok ? 'oui' : 'NON, relancer le generateur', frais.ok);

  // --- 2. la demo dans un vrai navigateur ---------------------------------
  lignes.push('demarrage sans compte ni reseau');
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(String(e.stack || e).split('\n').slice(0, 2).join(' | ')));
  // Le banc travaille hors ligne : tout ce qui vise l exterieur est abandonne, sinon il
  // dependrait d unpkg et d OpenStreetMap pour rendre son verdict. Mais seules les requetes
  // FIREBASE sont un defaut : elles voudraient dire que les bouchons ont ete contournes et
  // que la demo parle a la vraie base. Leaflet et les tuiles de carte, elles, sont normales -
  // la demo charge le meme app.js que le vrai site.
  const versFirebase = [];
  await page.route('**/*', route => {
    const u = route.request().url();
    if(/gstatic\.com\/firebasejs|firestore\.googleapis|identitytoolkit|securetoken|firebaseio/.test(u)) versFirebase.push(u);
    if(!u.startsWith('http://127.0.0.1')) return route.abort();
    return route.continue();
  });

  const srv = serveur(RACINE);
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  try{
    await page.goto(base + '/demo/', { waitUntil: 'load' });
    // Le bouchon connecte tout seul, puis app.js s abonne : on attend que les abonnements
    // soient poses plutot qu un delai au juge.
    await page.waitForFunction(() => window.__demo && window.__demo.chemins().length >= 14,
                               null, { timeout: 20000 }).catch(() => {});
    // Le tableau du classement n est bati que lorsque son onglet est ouvert : sans ce clic,
    // #board ne contient que son titre et ses trois modes, et le banc concluait a tort que
    // les membres manquaient. On fait donc ce que fait le visiteur - il arrive sur la carte
    // et va voir le classement.
    await page.evaluate(() => document.querySelector('[data-view="ranking"]')?.click());
    await page.waitForFunction(() => ((document.querySelector('#board') || {}).textContent || '').includes('Samir'),
                               null, { timeout: 15000 }).catch(() => {});

    const etat = await page.evaluate(() => ({
      abonnements: window.__demo ? window.__demo.chemins().length : 0,
      membres: document.querySelectorAll('#board tbody tr, #board .board-row').length,
      // textContent et non innerText : la vue classement n est pas l onglet actif au
      // demarrage, et innerText ne rend que le texte VISIBLE - il renvoyait une chaine vide.
      texteClassement: (document.querySelector('#board') || {}).textContent || '',
      bandeau: !!document.querySelector('#demoBandeau'),
      basePointeRacine: (document.querySelector('base') || {}).getAttribute
        ? document.querySelector('base').getAttribute('href') : '',
      swNeutralise: (() => { try{ return navigator.serviceWorker.register.toString().includes('Promise.resolve'); }
                             catch(_){ return true; } })(),
    }));

    verif('abonnements servis', etat.abonnements, etat.abonnements >= 14);
    verif('bandeau de demonstration', etat.bandeau ? 'present' : 'ABSENT', etat.bandeau);
    verif('base href', etat.basePointeRacine, etat.basePointeRacine === '../');
    verif('service worker neutralise', etat.swNeutralise ? 'oui' : 'NON', etat.swNeutralise);
    for(const nomJoueur of ['Vous', 'Claire', 'Hugo', 'Lina', 'Samir']){
      verif('au classement : ' + nomJoueur, etat.texteClassement.includes(nomJoueur) ? 'present' : 'ABSENT',
            etat.texteClassement.includes(nomJoueur));
    }

    // --- 3. les boutons agissent -----------------------------------------
    lignes.push('demo vivante');
    const TEXTE = 'Message envoye par le banc';
    await page.evaluate(() => { const b = document.querySelector('[data-view="chat"]'); if(b) b.click(); });
    await page.fill('#chatText', TEXTE).catch(() => {});
    await page.evaluate(() => document.querySelector('#chatForm').requestSubmit()).catch(() => {});
    await page.waitForFunction(t => (document.querySelector('#chatMessages') || {}).innerText?.includes(t),
                               TEXTE, { timeout: 5000 }).catch(() => {});
    const affiche = await page.evaluate(t => ((document.querySelector('#chatMessages') || {}).innerText || '').includes(t), TEXTE);
    verif('message envoye, puis affiche', affiche ? 'oui' : 'NON', affiche);

    verif('erreurs de page', erreurs.length, erreurs.length === 0);
    if(erreurs.length) for(const e of erreurs.slice(0, 4)) lignes.push('    ' + e);
    verif('requetes vers Firebase', versFirebase.length, versFirebase.length === 0);
    if(versFirebase.length) for(const u of versFirebase.slice(0, 4)) lignes.push('    ' + u);
  } finally {
    await ctx.close();
    srv.close();
  }

  return { ok: rates === 0, sortie: lignes.join('\n') + '\n\n' + (rates ? 'DÉFAUT' : 'CONFORME') };
}
