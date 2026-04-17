# Decisions tranchees

Ce document resout les ambiguites identifiees dans les docs 01 a 04 et fournit les contenus complementaires dont Claude Code a besoin pour coder sans avoir a deviner. A lire apres 01 et avant de commencer le developpement.

---

## 1. Calcul du chiffre d'affaires trimestriel

**Contradiction initiale** : le cahier des charges (01) dit "reservations avec au moins une nuit dans le trimestre", le modele de donnees (03) propose "trimestre du `start_date`".

**Decision retenue** : le CA est attribue au trimestre du `start_date` de la reservation.

Une reservation demarrant le 28 juin 2026 (Q2) avec depart le 5 juillet 2026 (Q3) voit **l'integralite de son `paid_amount` affectee a Q2**. Pas de prorata, pas de repartition multi-trimestres.

**Raisons** :
- Requete SQL simple, calculable en une seule agregation annuelle
- Regle explicable en une phrase au comptable
- Les reservations a cheval sur deux trimestres restent marginales sur un volume annuel

**Requete de reference** :

```sql
SELECT
  EXTRACT(QUARTER FROM start_date)::int AS quarter,
  COALESCE(SUM(paid_amount), 0) AS revenue
FROM reservations
WHERE EXTRACT(YEAR FROM start_date) = $1
GROUP BY EXTRACT(QUARTER FROM start_date)
ORDER BY quarter;
```

**A appliquer** : mettre a jour la formulation dans `01-cahier-des-charges.md` section 7 pour retirer la mention "au moins une nuit dans le trimestre".

---

## 2. Definition du statut "acompte paye"

**Decision retenue** : le statut est entierement manuel. Aucune regle automatique, aucune colonne `deposit_amount`.

Le selecteur de statut (3 valeurs : `pending_contract`, `pending_deposit`, `deposit_paid`) dans la fiche reservation est bascule a la main par Johan ou Quentin selon leur evaluation. La colonne `paid_amount` sert uniquement a la trace comptable et au calcul du CA, pas a determiner le statut.

**Raisons** :
- Les acomptes varient (pourcentage, montant fixe, arrangement au cas par cas)
- Automatiser forcerait une regle arbitraire qui ne correspondrait pas a la realite
- Le volume (2 gites, 2 utilisateurs) ne justifie pas la complexite

**Consequence code** : le composant selecteur dans `ReservationForm.tsx` laisse l'utilisateur choisir librement les 3 valeurs, sans validation liee a `paid_amount`.

---

## 3. Comportement au clic sur une case vide du calendrier

**Decision retenue** : ouvre la modale de creation de reservation avec les champs pre-remplis :

- `gite_id` = gite de l'onglet courant
- `start_date` = date cliquee
- `end_date` = date cliquee + 1 jour
- `status` = `pending_contract` (defaut)
- Autres champs vides

L'utilisateur peut modifier toutes les valeurs avant de valider.

---

## 4. Premier jour de la semaine dans le calendrier

**Decision retenue** : la semaine commence le **lundi** (standard francais et europeen).

Le calendrier affiche les colonnes dans l'ordre : lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.

---

## 5. Contenu initial de `src/constants/labels.ts`

Claude Code peut creer ce fichier avec le contenu ci-dessous. La structure exacte (objet imbrique, export nomme) est laissee a l'appreciation du dev, tant que l'acces reste simple (`LABELS.reservation.clientName` par exemple).

### Navigation et layout

- Titre application : "Gestion des gites"
- Bouton deconnexion : "Se deconnecter"
- Onglet gite (dynamique selon nom) : "Grand gite (22p)", "Petit gite (15p)"
- Onglet Finances : "Finances"
- Onglet Factures : "Factures"
- Onglet Export : "Export"

### Authentification (LoginPage)

- Titre : "Connexion"
- Label email : "Adresse email"
- Label mot de passe : "Mot de passe"
- Bouton connexion : "Se connecter"
- Lien mot de passe oublie : "Mot de passe oublie ?"
- Chargement : "Connexion en cours..."

### Calendrier

