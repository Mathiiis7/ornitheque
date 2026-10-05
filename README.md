# L’Ornithèque

Webapp de comparaison de listes d'observations d'oiseaux entre amis, basée sur les données eBird, GBIF, xeno-canto et AVONET.

Déployée sur GitHub Pages : [mathiiis7.github.io/ornitheque](https://mathiiis7.github.io/ornitheque/)

## Structure du projet

```
ornitheque/
├── index.html              le squelette HTML et les <template>
├── styles.css              toute la CSS
├── app.js                  le code, et les tables qui servent partout
├── service-worker.js       le cache (stale-while-revalidate)
├── manifest.json           nom, icônes et thème de l'app installable
├── CLAUDE.md               les consignes de travail sur ce dépôt
│
├── assets/
│   ├── trophies/           182 images de trophées
│   ├── icons/              32 icônes d'espèces et de badges
│   └── logos/              le logo et ses déclinaisons
│
├── data/                   les données servies au client
│   ├── regions-<cc>-simplified.json   contours régionaux de 48 pays
│   ├── avonet_traits.json  traits écologiques de 10 584 espèces
│   ├── cartes-index.json   l'index des cartes de répartition
│   └── countries/<cc>/     fréquences et abondances, pays par pays
│
├── demo/                   la démo du portfolio, générée
│   └── bouchons/           Firebase simulé, pour qu'elle tourne sans compte
│
├── docs/                   les documents de travail publiés avec le dépôt
│
└── outils/
    ├── build/              les générateurs de données (Node, ESM)
    ├── verif/              les bancs de mesure
    ├── config/             firestore.rules et les contours sources
    └── generateur-trophees.html   outil local de fabrication des badges
```

Deux choses ne sont pas dans cette arborescence, et c'est voulu. **Les cartes de
répartition** (`cartes/`, 82,7 Mo) vivent dans le dépôt séparé
[ornitheque-data](https://github.com/Mathiiis7/ornitheque-data) : les garder ici aurait
ralenti chaque opération sur le code. **`notes-privees/`** reste hors du dépôt, exclu par
`.gitignore` : le dépôt est public.

## Sources de données

- **eBird API v2** : liste d'espèces par région, catégorie exotique
- **eBird bar chart** : fréquence d'observation mensuelle par région, téléchargée depuis eBird
- **Observations eBird publiées sur GBIF** (CC BY 4.0) : les cartes de répartition, méthode dans `docs/sources-cartes.md`
- **xeno-canto API v3** : sons (chants + cris) par espèce
- **Avonet dataset** (Tobias et al. 2022) : traits écologiques et morphologiques
- **GBIF species API** : statut IUCN mondial
- **IUCN Red List France** (données locales) : statut national

## Commandes utiles

```bash
# Regénérer la donnée par pays (session eBird ouverte requise)
EBIRD_COOKIE="..." node outils/build/download-bar-charts-regional.mjs

# Regenerer les cartes de répartition (dans ../ornitheque-data/cartes)
node outils/build/cartes-gbif.mjs

# Regenerer traits Avonet
node outils/build/build-avonet-traits.mjs

# Regenerer IUCN redlist mondial
node outils/build/enrich-redlist-global-full.mjs
```

## Architecture technique

- **Front pur** : aucun backend, tout est statique + Firebase pour l'auth et la synchro utilisateur
- **Service Worker** : cache stale-while-revalidate pour rechargements instantanés
- **PWA** : installable sur écran d'accueil (mobile + desktop)
- **Lazy loading** : les grosses data (freq régionale, avonet traits, range maps) sont fetch à la demande

