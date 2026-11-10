// Essai (2026-11-10) : le bouton « ANNÉE » de la colonne des mois (fiche espèce, « Où et quand ») tient-il
// dans sa colonne ? Mesure la largeur du contenu contre celle du bouton, ordinateur et téléphone.
// Usage : node outils/verif/_mesure-annee.mjs [URL]
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:8766/demo/';
const navigateur = await chromium.launch({ channel: 'chrome' });
for (const mobile of [false, true]) {
  const ctx = await navigateur.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
    : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape');
  await page.locator('text=Birdydex >> visible=true').first().click();
  await page.waitForTimeout(1500);
  await page.locator('[data-sci]:visible').first().click();
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => {
    const b = document.querySelector('#smRarityMapMois button[data-mois="an"]');
    if (!b) return null;
    // Largeur qu'il faudrait : la somme des deux libellés, de l'écart et des marges.
    b.querySelectorAll('span')[1].textContent = '10';   // le cas le plus large : palier 10
    const s = getComputedStyle(b), spans = [...b.querySelectorAll('span')];
    const besoin = spans.reduce((a, e) => a + e.scrollWidth, 0) + parseFloat(s.columnGap || s.gap || 0)
      + parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
    return { largeur: b.clientWidth, besoin: Math.round(besoin * 10) / 10, texte: b.innerText.replace(/\s+/g, ' ') };
  });
  const col = await page.locator('#smRarityMapMois').boundingBox(); if (col) await page.screenshot({ path: (process.env.TEMP || '.') + '/essai-monde/annee-' + (mobile ? 'tel' : 'ordi') + '.png', clip: { x: col.x - 10, y: col.y - 10, width: Math.min(420, col.width + 330), height: 200 } });
  console.log(mobile ? 'telephone :' : 'ordinateur :', m ? `bouton ${m.largeur} px, contenu ${m.besoin} px, « ${m.texte} » -> ${m.besoin <= m.largeur ? 'tient' : 'DEBORDE'}` : 'bouton introuvable');
  await ctx.close();
}
await navigateur.close();