- Bouton nouvelle reservation : "+ Nouvelle reservation"
- Bouton aujourd'hui : "Aujourd'hui"
- Mois precedent : "Mois precedent"
- Mois suivant : "Mois suivant"
- Legende : "Legende"
- Legende statut pending_contract : "Contrat en attente"
- Legende statut pending_deposit : "Acompte en attente"
- Legende statut deposit_paid : "Acompte paye"

### Fiche reservation

- Titre creation : "Nouvelle reservation"
- Titre edition : "Modifier la reservation"
- Champ nom client : "Nom du client"
- Champ gite : "Gite"
- Champ date arrivee : "Date d'arrivee"
- Champ date depart : "Date de depart"
- Champ nombre personnes : "Nombre de personnes"
- Champ sets draps : "Sets de draps"
- Champ montant total : "Montant total (EUR)"
- Champ montant paye : "Montant deja paye (EUR)"
- Affichage reste a payer : "Reste a payer :"
- Champ statut : "Statut"
- Champ notes : "Notes"
- Champ contrat : "Contrat PDF"
- Bouton voir contrat : "Voir le contrat"
- Bouton upload contrat : "Televerser un contrat"
- Bouton remplacer contrat : "Remplacer le contrat"
- Bouton enregistrer : "Enregistrer"
- Bouton supprimer : "Supprimer"
- Bouton annuler : "Annuler"
- Confirmation suppression : "Confirmer la suppression de la reservation ?"

### Finances

- Titre : "Finances"
- Bouton annee courante : "Annee en cours"
- Annee precedente : "Annee precedente"
- Annee suivante : "Annee suivante"
- CA annuel : "Chiffre d'affaires annuel"
- Taxes annuelles : "Taxes de sejour annuelles"
- Nombre reservations : "Nombre de reservations"
- Entete colonne trimestre : "Trimestre"
- Entete colonne CA : "Chiffre d'affaires"
- Entete colonne taxes : "Taxes de sejour"
- Entete colonne notes : "Notes"
- Bouton ajout taxe : "+ Saisir une taxe de sejour"
- Bouton ajout note : "+ Ajouter une note"
- Champ montant : "Montant (EUR)"
- Champ annee : "Annee"
- Champ trimestre : "Trimestre"
- Champ label (note libre) : "Description"

### Factures

- Titre : "Factures"
- Bouton upload : "Televerser une facture"
- Bouton export ZIP : "Telecharger le ZIP du trimestre"
- Champ fichier : "Fichier (JPEG, PNG ou PDF)"
- Champ nom : "Nom de la facture"
- Champ date : "Date de la facture"
- Champ notes : "Notes"
- Trimestre precedent : "Trimestre precedent"
- Trimestre suivant : "Trimestre suivant"
- Confirmation suppression : "Confirmer la suppression de cette facture ?"

### Export

- Titre : "Export des donnees"
- Description : "Sauvegardez regulierement vos donnees. Un export complet mensuel est recommande."
- Bouton export complet : "Telecharger l'archive complete (ZIP)"
- Bouton export reservations : "Exporter les reservations (CSV)"
- Bouton export finances : "Exporter les finances (CSV)"
- Message pendant generation : "Generation de l'archive en cours..."

### Etats generiques

- Chargement : "Chargement..."
- Aucune donnee : "Aucune donnee a afficher"
- Erreur generique : "Une erreur est survenue. Reessayez dans quelques instants."

---

## 6. Template email Supabase (reinitialisation mot de passe)

A adapter dans Supabase Dashboard -> Authentication -> Email Templates -> "Reset Password".

**Sujet** : Reinitialisation de votre mot de passe

**Corps** (HTML ou texte selon configuration) :

```
Bonjour,

Vous avez demande la reinitialisation de votre mot de passe pour l'application de gestion des gites.

Cliquez sur le lien ci-dessous pour definir un nouveau mot de passe :

{{ .ConfirmationURL }}

Ce lien expire dans 24 heures.

Si vous n'etes pas a l'origine de cette demande, ignorez cet email : votre mot de passe ne sera pas modifie.

---
Application de gestion des gites
```

