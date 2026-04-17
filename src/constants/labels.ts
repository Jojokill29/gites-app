// All user-facing strings in French, centralized here
export const LABELS = {
  // App
  appTitle: 'Gestion des gîtes',

  // Auth
  loginTitle: 'Connexion',
  login: 'Se connecter',
  logout: 'Déconnexion',
  switchToDark: 'Passer en mode sombre',
  switchToLight: 'Passer en mode clair',
  email: 'Adresse email',
  password: 'Mot de passe',
  forgotPassword: 'Mot de passe oublié ?',
  loginLoading: 'Connexion en cours...',
  connectedAs: 'Connecté :',

  // Validation
  emailRequired: 'L\'adresse email est obligatoire.',
  emailInvalid: 'L\'adresse email n\'est pas valide.',
  passwordRequired: 'Le mot de passe est obligatoire.',
  passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères.',

  // Navigation
  finances: 'Finances',
  factures: 'Factures',
  export: 'Export',

  // Calendar
  newReservation: '+ Nouvelle réservation',
  today: 'Aujourd\'hui',
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  legend: 'Légende',

  // Reservation form
  newReservationTitle: 'Nouvelle réservation',
  editReservationTitle: 'Modifier la réservation',
  clientName: 'Nom du client',
  gite: 'Gîte',
  startDate: 'Date d\'arrivée',
  endDate: 'Date de départ',
  guestCount: 'Nombre de personnes',
  linenSetsSingle: 'Sets de draps (lits simples)',
  linenSetsDouble: 'Sets de draps (lits doubles)',
  totalAmount: 'Montant total (€)',
  paidAmount: 'Montant déjà payé (€)',
  remainingAmount: 'Reste à payer :',
  status: 'Statut',
  notes: 'Notes',
  contractPdf: 'Contrat PDF',
  viewContract: 'Voir le contrat',
  uploadContract: 'Téléverser un contrat',
  replaceContract: 'Remplacer le contrat',
  save: 'Enregistrer',
  delete: 'Supprimer',
  cancel: 'Annuler',
  confirmDeleteReservation: 'Confirmer la suppression de la réservation ?',

  // Finances
  financesTitle: 'Finances',
  currentYear: 'Année en cours',
  previousYear: 'Année précédente',
  nextYear: 'Année suivante',
  annualRevenue: 'Chiffre d\'affaires annuel',
  annualTaxes: 'Taxes de séjour annuelles',
  reservationCount: 'Nombre de réservations',
  quarterHeader: 'Trimestre',
  revenueHeader: 'Chiffre d\'affaires',
  taxHeader: 'Taxes de séjour',
  notesHeader: 'Notes',
  addTax: '+ Saisir une taxe de séjour',
  addNote: '+ Ajouter une note',
  amountField: 'Montant (€)',
  yearField: 'Année',
  quarterField: 'Trimestre',
  labelField: 'Description',

  // Invoices
  invoicesTitle: 'Factures',
  uploadInvoice: 'Téléverser une facture',
  downloadZip: 'Télécharger le ZIP du trimestre',
  invoiceFile: 'Fichier (JPEG, PNG ou PDF)',
  invoiceName: 'Nom de la facture',
  invoiceDate: 'Date de la facture',
  previousQuarter: 'Trimestre précédent',
  nextQuarter: 'Trimestre suivant',
  confirmDeleteInvoice: 'Confirmer la suppression de cette facture ?',

  // Export
  exportTitle: 'Export des données',
  exportDescription: 'Sauvegardez régulièrement vos données. Un export complet mensuel est recommandé.',
  exportFull: 'Télécharger l\'archive complète (ZIP)',
  exportReservations: 'Exporter les réservations (CSV)',
  exportFinances: 'Exporter les finances (CSV)',
  exportGenerating: 'Génération de l\'archive en cours...',

  // Generic states
  loading: 'Chargement...',
  noData: 'Aucune donnée à afficher',

  // Errors
  errorGeneric: 'Une erreur est survenue. Réessayez dans quelques instants.',
  errorUnexpected: 'Une erreur inattendue est survenue. Réessayez ou contactez un administrateur.',
  errorLogin: 'Email ou mot de passe incorrect.',
  errorSessionExpired: 'Votre session a expiré. Merci de vous reconnecter.',
  errorNetwork: 'Impossible de joindre le serveur. Vérifiez votre connexion internet.',
  errorFileTooLarge: 'Le fichier est trop volumineux (max 10 Mo pour un PDF, 5 Mo pour une image).',
  errorFileFormat: 'Format non supporté. Utilisez JPEG, PNG ou PDF pour les factures, PDF uniquement pour les contrats.',
  errorUpload: 'Le téléversement a échoué. Réessayez dans quelques instants.',
  errorLoadData: 'Impossible de charger les données. Réessayez dans quelques instants.',
  errorSaveData: 'La sauvegarde a échoué. Réessayez dans quelques instants.',
  errorDeleteGite: 'Ce gîte ne peut pas être supprimé car il contient des réservations.',
  errorDateConflict: 'Ces dates entrent en conflit avec une autre réservation sur ce gîte.',
  errorResetEmail: 'Si cette adresse est associée à un compte, un email a été envoyé.',
  errorLoadGites: 'Impossible de charger les gîtes. Rafraîchissez la page.',
} as const
