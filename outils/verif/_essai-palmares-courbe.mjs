/* Essai du 11/11 (pas un banc) : le palmares en courbes des 4 trophees de la ligue. Pour chaque trophee : le resume,
   la verification que la course finit sur le podium de la plaque, un survol (bulle), une capture. Ordinateur et
   telephone, bouchons (rien n ecrit nulle part).
   Usage : node outils/verif/_essai-palmares-courbe.mjs <sauvegarde.json> <dossier des captures> [nom du membre affiche] */
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

const QUI = process.argv[4] || 'Paul';
const cible = MEMBRES.find(m => m.data.name === QUI) || autre;
const nav = await chromium.launch();
const erreurs = [], defauts = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  await charger(page); await page.waitForTimeout(1500); await ouvrirTrophees(page);
  await page.evaluate(id => document.querySelector('#trophyWho .whochip[data-id="' + id + '"]').click(), cible.id); await page.waitForTimeout(1500);
  for(const id of ['aigles', 'nuit', 'canards', 'mouettes']){
    const c = page.locator('#vitrine .vt-case[data-id="' + id + '"]');
    const plaque = await c.evaluate(e => e.querySelector('.vt-nom').dataset.tip || '');
    await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(500);
    const f = await page.evaluate(() => {
      const plot = document.querySelector('.vt-co-plot');
      return { titre: document.querySelector('#tmodalTitle').textContent,
        resume: document.querySelector('.vt-palm-resume')?.textContent || '(pas de palmares)',
        lignes: document.querySelectorAll('.vt-co-plot .st-autre').length + (document.querySelector('.vt-co-plot .st-lui') ? 1 : 0),
        bandes: [...document.querySelectorAll('.vt-co-places span')].map(s => s.className + ' ' + s.style.left + '+' + s.style.width).join(' '),
        axeX: [...document.querySelectorAll('.vt-co .st-x')].map(s => s.textContent).join(' '),
        source: document.querySelector('.vt-palm-source')?.textContent || '',
        larg: plot ? Math.round(plot.getBoundingClientRect().width) : 0,
        tailles: [...new Set([...document.querySelectorAll('.vt-palmares *')].filter(e => e.childElementCount === 0 && e.textContent.trim()).map(e => getComputedStyle(e).fontSize))] };
    });
    // La course finit-elle sur le podium de la plaque ? Places du jour calculees par la course elle-meme
    const fin = await page.evaluate(() => { const c = _vtCourse; if(!c) return null;   // eslint-disable-line
      return _vtPlacesA(c.membres, c.x1).slice(0, 5).map(x => x.place + ' ' + x.m.nom + ' ' + x.n).join(' ; '); }).catch(() => '(global absent)');
    // Survol a 80 % de la largeur, a mi-hauteur
    const plot = page.locator('.vt-co-plot');
    let bulle = '';
    if(await plot.count()){
      const b = await plot.boundingBox();
      await page.mouse.move(b.x + b.width * 0.8, b.y + b.height * 0.5); await page.waitForTimeout(150);
      bulle = await page.evaluate(() => { const e = document.querySelector('.vt-co-plot .st-bulle'); return e && !e.hidden ? e.innerText.replace(/\n/g, ' | ') : '(bulle cachee)'; });
    }
    console.log(`\n== [${nom}] ${f.titre} | plaque : ${plaque}`);
    console.log('   ' + f.resume);
    console.log('   lignes :', f.lignes, '| largeur courbe :', f.larg, '| axe :', f.axeX, '| tailles :', f.tailles.join(' '));
    console.log('   bandes :', f.bandes || '(aucune)');
    console.log('   podium du jour selon la course :', fin);
    console.log('   survol :', bulle);
    if(!mobile && id === 'aigles') console.log('   source :', f.source);
    await page.locator('#trophyModal .tmodal, #trophyModal > *').first().screenshot({ path: S + '/' + nom + '-' + id + '.png' });
    await page.locator('#tmodalX').click(); await page.waitForTimeout(300);
  }
  if(mobile) console.log('\ntelephone | debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();
