// Essai ponctuel (2026-10-31), démo locale : la note sous le radar est grise et centrée sous le cercle, mesuré en pixels.
// node outils/verif/_essai-note-radar.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
let defauts = 0;
for(const [largeur, theme] of [[1300, 'light'], [375, 'light'], [1300, 'dark']]){
  const mobile = largeur < 700;
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block', colorScheme:theme });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"], .tab[data-view="birdydex"], .tab[data-view="dex"]')?.click()); await p.waitForTimeout(2000);
  await p.keyboard.press('Escape');
  await p.evaluate(() => [...document.querySelectorAll('.pkdx-card')].find(x => x.textContent.includes('Héron cendré')).click());
  await p.waitForFunction(() => document.querySelector('#smTraitsCard .sm-radar'), null, { timeout:8000 });
  const m = await p.evaluate(() => { const n = document.querySelector('.sm-rd-note'), c = document.querySelector('.sm-rd-fond').getBoundingClientRect(), s = getComputedStyle(n), r = document.createRange(); r.selectNodeContents(n); const t = r.getBoundingClientRect();
    const ink3 = getComputedStyle(document.documentElement).getPropertyValue('--ink-3').trim(), test = document.createElement('i'); test.style.color = ink3; document.body.append(test); const attendu = getComputedStyle(test).color; test.remove();
    return { couleur:s.color, attendu, alignement:s.textAlign, centreTexte:+(t.left + t.width / 2).toFixed(1), centreCercle:+(c.left + c.width / 2).toFixed(1) }; });
  console.log(largeur, theme, JSON.stringify(m));
  if(m.couleur !== m.attendu || m.alignement !== 'center' || Math.abs(m.centreTexte - m.centreCercle) > 1){ console.log('   ÉCART'); defauts++; }
  await p.evaluate(() => document.querySelector('.sm-radar').scrollIntoView({ block:'center' })); await p.waitForTimeout(300);
  await p.locator('.sm-radar').screenshot({ path:`${SORTIE}/note-${largeur}-${theme}.png` });
  await ctx.close();
}
await nav.close();
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