Les autres templates (confirmation inscription, magic link, etc.) ne sont pas utilises puisque l'inscription publique est desactivee et le login se fait par mot de passe.

---

## 7. Messages d'erreur utilisateur

Tous les messages sont en francais, centralises dans `labels.ts` (section `errors`), et affiches via un composant toast ou une zone d'erreur inline selon le contexte. Les details techniques vont uniquement dans `console.error` (en anglais).

| Cas | Code / detection | Message utilisateur |
|---|---|---|
| Conflit de dates | Postgres `23P01` | "Ces dates entrent en conflit avec une autre reservation sur ce gite." |
| Identifiants invalides | Supabase Auth `invalid_credentials` | "Email ou mot de passe incorrect." |
| Session expiree | Supabase Auth `session_expired` ou token invalide | "Votre session a expire. Merci de vous reconnecter." |
| Pas de connexion reseau | `navigator.onLine === false` ou erreur fetch | "Impossible de joindre le serveur. Verifiez votre connexion internet." |
| Upload fichier trop lourd | Taille > 10 Mo pour PDF, > 5 Mo pour images apres compression | "Le fichier est trop volumineux (max 10 Mo pour un PDF, 5 Mo pour une image)." |
| Format fichier non supporte | Extension hors whitelist | "Format non supporte. Utilisez JPEG, PNG ou PDF pour les factures, PDF uniquement pour les contrats." |
| Upload echoue | Erreur Supabase Storage | "Le televersement a echoue. Reessayez dans quelques instants." |
| Lecture donnees echouee | Erreur Supabase generique sur SELECT | "Impossible de charger les donnees. Reessayez dans quelques instants." |
| Ecriture donnees echouee | Erreur Supabase generique sur INSERT/UPDATE/DELETE | "La sauvegarde a echoue. Reessayez dans quelques instants." |
| Suppression empechee par FK | Postgres `23503` (sur gites uniquement) | "Ce gite ne peut pas etre supprime car il contient des reservations." |
| Email reset introuvable | Supabase Auth | "Si cette adresse est associee a un compte, un email a ete envoye." (volontairement vague, pour ne pas reveler si le compte existe) |
| Erreur inattendue | Catch-all | "Une erreur inattendue est survenue. Reessayez ou contactez un administrateur." |

---

## 8. Reference aux maquettes

Le fichier `maquettes-gites.html` dans ce dossier contient les maquettes HTML des 4 vues principales. Claude Code doit s'y referer pour les choix visuels (layout, espacements, hierarchie, responsive). L'apparence finale peut s'ecarter marginalement des maquettes tant que :

- Les codes couleur des 3 statuts sont respectes strictement (voir doc 02 / CLAUDE.md)
- La structure d'onglets (2 gites + Finances + Factures + Export) est conservee
- L'experience mobile reste fluide (Djo utilise majoritairement son telephone)

En cas de divergence entre les maquettes et une autre doc, **les docs 01 a 05 font foi** pour les regles metier et le perimetre. Les maquettes font foi pour l'UI et seulement l'UI.

---

## 10. Palette de fond adoucie (2026-04-17)

**Decision retenue** : adoucir les fonds pour le confort visuel.

- `--bg` : passe de `#F8F7F4` a `#EFEDE8`
- `--surface` : passe de `#FFFFFF` a `#FAF8F4`

Les autres couleurs (statuts, texte, accents, bordures) ne changent pas. Les maquettes HTML (`maquettes-gites.html`) ne sont volontairement pas mises a jour (document fige).

Verification de contraste effectuee : texte principal OK (>11:1), couleurs de statut non affectees (fond propre), texte secondaire pre-existant en dessous de 4.5:1 (non aggrave par ce changement).

---

## 9. Points non decides (a traiter plus tard si necessaire)

Ces points ne bloquent pas le developpement et peuvent etre resolus pendant l'implementation ou en v2 :

- Nom de domaine custom (optionnel, a acheter quand Adrien le decide)
- Logo ou favicon specifique (placeholder acceptable au demarrage)
- Personnalisation avatar utilisateur (initiales suffisent au demarrage)
- Format exact des notifications / toasts (choix du dev selon la maquette)
