// Chantier téléphone (2026-11-07) : l'ordinateur ne doit pas bouger d'un pixel.
// Capture chaque page de la démo à 1440 et 701 px, en clair et en sombre, puis compare deux captures.
//   node outils/verif/_ref-ordi.mjs capture <dossier>      ex. notes-privees/chantier-telephone/ref-avant
//   node outils/verif/_ref-ordi.mjs compare <avant> <apres>
// La comparaison se fait pixel par pixel dans un canvas (pas d'outil d'image dans node_modules).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const [mode, A, B] = process.argv.slice(2);
const PAGES = [['ma-liste', 'load'], ['classement', 'ranking'], ['birdydex', 'pokedex'], ['carte', 'map'], ['trophees', 'trophies'],
  ['quiz', 'quiz'], ['profil', 'profil'], ['a-propos', 'about'], ['requetes', 'requests'],
  ['fil', 'fab:fabFeed'], ['photos', 'fab:fabPhotos'], ['tchat', 'fab:fabChat'], ['menu', 'menu'], ['fiche', 'fiche']];
const LARGEURS = [1440, 701];
const THEMES = ['light', 'dark'];
const nav = await chromium.launch();

async function capture(dossier){
  fs.mkdirSync(dossier, { recursive:true });
  for(const larg of LARGEURS) for(const theme of THEMES){
    const ctx = await nav.newContext({ viewport:{ width:larg, height:900 }, locale:'fr-FR', reducedMotion:'reduce', timezoneId:'Europe/Paris' });
    await ctx.addInitScript(t => { try{ localStorage.setItem('mb-last-tab', 'load'); localStorage.setItem('mb-theme', t); }catch(_){} }, theme);
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
    await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
    for(const [cle, cible] of PAGES){
      await p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); });
      await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
      if(cible.startsWith('fab:') || cible === 'menu'){
        await p.evaluate(() => document.querySelector('.tab[data-view="load"]').click());
        await p.waitForTimeout(400);
        await p.evaluate(id => document.getElementById(id).click(), cible === 'menu' ? 'hamburgerBtn' : cible.slice(4));
      } else if(cible === 'fiche'){
        await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]').click());
        await p.waitForTimeout(1200);
        await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci]').click());
      } else await p.evaluate(v => document.querySelector(`.tab[data-view="${v}"]`).click(), cible);
      await p.waitForTimeout(2200);
      await p.evaluate(() => { const d = document.getElementById('ctChoixDialog'); if(d?.open) d.close(); scrollTo(0, 0); });
      // Le curseur clignotant d'un champ, l'heure qui change : on fige ce qui bouge tout seul.
      await p.evaluate(() => { document.activeElement?.blur?.(); });
      // Les images (photos, tuiles de la carte) finies de charger et décodées : sinon deux captures
      // de la même page différaient de quelques centaines de pixels.
      await p.evaluate(async () => {
        for(let i = 0; i < 50; i++){
          const imgs = [...document.images].filter(im => im.getClientRects().length);
          if(imgs.every(im => im.complete)) break;
          await new Promise(r => setTimeout(r, 200));
        }
        await Promise.all([...document.images].filter(im => im.complete && im.naturalWidth).map(im => im.decode().catch(() => {})));
      });
      await p.waitForTimeout(1200);
      await p.screenshot({ path:path.join(dossier, `${larg}-${theme}-${cle}.png`) });
      if(cle === 'fiche') await p.keyboard.press('Escape');
    }
    await ctx.close();
  }
}

async function compare(a, b){
  const p = await nav.newPage();
  let diff = 0;
  for(const f of fs.readdirSync(a).filter(f => f.endsWith('.png')).sort()){
    const fa = path.join(a, f), fb = path.join(b, f);
    if(!fs.existsSync(fb)){ console.log('MANQUE', f); diff++; continue; }
    const ba = fs.readFileSync(fa), bb = fs.readFileSync(fb);
    if(ba.equals(bb)) continue;
    const n = await p.evaluate(async ([x, y]) => {
      const charge = s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
      const [i1, i2] = await Promise.all([charge(x), charge(y)]);
      if(i1.width !== i2.width || i1.height !== i2.height) return { taille:true };
      const px = i => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height).data; };
      const d1 = px(i1), d2 = px(i2);
      let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for(let k = 0; k < d1.length; k += 4) if(d1[k] !== d2[k] || d1[k + 1] !== d2[k + 1] || d1[k + 2] !== d2[k + 2]){
        n++; const x = (k / 4) % i1.width, y = Math.floor(k / 4 / i1.width);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      return { n, zone:n ? `${x0},${y0} -> ${x1},${y1}` : '' };
    }, [ba.toString('base64'), bb.toString('base64')]);
    if(n.taille || n.n){ diff++; console.log('DIFFÉRENT', f, n.taille ? 'taille' : `${n.n} px, zone ${n.zone}`); }
  }
  console.log(diff ? `${diff} capture(s) différente(s)` : 'IDENTIQUE : aucune différence');
}

if(mode === 'capture') await capture(A);
else if(mode === 'compare') await compare(A, B);
else console.log('usage : capture <dossier> | compare <avant> <apres>');
await nav.close();
