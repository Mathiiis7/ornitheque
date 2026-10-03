---
name: bancs-de-mesure
description: "Lancer, lire ou écrire un banc de mesure de outils/verif/ (tous.mjs, demo, trophees, firestore). À utiliser après toute retouche de l'entête du panneau, des sélecteurs, des pastilles, des cartes ou d'index.html, et avant d'ajouter un banc."
---

# Les bancs de mesure

`outils/verif/` contient des pages qui font tourner les VRAIES fonctions d'`app.js` dans un
vrai navigateur et impriment des chiffres. Tout rejouer :

```
node outils/verif/tous.mjs
```

Le banc `demo` est à part : il vérifie que `demo/index.html` n'a pas pris de retard sur
`index.html`, puis charge la démo dans un vrai navigateur et envoie un message dans son chat.
Après toute retouche d'`index.html`, relancer `node outils/build/genere-demo.mjs`.

Chaque banc affiche ses mesures et se termine par `CONFORME` ou `DÉFAUT`. Les lancer après
toute retouche de l'entête du panneau, des sélecteurs, des pastilles ou des cartes : ils
attrapent les régressions qu'une capture d'écran ne montre pas.

**Un crochet les lance tout seul.** `.claude/hooks/verif-avant-fin.mjs`, branché sur
l'événement `Stop` dans `.claude/settings.json` : si `app.js`, `index.html` ou `styles.css`
sont modifiés au moment où une réponse se termine, il rejoue `tous.mjs` et refuse de laisser
finir tant qu'un banc est en défaut. Tout rejouer coûte 11,5 s mesurés le 2026-09-29, d'où le
choix de ne pas deviner quel banc concerne quel fichier - deviner raterait la régression à
distance. Il ne se déclenche pas deux fois de suite (`stop_hook_active`), et il se tait dès que
le travail est commité, `git status` étant sa seule source.

Pour en ajouter un : copier le plus proche, il n'y a qu'un contrat - appeler `fini()` à la
fin, après avoir empilé ses vérifications avec `verif(libellé, valeur, ok)`.

Un banc peut aussi piloter le navigateur lui-même, quand une page à regarder ne suffit pas :
il exporte `mesure({ navigateur })` au lieu de `html()`, et rend `{ ok, sortie }` avec
`rapport()`. C'est le cas de `trophees`, qui charge `app.js` en entier avec Firebase bouchonné
(`outils/verif/bouchons/`, branchés par une importmap) et choisit l'ordre d'arrivée des
snapshots : c'est le seul moyen d'exercer le démarrage CONNECTÉ sans compte et sans toucher à
la vraie ligue, et il a attrapé quatre `TypeError` qui étaient en production. Il avance
l'horloge au lieu d'attendre, sinon la détection de trophées lui coûterait 14 secondes.

`photos` se sert du même montage pour vérifier que les images ne voyagent plus au démarrage :
aucune vignette ni image pleine lue à la connexion, une lecture par vignette quand la galerie
s'ouvre et jamais deux, rien de relu à un re-rendu, l'image pleine au clic seulement. Il pose
des documents dans le bouchon (`window.__fs.poser`) et reconnaît laquelle des trois tailles une
image affiche à la longueur de sa data-URL, sans regarder un pixel.

`firestore` se sert du même montage pour compter ce qu’une session coûte en lectures : 14
abonnements ouverts à la connexion, aucun doublon, et surtout **une lecture par client abonné**
à chaque document modifié. Avec 50 connectés, une frappe dans le chat coûte 50 lectures, soit
1 000 frappes par jour avant le plafond gratuit de 50 000. C’est ce plafond-là qui cédera le
premier si l'appli marche, bien avant la bande passante de GitHub Pages.
