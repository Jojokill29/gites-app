# Cahier des charges -- Application de gestion des gites

## Contexte

Application web de gestion des reservations pour une societe familiale de location de gites. Deux gites sont geres : un grand gite de 22 personnes et un petit gite de 15 personnes.

L'application est utilisee par deux freres :
- **Johan (Djo)** -- utilisation principale sur telephone
- **Quentin (Coltan)** -- utilisation principale sur ordinateur

Les deux ont des droits identiques (lecture et ecriture). L'application opere en heure francaise (Europe/Paris).

## Objectif

Fournir un outil fiable, multi-appareil, permettant de gerer les reservations des deux gites, les documents associes (contrats, factures), les finances trimestrielles, et de garantir un stockage securise et perenne des donnees.

---

## Fonctionnalites

### 1. Authentification

- Login + mot de passe classique
- Deux comptes utilisateurs : Johan et Quentin
- **Inscription publique desactivee** dans Supabase Auth (les comptes sont crees manuellement par l'admin)
- Session persistante sur l'appareil (pas besoin de se reconnecter a chaque ouverture)
- Deconnexion manuelle possible
- Recuperation de mot de passe par email (Supabase Auth standard)

### 2. Calendriers (un onglet par gite)

- Deux onglets distincts : "Grand gite (22p)" et "Petit gite (15p)"
- Vue mensuelle en grille (semaine / jours)
- Navigation mois precedent / mois suivant
- Bouton "Aller a aujourd'hui" pour revenir rapidement au mois courant
- Jour courant mis en evidence
- Reservations affichees comme des barres colorees s'etalant sur les dates occupees
- Nom du client visible sur la barre
- Clic sur une barre -> ouverture de la fiche reservation
- Bouton "+ Nouvelle reservation" accessible depuis le calendrier
- Gestion des jours de rotation : un meme jour peut afficher le depart d'une reservation et l'arrivee d'une autre (empilees visuellement)

### 3. Code couleur par statut

- **Rouge** -- contrat en attente
- **Orange** -- contrat recu, acompte en attente
- **Vert** -- contrat recu, acompte paye
- Legende visible en permanence sur le calendrier

### 4. Contraintes de reservation

- **Interdiction stricte** de deux reservations simultanees sur le meme gite avec plusieurs nuits de chevauchement
- **Autorise** : un jour unique de chevauchement depart/arrivee (jour de rotation)
- Validation effectuee directement en base de donnees (contrainte d'exclusion PostgreSQL)
- Les modifications de dates d'une reservation existante respectent la meme contrainte

### 5. Fiche reservation

Informations affichees et editables :
- Nom du client / de la reservation
- Gite concerne
- Date d'arrivee, date de depart
- Nombre de personnes (optionnel) -- capacite totale, utile pour les draps
- Nombre d'adultes (optionnel) -- utilise pour le calcul des taxes de sejour declarees a la commune (ajoute 2026-06-03)
- Nombre de sets de draps pour lits simples (optionnel)
- Nombre de sets de draps pour lits doubles (optionnel)
- Montant total
- Montant deja paye
- **Reste a payer** (calcule automatiquement : total - paye)
- Montant de taxe de sejour pour ce sejour (optionnel, saisi par Johan apres le sejour, ajoute 2026-06-03)
- Statut (selecteur avec les 3 valeurs predefinies)
- Notes libres (texte)
- Contrat PDF (upload + consultation)

Affichage sur le calendrier : la barre d'une reservation indique le nom du client et un suffixe draps du format `NS MD` (ex: `5S 2D` = 5 sets simples + 2 sets doubles), systematique quand la barre est assez large pour ne pas rogner le nom client ; sinon le suffixe est omis et reste visible dans le tooltip au survol.

Actions possibles :
- Modifier les champs
- Supprimer la reservation (avec confirmation explicite) -- cas d'annulation
- Consulter le contrat PDF uploade

### 6. Gestion des contrats

- Upload de fichier PDF par reservation
- Un seul contrat par reservation
- Remplacement possible (le nouvel upload remplace l'ancien, l'ancien fichier est supprime du Storage)
- Consultation via URL signee (acces securise, pas d'URL publique)
- Stockage dans Supabase Storage avec un nom de fichier base sur un UUID (pas le nom utilisateur, pour eviter les problemes d'accents et caracteres speciaux)
- Quand une reservation est supprimee, son contrat PDF est supprime du Storage egalement

### 7. Onglet Finances

**Refonte 2026-06-03 / revisee 2026-06-04** apres dol&eacute;ance utilisateur. CA calcule automatiquement (reservations + operations annexe). Taxes saisies par sejour (sur la fiche reservation) ou par operation annexe isolee (depuis Finances). L'annexe n'a pas de calendrier propre.

- Vue par annee (navigation annee precedente / suivante)
- Bouton "Annee courante" pour revenir rapidement

**Chiffre d'affaires (calcule automatiquement) :**
- Pour chaque trimestre, somme des `paid_amount` des `reservations` ET des `annex_stays` dont le `start_date` tombe dans le trimestre (voir decision 1)
- Mis a jour en temps reel quand une reservation ou une operation annexe est modifiee

**Taxes de sejour (saisies par operation) :**
- Pour une r&eacute;servation g&icirc;te : Johan renseigne `tax_amount` dans la fiche reservation apres le sejour
- Pour l'annexe : Johan saisit une **operation isolee** depuis l'accordion Finances (modale dediee, table `annex_stays`)
- Total trimestriel = somme des `tax_amount` des `reservations` + des `annex_stays` du trimestre

**Notes financieres libres (saisies manuellement) :**
- Pour corrections, remboursements, frais exceptionnels
- Label, montant (peut etre negatif), trimestre, notes optionnelles
- Stockees dans `misc_entries`, comptees comme metrique distincte (n'impactent pas le CA)

**4 metriques annuelles affichees :**
- CA annuel
- Taxes de sejour annuelles
- Notes diverses annuelles (en rouge si negatif)
- Nombre de reservations (par `start_date` dans l'annee)

**Tableau trimestriel :**
- 4 colonnes : Trimestre / CA / Taxes / Notes diverses
- Le trimestre en cours est mis en evidence (uniquement pour l'annee courante)
- **Clic sur une ligne trimestre** : developpe inline un accordion avec deux sous-sections :
  - **Sejours du trimestre** : tableau **lecture seule** melangeant `reservations` et `annex_stays` du trimestre, triees par date d'arrivee. Colonnes : date + client, lieu (pill couleur Petit g&icirc;te / Grand g&icirc;te / Annexe), nuits, adultes, CA, taxe, lien vers la fiche complete. Pour modifier : passer par la fiche reservation (ou la modale annexe pour les operations isolees). Bouton "+ Ajouter une operation annexe" en bas de la section.
  - **Notes diverses du trimestre** : liste des `misc_entries` avec ajout / modification / suppression.

Reference visuelle : `docs/maquette-finances-v2.html`.

### 8. Onglet Factures

- Upload de photos et scans de factures (JPEG, PNG, PDF)
- Compression cote client des images JPEG/PNG avant upload (qualite 80%, max 2000px sur le grand cote) pour limiter le volume de stockage
- Chaque facture a : un fichier, un nom, une date, des notes optionnelles
- Affichage en grille de vignettes, regroupees par trimestre
- Navigation trimestre precedent / suivant
- Clic sur une facture : affichage plein ecran, option de suppression
- **Bouton "Telecharger ZIP trimestre"** : regroupe toutes les factures du trimestre en une archive pour transmission au comptable

### 9. Onglet Export

Fonctionnalite de sauvegarde / resilience long terme. Trois exports disponibles :

- **Export complet** : archive ZIP contenant tous les CSV + tous les PDF de contrats + toutes les factures
- **Export reservations** : CSV de toutes les reservations
- **Export finances** : CSV des entrees financieres et du CA calcule par trimestre

### 10. Confort d'utilisation -- theme sombre

- L'application propose un theme clair (defaut) et un theme sombre.
- Au premier chargement, le theme actif correspond a la preference systeme du device (via `prefers-color-scheme`).
- Un bouton de bascule (icone soleil / lune) dans la TopBar permet de forcer l'un des deux themes independamment du systeme.
- Le choix manuel est persiste localement (localStorage) et restaure au prochain chargement sur le meme appareil.

---

## Contraintes techniques

### Plateforme

- Application web responsive (utilisable sur mobile et desktop)
- Pas d'application mobile native
- Fonctionne dans les navigateurs modernes (Chrome, Safari, Firefox, derniers Edge)

### Stack technique retenue

- **Frontend** : React + TypeScript
- **Backend / BDD / Auth / Storage** : Supabase (PostgreSQL manage)
- **Hebergement frontend** : Vercel

### Securite

- HTTPS obligatoire (gere par Vercel et Supabase)
- Authentification par session
- Inscription publique desactivee dans Supabase Auth
- URLs signees pour les fichiers (contrats et factures non accessibles publiquement)
- Row Level Security (RLS) activee cote Supabase : seuls les utilisateurs authentifies ont acces aux donnees
- Policies RLS specifiques pour les buckets Storage (voir document modele de donnees)

### Maintenance

- Aucune maintenance technique post-livraison prevue
- Stack choisie pour minimiser le besoin d'intervention
- Exports reguliers des donnees comme filet de securite
- Renouvellement automatique du nom de domaine a prevoir (carte bancaire valide chez le registrar)
- Plan tarifaire Supabase Free suffit pour demarrer (limite : 500 Mo de base + 1 Go de Storage). Passage au plan Pro (25 USD/mois) seulement quand necessaire.

### Donnees

- Volume estime sur 10 ans : environ 4 a 10 Go de PDF et photos, quelques Mo de donnees structurees
- Backups automatiques quotidiens assures par Supabase (plan Pro requis pour les Point-in-Time Recovery)
- Export complet manuel recommande tous les mois (etape 9)

---

## Hors perimetre (pour information)

Elements non inclus dans cette version :
- Generation automatique de contrats (Coltan uploade des PDF existants)
- Envoi d'emails automatiques aux clients
- Integration avec des plateformes externes (Airbnb, Booking, etc.)
- Systeme de reservation cote client (l'app est uniquement interne)
- Paiements en ligne
- Statistiques avancees ou rapports analytiques
- Application mobile native
- Gestion multi-utilisateurs avec roles differencies (admin / lecture seule)
- Audit log (qui a fait quoi quand)

Ces elements pourront etre envisages dans une version future si besoin.
