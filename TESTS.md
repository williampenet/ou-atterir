# Suite de tests — Ou Atterir

> A exécuter manuellement à chaque modification significative du code.
> Lancer `npm run dev` puis ouvrir http://localhost:5173 en desktop ET mobile (F12 → Device Toggle).

---

## T1 — Chargement initial (0 filtre)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T1.1 | Ouvrir l'app sans aucun filtre actif | La liste affiche des communes (max 500), la carte montre des marqueurs | |
| T1.2 | Vérifier le compteur de résultats | Affiche le nombre total de communes (ex: "34 968 communes") | |
| T1.3 | Console du navigateur (F12 → Console) | Aucune erreur rouge. Si `hasLanded=true` en localStorage et que la RPC climat n'existe pas, un `console.warn` fallback doit apparaître | |

---

## T2 — Filtres rapides (barre horizontale desktop)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T2.1 | Clic sur "Département" → sélectionner "Isère" | Le dropdown se ferme, le bouton passe en bleu indigo avec label "Isère", la liste se met à jour avec des communes de l'Isère uniquement | |
| T2.2 | Clic sur "Département" → "Tous les départements" | Le filtre se désactive, toutes les communes réapparaissent | |
| T2.3 | Clic sur "Géographie" → sélectionner "Littoral" | Les communes littorales s'affichent, le bouton affiche "Littoral" en indigo | |
| T2.4 | Clic sur "Géographie" → ajouter "Montagne" (multi-select) | Les communes littoral + montagne s'affichent, le bouton affiche "Littoral, Montagne" | |
| T2.5 | Clic sur "Taille" → sélectionner "Village" | Filtre les communes de 200-500 habitants | |
| T2.6 | Clic sur "Taille" → sélectionner plusieurs tailles | Le bouton affiche "N tailles" | |
| T2.7 | Clic sur "Commerces" → "Présence de commerces" | Filtre les communes avec des commerces | |
| T2.8 | Clic sur "Enseignement" → sélectionner "Collège" | Filtre les communes avec un collège, bouton "1 sélectionné" | |
| T2.9 | Clic sur "Santé" → sélectionner "Professions médicales" | Filtre les communes avec des professions médicales | |
| T2.10 | Clic sur "Maire sortant" → sélectionner "Gauche" | Filtre par bloc politique, pastille rose visible | |
| T2.11 | **REGRESSION BUG FIX** : Vérifier que le filtre Département envoie le **nom** (ex: "Isère") et pas le code (ex: "38"). Ouvrir l'onglet Réseau (F12) et vérifier le payload RPC | Le champ `target_department` doit contenir "Isère", pas "38" | |

---

## T3 — Synchronisation Quick Filters ↔ FilterSheet

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T3.1 | Sélectionner "Isère" via le quick filter Département, puis ouvrir FilterSheet | Le select "Département" dans FilterSheet doit afficher "Isère" (synchronisé) | |
| T3.2 | Sélectionner "Montagne" via FilterSheet, puis fermer | Le quick filter "Géographie" doit passer en indigo avec "Montagne" | |
| T3.3 | Activer un filtre via quick filter, puis le désactiver via FilterSheet | Le quick filter doit revenir à l'état inactif | |

---

## T4 — Responsive adaptatif (quick filters)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T4.1 | Écran large (>1400px) | Les 7 filtres rapides sont tous visibles | |
| T4.2 | Réduire la fenêtre progressivement | Les filtres les plus à droite disparaissent un par un | |
| T4.3 | Les dropdowns ouverts ne sont pas coupés | Le menu déroulant dépasse du conteneur sans être tronqué | |
| T4.4 | Le bouton "+ Filtres" reste toujours visible à droite | Jamais masqué, toujours accessible | |
| T4.5 | Vue mobile (<640px) | La barre de filtres rapides n'apparaît pas du tout | |

---

## T5 — Bouton "Atterrir" (LandButton)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T5.1 | Avant toute recherche (0 résultat) | Le bouton "Atterrir" n'est PAS visible (desktop ni mobile) | |
| T5.2 | Après une recherche avec résultats | Le bouton "Atterrir" apparaît (desktop : sidebar, mobile : sticky bottom center) | |
| T5.3 | Clic sur "Atterrir" | Le bouton se transforme en badge "Données 2050 actives", badge "2050" dans le header | |
| T5.4 | `localStorage.getItem('hasLanded')` | Doit être `'true'` après atterrissage | |
| T5.5 | Recharger la page après atterrissage | L'app charge directement en mode atterri | |

