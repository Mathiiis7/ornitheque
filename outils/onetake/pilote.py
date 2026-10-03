"""Le pilote de la demo : les gestes qui amenent le site dans chaque etat filme.

Les prises precedentes (mur-libre, fiche-libre, prises-libres) repetent chacune ces gestes.
Le montage par COMPOSANTS en a besoin d'un seul endroit : on amene le site dans un etat, puis
composants.py photographie et mesure chaque morceau. Les photos interdites sont remplacees
par substituts.py, comme pour les prises.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
SCI = "upupa epops"
LARGEUR, HAUTEUR = 1920, 1080
DPR = 2
DEMARRAGE_MS = 8000


def ouvre(p):
    """Un navigateur sur la demo, photos libres posees. Rend (contexte, page)."""
    subs, _, _ = S.charge()
    nav = p.chromium.launch_persistent_context(
        ".onetake/profil", viewport={"width": LARGEUR, "height": HAUTEUR},
        device_scale_factor=DPR, user_agent=S.UA)
    page = nav.new_page()
    page.goto(URL)
    page.wait_for_timeout(DEMARRAGE_MS)
    S.installe(page, {"parSci": subs, "parUrl": {}, "hero": SCI})
    return nav, page, subs


def onglet(page, libelle):
    page.evaluate(
        """(libelle) => {
            const b = [...document.querySelectorAll('button')]
                .find(b => b.textContent.trim().endsWith(libelle));
            if (!b) throw new Error('onglet absent : ' + libelle);
            b.click();
        }""", libelle)


def birdydex(page, vues_seulement=True):
    onglet(page, "Birdydex")
    page.wait_for_timeout(2000)
    page.evaluate(
        """() => {
            const i = document.getElementById('pkdxSearch');
            if (i && i.value) { i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }
        }""")
    page.wait_for_timeout(2000)
    page.wait_for_function(
        """() => [...document.querySelectorAll('.pkdx-img img')]
                 .filter(i => i.naturalWidth > 0).length >= 20""", timeout=40000)
    if vues_seulement:
        page.click("#pkdxOwned")
        page.wait_for_timeout(900)
        page.evaluate(
            """() => {
                const it = [...document.querySelectorAll('.cp-item, [data-value]')]
                    .find(e => /Vues seulement/i.test(e.textContent || ''));
                if (!it) throw new Error('choix Vues seulement absent');
                it.click();
            }""")
        page.wait_for_timeout(1200)
        # Le selecteur de filtre reste ouvert apres le choix : il voilait tout le site sur
        # les premieres captures par composants (2026-10-01). On le ferme comme le ferait la
        # main, et on verifie qu'il n'en reste aucun.
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)
        reste = page.evaluate("() => document.querySelectorAll('.cp-modal-backdrop').length")
        if reste:
            page.evaluate("() => document.querySelectorAll('.cp-modal-backdrop')"
                          ".forEach(b => b.click())")
            page.wait_for_timeout(600)
            reste = page.evaluate("() => document.querySelectorAll('.cp-modal-backdrop').length")
        if reste:
            raise RuntimeError(f"{reste} selecteur(s) de filtre encore ouvert(s)")
        page.wait_for_timeout(1300)
        for _ in range(14):
            page.mouse.wheel(0, 2500)
            page.wait_for_timeout(400)
        page.wait_for_timeout(1500)
        page.evaluate("() => window.scrollTo(0, 0)")
        page.wait_for_timeout(1200)


def ouvre_fiche(page, sci=SCI):
    page.evaluate(
        """(sci) => {
            const c = document.querySelector('.pkdx-card[data-sci="' + sci + '"]');
            if (!c) throw new Error('carte absente du Birdydex : ' + sci);
            c.click();
        }""", sci)
    page.wait_for_timeout(4000)


def onglet_fiche(page, nom):
    page.evaluate(
        """(nom) => {
            const b = [...document.querySelectorAll('button,[role=tab]')]
                .find(b => new RegExp(nom).test(b.textContent) && b.textContent.trim().length < 14);
            if (!b) throw new Error('onglet de fiche absent : ' + nom);
            b.click();
        }""", nom)
    page.wait_for_timeout(1800)


def rects(page, selecteurs):
    """Les rectangles (pixels CSS, relatifs a la fenetre) de chaque selecteur, tous les
    elements visibles. Rend {selecteur: [rect, ...]}."""
    return page.evaluate(
        """(sels) => {
            const out = {};
            for (const s of sels) {
                out[s] = [...document.querySelectorAll(s)].map(e => {
                    const r = e.getBoundingClientRect();
                    return {x: r.left, y: r.top, w: r.width, h: r.height,
                            cls: (e.className && e.className.baseVal === undefined)
                                 ? e.className : '', id: e.id || '',
                            txt: (e.textContent || '').trim().slice(0, 40)};
                }).filter(r => r.w > 2 && r.h > 2);
            }
            return out;
        }""", selecteurs)
