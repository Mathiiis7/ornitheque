"""Prises de reference pour la video de presentation (skill onetake).

Photographie les six ecrans que le film montre, DEPUIS LE MODE DEMO, jamais depuis la vraie
ligue : la fausse ligue de demo/ est la seule source autorisee (voir notes-privees/MODE-DEMO.md).

Sortie : .onetake/refs/*.png, en 1920x1080 a deux pixels par point, donc 3840x2160 reels.
Le skill demande a poser la reconstruction dans le repere de la prise ; 3840 divise par deux
donne 1920, la largeur d'un film 1080p, et sert aussi pour le rendu final en 4K.

Prerequis : le serveur local tourne (npx http-server . -p 8765) et la machine est en ligne,
les images de migration venant du depot separe ornitheque-data.

    .onetake/venv/Scripts/python.exe tools/onetake/captures.py
"""

import pathlib
import sys

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8765/demo/"
SORTIE = pathlib.Path(".onetake/refs")
LARGEUR, HAUTEUR = 1920, 1080

# Attente apres chaque action. L'appli demarre ses quinze abonnements bouchonnes puis
# calcule les trophees : mesure le 2026-09-30, l'ecran est stable bien avant 8 s.
DEMARRAGE_MS = 8000


def clique_onglet(page, libelle):
    """Clique un onglet de la barre par son libelle exact. Les onglets sont des <button>."""
    page.evaluate(
        """(libelle) => {
            const b = [...document.querySelectorAll('button')]
                .find(b => b.textContent.trim() === libelle);
            if (!b) throw new Error('onglet absent : ' + libelle);
            b.click();
        }""",
        libelle,
    )


