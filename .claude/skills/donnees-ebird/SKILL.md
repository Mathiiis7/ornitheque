---
name: donnees-ebird
description: "Récolter ou vérifier des données eBird : scrape des bar charts, fréquences, statuts exotiques, injecteur, listes de zones d'un pays, mur anti-robot, « zone vide » contre « scrape raté ». À lire avant de lancer un scrape ou d'en juger le résultat."
---

# Données eBird

Les fréquences viennent des bar charts eBird, fenêtre 2019-2026, **et exigent un compte** :
l'URL `barchartData` redirige vers la connexion. Le cookie se colle dans un fichier hors
dépôt, désigné par `EBIRD_COOKIE_FILE`. Les statuts exotiques, eux, se lisent sur la page
publique sans aucun compte.

La dernière année de la fenêtre est toujours incomplète. Les poids des quinzaines sont donc
ramenés à l'année - voir `tools/build/annees-par-quinzaine.mjs`, qui explique pourquoi et
donne les mesures. **Là où l'effort sert à pondérer le temps, il est ramené à l'année ; là où
il sert à recombiner des comptes en fréquence, il reste brut.**

**Repasser l'injecteur fait partie du scrape, pas d'une étape facultative.**
`inject-exotic-by-region.mjs` avait deux jours de retard le 2026-09-27 : la Grande-Bretagne,
la Hongrie, la Slovénie et la Lettonie avaient **zéro zone** dans `app.js` alors que leurs
fichiers générés étaient pleins. Leurs cartes de statut s'affichaient vides à l'écran, et
rien ne le signalait.

**La liste des zones d'un pays se demande à eBird, jamais à `zones-agregees.json`** :
`https://api.ebird.org/v2/ref/region/list/subnational1/XX.json`, jeton `EBIRD_API_KEY` (dans `Documents\.Renviron`). Le
fichier local ignorait cinq zones lettonnes, et c'étaient les cinq plus grosses, de 147 à
241 espèces : jamais demandées, donc jamais récoltées, pendant des mois.

**Le mur anti-robot refuse le mode invisible.** Mesuré le 2026-09-28 sur le même témoin à la
minute près : en `headless`, eBird rend « impossible de déterminer si vous êtes un robot » et
0 espèce ; en fenêtre visible, SI-061 rend ses 295 espèces. Une zone qui répond 0 en mode
invisible ne dit rien sur la zone, seulement sur le mur - c'est ce qui a fait conclure à tort
à un bridage. Deux commandes répondent désormais : `tools/build/etat-exotiques.mjs` pour ce
qui manque face aux listes eBird, `tools/build/verifie-zones-vides.mjs` pour trancher zone par
zone.

**« Zone vide » ou « scrape raté » : seule la page barchart ouverte dans un vrai navigateur
tranche.** Les deux sondes de l'API mentent, chacune à sa façon : `obs/recent` donne 0 pour
une commune rurale en septembre, et `spplist` compte toute l'histoire d'eBird quand le bar
chart s'arrête à la fenêtre courante. Et ne jamais conclure au bridage sans avoir chargé un
témoin connu dans la même minute : le 2026-09-27, le scraper échouait partout pendant que
LV-022 rendait ses 228 espèces en trois secondes.
