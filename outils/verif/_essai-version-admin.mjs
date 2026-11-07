// 2026-11-08 : la pastille de version des administrateurs (#adminBuildStamp) se cache au téléphone et reste
// à l'ordinateur. On la force affichée comme le fait app.js (style.display), puis on lit si elle se voit.
import { chromium } from 'playwright';
const nav = await chromium.launch();
let defauts = 0;
for(const [nom, o, attendu] of [['téléphone 390', { viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true }, false],
                                  ['ordinateur 1440', { viewport:{ width:1440, height:900 } }, true]]){
  const p = await (await nav.newContext(o)).newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(2500);
  const vu = await p.evaluate(() => { const el = document.getElementById('adminBuildStamp'); el.style.display = 'block';
    return getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0; });
  const ok = vu === attendu; if(!ok) defauts++;
  console.log(`${nom} : pastille ${vu ? 'visible' : 'cachée'} ${ok ? 'ok' : 'DÉFAUT'}`);
}
console.log(defauts ? 'DÉFAUT' : 'CONFORME');
await nav.close();