def prise(page, nom, attente=1500):
    page.wait_for_timeout(attente)
    chemin = SORTIE / f"{nom}.png"
    page.screenshot(path=str(chemin))
    print(f"  {chemin}  ({chemin.stat().st_size // 1024} Ko)")


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        # Profil garde d'une fois sur l'autre, dans .onetake/profil : l'appli met ses photos
        # et ses listes de chants en cache local, et c'est ce que voit un visiteur qui
        # revient. Un profil neuf a chaque fois donne des prises appauvries - le panneau des
        # chants tombait sur un enregistrement sans sonagramme.
        nav = p.chromium.launch_persistent_context(
            str(SORTIE.parent / "profil"),
            viewport={"width": LARGEUR, "height": HAUTEUR},
            device_scale_factor=2,
            # Sans agent utilisateur ordinaire, xeno-canto ne repond pas au navigateur
            # invisible : l'appli basculait alors sur son recours iNaturalist, dont les
            # enregistrements n'ont pas de sonagramme. Diagnostique le 2026-09-30 - c'est le
            # meme mur anti-robot qu'eBird, decrit dans le skill donnees-ebird.
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36"
            ),
        )
        page = nav.new_page()
        erreurs = []
        page.on("pageerror", lambda e: erreurs.append(str(e)))
        page.goto(URL)
        page.wait_for_timeout(DEMARRAGE_MS)

        print("prises de reference :")

        # 1. Le mur du Birdydex : la premiere image du film. Les vignettes sont en
        #    chargement differe : sans attendre qu'elles arrivent, on photographie un mur de
        #    cases grises. Le poids du fichier le dit tout seul - 244 Ko sans les photos,
        #    1,8 Mo avec (mesure le 2026-09-30).
        clique_onglet(page, "📖 Birdydex")
        page.wait_for_timeout(2000)
        # Vider le filtre APRES l'ouverture du panneau : il restaure sa recherche gardee au
        # premier rendu, donc un nettoyage fait avant est efface. Le script laisse
        # « rustica » derriere lui, d'ou un mur de deux cartes a la fois suivante.
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                if (i && i.value) { i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); }
            }"""
        )
        page.wait_for_timeout(1500)
        page.wait_for_function(
            """() => {
                const im = [...document.querySelectorAll('.pkdx-img img')];
                return im.length > 20 && im.filter(i => i.naturalWidth > 0).length >= 20;
            }""",
            timeout=40000,
        )
        prise(page, "1-birdydex-mur", 2000)

        # 2. La fiche d'espece de l'hirondelle rustique, avec sa photo et son chant.
        #    Une des 304 especes qui ont une carte de migration hebdomadaire.
        page.evaluate(
            """() => {
                const i = document.getElementById('pkdxSearch');
                i.value = 'rustica'; i.dispatchEvent(new Event('input',{bubbles:true}));
            }"""
        )
        page.wait_for_timeout(1200)
        page.evaluate(
            """() => {
                const c = document.querySelector('.pkdx-card[data-sci="hirundo rustica"]');
                if (!c) throw new Error('carte hirondelle absente du Birdydex');
                c.click();
            }"""
        )
        prise(page, "2-fiche-hirondelle", 4000)

        # 2b. L'onglet Sons de la fiche : le chant et son sonagramme, le deuxieme temps du
        #     film. Les enregistrements viennent de xeno-canto, donc du reseau.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Sons/.test(b.textContent) && b.textContent.trim().length < 12);
                if (!b) throw new Error('onglet Sons absent de la fiche');
                b.click();
            }"""
        )
        # Attendre le sonagramme, pas une duree : c'est lui qu'on filme. L'appli affiche
        # « Pas de spectrogramme » quand l'enregistrement le mieux classe n'en a pas, et le
        # classement depend du cache : a froid on tombe parfois sur un enregistrement sans
        # image, a chaud on en avait 16 sur 16 (mesure le 2026-09-30, hirondelle rustique).
        # Donc on attend doucement, et on le dit si l'image n'est pas venue - on ne fait pas
        # echouer les autres prises pour ca.
        try:
            page.wait_for_selector(".xa-bar-sono", timeout=25000)
        except Exception:
            print("  ATTENTION : pas de sonagramme sur cette prise. Relancer le script :")
            print("  le profil est garde dans .onetake/profil, donc le cache se rechauffe.")
        prise(page, "2b-fiche-sons", 2000)
        # Revenir sur Info : le bouton Animation vit dans ce panneau.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=tab]')]
                    .find(b => /Info/.test(b.textContent) && b.textContent.trim().length < 12);
                if (b) b.click();
            }"""
        )
        page.wait_for_timeout(1500)

        # 3. La migration semaine par semaine. Les images PNG n'arrivent qu'une fois la
        #    lecture lancee : sans le clic sur Lire, la carte reste vide (verifie le 2026-09-30).
        page.evaluate(
            """() => {
                const b = document.querySelector('.mig-fs-btn');
                if (!b) throw new Error('bouton Animation absent de la fiche');
                b.click();
            }"""
        )
        page.wait_for_timeout(3000)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Lire/.test(b.textContent));
                if (!b) throw new Error('bouton Lire absent de la carte de migration');
                b.click();
            }"""
        )
        # Laisser l'animation atteindre le plein ete, quand l'Europe est rouge.
        prise(page, "3-migration-ete", 9000)
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)

        # 4. La carte de rarete : les observations de la fausse ligue sur la France.
        clique_onglet(page, "📍 Carte")
        prise(page, "4-carte-rarete", 5000)

        # 5. Le classement des cinq joueurs de la fausse ligue.
        clique_onglet(page, "Classement")
        prise(page, "5-classement", 3000)

        # 6. Le quiz de chants, EN COURS de partie. A l'arret il ne montre qu'un bouton
        #    « Lancer le quiz » : c'est la question, son onde et ses reponses qu'on filme.
        clique_onglet(page, "🎵 Quiz")
        page.wait_for_timeout(2500)
        prise(page, "6-quiz-accueil", 500)
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button')]
                    .find(b => /Lancer le quiz/.test(b.textContent));
                if (!b) throw new Error('bouton Lancer le quiz absent');
                b.click();
            }"""
        )
        prise(page, "6b-quiz-question", 8000)

        # 7. Le chat, ouvert par sa pastille flottante.
        page.evaluate(
            """() => {
                const b = [...document.querySelectorAll('button,[role=button],a')]
                    .find(b => /💬/.test(b.textContent));
                if (!b) throw new Error('pastille du chat absente');
                b.click();
            }"""
        )
        prise(page, "7-chat", 2500)

        nav.close()
        if erreurs:
            print("\nerreurs de page pendant les prises :")
            for e in erreurs[:10]:
                print("  " + e)
            return 1
        print("\naucune erreur de page.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
