// 2026-11-08 : le Classement au téléphone. Les colonnes de droite défilent de côté, rang, joueur et nombre
// restent figés ; et le barème qui s'ouvre sous « Rareté ligue » / « Rareté terrain » tient dans l'écran.
// node outils/verif/_essai-classement-tel.mjs -> captures notes-privees/chantier-telephone/pages-ok/classement-*.png
import { chromium } from 'playwright';
const nav = await chromium.launch();
let defauts = 0;
const ko = m => { defauts++; console.log('  DÉFAUT', m); };
for(const [larg, haut] of [[390, 844], [360, 740]]){
  console.log(`== ${larg} px`);
  const ctx = await nav.newContext({ viewport:{ width:larg, height:haut }, isMobile:true, hasTouch:true, locale:'fr-FR' });
  await ctx.addInitScript(() => { try{ localStorage.setItem('mb-last-tab', 'ranking'); }catch(_){} });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(3500);
  const t = await p.evaluate(() => {
    const sc = document.querySelector('#boardList .sheet-scroll');
    const fige = () => [...document.querySelectorAll('#boardList tbody tr:nth-child(2) td')].slice(0, 4).map(td => Math.round(td.getBoundingClientRect().left));
    const avant = fige();
    sc.scrollLeft = 250;
    const apres = fige();
    const colonnes = [...document.querySelectorAll('#boardList thead th')].map(th => th.textContent.trim()).filter(Boolean);
    return { avant, apres, defile:sc.scrollWidth > sc.clientWidth, colonnes, largeur:document.documentElement.scrollWidth };
  });
  console.log(`  colonnes : ${t.colonnes.join(' | ')}`);
  console.log(`  cases rang, joueur, nombre, 1re défilante : ${t.avant.join(', ')} -> après glissement ${t.apres.join(', ')}`);
  if(!t.defile) ko('le tableau ne défile pas');
  if(t.colonnes.length < 7) ko('des colonnes manquent');
  if(t.avant.slice(0, 3).join() !== t.apres.slice(0, 3).join()) ko('rang, joueur ou nombre bougent en glissant');
  if(t.apres[3] >= t.avant[3]) ko('les colonnes de droite ne défilent pas');
  if(t.largeur > larg) ko('la page déborde');
  if(larg === 390) await p.screenshot({ path:'notes-privees/chantier-telephone/pages-ok/classement-glisse.png' });
  await p.evaluate(() => { document.querySelector('#boardList .sheet-scroll').scrollLeft = 0; scrollTo(0, 0); });
  for(const mot of ['Rareté ligue', 'Rareté terrain']){
    // Un vrai toucher : la bulle s'ouvre sur mouseenter / focus, qu'un clic du code ne donne pas.
    await p.locator('#boardModes button', { hasText:mot }).tap();
    await p.waitForTimeout(900);
    const b = await p.evaluate(() => { const bu = [...document.querySelectorAll('.tri-bulle')].find(x => !x.hidden && x.getClientRects().length);
      if(!bu) return null; const r = bu.getBoundingClientRect(); return { g:Math.round(r.left), d:Math.round(r.right), h:Math.round(r.top), b:Math.round(r.bottom),
        coupe:bu.scrollWidth > bu.clientWidth + 1 || bu.scrollHeight > bu.clientHeight + 1 }; });
    if(!b){ console.log(`  ${mot} : pas de barème ouvert`); continue; }
    console.log(`  ${mot} : barème de ${b.g} à ${b.d} px (écran ${larg}), de ${b.h} à ${b.b} px (barre dès ${haut - 66})`);
    if(b.g < 0 || b.d > larg) ko(`${mot} : le barème sort de l'écran sur le côté`);
    if(b.b > haut - 66) ko(`${mot} : le barème passe sous la barre du bas`);
    if(b.coupe) ko(`${mot} : le barème est coupé à l'intérieur`);
    await p.screenshot({ path:`notes-privees/chantier-telephone/pages-ok/bareme-${larg}-${mot === 'Rareté ligue' ? 'ligue' : 'terrain'}.png` });
  }
  await ctx.close();
}
console.log(defauts ? `${defauts} DÉFAUT(S)` : 'CONFORME');
await nav.close();
