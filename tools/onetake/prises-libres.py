"""Les cinq ecrans restants du film, pris sur le vrai site, photos interdites remplacees.

Migration, carte de rarete, classement, quiz, tchat. Meme principe que mur-libre.py et
fiche-libre.py : on pilote la demo, on pose les photos libres a la place des interdites, et on
photographie. Rien n'est redessine.

Chaque prise liste les images qu'elle contient : c'est le seul moyen de savoir ce qu'on
diffuse. Une image qu'on n'a pas vue est une licence qu'on n'a pas verifiee.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne,
les images de migration venant du depot separe ornitheque-data.

    .onetake/venv/Scripts/python.exe tools/onetake/prises-libres.py
"""

import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import substituts as S  # noqa: E402

URL = "http://127.0.0.1:8765/demo/"
REFS = pathlib.Path(".onetake/refs")
SCI = "upupa epops"
LARGEUR, HAUTEUR = 1920, 1080
DEMARRAGE_MS = 8000
UA = S.UA

IMAGES_VUES = {}


def prise(page, nom, attente=1500):
    page.wait_for_timeout(attente)
    chemin = REFS / f"{nom}.png"
    page.screenshot(path=str(chemin))
    vues = page.evaluate(
        """() => [...document.querySelectorAll('img')]
            .filter(i => i.naturalWidth > 100 && i.getBoundingClientRect().width > 20
                         && i.getBoundingClientRect().top < window.innerHeight
                         && i.getBoundingClientRect().bottom > 0)
            .map(i => i.getAttribute('src') || '')
            .filter(s => !s.startsWith('data:'))""")
    IMAGES_VUES[nom] = sorted(set(vues))
    print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)"
          + (f"  ·  {len(IMAGES_VUES[nom])} image(s) exterieure(s)" if vues else "  ·  aucune image exterieure"))
    for s in IMAGES_VUES[nom][:6]:
        print(f"      {s[:104]}")


def onglet(page, libelle):
    page.evaluate(
        """(libelle) => {
            const b = [...document.querySelectorAll('button')]
                .find(b => b.textContent.trim().endsWith(libelle));
            if (!b) throw new Error('onglet absent : ' + libelle);
            b.click();
        }""", libelle)


def main():
    REFS.mkdir(parents=True, exist_ok=True)
    subs, manquantes, n_choisis = S.charge()
    print(f"{len(subs)} substituts prets, {n_choisis} choisis a la main\n")

    with sync_playwright() as p:
        nav = p.chromium.launch_persistent_context(
            ".onetake/profil", viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2, user_agent=UA)
        page = nav.new_page()
        erreurs = []
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(DEMARRAGE_MS)
        S.installe(page, {"parSci": subs, "parUrl": {}, "hero": SCI})

        # 3. La migration semaine par semaine, depuis la fiche de l'espece du film. Les PNG
        #    n'arrivent qu'une fois la lecture lancee : sans le clic sur Lire, la carte reste
        #    vide (verifie le 2026-09-30).
        onglet(page, "Birdydex")
        page.wait_for_timeout(2000)
        page.evaluate(
            """(mot) => {
                const i = document.getElementById('pkdxSearch');
                i.value = mot; i.dispatchEvent(new Event('input',{bubbles:true}));
            }""", SCI.split()[1])
        page.wait_for_timeout(1500)
        page.evaluate(
            """(sci) => {
                const c = document.querySelector('.pkdx-card[data-sci="' + sci + '"]');
                if (!c) throw new Error('carte absente du Birdydex : ' + sci);
                c.click();
            }""", SCI)
        page.wait_for_timeout(4000)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Info/.test(b.textContent) && b.textContent.trim().length < 12);
                if (b) b.click();
            }""")
        page.wait_for_timeout(1500)
        page.evaluate(
            """() => {
                const b = document.querySelector('.mig-fs-btn');
                if (!b) throw new Error('bouton Animation absent de la fiche');
                b.click();
            }""")
        page.wait_for_timeout(3000)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Lire/.test(b.textContent));
                if (!b) throw new Error('bouton Lire absent de la carte de migration');
                b.click();
            }""")
        prise(page, "3-migration-ete", 9000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)

        # 4. La carte de rarete : les observations de la fausse ligue sur la France.
        onglet(page, "Carte")
        prise(page, "4-carte-rarete", 5000)

        # 5. Le classement des cinq joueurs.
        onglet(page, "Classement")
        prise(page, "5-classement", 3000)

        # 6. Le quiz, a l'accueil puis EN COURS de partie : c'est la question, son onde et ses
        #    reponses qu'on filme, pas le bouton de lancement.
        onglet(page, "Quiz")
        page.wait_for_timeout(2500)
        prise(page, "6-quiz-accueil", 500)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Lancer le quiz/.test(b.textContent));
                if (!b) throw new Error('bouton Lancer le quiz absent');
                b.click();
            }""")
        prise(page, "6b-quiz-question", 8000)

        # 7. Le tchat, ouvert par sa pastille flottante.
        page.evaluate(
            """(pastille) => {
                const b = [...document.querySelectorAll('button,[role=button],a')]
                    .find(b => (b.textContent || '').includes(pastille));
                if (!b) throw new Error('pastille du tchat absente');
                b.click();
            }""",
            "\U0001F4AC")
        prise(page, "7-chat", 2500)

        nav.close()

    (pathlib.Path(".onetake/images-des-prises.json")).write_text(
        json.dumps(IMAGES_VUES, ensure_ascii=False, indent=1), encoding="utf-8")
    if erreurs:
        print("\nerreurs de page pendant les prises :")
        for e in erreurs[:10]:
            print("  " + e)
        return 1
    print("\naucune erreur de page.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
