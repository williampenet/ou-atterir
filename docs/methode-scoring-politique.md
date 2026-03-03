# Méthodologie de scoring politique communal

## 1. Objectif

Attribuer à chaque commune française un **profil politique synthétique** à partir des résultats électoraux récents. Le profil doit refléter à la fois :

- la **couleur politique des élus en exercice** (maire, député, président) ;
- la **distribution des votes** dans la commune, y compris pour les candidats non élus.

Le résultat est un vecteur de scores par bloc politique, normalisé en pourcentages, accompagné d'une classification qualitative.

---

## 2. Périmètre électoral

Quatre scrutins sont retenus, correspondant aux mandats en cours :

| Élection | Édition | Mode de scrutin | Portée |
|---|---|---|---|
| **Municipales** | 2020 | Scrutin de liste (>1000 hab.) ou plurinominal | Locale — élit le maire |
| **Présidentielle T1** | 2022 | Uninominal à 2 tours | Nationale — élit le président |
| **Législatives T1** | 2024 | Uninominal à 2 tours, par circonscription | Nationale — élit le député |
| **Européennes** | 2024 | Proportionnelle, listes nationales | Européenne — peu d'impact local direct |

### Choix méthodologiques

- **Seuls les premiers tours** sont utilisés. Le T2 de la présidentielle et des législatives est souvent un vote de barrage (« contre » plutôt que « pour ») et ne reflète pas les préférences sincères des électeurs.
- **Les départementales et régionales sont exclues** : les départementales utilisent un binôme paritaire sur des cantons qui ne correspondent pas aux communes ; les régionales sont des scrutins à échelle trop large pour caractériser une commune.
- **Chaque scrutin représente le mandat en cours** : pas de pondération temporelle complexe. Un maire élu en 2020 gouverne jusqu'en 2026, un député élu en 2024 siège jusqu'en 2029.

---

## 3. Taxonomie des blocs politiques