---

## T6 — Modale d'onboarding

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T6.1 | Première visite (vider localStorage) | La modale "Bienvenue sur Où Atterir" s'affiche, centrée | |
| T6.2 | Contenu de la modale | 3 étapes visibles : "Sélectionnez vos critères", "Atterrissez", "Filtres climatiques" | |
| T6.3 | Clic "C'est parti !" | La modale se ferme | |
| T6.4 | Recharger la page | La modale ne réapparaît PAS (`hasSeenOnboarding` en localStorage) | |
| T6.5 | Utilisateur déjà atterri (`hasLanded=true`) | La modale ne s'affiche PAS, même si `hasSeenOnboarding` n'existe pas | |

---

## T7 — Filtres verrouillés (Environnement)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T7.1 | Avant atterrissage : ouvrir FilterSheet | Section "Environnement et risques" grisée avec overlay et message | |
| T7.2 | Clic sur les filtres environnement (avant atterrissage) | Aucune interaction possible (pointer-events-none) | |
| T7.3 | Après atterrissage : ouvrir FilterSheet | Section "Environnement et risques" déverrouillée, filtres cliquables | |

---

## T8 — Indicateurs climatiques (après atterrissage)

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T8.1 | Cartes de résultats | Score global badge (ex: "32/100") + 5 mini-indicateurs colorés | |
| T8.2 | Couleurs des scores | Vert < 33, Orange 33-66, Rouge > 66 | |
| T8.3 | Sols | Indicateur "Sols" grisé (données pas encore disponibles) | |
| T8.4 | Label de tri | "trié par exposition climat" visible | |

---

## T9 — Carte Leaflet

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T9.1 | Avant atterrissage | Marqueurs colorés par bloc politique | |
| T9.2 | Après atterrissage | Marqueurs colorés par score climat (vert/orange/rouge) | |
| T9.3 | Légende climat | "Exposition climat : Faible / Modérée / Forte" visible en bas-gauche après atterrissage | |
| T9.4 | Pan/zoom sur la carte | Les résultats se mettent à jour selon les bounds visibles | |

---

## T10 — Pondération climatique

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T10.1 | Bouton "Priorités" visible après atterrissage | Desktop : barre d'info, Mobile : sticky bottom right | |
| T10.2 | Ouvrir le panneau de pondération | 5 curseurs (0-100) : Chaleur, Eau, Risques, Air, Sols (désactivé) | |
| T10.3 | Déplacer un curseur | La liste se retrie instantanément (pas de rechargement serveur) | |
| T10.4 | Mettre tous les curseurs actifs à 0 | Message d'avertissement "Au moins une famille doit rester active" | |

---

## T11 — Drawer commune

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T11.1 | Clic sur une commune (avant atterrissage) | Drawer s'ouvre, section climat affiche message "Les projections climatiques seront visibles après avoir atterri." | |
| T11.2 | Clic sur une commune (après atterrissage) | Drawer s'ouvre avec score global, barres par famille, projections 2050 | |

---

## T12 — Fallback RPC climat

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T12.1 | Si `hasLanded=true` mais la RPC `search_communes_climate` n'existe pas en Supabase | L'app doit fallback sur `searchCommunesInBounds` et afficher les résultats normalement | |
| T12.2 | Vérifier dans la console | `console.warn` : "Climate RPC failed, falling back to standard search" | |

---

## T13 — Performance

| # | Test | Attendu | Statut |
|---|------|---------|--------|
| T13.1 | Chargement initial | Résultats affichés en < 3 secondes | |
| T13.2 | Changement de filtre | Résultats mis à jour en < 2 secondes | |
| T13.3 | Pondération (déplacement curseur) | Re-tri instantané (< 100ms, pas de requête serveur) | |
| T13.4 | Nombre de résultats max | Max 500 résultats chargés (limite côté RPC) | |

---

## Procédure de reset complet

Pour tester depuis un état vierge :
```javascript
// Dans la console du navigateur (F12)
localStorage.removeItem('hasLanded');
localStorage.removeItem('hasSeenOnboarding');
location.reload();
```

## Avant chaque commit

1. `npx vite build` → 0 erreurs TypeScript
2. Exécuter T1 (chargement initial)
3. Exécuter T2.11 (régression filtre département)
4. Exécuter T3.1 (synchronisation quick filters ↔ FilterSheet)
5. Exécuter T5.1-T5.2 (visibilité conditionnelle du bouton Atterrir)
