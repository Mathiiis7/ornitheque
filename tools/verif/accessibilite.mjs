/*
  Ce qu'un lecteur d'ecran annonce, et ce qu'un doigt peut atteindre.

  CE QUE LE RAPPORT IMPECCABLE DU 2026-09-29 AVAIT TROUVE, ET QU'ON NE VEUT PLUS REVOIR
  - zero region vivante : rien n'etait annonce quand la page changeait ;
  - deux role="tablist" sans un seul role="tab" dedans - une rangee d'onglets vide ;
  - des boutons dont le seul nom etait leur emoji ;
  - des champs dont le seul nom etait leur texte grise, qui s'efface des qu'on tape ;
  - des cibles a 17, 18 et 36 px d'ecran la ou il en faut 44.

  DEUX PIEGES DE MESURE, LES DEUX DEJA PAYES
  1. body porte zoom:0.85. getBoundingClientRect rend des pixels d'ECRAN, les styles calcules
     des pixels CSS : on ne compare que des rect, jamais un rect a un font-size.
     44 px d'ecran s'ecrivent donc 52 px dans la CSS.
  2. pointer:coarse ne se simule pas avec hasTouch. Il faut isMobile:true, sinon la CSS des
     cibles tactiles ne s'applique pas et le banc mesure l'affichage souris en croyant
     mesurer le doigt. Le banc verifie donc d'abord que l'emulation a pris.

  On mesure la VRAIE page : la demo charge le meme index.html et la meme styles.css, sans
  compte ni reseau. Le banc demo garantit par ailleurs qu'elle n'a pas pris de retard.

  Les trois cibles ne sont pas toutes a l'ecran au demarrage (le tchat et la fiche espece
  demandent d'y aller). On plante donc un temoin : le vrai balisage des trois widgets, pose
  dans la vraie page, donc soumis a la vraie CSS, au vrai zoom et a la vraie emulation. Ce
  qu'on veut savoir, c'est ce que la CSS accorde a ces cibles ; ce n'est pas un test de
  navigation.
*/
import { rapport, serveurDepot } from './_banc.mjs';

export const nom = 'accessibilite';
export const titre = 'Lecteur d ecran et cibles tactiles';
export const quoi = 'ce qu un lecteur d ecran annonce, et ce qu un doigt peut atteindre';

const CIBLE_ECRAN = 44;   // Apple HIG, Material, WCAG 2.5.5

// Le temoin. Chaque bloc reprend le balisage reel, classes comprises : c'est ce qui fait que
// les selecteurs de styles.css s'appliquent vraiment. visibility:hidden et non display:none,
// parce qu'un element invisible est quand meme mis en page - un element non affiche n'a
// aucune taille et le banc mesurerait des zeros.
const TEMOIN = `
<div id="bancA11y" style="position:absolute; left:0; top:0; visibility:hidden;">
  <div class="rar-chips">
    <button type="button" class="rar-chip on" data-rar="7">7</button>
    <button type="button" class="rar-chip on" data-rar="10">10</button>
  </div>
  <div class="msg">
    <div class="msg-time">12:34</div>
    <div class="react-bar">
      <button class="react-chip">🎉 1</button>
      <button class="react-add" aria-label="Réagir">＋</button>
    </div>
    <div class="msg-actions"><button class="msg-act msg-reply" aria-label="Répondre">↪</button></div>
  </div>
  <div class="species-modal" style="display:block; position:static;">
    <nav class="sm-tabs"><button type="button" class="sm-tab on">📝 Info</button></nav>
  </div>
</div>`;

// Nom accessible, version courte mais honnete : ce que les lecteurs lisent, dans leur ordre.
// aria-labelledby, puis aria-label, puis le texte, puis le alt d'une image, puis title en
// dernier recours. Un texte reduit a des emoji ne compte pas comme un nom.
const NOM_ACCESSIBLE = `(el => {
  const par = el.getAttribute('aria-labelledby');
  if(par){ const c = par.split(/\\s+/).map(i => document.getElementById(i)).filter(Boolean);
           if(c.length) return c.map(x => x.textContent.trim()).join(' ').trim(); }
  const lab = (el.getAttribute('aria-label') || '').trim();
  if(lab) return lab;
  if(el.id){ const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
             if(l && l.textContent.trim()) return l.textContent.trim(); }
  const enveloppe = el.closest('label');
  if(enveloppe && enveloppe.textContent.trim()) return enveloppe.textContent.trim();
  const txt = (el.textContent || '').replace(/[\\p{Extended_Pictographic}\\uFE0F\\u200D\\u2190-\\u27BF\\u00D7]/gu, '').trim();
  if(txt) return txt;
  const img = el.querySelector('img[alt]');
  if(img && img.alt.trim()) return img.alt.trim();
  return (el.getAttribute('title') || '').trim();
})`;