Chaque candidat ou liste est rattaché à une **nuance politique** (codification officielle du Ministère de l'Intérieur), elle-même mappée vers l'un des 7 blocs :

| Bloc | Exemples de nuances |
|---|---|
| **Extrême-gauche** | EXG, LFI, FI, FG, PG |
| **Gauche** | SOC, COM, ECO, VEC, DVG, UG, NUP |
| **Centre** | MDM, DVC, UDI, CEN |
| **Centre-droit** | ENS, REM, LREM, HOR, MAJ |
| **Droite** | LR, DVD, UMP, UD |
| **Extrême-droite** | RN, REC, DLF, EXD |
| **Divers** | DIV, REG, AUT, LNC |

La distinction **Centre / Centre-droit** sépare les centristes historiques (MoDem, UDI) de la majorité présidentielle macroniste (Ensemble, Renaissance, Horizons), dont le positionnement effectif en matière de politique publique se situe nettement à droite du centre.

Pour la présidentielle (où les nuances ne sont pas attribuées par le Ministère), un mapping nominatif des 12 candidats est utilisé.

---

## 4. Modèle de scoring

### 4.1 Intuition

Le modèle doit capturer deux signaux distincts :

1. **Qui gouverne** : le parti du maire, du député et du président élu a un impact direct sur la vie de la commune. Même si l'élection a été serrée (51/49), le programme appliqué est celui du vainqueur.
2. **Comment vote la population** : la répartition des suffrages entre blocs donne le paysage politique de la commune, au-delà du seul vainqueur.

Un simple barycentre sur un axe gauche-droite est **exclu** : si une commune vote 40% extrême-gauche et 40% extrême-droite, la moyenne arithmétique donnerait un centre fictif. Le modèle conserve donc un **vecteur multidimensionnel** (un score par bloc) plutôt qu'un scalaire.

### 4.2 Formulation

Pour chaque commune $c$ et chaque élection $e \in \{M, P, L, E\}$ (Municipales, Présidentielle, Législatives, Européennes), on calcule le score du bloc $b$ :

$$S_{c,b} = \sum_{e} \left[ \alpha_e \cdot p_{c,e,b} + \beta_e \cdot \mathbb{1}_{b = w_{c,e}} \right]$$

Où :

| Symbole | Définition |
|---|---|
| $p_{c,e,b}$ | Part des suffrages exprimés pour le bloc $b$ dans la commune $c$ à l'élection $e$ (en fraction, $\in [0,1]$) |
| $w_{c,e}$ | Bloc du candidat/liste arrivé en tête à l'élection $e$ dans la commune $c$ |
| $\mathbb{1}_{b = w_{c,e}}$ | Indicatrice : vaut 1 si $b$ est le bloc du vainqueur, 0 sinon |
| $\alpha_e$ | Multiplicateur de part de vote (« share multiplier ») pour l'élection $e$ |
| $\beta_e$ | Bonus de victoire (« winner bonus ») pour l'élection $e$ |

### 4.3 Paramètres

| Élection $e$ | $\beta_e$ (winner bonus) | $\alpha_e$ (share multiplier) | Justification |
|---|---|---|---|
| Municipales | 10 | 3 | Le maire façonne directement la politique locale (urbanisme, fiscalité, services). Impact maximal. |
| Législatives T1 | 7 | 2 | Le député vote les lois, représente la circonscription. Impact élevé. |
| Présidentielle T1 | 5 | 2 | Le président influence la politique nationale mais n'a pas d'impact local direct. |
| Européennes | 2 | 1.5 | Scrutin d'opinion sans impact direct sur la gouvernance communale. Utile comme indicateur de tendance. |

**Ratio $\beta_e / \alpha_e$** : le winner bonus domine la contribution de part de vote. Pour les municipales, un vainqueur à 100% contribue $10 + 3 \times 1 = 13$ points, tandis qu'un second à 0% contribue 0. Pour un vainqueur à 51%, la contribution du winner bonus seul ($10$) représente ~87% de ses $10 + 3 \times 0.51 = 11.53$ points totaux. Ce ratio élevé traduit le fait qu'en politique française, **c'est le vainqueur qui gouverne**, pas le spectre complet des votes.

### 4.4 Normalisation

Les scores bruts sont normalisés en pourcentages relatifs :

$$\hat{S}_{c,b} = \frac{S_{c,b}}{\sum_{b'} S_{c,b'}} \times 100$$

Ce profil normalisé est un vecteur de dimension 7 qui somme à 100%.

---

## 5. Classification

Le profil normalisé est ensuite traduit en une étiquette qualitative basée sur le score du bloc dominant :

| Seuil | Étiquette | Interprétation |
|---|---|---|
| $\hat{S}_{c,b^*} > 60\%$ | **Ancré** $b^*$ | Le bloc dominant concentre une majorité claire. La commune est politiquement homogène. |
| $40\% < \hat{S}_{c,b^*} \leq 60\%$ | **Tendance** $b^*$ | Le bloc dominant est en tête mais sans majorité écrasante. |
| $\hat{S}_{c,b^*} \leq 40\%$ | **Partagé** ($b^*$ / $b^{**}$) | Aucun bloc ne domine. Les deux premiers blocs sont mentionnés. |

Avec $b^* = \arg\max_b \hat{S}_{c,b}$ et $b^{**}$ le second bloc.

---

## 6. Résultats sur 9 communes tests

| Commune | Code postal | Classification | Bloc dominant | % |
|---|---|---|---|---|
| Saint-Pierre-de-Bœuf | 42520 | Tendance Extrême-droite | Extrême-droite | 50.3% |
| Larmor-Plage | 56260 | Tendance Centre-droit | Centre-droit | 49.9% |
| Lille | 59000 | Ancré Gauche | Gauche | 65.4% |
| La Madeleine | 59110 | Partagé (Droite / Gauche) | Droite | 38.1% |
| Lambersart | 59130 | Tendance Centre-droit | Centre-droit | 48.7% |
| Le Touquet-Paris-Plage | 62520 | Tendance Centre-droit | Centre-droit | 51.6% |
| Lyon 6e | 69006 | Partagé (Droite / Gauche) | Droite | 36.7% |
| Villeurbanne | 69100 | Ancré Gauche | Gauche | 65.0% |
| Paris 19e | 75019 | Ancré Gauche | Gauche | 69.9% |

### Profils détaillés

**Saint-Pierre-de-Bœuf (42520)** — petite commune rurale (~1200 inscrits), maire « divers » sans opposant aux municipales 2020. Le vote Le Pen/RN aux autres scrutins (28% présidentielle, 44% législatives, 40% européennes) tire fortement le profil vers l'extrême-droite. Le poids élevé du « Divers » (40%) est un artefact de la candidature unique en municipale.

**Larmor-Plage (56260)** — station balnéaire bretonne. Maire DVD (droite classique), mais la députée ENS (Centre-droit) et le score Macron à 42% à la présidentielle font basculer le profil vers Centre-droit.

**Lille (59000)** — métropole de gauche. Martine Aubry (PS) réélue en 2020, Mélenchon (LFI) en tête à la présidentielle (40%), candidats UG majoritaires aux législatives, LFI en tête aux européennes. Le profil est 65% Gauche + 25% Extrême-gauche = 90% à gauche de l'échiquier.

**La Madeleine (59110)** — commune limitrophe de Lille, profil opposé. Maire DVD (Droite, 65%), mais législatives remportées par la Gauche (UG, 38%), présidentielle par Macron (Centre-droit, 36%). Le profil est fragmenté entre Droite (38%), Gauche (29%) et Centre-droit (27%) → classification « Partagé ».

**Lambersart (59130)** — commune résidentielle limitrophe de Lille. Maire centriste (DVC), score Macron élevé à la présidentielle (40%), députée ENS. Le Centre historique (38%) et le Centre-droit (49%) se côtoient, avec un profil global Centre-droit dominant.

**Le Touquet-Paris-Plage (62520)** — station balnéaire aisée. Maire DVD (Droite), mais Macron à 56% (présidentielle) et député ENS (56% aux législatives) créent un profil très Centre-droit (52%) avec un socle Droite classique (38%).

**Lyon 6e (69006)** — arrondissement bourgeois de Lyon. Maire LR (Droite, 50%), mais les données présidentielles/législatives/européennes ne sont disponibles qu'au niveau de la ville de Lyon (plus à gauche), ce qui dilue le profil. Résultat : Partagé entre Droite (37%) et Gauche (36%).

**Villeurbanne (69100)** — grande ville populaire de la métropole lyonnaise. Maire UG (Gauche, 70%), Mélenchon à 38% (présidentielle), législatives UG à 46%. Profil très marqué à gauche (65% Gauche + 25% Extrême-gauche).

**Paris 19e (75019)** — arrondissement populaire et métissé. Maire UG (Gauche, 68%), mais les données nationales sont au niveau Paris (Macron en tête à la présidentielle). Le poids des municipales compense largement : 70% Gauche, 20% Centre-droit.

---

## 7. Limites connues

### 7.1 Communes à candidature unique en municipale

Dans les petites communes, les municipales se jouent souvent avec un seul candidat « divers » ou « sans étiquette » (nuance LNC). Le winner bonus de 10 points attribué à ce candidat crée un poids « Divers » disproportionné. Ce biais affecte essentiellement les communes de moins de 1000 habitants.

**Piste d'amélioration** : réduire le winner bonus lorsque le taux de participation aux municipales est inférieur à un seuil (ex. 40%) ou lorsqu'il n'y a qu'un seul candidat.

### 7.2 Paris, Lyon, Marseille (PLM)

Pour les arrondissements de Paris, Lyon et Marseille, les municipales sont disponibles par arrondissement (scrutin d'arrondissement), mais les présidentielles, législatives et européennes ne sont disponibles qu'à l'échelle de la ville entière. Les résultats ville sont utilisés comme proxy pour chaque arrondissement, ce qui introduit un biais de dilution (le 6e de Lyon n'a pas le même profil que le 8e).

**Piste d'amélioration** : utiliser les résultats par bureau de vote quand ils sont disponibles et les agréger par arrondissement.

### 7.3 Calibration des paramètres

Les valeurs de $\alpha_e$ et $\beta_e$ ont été fixées par jugement expert, pas par optimisation statistique. Une validation plus formelle pourrait :

- comparer les classifications obtenues avec des sondages d'opinion locaux ;
- tester la sensibilité des résultats à une perturbation des paramètres (analyse de robustesse) ;
- utiliser une approche de type cross-validation sur des communes dont l'orientation est connue a priori.

### 7.4 Absence de pondération par la participation

Le modèle ne pondère pas par le taux de participation. Une élection à 30% de participation et une élection à 80% de participation contribuent de la même manière (hors le winner bonus qui est fixe). Le choix est délibéré : la participation affecte les pourcentages de voix ($p_{c,e,b}$), mais l'élu reste l'élu quel que soit le nombre de votants.

### 7.5 Évolution temporelle

Le modèle produit un snapshot statique. Il ne capture pas les dynamiques (commune en train de basculer d'un bloc à l'autre). Une version future pourrait comparer les profils entre deux mandatures.

---

## 8. Sources de données

| Donnée | Source | Format |
|---|---|---|
| Municipales 2020 | data.gouv.fr — pipeline élections | Parquet |
| Présidentielle 2022 T1 | data.gouv.fr — résultats sub-communaux | XLSX |
| Législatives 2024 T1 | data.gouv.fr — résultats par commune | CSV |
| Européennes 2024 | data.gouv.fr — résultats par commune | CSV |
| Codes INSEE ↔ codes postaux | geo.api.gouv.fr | API JSON |
| Nuances politiques | Ministère de l'Intérieur | Codification officielle |
