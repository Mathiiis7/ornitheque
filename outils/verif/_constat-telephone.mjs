// Constat du chantier téléphone (2026-11-07), démo locale : chaque page en largeur téléphone (390 px,
// isMobile : pointer coarse), écran par écran (pas de fullPage, qui retire l'émulation mobile).
// Mesures : débordement horizontal, éléments qui sortent de l'écran, textes coupés, textes trop petits,
// hauteur de la page en écrans, place prise par l'entête avant le contenu.
// node outils/verif/_constat-telephone.mjs   -> notes-privees/chantier-telephone/constat/
import { chromium } from 'playwright';
import fs from 'fs';
const SORTIE = 'notes-privees/chantier-telephone/constat';
fs.mkdirSync(SORTIE, { recursive:true });
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:390, height:844 }, deviceScaleFactor:1, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'load'); localStorage.setItem('mb-theme', 'light'); }catch(_){} });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.waitForTimeout(400);

const PAGES = [
  ['ma-liste', 'load'], ['classement', 'ranking'], ['birdydex', 'pokedex'], ['carte', 'map'],
  ['trophees', 'trophies'], ['quiz', 'quiz'], ['profil', 'profil'], ['a-propos', 'about'],
  ['fil', 'fab:fabFeed'], ['photos', 'fab:fabPhotos'], ['tchat', 'fab:fabChat'],
  ['menu', 'menu'], ['fiche-espece', 'fiche'],
];

const mesure = () => p.evaluate(() => {
  const W = innerWidth, H = innerHeight;
  const nom = el => el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const visible = el => { const s = getComputedStyle(el); if(s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // Un ancêtre qui défile de côté exprès (overflow-x auto/scroll) : ce qui sort de l'écran y est voulu.
  const dansDefilement = el => { for(let a = el.parentElement; a && a !== document.body; a = a.parentElement){ const o = getComputedStyle(a).overflowX; if(o === 'auto' || o === 'scroll') return nom(a); } return ''; };
  const sortent = [], coupes = [], petits = [], defilants = new Map();
  for(const el of document.querySelectorAll('body *')){
    if(!visible(el) || el.closest('svg') && el.tagName !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if(r.right > W + 1 || r.left < -1){
      const d = dansDefilement(el);
      if(d) defilants.set(d, (defilants.get(d) || 0) + 1);
      else if(![...el.children].some(c => c.getBoundingClientRect().right > W + 1)) sortent.push(nom(el) + ` (${Math.round(r.left)}..${Math.round(r.right)})`);
    }
    const s = getComputedStyle(el);
    const texte = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if(texte && (s.textOverflow === 'ellipsis' || s.overflow === 'hidden' || s.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 1)
      coupes.push(nom(el) + ' « ' + el.textContent.trim().slice(0, 40) + ' »');
    // Taille à l'écran : la taille CSS fois le zoom de body (0,85)
    if(texte && r.top < H * 3){
      const ecran = parseFloat(s.fontSize) * (r.height / (el.offsetHeight || r.height) || 1);
      if(ecran < 12) petits.push(nom(el) + ' ' + ecran.toFixed(1) + 'px « ' + el.textContent.trim().slice(0, 30) + ' »');
    }
  }
  const titre = [...document.querySelectorAll('h2.page-title')].find(visible);
  return {
    largeurPage: document.documentElement.scrollWidth, ecran: W,
    hauteurEcrans: +(document.documentElement.scrollHeight / H).toFixed(1),
    titreA: titre ? Math.round(titre.getBoundingClientRect().top + scrollY) : null,
    sortent: [...new Set(sortent)].slice(0, 15), nbSortent: sortent.length,
    coupes: [...new Set(coupes)].slice(0, 15), nbCoupes: coupes.length,
    petits: [...new Set(petits)].slice(0, 10), nbPetits: petits.length,
    defilants: [...defilants.keys()],
  };
});

const resultats = {};
for(const [cle, cible] of PAGES){
  await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); });
  await p.keyboard.press('Escape');
  if(cible.startsWith('fab:') || cible === 'menu'){
    await p.evaluate(() => document.querySelector('.tab[data-view="load"]').click());
    await p.waitForTimeout(500);
    await p.evaluate(id => document.getElementById(id).click(), cible === 'menu' ? 'hamburgerBtn' : cible.slice(4));
  } else if(cible === 'fiche'){
    await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
    await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci]').click());
  } else {
    await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), cible);
  }
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('ctChoixDialog')?.open && document.getElementById('ctChoixDialog').close());
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  const m = await mesure();
  // Jusqu'à 4 écrans, pour voir la densité en descendant
  const n = Math.min(4, Math.ceil(m.hauteurEcrans));
  for(let i = 0; i < n; i++){
    await p.evaluate(i => scrollTo(0, i * innerHeight), i);
    await p.waitForTimeout(250);
    await p.screenshot({ path:`${SORTIE}/${cle}-${i + 1}.png` });
  }
  resultats[cle] = m;
  console.log(`\n== ${cle} : page ${m.largeurPage} px pour ${m.ecran}, ${m.hauteurEcrans} écrans, titre à ${m.titreA} px`);
  if(m.nbSortent) console.log(`  sort de l'écran (${m.nbSortent}) : ${m.sortent.join(' ; ')}`);
  if(m.nbCoupes) console.log(`  textes coupés (${m.nbCoupes}) : ${m.coupes.join(' ; ')}`);
  if(m.nbPetits) console.log(`  textes < 12 px (${m.nbPetits}) : ${m.petits.join(' ; ')}`);
  if(m.defilants.length) console.log(`  défile de côté exprès : ${m.defilants.join(', ')}`);
  if(cle === 'fiche-espece') await p.evaluate(() => typeof closeSpeciesModal === 'function' ? closeSpeciesModal() : document.querySelector('#speciesModal .sm-close, #smClose')?.click());
  if(cible.startsWith('fab:') || cible === 'menu') await p.keyboard.press('Escape');
}
fs.writeFileSync(`${SORTIE}/mesures.json`, JSON.stringify(resultats, null, 1));
console.log('\nerreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();