export async function mesure({ navigateur, RACINE }){
  const r = rapport();
  const srv = serveurDepot(RACINE);
  await new Promise(x => srv.listen(0, '127.0.0.1', x));
  const base = 'http://127.0.0.1:' + srv.address().port;

  try{
    // ---- 1. ce qui s'annonce (contexte ordinaire) --------------------------
    const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route('**/*', route =>
      route.request().url().startsWith(base) ? route.continue() : route.abort());
    await page.goto(base + '/demo/', { waitUntil: 'load' });
    await page.waitForFunction(() => window.__demo && window.__demo.chemins().length >= 14,
                               null, { timeout: 20000 }).catch(() => {});

    const annonce = await page.evaluate(() => {
      const z = document.getElementById('a11yAnnonce');
      return z ? { existe: true, vide: !z.textContent.trim(),
                   role: z.getAttribute('role'), live: z.getAttribute('aria-live') }
               : { existe: false };
    });
    r.note('region d annonce');
    r.verif('  #a11yAnnonce present', annonce.existe ? 'oui' : 'ABSENT', annonce.existe);
    r.verif('  declaree vivante', annonce.existe ? annonce.role + ' / ' + annonce.live : '-',
            annonce.role === 'status' && annonce.live === 'polite');
    r.verif('  vide au repos', annonce.vide ? 'oui' : 'NON', !!annonce.vide);

    const onglets = await page.evaluate(() =>
      [...document.querySelectorAll('[role="tablist"]')].map(tl => {
        const tabs = [...tl.querySelectorAll('[role="tab"]')];
        return {
          nom: tl.getAttribute('aria-label') || tl.className || '?',
          tabs: tabs.length,
          choisis: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length,
          panneauxOk: tabs.every(t => { const c = t.getAttribute('aria-controls');
                                        return !!c && !!document.getElementById(c); }),
        };
      }));
    r.note('');
    r.note('rangees d onglets');
    r.verif('  rangees trouvees', onglets.length, onglets.length >= 2);
    for(const o of onglets){
      r.verif('  « ' + o.nom.slice(0, 34) + ' »', o.tabs + ' onglet(s)', o.tabs > 0);
      r.verif('    un seul ouvert', o.choisis, o.choisis === 1);
      r.verif('    panneau designe', o.panneauxOk ? 'oui' : 'NON', o.panneauxOk);
    }

    // Boutons et champs ATTEIGNABLES seulement : ce qui est en display:none ne s'annonce pas,
    // donc son absence de nom ne gene personne. C'est la difference entre un vrai defaut et
    // du balisage dormant - le banc comptait 4 faux positifs sans ce filtre.
    const sansNom = await page.evaluate(`(() => {
      const nomAccessible = ${NOM_ACCESSIBLE};
      const atteignable = el => {
        if(el.closest('[hidden]')) return false;
        const cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden') return false;
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      };
      const rate = [];
      for(const el of document.querySelectorAll('button, [role="button"], input:not([type=hidden]), select, textarea')){
        if(!atteignable(el)) continue;
        if(el.type === 'submit' || el.type === 'reset') continue;
        if(!nomAccessible(el)) rate.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '.' + (el.className||'').split(' ')[0]));
      }
      return rate;
    })()`);
    r.note('');
    r.note('noms accessibles');
    r.verif('  commandes visibles sans nom', sansNom.length, sansNom.length === 0);
    for(const s of sansNom.slice(0, 8)) r.note('      ' + s);

    await ctx.close();

    // ---- 2. ce qu'un doigt atteint (contexte tactile) -----------------------
    const ctxTel = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block',
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 3 });
    const tel = await ctxTel.newPage();
    await tel.route('**/*', route =>
      route.request().url().startsWith(base) ? route.continue() : route.abort());
    await tel.goto(base + '/demo/', { waitUntil: 'load' });
    await tel.waitForFunction(() => window.__demo && window.__demo.chemins().length >= 14,
                              null, { timeout: 20000 }).catch(() => {});

    const coarse = await tel.evaluate(() => matchMedia('(pointer: coarse)').matches);
    r.note('');
    r.note('cibles au doigt (px d ECRAN, seuil ' + CIBLE_ECRAN + ')');
    r.verif('  emulation tactile prise', coarse ? 'pointer:coarse' : 'NON - mesure invalide', coarse);

    const tailles = await tel.evaluate(t => {
      document.body.insertAdjacentHTML('beforeend', t);
      const lire = sel => { const el = document.querySelector('#bancA11y ' + sel);
        if(!el) return null;
        const b = el.getBoundingClientRect();
        return { l: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10,
                 opacite: parseFloat(getComputedStyle(el).opacity) };
      };
      const res = {
        pastille: lire('.rar-chip[data-rar="7"]'),
        pastilleLarge: lire('.rar-chip[data-rar="10"]'),
        actionMsg: lire('.msg-act'),
        reaction: lire('.react-chip'),
        ajoutReaction: lire('.react-add'),
        heureMsg: lire('.msg-time'),
        ongletFiche: lire('.sm-tab'),
      };
      document.getElementById('bancA11y').remove();
      return res;
    }, TEMOIN);

    const mesureCible = (libelle, m) => {
      if(!m){ r.verif('  ' + libelle, 'INTROUVABLE', false); return; }
      const petit = Math.min(m.l, m.h);
      r.verif('  ' + libelle, m.l + ' x ' + m.h + ' px', petit >= CIBLE_ECRAN);
    };
    mesureCible('pastille de rareté « 7 »', tailles.pastille);
    mesureCible('pastille de rareté « 10 »', tailles.pastilleLarge);
    mesureCible('action d un message', tailles.actionMsg);
    mesureCible('pastille de réaction', tailles.reaction);
    mesureCible('bouton « réagir »', tailles.ajoutReaction);
    mesureCible('onglet de la fiche espèce', tailles.ongletFiche);

    // Une cible de 44 px qu'on ne voit pas reste inatteignable : c'etait le vrai defaut du
    // tchat, ou tout attendait un survol que le doigt ne produit jamais.
    r.verif('  actions d un message visibles',
            tailles.actionMsg ? tailles.actionMsg.opacite : '-',
            !!tailles.actionMsg && tailles.actionMsg.opacite === 1);
    r.verif('  heure d un message visible',
            tailles.heureMsg ? tailles.heureMsg.opacite : '-',
            !!tailles.heureMsg && tailles.heureMsg.opacite === 1);

    r.note('');
    r.note('(mesures du 2026-09-29 avant correction : pastilles 17, actions 18, onglets 36)');

    await ctxTel.close();
  } finally {
    await new Promise(x => srv.close(x));
  }
  return r.rendu();
}
