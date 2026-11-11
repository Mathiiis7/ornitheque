/* Essai du 10/11 (pas un banc) : les trophees repris de la pause dans les Exploits de la vitrine, et le vote
   depuis la fenetre, ordinateur et telephone. Tout passe par les bouchons : aucun vote ne part dans la vraie ligue.
   Usage : node outils/verif/_essai-en-pause.mjs <sauvegarde.json> <dossier des captures> */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, S] = process.argv.slice(2);
mkdirSync(S, { recursive: true });
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES[0], autre = MEMBRES[1], tiers = MEMBRES.slice(2, 5);
console.log('moi :', moi.data.name, '| autre :', autre.data.name, '| votants :', tiers.map(m => m.data.name).join(', '));
const vote = (trophy, target, voter) => ({ id: trophy + '__' + target + '__' + voter, data: { trophy, target, voter } });
// Le Necrophile valide pour « autre » (3 votes), le kimono a 1 vote
const VOTES = [...tiers.map(m => vote('necrophile', autre.id, m.id)), vote('kimono', autre.id, tiers[0].id)];

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: { [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js', [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js', [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  const ancre = '<meta charset="utf-8">';
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  return html.replace(/(app\.js|styles\.css)\?v=\d+/g, '$1');
}
const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const envoyer = (corps, type) => { res.writeHead(200, { 'content-type': type }); res.end(corps); };
  try{
    if(u === '/' || u === '/index.html') return envoyer(pageHtml(), 'text/html; charset=utf-8');
    if(u === '/app.js' && process.env.APPJS) return envoyer(readFileSync(process.env.APPJS), 'text/javascript');   // tester une autre version d'app.js
    if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
    const f = join(RACINE, u.replace(/^\/+/, ''));
    if(!existsSync(f)){ res.writeHead(404); return res.end(); }
    return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
  }catch(e){ res.writeHead(500); res.end(String(e.message)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = 'http://127.0.0.1:' + srv.address().port + '/';

const livrerVotes = (page, v) => page.evaluate(v => window.__fs.livrer('leagues/merlin-bird/votes', v), v);
async function charger(page){
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['reactions', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  // 3 photos de « autre », sans coeur : National Geographic doit en compter 3 (100 photos postees, 10/11)
  await page.evaluate(id => window.__fs.livrer('leagues/merlin-bird/photos', [1, 2, 3].map(i => ({ id: 'ph' + i, data: { uid: id, sci: 'pica pica', createdAt: { toMillis: () => i } } }))), autre.id);
  await livrerVotes(page, VOTES);
}
async function ouvrirTrophees(page){
  await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]') || document.querySelector('[data-view="trophies"]'); t?.click(); });
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 });
  await page.waitForTimeout(2500);
}
const caseDe = async (page, nom) => page.locator('#vitrine .vt-case').nth(await page.$$eval('#vitrine .vt-case', (cs, n) => cs.findIndex(c => c.dataset.id === (n.startsWith('x-') ? n : 'e-' + n)), nom));
// Toucher un trophee ; s'il attend son animation, on la laisse jouer puis on retouche
async function ouvrir(page, nom){
  let c = await caseDe(page, nom);
  await c.scrollIntoViewIfNeeded();
  if(await c.evaluate(e => e.classList.contains('vt-attend'))){ await c.click(); await page.waitForTimeout(3500); c = await caseDe(page, nom); }
  await c.click(); await page.waitForTimeout(400);
}
const fenetre = page => page.evaluate(() => ({ ouvert: document.querySelector('#trophyModal').classList.contains('open'), titre: document.querySelector('#tmodalTitle').textContent,
  notes: [...document.querySelectorAll('#tmodalBody .tmodal-note')].map(p => p.textContent).join(' / '),
  bouton: document.querySelector('#tmodalBody .vt-vote-btn')?.textContent || '-' }));
const fermer = async page => { await page.locator('#tmodalX').click(); await page.waitForTimeout(300); };
const PAUSE = ["Tia mis le kimono", 'Nécrophile', 'Gros Bébé', 'Bourriche d’huître'];

const nav = await chromium.launch();
const erreurs = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  await charger(page); await page.waitForTimeout(1500); await ouvrirTrophees(page);
  const exploits = await page.$$eval('#vitrine .vt-case', cs => cs.filter(c => c.dataset.id.startsWith('e-') || c.dataset.id.startsWith('x-')).map(c => c.dataset.id.replace(/^[ex]-/, '') + (c.classList.contains('vt-manque') ? '' : ' (gagne)')));
  console.log(nom, '| Exploits :', exploits.join(', '));
  // Sa propre vitrine : pas de bouton, les autres votent
  for(const t of PAUSE){ await ouvrir(page, t); const f = await fenetre(page); console.log(nom, '| moi |', t, '|', f.ouvert, '|', f.notes, '| bouton :', f.bouton); await fermer(page); }
  // La vitrine d'un autre membre
  await page.evaluate(id => document.querySelector(`#trophyWho .whochip[data-id="${id}"]`).click(), autre.id); await page.waitForTimeout(1500);
  console.log(nom, '| autre | Necrophile gagne :', await (await caseDe(page, 'Nécrophile')).evaluate(e => !e.classList.contains('vt-manque')));
  await ouvrir(page, "Tia mis le kimono");
  let f = await fenetre(page); console.log(nom, '| autre | kimono avant |', f.notes, '| bouton :', f.bouton);
  const btn = page.locator('#tmodalBody .vt-vote-btn');
  console.log(nom, '| bouton :', await btn.evaluate(b => Math.round(b.getBoundingClientRect().height) + ' px ecran, ' + getComputedStyle(b).fontSize + ', doigt ' + matchMedia('(pointer: coarse)').matches));
  await page.locator('#trophyModal .tmodal, #trophyModal > *').first().screenshot({ path: S + '/' + nom + '-kimono-avant.png' });
  await btn.click(); await page.waitForTimeout(300);
  console.log(nom, '| ecritures apres Valider :', await page.evaluate(() => window.__ecritures.filter(e => e.includes('/votes/')).join(' ; ')));
  // La base renvoie le nouveau vote : la fenetre ouverte doit suivre
  await livrerVotes(page, [...VOTES, vote('kimono', autre.id, moi.id)]); await page.waitForTimeout(600);
  f = await fenetre(page); console.log(nom, '| autre | kimono apres |', f.ouvert, '|', f.notes, '| bouton :', f.bouton);
  await page.locator('#trophyModal .tmodal, #trophyModal > *').first().screenshot({ path: S + '/' + nom + '-kimono-apres.png' });
  await page.locator('#tmodalBody .vt-vote-btn').click(); await page.waitForTimeout(300);
  console.log(nom, '| ecritures apres Retirer :', await page.evaluate(() => window.__ecritures.filter(e => e.includes('/votes/')).join(' ; ')));
  await fermer(page);
  await ouvrir(page, 'Bourriche d’huître'); f = await fenetre(page); console.log(nom, '| autre | Bourriche |', f.notes, '| bouton :', f.bouton); await fermer(page);
  // La rangee des Exploits, en image
  // Bourriche gagnee (mode Essai : chez un autre membre, le toucher la debloque tout de suite), et Gargantua a
  // cote pour comparer les tailles
  await page.locator('#vtEssai').click(); await page.waitForTimeout(400);
  for(const t of ['Bourriche d’huître', 'Gros Bébé', 'Magellan', 'x-ecologue-100', 'x-ecologue-200', 'x-natgeo', 'x-terroir', 'x-terroir', 'x-terroir']){ const c = await caseDe(page, t);
    if(!(await c.evaluate(e => e.classList.contains('vt-manque')))) continue;   // deja gagne : un toucher l'eteindrait
    await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(4000); }
  console.log(nom, '| plaques :', await page.$$eval('#vitrine .vt-case', cs => cs.filter(c => /x-ecologue-100|x-natgeo/.test(c.dataset.id)).map(c => c.querySelector('.vt-nom').textContent + ' = ' + (c.querySelector('.vt-nom').dataset.tip || '-')).join(' | ')));
  const g = page.locator('#vitrine .vt-case').nth(await page.$$eval('#vitrine .vt-case', cs => cs.findIndex(c => c.dataset.id === 'u-Gargantua')));
  await g.scrollIntoViewIfNeeded(); await g.click(); await page.waitForTimeout(4000);
  await page.locator('#vtEssai').click(); await page.waitForTimeout(400);
  // La vitrine entiere, ses etages (10/11) : chaque etage revient a son debut, puis Exploits va a Magellan
  const etages = await page.$$eval('#vitrine .vt-etage', es => es.map(e => e.querySelector('h4').textContent + ' ' + e.querySelector('.vt-etage-tete span').textContent + ' : ' +
    [...e.querySelectorAll('.vt-case')].map(c => c.dataset.id.replace(/^[exu]-/, '')).join(', ')));
  console.log(nom, '| etages :\n  ' + etages.join('\n  '));
  await page.evaluate(() => { for(const r of document.querySelectorAll('#vitrine .vt-rail')) r.scrollLeft = 0;
    const c = [...document.querySelectorAll('#vitrine .vt-case')].find(x => x.dataset.id === 'e-Magellan'); c.closest('.vt-rail').scrollLeft = 0; });
  await page.waitForTimeout(1200);
  await page.locator('#vitrine .vt-vitrine').screenshot({ path: S + '/' + nom + '-etages.png' });
  // Un etage qui defile ne fait pas bouger les autres
  const avant = await page.$$eval('#vitrine .vt-rail', rs => rs.map(r => Math.round(r.scrollLeft)));
  await page.evaluate(() => { const r = document.querySelectorAll('#vitrine .vt-rail')[1]; r.scrollLeft += 400; });
  await page.waitForTimeout(300);
  console.log(nom, '| defilement par etage, avant :', avant.join(' '), '| apres le 2e :', (await page.$$eval('#vitrine .vt-rail', rs => rs.map(r => Math.round(r.scrollLeft)))).join(' '));
  // La vitrine de Sam : Gros Bebe d'office, sans bouton ni vote (Mathis, 10/11)
  const sam = MEMBRES.find(m => m.id === 'XLE3gYESGaexYimXdugvldHhmBh1');
  if(sam){
    await page.evaluate(id => document.querySelector(`#trophyWho .whochip[data-id="${id}"]`).click(), sam.id); await page.waitForTimeout(1500);
    console.log(nom, '| Sam | Gros Bebe gagne :', await (await caseDe(page, 'Gros Bébé')).evaluate(e => !e.classList.contains('vt-manque')), '| kimono gagne :', await (await caseDe(page, "Tia mis le kimono")).evaluate(e => !e.classList.contains('vt-manque')));
    await ouvrir(page, 'Gros Bébé'); f = await fenetre(page); console.log(nom, '| Sam | Gros Bebe |', f.notes, '| bouton :', f.bouton); await fermer(page);
  }
  if(mobile) console.log('telephone | debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();
