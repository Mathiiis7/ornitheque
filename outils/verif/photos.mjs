/*
  Les images ne voyagent plus au demarrage.

  POURQUOI CE BANC
  Mesure du 2026-09-29 sur la vraie ligue : 56 images en base64 stockees DANS les documents
  Firestore, 14 737 Ko avales a la connexion, et le classement qui attend derriere. Depuis la
  separation, une image publiee vit dans TROIS documents : un apercu flou de quelques Ko dans
  le document leger (celui que tout le monde recoit au demarrage), la vignette nette dans
  photoThumbs, l image pleine dans photoFull. Les deux derniers ne se lisent qu au moment de
  regarder.

  La regression a craindre n est pas visible a l oeil : une photo qui s affiche est une photo
  qui s affiche, qu elle ait coute 5 Ko ou 263 Ko. Seul un compteur de lectures le dit.

  CE QU IL VERIFIE
  1. au demarrage, AUCUNE lecture de vignette ni d image pleine
  2. ouvrir la galerie charge les vignettes, une lecture chacune, jamais deux
  3. un re-rendu (une reaction qui arrive) ne relit rien : le cache tient
  4. ouvrir une photo en grand lit l image pleine, et elle seule
  5. une photo publiee AVANT la separation s affiche toujours, sans lecture de plus
  6. le poids reel des trois tailles, mesure et non suppose

  Meme montage que trophees et firestore, dont il est copie : Firebase bouchonne
  (outils/verif/bouchons/), branche par une importmap, aucun reseau, aucun compte. Voir
  l entete de trophees pour les deux pieges du montage - l ancre de l importmap, qui est le
  charset et non un <head> inexistant, et le service worker qui servirait un app.js en cache.
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { RACINE, rapport } from './_banc.mjs';

export const nom = 'photos';
export const titre = 'Images separees du document leger';
export const quoi = 'rien de lourd au demarrage, la vignette a l ecran, la pleine au clic';

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const LIGUE = 'leagues/merlin-bird/';
const NB_PHOTOS = 12;        // dont la derniere est une photo d avant la separation

const MEMBRES = [
  { id: 'uid-moi', data: { name: 'Moi', joinedAt: { seconds: 1 }, species: [
      { k: 'merle noir', c: 'Merle noir', s: 'Turdus merula', d: '2025-01-02', l: 'Paris', f: true, co: 'FR', a: 1 },
      { k: 'buse variable', c: 'Buse variable', s: 'Buteo buteo', d: '2025-01-04', l: 'Paris', f: true, co: 'FR', a: 2 } ] } }
];

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.html': 'text/html' };

function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: {
    [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js',
    [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js',
    [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  const ancre = '<meta charset="utf-8">';
  if(!html.includes(ancre)) throw new Error('ancre introuvable dans index.html : ' + ancre);
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  if(!/^[\s\S]{0,400}importmap/.test(html)) throw new Error('importmap posee trop loin dans la page');
  return html.replace(/app\.js\?v=\d+/g, 'app.js');
}

function serveur(){
  return createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const envoyer = (corps, type) => { res.writeHead(200, { 'content-type': type + '; charset=utf-8' }); res.end(corps); };
    try{
      if(u === '/' || u === '/index.html') return envoyer(pageHtml(), 'text/html');
      if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
      const f = join(RACINE, u.replace(/^\/+/, ''));
      if(!existsSync(f)){ res.writeHead(404); return res.end('rien'); }
      return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
    }catch(e){ res.writeHead(500); res.end(String(e.message)); }
  });
}

// Fabrique les images DANS la page, puis livre le snapshot : les documents portent des
// horodatages a methodes (toMillis, toDate) qui ne passeraient pas la frontiere avec Node.
// Trois aplats de couleurs differentes, donc de longueurs differentes : le banc reconnait
// ensuite laquelle des trois tailles une image affiche, sans regarder un seul pixel.
function poserPhotos({ nb, ligue }){
  const carre = (px, couleur) => {
    const cv = document.createElement('canvas');
    cv.width = px; cv.height = px;
    const c = cv.getContext('2d');
    c.fillStyle = couleur; c.fillRect(0, 0, px, px);
    return cv.toDataURL('image/jpeg', 0.7);
  };
  const APERCU = carre(120, '#204020'), VIGNETTE = carre(480, '#40a040'), PLEINE = carre(1200, '#80ff80');
  const horo = s => ({ seconds: s, toMillis: () => s * 1000, toDate: () => new Date(s * 1000) });
  const docs = [];
  for(let i = 0; i < nb - 1; i++){
    docs.push({ id: 'ph' + i, data: { uid: 'uid-moi', name: 'Moi', blur: APERCU, createdAt: horo(1000 + i) } });
    window.__fs.poser(ligue + 'photoThumbs/ph' + i, { uid: 'uid-moi', image: VIGNETTE });
    window.__fs.poser(ligue + 'photoFull/ph' + i,   { uid: 'uid-moi', image: PLEINE });
  }
  // La derniere est une photo d avant la separation : son image pleine est encore dans le
  // document leger. Elle doit s afficher sans qu on aille lire quoi que ce soit.
  docs.push({ id: 'vieille', data: { uid: 'uid-moi', name: 'Moi', image: PLEINE, createdAt: horo(999) } });
  window.__mesures = { apercu: APERCU.length, vignette: VIGNETTE.length, pleine: PLEINE.length };
  window.__fs.livrer(ligue + 'photos', docs);
  return { apercu: APERCU.length, vignette: VIGNETTE.length, pleine: PLEINE.length };
}

// Combien d images de la galerie montrent quoi. On distingue les trois tailles par la
// longueur de leur data-URL, qui est unique a chaque couleur.
function etatGalerie(){
  const out = { total: 0, apercu: 0, vignette: 0, pleine: 0, enAttente: 0, autre: 0 };
  for(const img of document.querySelectorAll('#photoGrid .photo-img')){
    out.total++;
    if(img.dataset.thumb) out.enAttente++;
    const n = (img.getAttribute('src') || '').length;
    if(n === window.__mesures.apercu) out.apercu++;
    else if(n === window.__mesures.vignette) out.vignette++;
    else if(n === window.__mesures.pleine) out.pleine++;
    else out.autre++;
  }
  out.longueurs = [...new Set([...document.querySelectorAll('#photoGrid .photo-img')]
    .map(i => (i.getAttribute('src') || '').length))].sort((a, b) => a - b);
  return out;
}

async function jouer(navigateur){
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const horsCallback = [];
  page.on('pageerror', e => horsCallback.push(String(e.stack || e).split('\n').slice(0, 3).join(' | ')));
  const srv = serveur();
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  try{
    await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 15000 });
    await page.evaluate(() => window.__auth.connecter('uid-moi'));

    // Les snapshots arrivent comme en vrai : membres d abord, puis photos.
    await page.evaluate(a => window.__fs.livrer(a.ligue + 'members', a.membres), { ligue: LIGUE, membres: MEMBRES });
    const reperes = await page.evaluate(poserPhotos, { nb: NB_PHOTOS, ligue: LIGUE });
    await page.waitForTimeout(300);

    const lectures = () => page.evaluate(() => window.__lectures.ponctuelles.slice());
    const lourdes = l => l.filter(x => /photoThumbs|photoFull/.test(x));
    const apresDemarrage = lourdes(await lectures());

    // Ouvrir la galerie. C est seulement la que les vignettes ont une raison d arriver.
    await page.evaluate(() => document.querySelector('.tab[data-view="photos"]')?.click());
    await page.waitForTimeout(600);
    // Si la grille ne fait aucune hauteur, l observateur ne verra jamais rien et le banc
    // mesurerait du vide en croyant mesurer la galerie. On veut le savoir.
    const hauteurGrille = await page.evaluate(() => {
      const g = document.getElementById('photoGrid');
      return g ? Math.round(g.getBoundingClientRect().height) : 0;
    });
    const apresOuverture = lourdes(await lectures());
    const galerieOuverte = await page.evaluate(etatGalerie);

    // Descendre jusqu au bout : toutes les vignettes doivent finir par arriver.
    await page.evaluate(() => {
      const cartes = document.querySelectorAll('#photoGrid .photo-card');
      if(cartes.length) cartes[cartes.length - 1].scrollIntoView({ block: 'end' });
    });
    await page.waitForTimeout(800);
    const apresDefilement = lourdes(await lectures());
    const galerieDefilee = await page.evaluate(etatGalerie);

    // Un re-rendu : une reaction qui arrive rejoue renderPhotos de bout en bout. Sans cache,
    // chaque photo repartirait de son apercu flou et paierait une seconde lecture.
    await page.evaluate(l => window.__fs.livrer(l + 'reactions',
      [{ id: 'r1', data: { uid: 'uid-moi', target: 'photo:ph0', emoji: '👍' } }]), LIGUE);
    await page.waitForTimeout(400);
    const apresRerendu = lourdes(await lectures());
    const galerieRerendue = await page.evaluate(etatGalerie);

    // Ouvrir une photo en grand : c est le seul moment ou l image pleine se justifie.
    await page.evaluate(() => document.querySelector('#photoGrid .photo-img')?.click());
    await page.waitForTimeout(500);
    const apresClic = lourdes(await lectures());
    const modale = await page.evaluate(() => {
      const el = document.getElementById('imgModalImg');
      const n = (el && el.getAttribute('src') || '').length;
      return { ouverte: !!document.getElementById('imgModal')?.classList.contains('open'),
               pleine: n === window.__mesures.pleine, vignette: n === window.__mesures.vignette };
    });

    // Le poids reel des trois tailles, sur une photo de la taille d un appareil courant.
    const poids = await page.evaluate(async () => {
      const cv = document.createElement('canvas');
      cv.width = 2400; cv.height = 1600;
      const c = cv.getContext('2d');
      // Un degrade plus du bruit : une image unie se compresserait bien mieux que le reel
      // et donnerait un chiffre trop flatteur.
      const g = c.createLinearGradient(0, 0, 2400, 1600);
      g.addColorStop(0, '#2b5d34'); g.addColorStop(0.5, '#c8b37a'); g.addColorStop(1, '#1d3b5c');
      c.fillStyle = g; c.fillRect(0, 0, 2400, 1600);
      for(let i = 0; i < 6000; i++){
        c.fillStyle = 'rgba(' + ((i * 37) % 255) + ',' + ((i * 91) % 255) + ',' + ((i * 53) % 255) + ',0.5)';
        c.fillRect((i * 17) % 2400, (i * 29) % 1600, 7, 7);
      }
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
      const trio = await window.__imageTrio(new File([blob], 'test.jpg', { type: 'image/jpeg' }), 1200, 850000);
      return { apercu: trio.blur.length, vignette: trio.thumb.length, pleine: trio.full.length };
    });
    poids.reperes = reperes;

    return { apresDemarrage, apresOuverture, apresDefilement, apresRerendu, apresClic,
             galerieOuverte, galerieDefilee, galerieRerendue, modale, poids, horsCallback, hauteurGrille };
  }finally{
    await ctx.close();
    srv.close();
  }
}

export async function mesure({ navigateur }){
  const r = rapport();
  const m = await jouer(navigateur);
  const ko = n => Math.round(n / 1024) + ' Ko';
  const separees = NB_PHOTOS - 1;

  r.verif('erreurs de page', m.horsCallback.length, m.horsCallback.length === 0);
  for(const e of m.horsCallback) r.note('  ' + e.replace(/http:\/\/127\.0\.0\.1:\d+\//g, ''));

  r.note('Demarrage : ' + separees + ' photos separees + 1 photo d avant la separation');
  r.verif('  lectures de vignette ou d image pleine', m.apresDemarrage.length, m.apresDemarrage.length === 0);

  r.note('Galerie ouverte');
  r.verif('  cartes rendues', m.galerieOuverte.total, m.galerieOuverte.total === NB_PHOTOS);
  r.verif('  hauteur de la grille', m.hauteurGrille + ' px', m.hauteurGrille > 0);
  r.verif('  vignettes deja lues', m.apresOuverture.length, m.apresOuverture.length > 0);
  r.verif('  aucune image pleine lue', m.apresOuverture.filter(x => /photoFull/.test(x)).length,
          m.apresOuverture.filter(x => /photoFull/.test(x)).length === 0);

  r.note('  reperes de longueur : apercu ' + m.poids.reperes.apercu + ', vignette ' +
         m.poids.reperes.vignette + ', pleine ' + m.poids.reperes.pleine);
  r.note('  longueurs vues dans la grille : ' + m.galerieDefilee.longueurs.join(', '));
  r.note('Apres defilement jusqu au bas de la galerie');
  r.verif('  vignettes lues', m.apresDefilement.length + ' / ' + separees, m.apresDefilement.length === separees);
  r.verif('  aucune lue deux fois', new Set(m.apresDefilement).size + ' distinctes',
          new Set(m.apresDefilement).size === m.apresDefilement.length);
  r.verif('  images montrant leur vignette', m.galerieDefilee.vignette, m.galerieDefilee.vignette === separees);
  r.verif('  images restees a l apercu flou', m.galerieDefilee.apercu, m.galerieDefilee.apercu === 0);
  r.verif('  photo d avant la separation affichee', m.galerieDefilee.pleine, m.galerieDefilee.pleine === 1);

  r.note('Un re-rendu (une reaction qui arrive)');
  const relectures = m.apresRerendu.length - m.apresDefilement.length;
  r.verif('  lectures supplementaires', relectures, relectures === 0);
  r.verif('  images retombees a l apercu flou', m.galerieRerendue.apercu, m.galerieRerendue.apercu === 0);

  r.note('Clic sur une photo');
  const pleines = m.apresClic.filter(x => /photoFull/.test(x));
  r.verif('  modale ouverte', m.modale.ouverte ? 'oui' : 'non', m.modale.ouverte === true);
  r.verif('  images pleines lues', pleines.length, pleines.length === 1);
  r.verif('  modale montrant l image pleine', m.modale.pleine ? 'oui' : 'non', m.modale.pleine === true);

  r.note('Poids reel des trois tailles, photo 2400x1600 avec degrade et bruit');
  r.note('  apercu flou (dans le document leger) : ' + ko(m.poids.apercu));
  r.note('  vignette nette (lue a l ecran)       : ' + ko(m.poids.vignette));
  r.note('  image pleine (lue au clic)           : ' + ko(m.poids.pleine));
  r.verif('  apercu sous le plafond des regles (20 000 caracteres)', m.poids.apercu, m.poids.apercu <= 20000);
  r.verif('  vignette sous son plafond (150 000 caracteres)', m.poids.vignette, m.poids.vignette <= 150000);
  r.verif('  image pleine sous son plafond (950 000 caracteres)', m.poids.pleine, m.poids.pleine <= 950000);

  // Le chiffre qui a decide de tout ce travail, rejoue sur la vraie ligue mesuree le
  // 2026-09-29 : 56 images, 14 737 Ko dans les documents legers.
  const AVANT_KO = 14737, NB_VRAIES = 56;
  const apres = Math.round(NB_VRAIES * m.poids.apercu / 1024);
  r.note('Sur la vraie ligue du 2026-09-29 (' + NB_VRAIES + ' images, ' + AVANT_KO + ' Ko au demarrage)');
  r.note('  une fois migree, au demarrage : environ ' + apres + ' Ko, soit ' +
         Math.round(100 - apres * 100 / AVANT_KO) + ' % de moins');

  return r.rendu();
}
