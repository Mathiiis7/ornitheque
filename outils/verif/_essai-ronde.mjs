// Essai ponctuel (2026-10-30), démo locale : la ronde d'hiver est la dernière ligne des parcours, grisée, à six
// oiseaux, et un clic n'ouvre rien. node outils/verif/_essai-ronde.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="quiz"]').click()); await p.waitForTimeout(1500);
await p.keyboard.press('Escape');
const lire = () => p.evaluate(() => {
  const l = [...document.querySelectorAll('.pc-tableau .pc-ligne:not(.pc-tableau-th)')], d = l[l.length - 1];
  if(!d) return null;
  d.scrollIntoView({ block:'center' });
  return { lignes:l.length, fermees:l.filter(x => x.classList.contains('ferme')).length, ferme:d.classList.contains('ferme'), texte:d.textContent.replace(/\s+/g, ' ').trim(),
    ronds:d.querySelectorAll('img, .pc-rond').length, titres:[...d.querySelectorAll('[title],[alt]')].map(x => x.title || x.alt), note:document.querySelector('#pcParcoursTitre')?.textContent,
    deborde:document.documentElement.scrollWidth > innerWidth + 1 };
});
const avant = await lire();
console.log(JSON.stringify(avant, null, 1));
await p.waitForTimeout(600);
await p.screenshot({ path:`${SORTIE}/ronde-${largeur}.png` });
await p.evaluate(() => { const l = [...document.querySelectorAll('.pc-tableau .pc-ligne')]; l[l.length - 1].click(); });
await p.waitForTimeout(500);
const apres = await lire();
const ok = avant && avant.ferme && apres && apres.lignes === avant.lignes && !avant.deborde && !erreurs.length;
console.log('erreurs', erreurs.length, erreurs.slice(0, 2), ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();
