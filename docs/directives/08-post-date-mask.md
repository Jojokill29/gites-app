# Directive — Peaufinage post-étape 8 : auto-format jj/mm/aaaa sur les champs date Finances

Mini-tâche atomique, post-livraison étape 8. Un seul commit poussé sur GitHub.

---

## Contexte

Dans les formulaires de l'onglet Finances (opérations CA et Taxes), Johan saisit la date en texte libre. Pour gagner du temps, on veut que les `/` soient insérés automatiquement entre `jj` et `mm`, puis entre `mm` et `aaaa`. Exemple : Johan tape `14072026` → le champ affiche `14/07/2026`.

---

## Travail à faire

### Composant `DateMaskedInput.tsx`

Créer `src/components/finances/DateMaskedInput.tsx` :

- Wrapper autour d'un `<input type="text">` standard.
- Comportement à la saisie :
  - Accepte uniquement les chiffres (filtre les autres caractères).
  - Insère automatiquement `/` après le 2e caractère (jj) et après le 5e caractère (jj/mm).
  - Bloque la saisie au-delà de 10 caractères (jj/mm/aaaa).
- Comportement au backspace : retirer le `/` proprement (pas de blocage).
- Pas de validation stricte côté front : si Johan tape une date incomplète, on l'accepte (toujours stocké en `TEXT` en BDD, conforme à la décision 51).
- Props standard d'un input contrôlé : `value`, `onChange(string)`, `placeholder` ("jj/mm/aaaa"), `id`, `name`, etc.

### Intégration dans les deux formulaires

Remplacer le `<input type="text">` actuel du champ date par `<DateMaskedInput>` dans :

- `src/components/finances/RevenueEntryForm.tsx` (champ "Date")
- `src/components/finances/TaxStayForm.tsx` (champ "Dates")

Aucune autre modification dans ces formulaires — uniquement le remplacement de l'input du champ date.

---

## Isolation entre onglets

Ne pas modifier les composants des autres onglets (calendrier, fiche réservation, contrats). Strictement dans le périmètre Finances.

---

## Commit unique

```
feat(finances): auto-format jj/mm/aaaa on date inputs

Add DateMaskedInput component that auto-inserts '/' between
day/month and month/year as the user types. Wired into
RevenueEntryForm and TaxStayForm date fields. Storage in DB
unchanged (still TEXT, no strict validation).
```

Push direct sur la branche principale.

---

## Test Vercel

Sur la page Finances, ajouter une opération CA puis une opération Taxe :

- Taper `14072026` dans le champ Date → le champ affiche `14/07/2026`.
- Backspace fonctionne sans bloquer (les `/` s'enlèvent quand on remonte).
- Pas de bug sur copier/coller d'une date déjà formatée.
