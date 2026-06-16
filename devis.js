import { afficherPageDashboard } from "./dashboard.js";
import { afficherPageCategories } from "./categories.js";
import { afficherPageProfil } from "./profil.js";
import { afficherPageProduits } from "./produits.js";
import { afficherPageCommandes } from "./commandes.js";
import { attacherNavigationNavbar } from "./navigation.js";

// Données mock des devis
var donneesDevis = [
  {
    id: "DF-Q001",
    numero: "DEV-2024-001",
    initiales: "AB",
    couleur: "bg-[#C4A882]",
    client: "Atelier Bourgeois",
    clientId: "client_1",
    clientEmail: "contact@atelierbourgeois.com",
    clientTel: "+33 1 23 45 67 89",
    ville: "Paris, France",
    projet: "Rénovation Loft Saint-Germain",
    description: "Rénovation complète du loft avec mobilier sur mesure",
    badge: "CURATION MOBILIER",
    badgeCouleur: "bg-terra-pale text-terracotta",
    dateCreation: "2024-10-01",
    dateExpiration: "2024-12-15",
    expiration: "15 Déc. 2024",
    depasse: false,
    montantHT: 20416.67,
    montantTTC: 24500.00,
    tva: 20,
    montant: "24 500,00",
    statut: "en_attente",
    assigneA: "admin_1",
    historique: [
      { date: "2024-10-01", action: "Création du devis", utilisateur: "Admin Principal" },
      { date: "2024-10-05", action: "Envoi au client", utilisateur: "Admin Principal" }
    ],
    commentaires: [
      { date: "2024-10-06", auteur: "Client", texte: "Peut-on modifier la date de livraison ?" },
      { date: "2024-10-07", auteur: "Admin", texte: "Oui, je vous fais un avenant" }
    ],
    piecesJointes: [],
    produits: [
      { nom: "Canapé design", quantite: 1, prixUnitaire: 8500, total: 8500 },
      { nom: "Table basse", quantite: 2, prixUnitaire: 1200, total: 2400 }
    ]
  },
  {
    id: "DF-Q002",
    numero: "DEV-2024-002",
    initiales: "ML",
    couleur: "bg-[#2C2A27]",
    client: "Mme. Laurent",
    clientId: "client_2",
    clientEmail: "laurent@villazur.com",
    clientTel: "+33 4 92 98 76 54",
    ville: "Cannes, France",
    projet: "Villa Azur — Salon d'été",
    description: "Aménagement du salon d'été avec mobilier extérieur",
    badge: "ESPACE EXTÉRIEUR",
    badgeCouleur: "bg-beige text-charcoal",
    dateCreation: "2024-10-15",
    dateExpiration: "2024-11-28",
    expiration: "28 Nov. 2024",
    depasse: true,
    montantHT: 6833.33,
    montantTTC: 8200.00,
    tva: 20,
    montant: "8 200,00",
    statut: "expire",
    assigneA: "admin_2",
    historique: [
      { date: "2024-10-15", action: "Création du devis", utilisateur: "Admin2" },
      { date: "2024-10-20", action: "Relance client", utilisateur: "Admin2" }
    ],
    commentaires: [],
    piecesJointes: [],
    produits: [
      { nom: "Salon de jardin", quantite: 1, prixUnitaire: 4500, total: 4500 },
      { nom: "Pergola bioclimatique", quantite: 1, prixUnitaire: 3700, total: 3700 }
    ]
  },
  {
    id: "DF-Q003",
    numero: "DEV-2024-003",
    initiales: "RH",
    couleur: "bg-terracotta",
    client: "Résidence Haussmann",
    clientId: "client_3",
    clientEmail: "contact@haussmann.com",
    clientTel: "+33 5 56 78 90 12",
    ville: "Bordeaux, France",
    projet: "Concept Déco — Hall d'entrée",
    description: "Refonte du hall d'entrée avec éclairage design",
    badge: "CONSEIL",
    badgeCouleur: "bg-terra-pale text-terracotta",
    dateCreation: "2024-11-01",
    dateExpiration: "2025-01-05",
    expiration: "05 Janv. 2025",
    depasse: false,
    montantHT: 3958.33,
    montantTTC: 4750.00,
    tva: 20,
    montant: "4 750,00",
    statut: "valide",
    assigneA: "admin_1",
    historique: [
      { date: "2024-11-01", action: "Création du devis", utilisateur: "Admin Principal" },
      { date: "2024-11-05", action: "Envoi au client", utilisateur: "Admin Principal" },
      { date: "2024-11-10", action: "Validation client", utilisateur: "Client" }
    ],
    commentaires: [
      { date: "2024-11-08", auteur: "Client", texte: "Pouvez-vous ajouter un miroir ?" },
      { date: "2024-11-09", auteur: "Admin", texte: "Ajouté au devis, nouveau total 4750€" }
    ],
    piecesJointes: [],
    produits: [
      { nom: "Lustre design", quantite: 3, prixUnitaire: 850, total: 2550 },
      { nom: "Appliques murales", quantite: 5, prixUnitaire: 440, total: 2200 }
    ]
  }
];

var devisAffiches = 3;
var utilisateurCourant = null;
var roleUtilisateur = null;
var devisEnEdition = null;
var filtreActif = "tous";
var rechercheActuelle = "";

export function afficherPageDevis(prenomUtilisateur, role = "client", userId = null) {
  history.pushState({ page: "devis", nom: prenomUtilisateur }, "", "#devis");

  var conteneurApp = document.getElementById("app");
  var prenom = prenomUtilisateur || "Utilisateur";
  roleUtilisateur = role;
  utilisateurCourant = userId;

  conteneurApp.className = "w-full";

  document.getElementById("corps-application").className =
    "font-body bg-beige min-h-screen block p-0 transition-all duration-300";

  // Injection du squelette de la page
  conteneurApp.innerHTML = `
    <div id="page-devis" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <!-- NAVBAR GLOBAL -->
      <header id="navbar" class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div id="navbar-logo" class="flex items-center gap-2 mr-10">
          <img src="LOGOD.png" alt="DecoFlow" class="h-8" />
          <span class="font-display text-2xl font-semibold text-charcoal tracking-wide">DecoFlow</span>
        </div>
        <nav id="navbar-nav" class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Dashboard</a>
          ${role !== 'client' ? `
            <a id="nav-produits" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
            <a id="nav-categories" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Catégories</a>
            <a id="nav-orders" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
            <a id="nav-customers" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Clients</a>
          ` : ''}
          <a id="nav-quotes" href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-charcoal border-b-2 border-terracotta">Devis</a>
        </nav>
        <div id="navbar-droite" class="flex items-center gap-4">
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-charcoal hidden sm:block">${prenom} (${role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Client'})</span>
            <div class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center overflow-hidden">
              <i class="fa-solid fa-user text-terracotta text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- CONTENU DYNAMIQUE PAR RÔLE -->
      <main id="contenu-devis" class="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        ${role === 'client' ? afficherVueClient() : afficherVueAdmin()}
      </main>

      <!-- FOOTER GLOBAL -->
      <footer class="bg-white border-t border-gray-100 mt-auto">
        <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="font-display text-lg font-semibold text-charcoal">DecoFlow</span>
            <span class="text-xs text-muted">© 2024 DecoFlow Interior Management. All rights reserved.</span>
          </div>
          <nav class="flex items-center gap-5">
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Legal Notice</a>
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Privacy Policy</a>
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  `;

  // Initialisation des écouteurs d'événements et de la barre de navigation
  attacherTousLesEcouteurs();
  attacherNavigationNavbar(prenom, role);
}

// VUE ADMIN / SUPERADMIN
function afficherVueAdmin() {
  var devisFiltres = filtrerDevisParRole();
  return `
    ${afficherEnTeteAdmin()}
    ${afficherBarreRechercheEtFiltres()}
    ${afficherStatistiques()}
    ${afficherTableauDevis(devisFiltres)}
    ${devisFiltres.length > devisAffiches ? afficherPagination() : ''}
  `;
}

// VUE CLIENT — interface orientée "mes demandes"
function afficherVueClient() {
  var mesDevis = filtrerDevisParRole();
  var enAttente = mesDevis.filter(function(d) { return d.statut === 'en_attente'; }).length;
  var acceptes  = mesDevis.filter(function(d) { return d.statut === 'valide'; });
  var montantEngage = acceptes.reduce(function(s, d) { return s + d.montantTTC; }, 0);

  return `
    <div class="mb-6 bg-gradient-to-r from-white to-beige/50 rounded-xl p-6 border border-gray-100">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-semibold text-charcoal mb-2">Mes Devis</h1>
          <p class="text-muted text-sm max-w-xl">Retrouvez ici toutes vos demandes de devis. Acceptez ou refusez les propositions reçues, et faites une nouvelle demande à tout moment.</p>
        </div>
        <button id="bouton-demande-devis" class="flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/80 transition text-sm font-medium whitespace-nowrap">
          <i class="fa-solid fa-plus"></i> Faire une demande de devis
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-terra-pale flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-file-invoice text-terracotta text-lg"></i>
        </div>
        <div>
          <p class="text-muted text-xs uppercase tracking-wider mb-0.5">Total demandes</p>
          <p class="text-3xl font-semibold text-charcoal">${mesDevis.length}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-hourglass-half text-yellow-600 text-lg"></i>
        </div>
        <div>
          <p class="text-muted text-xs uppercase tracking-wider mb-0.5">En attente de réponse</p>
          <p class="text-3xl font-semibold text-yellow-600">${enAttente}</p>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-circle-check text-green-600 text-lg"></i>
        </div>
        <div>
          <p class="text-muted text-xs uppercase tracking-wider mb-0.5">Montant accepté</p>
          <p class="text-3xl font-semibold text-green-600">${montantEngage.toLocaleString('fr-FR')} €</p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-100 rounded-xl px-5 py-3 mb-4 flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"></i>
        <input id="champ-recherche-devis" type="text"
          placeholder="Rechercher un devis..."
          value="${rechercheActuelle}"
          class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition">
      </div>
    </div>

    ${afficherCartesClient(mesDevis)}
  `;
}

function afficherCartesClient(mesDevis) {
  if (mesDevis.length === 0) {
    return `
      <div class="bg-white rounded-xl border border-gray-100 py-16 text-center">
        <i class="fa-regular fa-folder-open text-4xl text-terracotta/30 mb-4 block"></i>
        <p class="text-charcoal font-medium mb-1">Aucune demande de devis</p>
        <p class="text-muted text-sm">Cliquez sur « Faire une demande de devis » pour commencer.</p>
      </div>
    `;
  }

  var statutConfig = {
    en_attente: { label: 'En attente', couleur: 'bg-yellow-100 text-yellow-800', icone: 'fa-hourglass-half' },
    valide:     { label: 'Accepté',    couleur: 'bg-green-100 text-green-800',   icone: 'fa-circle-check' },
    refuse:     { label: 'Refusé',     couleur: 'bg-red-100 text-red-800',       icone: 'fa-circle-xmark' },
    expire:     { label: 'Expiré',     couleur: 'bg-gray-100 text-gray-500',     icone: 'fa-clock' },
    brouillon:  { label: 'En cours',   couleur: 'bg-blue-100 text-blue-700',     icone: 'fa-pen' }
  };

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${mesDevis.map(function(devis) {
        var cfg = statutConfig[devis.statut] || statutConfig.en_attente;
        var estExpire = new Date(devis.dateExpiration) < new Date();
        return `
          <div class="bg-white rounded-xl border border-gray-100 hover:border-terra-light hover:shadow-md transition cursor-pointer devis-row" data-devis-id="${devis.id}">
            <div class="h-1.5 rounded-t-xl ${devis.couleur}"></div>
            <div class="p-5">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full ${devis.couleur} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    ${devis.initiales}
                  </div>
                  <div>
                    <p class="font-semibold text-charcoal text-sm leading-tight">${devis.projet}</p>
                    <p class="text-xs text-muted">${devis.numero}</p>
                  </div>
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.couleur} whitespace-nowrap">
                  <i class="fas ${cfg.icone} text-xs"></i> ${cfg.label}
                </span>
              </div>

              <div class="bg-beige rounded-lg px-4 py-3 mb-4 text-center">
                <p class="text-xs text-muted uppercase tracking-wider mb-0.5">Montant TTC</p>
                <p class="text-2xl font-display font-semibold text-terracotta">${devis.montantTTC.toLocaleString('fr-FR')} €</p>
                <p class="text-xs text-muted">HT : ${devis.montantHT.toLocaleString('fr-FR')} €</p>
              </div>

              <div class="space-y-1.5 text-sm mb-4">
                <div class="flex justify-between">
                  <span class="text-muted">Catégorie :</span>
                  <span class="text-charcoal font-medium truncate ml-2 text-right">${devis.badge}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Créé le :</span>
                  <span class="text-charcoal">${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">Expire le :</span>
                  <span class="${estExpire && devis.statut !== 'valide' ? 'text-red-500 font-medium' : 'text-charcoal'}">
                    ${new Date(devis.dateExpiration).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div class="flex gap-2 pt-3 border-t border-gray-100">
                <button class="voir-devis-btn flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-charcoal hover:bg-beige transition" data-devis-id="${devis.id}">
                  <i class="fa-regular fa-eye"></i> Voir le détail
                </button>
                ${devis.statut === 'en_attente' ? `
                  <button class="accepter-devis-btn flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition" data-devis-id="${devis.id}" title="Accepter">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button class="refuser-devis-btn flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition" data-devis-id="${devis.id}" title="Refuser">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// MODAL DEMANDE DEVIS (vue client)
function afficherModalDemandeDevis() {
  var modalHtml = `
    <div id="modal-demande" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl max-w-lg w-full">
        <div class="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="font-display text-2xl font-semibold text-charcoal">Nouvelle demande de devis</h2>
            <p class="text-muted text-xs mt-0.5">Notre équipe vous répondra sous 48h</p>
          </div>
          <button id="fermer-demande" class="text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Produit souhaité <span class="text-terracotta">*</span></label>
            <input type="text" id="demande-produit" placeholder="Ex : Canapé Velours Taupe, Table basse…"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Quantité <span class="text-terracotta">*</span></label>
            <input type="number" id="demande-quantite" value="1" min="1"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta transition">
          </div>
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Description du projet</label>
            <textarea id="demande-message" rows="4" placeholder="Décrivez votre projet, vos besoins, votre budget approximatif…"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta transition resize-none"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button id="annuler-demande" class="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm hover:bg-beige transition">Annuler</button>
            <button id="envoyer-demande" class="flex-1 px-4 py-2.5 bg-terracotta text-white rounded-lg text-sm hover:bg-terracotta/80 transition font-medium">Envoyer la demande</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  var fermer = function() {
    var modal = document.getElementById('modal-demande');
    if (modal) modal.remove();
  };

  document.getElementById('fermer-demande').addEventListener('click', fermer);
  document.getElementById('annuler-demande').addEventListener('click', fermer);

  document.getElementById('envoyer-demande').addEventListener('click', function() {
    var produit  = document.getElementById('demande-produit').value.trim();
    var quantite = document.getElementById('demande-quantite').value;
    var message  = document.getElementById('demande-message').value.trim();

    if (!produit) {
      afficherNotification('Veuillez indiquer le produit souhaité', 'error');
      return;
    }

    var newId = 'DF-Q' + String(donneesDevis.length + 1).padStart(3, '0');
    var nouveauDevis = {
      id: newId,
      numero: 'DEV-' + new Date().getFullYear() + '-' + String(donneesDevis.length + 1).padStart(3, '0'),
      initiales: utilisateurCourant ? utilisateurCourant.substring(0, 2).toUpperCase() : 'CL',
      couleur: 'bg-[#C4A882]',
      client: 'Moi',
      clientId: utilisateurCourant || 'client_actuel',
      clientEmail: '',
      clientTel: '',
      ville: '',
      projet: produit,
      description: message,
      badge: 'DEMANDE CLIENT',
      badgeCouleur: 'bg-terra-pale text-terracotta',
      dateCreation: new Date().toISOString().split('T')[0],
      dateExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expiration: '',
      depasse: false,
      montantHT: 0,
      montantTTC: 0,
      tva: 20,
      montant: '0',
      statut: 'en_attente',
      assigneA: null,
      historique: [{ date: new Date().toISOString(), action: 'Demande envoyée par le client', utilisateur: 'Client' }],
      commentaires: [],
      piecesJointes: [],
      produits: [{ nom: produit, quantite: parseInt(quantite) || 1, prixUnitaire: 0, total: 0 }]
    };

    donneesDevis.push(nouveauDevis);
    fermer();
    afficherNotification('Votre demande a été envoyée ! Notre équipe vous répondra sous 48h.', 'success');
    mettreAJourAffichage();
  });
}

// FILTRAGE PAR RÔLE
function filtrerDevisParRole() {
  var resultats = donneesDevis;
  
  if (roleUtilisateur === 'client') {
    resultats = resultats.filter(d => d.clientId === utilisateurCourant);
  } else if (roleUtilisateur === 'admin') {
    resultats = resultats.filter(d => d.assigneA === utilisateurCourant || !d.assigneA);
  }
  
  if (rechercheActuelle) {
    resultats = resultats.filter(d => 
      d.client.toLowerCase().includes(rechercheActuelle.toLowerCase()) ||
      d.projet.toLowerCase().includes(rechercheActuelle.toLowerCase()) ||
      d.numero.toLowerCase().includes(rechercheActuelle.toLowerCase())
    );
  }
  
  if (filtreActif !== 'tous') {
    resultats = resultats.filter(d => d.statut === filtreActif);
  }
  
  return resultats;
}

// EN-TÊTE ADMIN AVEC BOUTON NOUVEAU DEVIS
function afficherEnTeteAdmin() {
  var titre = "";
  var description = "";
  
  if (roleUtilisateur === 'admin') {
    titre = "Conception des Devis";
    description = "Concevez les devis en réponse aux demandes envoyées par vos clients.";
  } else {
    titre = "Conception des Devis - Vue SuperAdmin";
    description = "Supervisez et concevez les devis à partir des demandes clients. Assignation, workflow et envoi.";
  }

  // Compter les demandes clients en attente de conception
  var demandesEnAttente = filtrerDevisParRole().filter(function(d) {
    return d.badge === 'DEMANDE CLIENT' && (d.montantHT === 0 || d.statut === 'en_attente');
  }).length;

  return `
    <div class="mb-6 bg-gradient-to-r from-white to-beige/50 rounded-xl p-6 border border-gray-100">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-4xl font-semibold text-charcoal mb-2">${titre}</h1>
          <p class="text-muted text-sm max-w-2xl">${description}</p>
        </div>
        <div class="flex items-center gap-3">
          ${demandesEnAttente > 0 ? `
            <div class="flex items-center gap-2 bg-terra-pale text-terracotta px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
              <i class="fa-solid fa-bell"></i>
              ${demandesEnAttente} demande${demandesEnAttente > 1 ? 's' : ''} à concevoir
            </div>
          ` : ''}
          <button id="bouton-nouveau-devis" class="flex items-center gap-2 bg-charcoal text-white px-5 py-2 rounded-lg hover:bg-terracotta transition text-sm whitespace-nowrap">
            <i class="fa-solid fa-plus"></i> Nouveau Devis
          </button>
        </div>
      </div>
    </div>
  `;
}

function afficherBarreRechercheEtFiltres() {
  return `
    <div class="bg-white border border-gray-100 rounded-xl px-5 py-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="relative flex-1 max-w-md">
        <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted text-sm"></i>
        <input id="champ-recherche-devis" type="text" 
          placeholder="Rechercher par client, projet..." 
          value="${rechercheActuelle}"
          class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-terracotta transition">
      </div>
      <div class="flex gap-2 flex-wrap">
        ${roleUtilisateur !== 'client' ? `
          <select id="filtre-statut" class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta">
            <option value="tous" ${filtreActif === 'tous' ? 'selected' : ''}>Tous les statuts</option>
            <option value="en_attente" ${filtreActif === 'en_attente' ? 'selected' : ''}>En attente</option>
            <option value="valide" ${filtreActif === 'valide' ? 'selected' : ''}>Validés</option>
            <option value="refuse" ${filtreActif === 'refuse' ? 'selected' : ''}>Refusés</option>
            <option value="expire" ${filtreActif === 'expire' ? 'selected' : ''}>Expirés</option>
            <option value="brouillon" ${filtreActif === 'brouillon' ? 'selected' : ''}>Brouillons</option>
          </select>
        ` : ''}
        <button id="bouton-filtrer" class="flex items-center gap-2 bg-charcoal text-white px-4 py-2 rounded-lg hover:bg-terracotta transition text-sm">
          <i class="fa-solid fa-sliders-h"></i> Filtrer
        </button>
      </div>
    </div>
  `;
}

function afficherStatistiques() {
  var devisFiltres = filtrerDevisParRole();
  var stats = {
    total: devisFiltres.length,
    enAttente: devisFiltres.filter(d => d.statut === 'en_attente').length,
    valides: devisFiltres.filter(d => d.statut === 'valide').length,
    montantTotal: devisFiltres.reduce((sum, d) => sum + d.montantTTC, 0)
  };

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted text-sm">Total devis</p>
            <p class="text-2xl font-semibold text-charcoal mt-1">${stats.total}</p>
          </div>
          <i class="fa-solid fa-file-invoice text-3xl text-terracotta/30"></i>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted text-sm">En attente</p>
            <p class="text-2xl font-semibold text-orange-600 mt-1">${stats.enAttente}</p>
          </div>
          <i class="fa-solid fa-hourglass-half text-3xl text-terracotta/30"></i>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted text-sm">Validés</p>
            <p class="text-2xl font-semibold text-green-600 mt-1">${stats.valides}</p>
          </div>
          <i class="fa-solid fa-check-circle text-3xl text-terracotta/30"></i>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-muted text-sm">Montant total</p>
            <p class="text-2xl font-semibold text-charcoal mt-1">${stats.montantTotal.toLocaleString('fr-FR')} €</p>
          </div>
          <i class="fa-solid fa-euro-sign text-3xl text-terracotta/30"></i>
        </div>
      </div>
    </div>
  `;
}

function afficherTableauDevis(devisList) {
  var devisAfficher = devisList.slice(0, devisAffiches);
  
  var colonnes = `
    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Devis</th>
    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Client / Projet</th>
  `;
  
  if (roleUtilisateur === 'superadmin') {
    colonnes += `<th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Assigné à</th>`;
  }
  
  colonnes += `
    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Montant</th>
    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Statut</th>
    <th class="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Expiration</th>
    <th class="text-center px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
  `;
  
  return `
    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>${colonnes}</tr>
          </thead>
          <tbody>
            ${devisAfficher.map(devis => afficherLigneDevis(devis)).join('')}
          </tbody>
        </table>
      </div>
      ${devisAfficher.length === 0 ? '<div class="text-center py-12 text-muted">Aucun devis trouvé</div>' : ''}
    </div>
  `;
}

function afficherLigneDevis(devis) {
  var statutConfig = {
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: 'fa-hourglass-half' },
    valide: { label: 'Validé', color: 'bg-green-100 text-green-800', icon: 'fa-check-circle' },
    refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: 'fa-times-circle' },
    expire: { label: 'Expiré', color: 'bg-gray-100 text-gray-800', icon: 'fa-clock' },
    brouillon: { label: 'Brouillon', color: 'bg-blue-100 text-blue-800', icon: 'fa-pen' }
  };
  
  var config = statutConfig[devis.statut] || statutConfig.en_attente;
  var estExpire = new Date(devis.dateExpiration) < new Date();
  
  var actions = '';
  
  // Bouton voir (tous les rôles)
  actions += `<button class="voir-devis-btn text-terracotta hover:text-terracotta/80 transition" data-devis-id="${devis.id}" title="Voir détails">
    <i class="fa-regular fa-eye"></i>
  </button>`;
  
  // Admin et Superadmin
  if (roleUtilisateur !== 'client') {
    var estDemandeAConcevoir = devis.badge === 'DEMANDE CLIENT' && (devis.montantHT === 0 || devis.statut === 'en_attente');
    if (estDemandeAConcevoir) {
      actions += `<button class="modifier-devis-btn text-terracotta hover:text-terracotta/80 transition font-semibold" data-devis-id="${devis.id}" title="Concevoir le devis en réponse à la demande client">
        <i class="fa-solid fa-pen-ruler"></i>
      </button>`;
    } else {
      actions += `<button class="modifier-devis-btn text-blue-600 hover:text-blue-700 transition" data-devis-id="${devis.id}" title="Modifier">
        <i class="fa-regular fa-pen-to-square"></i>
      </button>`;
      actions += `<button class="dupliquer-devis-btn text-green-600 hover:text-green-700 transition" data-devis-id="${devis.id}" title="Dupliquer">
        <i class="fa-regular fa-copy"></i>
      </button>`;
    }
    if (devis.statut === 'brouillon' || devis.badge === 'DEVIS CONÇU') {
      actions += `<button class="envoyer-devis-btn text-blue-500 hover:text-blue-700 transition" data-devis-id="${devis.id}" title="Envoyer au client">
        <i class="fa-regular fa-paper-plane"></i>
      </button>`;
    }
    if (roleUtilisateur === 'superadmin') {
      actions += `<button class="supprimer-devis-btn text-red-600 hover:text-red-700 transition" data-devis-id="${devis.id}" title="Supprimer">
        <i class="fa-regular fa-trash-can"></i>
      </button>`;
    }
  }
  
  // Client peut accepter/refuser si le devis est en attente
  if (roleUtilisateur === 'client' && devis.statut === 'en_attente' && devis.badge !== 'DEMANDE CLIENT') {
    actions += `<button class="accepter-devis-btn text-green-600 hover:text-green-700 transition" data-devis-id="${devis.id}" title="Accepter">
      <i class="fa-regular fa-check-circle"></i>
    </button>`;
    actions += `<button class="refuser-devis-btn text-red-600 hover:text-red-700 transition" data-devis-id="${devis.id}" title="Refuser">
      <i class="fa-regular fa-times-circle"></i>
    </button>`;
  }
  
  return `
    <tr class="border-b border-gray-50 hover:bg-beige/20 transition cursor-pointer devis-row" data-devis-id="${devis.id}">
      <td class="px-6 py-4">
        <div>
          <p class="font-semibold text-charcoal">${devis.numero}</p>
          <p class="text-xs text-muted">${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</p>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full ${devis.couleur} flex items-center justify-center text-white text-xs font-semibold">
            ${devis.initiales}
          </div>
          <div>
            <p class="font-medium text-charcoal">${devis.client}</p>
            <p class="text-xs text-muted">${devis.projet}</p>
          </div>
        </div>
      </td>
      ${roleUtilisateur === 'superadmin' ? `
        <td class="px-6 py-4">
          <select class="assigner-select text-xs border border-gray-200 rounded px-2 py-1" data-devis-id="${devis.id}">
            <option value="">Non assigné</option>
            <option value="admin_1" ${devis.assigneA === 'admin_1' ? 'selected' : ''}>Admin Principal</option>
            <option value="admin_2" ${devis.assigneA === 'admin_2' ? 'selected' : ''}>Admin Secondaire</option>
            <option value="admin_3" ${devis.assigneA === 'admin_3' ? 'selected' : ''}>Admin Commercial</option>
          </select>
        </td>
      ` : ''}
      <td class="px-6 py-4">
        <p class="font-semibold text-charcoal">${devis.montantTTC.toLocaleString('fr-FR')} €</p>
        <p class="text-xs text-muted">HT: ${devis.montantHT.toLocaleString('fr-FR')} €</p>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}">
          <i class="fas ${config.icon} text-xs"></i>
          ${config.label}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-1">
          <i class="fas ${estExpire && devis.statut !== 'valide' ? 'fa-exclamation-triangle text-red-400' : 'fa-calendar text-muted'} text-xs"></i>
          <span class="${estExpire && devis.statut !== 'valide' ? 'text-red-600 font-medium' : 'text-charcoal'} text-sm">
            ${new Date(devis.dateExpiration).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center justify-center gap-2">
          ${actions}
        </div>
      </td>
    </tr>
  `;
}

function afficherPagination() {
  return `
    <div class="flex justify-center mt-6">
      <button id="bouton-voir-plus" class="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-lg text-charcoal hover:bg-beige transition text-sm">
        Voir plus <i class="fa-solid fa-chevron-down"></i>
      </button>
    </div>
  `;
}

// MODAL DÉTAILS
function afficherModalDevis(devisId) {
  var devis = donneesDevis.find(d => d.id === devisId);
  if (!devis) return;
  
  var modalHtml = `
    <div id="modal-devis" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-display font-semibold text-charcoal">${devis.numero}</h2>
            <p class="text-muted text-sm">${devis.projet}</p>
          </div>
          <button class="fermer-modal-btn text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="p-6">
          <div class="border-b border-gray-200 mb-6">
            <div class="flex gap-4 flex-wrap">
              <button class="tab-btn active px-4 py-2 text-sm font-medium text-terracotta border-b-2 border-terracotta" data-tab="details">Détails</button>
              <button class="tab-btn px-4 py-2 text-sm font-medium text-muted hover:text-charcoal" data-tab="produits">Produits</button>
              <button class="tab-btn px-4 py-2 text-sm font-medium text-muted hover:text-charcoal" data-tab="historique">Historique</button>
              <button class="tab-btn px-4 py-2 text-sm font-medium text-muted hover:text-charcoal" data-tab="commentaires">Commentaires</button>
            </div>
          </div>
          
          <div id="tab-details" class="tab-content">
            ${afficherDetailsDevis(devis)}
          </div>
          <div id="tab-produits" class="tab-content hidden">
            ${afficherProduitsDevis(devis)}
          </div>
          <div id="tab-historique" class="tab-content hidden">
            ${afficherHistoriqueDevis(devis)}
          </div>
          <div id="tab-commentaires" class="tab-content hidden">
            ${afficherCommentairesDevis(devis)}
          </div>
        </div>
        
        <div class="border-t border-gray-100 px-6 py-4 flex justify-between items-center flex-wrap gap-2">
          <div class="flex gap-2">
            <button class="pdf-devis-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm" data-id="${devis.id}">
              <i class="fa-regular fa-file-pdf"></i> PDF
            </button>
            ${roleUtilisateur !== 'client' ? `
              <button class="email-devis-btn px-4 py-2 ${devis.statut === 'brouillon' || devis.badge === 'DEVIS CONÇU' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-default'} text-white rounded-lg transition text-sm flex items-center gap-2" data-id="${devis.id}" ${devis.statut !== 'brouillon' && devis.badge !== 'DEVIS CONÇU' ? 'disabled title="Devis déjà envoyé"' : 'title="Envoyer au client et passer en attente"'}>
                <i class="fa-regular fa-paper-plane"></i>
                ${devis.statut === 'brouillon' || devis.badge === 'DEVIS CONÇU' ? 'Envoyer au client' : 'Devis envoyé'}
              </button>
            ` : ''}
          </div>
          <div class="flex gap-2">
            ${roleUtilisateur !== 'client' ? `
              <button class="modifier-devis-modal-btn px-4 py-2 border border-gray-300 rounded-lg hover:bg-beige transition text-sm" data-id="${devis.id}">
                Modifier
              </button>
            ` : ''}
            ${roleUtilisateur === 'client' && devis.statut === 'en_attente' && devis.badge !== 'DEMANDE CLIENT' ? `
              <button class="accepter-devis-modal-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm" data-id="${devis.id}">
                Accepter le devis
              </button>
              <button class="refuser-devis-modal-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm" data-id="${devis.id}">
                Refuser
              </button>
            ` : ''}
            <button class="fermer-modal-btn px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  attacherEvenementsModal(devis);
}

function afficherDetailsDevis(devis) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="font-semibold text-charcoal mb-3">Informations générales</h3>
        <div class="space-y-2 text-sm">
          <p><span class="text-muted">Client :</span> ${devis.client}</p>
          <p><span class="text-muted">Email :</span> ${devis.clientEmail}</p>
          <p><span class="text-muted">Téléphone :</span> ${devis.clientTel}</p>
          <p><span class="text-muted">Ville :</span> ${devis.ville}</p>
          <p><span class="text-muted">Date création :</span> ${new Date(devis.dateCreation).toLocaleDateString('fr-FR')}</p>
          <p><span class="text-muted">Date expiration :</span> ${new Date(devis.dateExpiration).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
      <div>
        <h3 class="font-semibold text-charcoal mb-3">Informations financières</h3>
        <div class="space-y-2 text-sm">
          <p><span class="text-muted">Montant HT :</span> ${devis.montantHT.toLocaleString('fr-FR')} €</p>
          <p><span class="text-muted">TVA (${devis.tva}%) :</span> ${(devis.montantTTC - devis.montantHT).toLocaleString('fr-FR')} €</p>
          <p><span class="text-muted">Montant TTC :</span> <strong class="text-terracotta">${devis.montantTTC.toLocaleString('fr-FR')} €</strong></p>
          <p><span class="text-muted">Statut :</span> ${devis.statut}</p>
          ${roleUtilisateur === 'superadmin' ? `<p><span class="text-muted">Assigné à :</span> ${devis.assigneA || 'Non assigné'}</p>` : ''}
        </div>
      </div>
      <div class="md:col-span-2">
        <h3 class="font-semibold text-charcoal mb-2">Description du projet</h3>
        <p class="text-sm text-muted">${devis.description}</p>
      </div>
    </div>
  `;
}

function afficherProduitsDevis(devis) {
  if (!devis.produits || devis.produits.length === 0) {
    return '<p class="text-muted text-center py-4">Aucun produit dans ce devis</p>';
  }
  
  return `
    <table class="w-full">
      <thead>
        <tr class="border-b border-gray-200">
          <th class="text-left py-2 text-sm font-semibold text-muted">Produit</th>
          <th class="text-center py-2 text-sm font-semibold text-muted">Quantité</th>
          <th class="text-right py-2 text-sm font-semibold text-muted">Prix unitaire</th>
          <th class="text-right py-2 text-sm font-semibold text-muted">Total</th>
        </tr>
      </thead>
      <tbody>
        ${devis.produits.map(produit => `
          <tr class="border-b border-gray-50">
            <td class="py-2 text-sm">${produit.nom}</td>
            <td class="py-2 text-sm text-center">${produit.quantite}</td>
            <td class="py-2 text-sm text-right">${produit.prixUnitaire.toLocaleString('fr-FR')} €</td>
            <td class="py-2 text-sm text-right font-semibold">${produit.total.toLocaleString('fr-FR')} €</td>
          </tr>
        `).join('')}
        <tr class="border-t border-gray-200">
          <td colspan="3" class="py-2 text-right font-semibold">Total HT :</td>
          <td class="py-2 text-right font-semibold">${devis.montantHT.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr>
          <td colspan="3" class="py-2 text-right font-semibold">TVA (${devis.tva}%) :</td>
          <td class="py-2 text-right">${(devis.montantTTC - devis.montantHT).toLocaleString('fr-FR')} €</td>
        </tr>
        <tr class="bg-beige/30">
          <td colspan="3" class="py-2 text-right font-bold text-terracotta">Total TTC :</td>
          <td class="py-2 text-right font-bold text-terracotta">${devis.montantTTC.toLocaleString('fr-FR')} €</td>
        </tr>
      </tbody>
    </table>
  `;
}

function afficherHistoriqueDevis(devis) {
  if (!devis.historique || devis.historique.length === 0) {
    return '<p class="text-muted text-center py-4">Aucun historique disponible</p>';
  }
  
  return `
    <div class="space-y-3">
      ${devis.historique.map(entry => `
        <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <i class="fa-regular fa-clock text-terracotta mt-0.5"></i>
          <div>
            <p class="text-sm font-medium text-charcoal">${entry.action}</p>
            <p class="text-xs text-muted">${new Date(entry.date).toLocaleString('fr-FR')} par ${entry.utilisateur}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function afficherCommentairesDevis(devis) {
  return `
    <div id="commentaires-container" class="space-y-3 mb-4 max-h-96 overflow-y-auto">
      ${devis.commentaires && devis.commentaires.length > 0 ? devis.commentaires.map(comment => `
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="flex justify-between mb-1">
            <span class="text-xs font-semibold text-charcoal">${comment.auteur}</span>
            <span class="text-xs text-muted">${new Date(comment.date).toLocaleString('fr-FR')}</span>
          </div>
          <p class="text-sm">${comment.texte}</p>
        </div>
      `).join('') : '<p class="text-muted text-center py-4">Aucun commentaire</p>'}
    </div>
    <div class="mt-4">
      <textarea id="nouveau-commentaire" rows="3" class="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-terracotta" placeholder="Ajouter un commentaire..."></textarea>
      <button id="ajouter-commentaire-modal" class="mt-2 px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-terracotta transition text-sm">
        Ajouter un commentaire
      </button>
    </div>
  `;
}

// MODAL CRÉATION/ÉDITION
function afficherModalEditionDevis(devis = null) {
  var isEditing = !!devis;
  devisEnEdition = devis;
  
  var clientValue = devis?.client || '';
  var emailValue = devis?.clientEmail || '';
  var telValue = devis?.clientTel || '';
  var projetValue = devis?.projet || '';
  var descriptionValue = devis?.description || '';
  var expirationValue = devis?.dateExpiration || '';
  var tvaValue = devis?.tva || 20;
  
  var produitsHtml = '';
  if (devis?.produits && devis.produits.length > 0) {
    produitsHtml = devis.produits.map((p, i) => `
      <div class="produit-item flex gap-2 mb-2">
        <input type="text" name="produit_nom" placeholder="Produit" value="${p.nom.replace(/"/g, '&quot;')}" class="flex-1 border border-gray-200 rounded p-1 text-sm">
        <input type="number" name="produit_quantite" placeholder="Qté" value="${p.quantite}" class="w-20 border border-gray-200 rounded p-1 text-sm">
        <input type="number" name="produit_prix" placeholder="Prix" value="${p.prixUnitaire}" step="0.01" class="w-24 border border-gray-200 rounded p-1 text-sm">
        <button type="button" class="supprimer-produit text-red-500 hover:text-red-700">×</button>
      </div>
    `).join('');
  }
  
  var titre = isEditing 
    ? (devis.badge === 'DEMANDE CLIENT' && devis.montantHT === 0 ? 'Concevoir le devis (demande client)' : 'Modifier le devis') 
    : 'Nouveau devis';
  
  var modalHtml = `
    <div id="modal-edition" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 class="text-2xl font-display font-semibold text-charcoal">${titre}</h2>
          <button type="button" class="fermer-edition-btn text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <form id="form-devis" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Client *</label>
            <input type="text" id="edition-client" required value="${clientValue}" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Email client *</label>
            <input type="email" id="edition-email" required value="${emailValue}" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Téléphone</label>
            <input type="tel" id="edition-tel" value="${telValue}" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Projet *</label>
            <input type="text" id="edition-projet" required value="${projetValue}" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Description</label>
            <textarea id="edition-description" rows="3" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">${descriptionValue}</textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-charcoal mb-1">Date expiration *</label>
              <input type="date" id="edition-expiration" required value="${expirationValue}" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
            </div>
            <div>
              <label class="block text-sm font-medium text-charcoal mb-1">TVA (%)</label>
              <input type="number" id="edition-tva" value="${tvaValue}" step="0.1" class="w-full border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-terracotta">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-charcoal mb-1">Produits</label>
            <div id="produits-container" class="space-y-2">
              ${produitsHtml}
            </div>
            <button type="button" id="ajouter-produit" class="mt-2 text-sm text-terracotta hover:text-terracotta/80">
              + Ajouter un produit
            </button>
          </div>
          
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" class="fermer-edition-btn px-4 py-2 border border-gray-300 rounded-lg hover:bg-beige transition">
              Annuler
            </button>
            <button type="submit" class="px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-terracotta transition">
              ${isEditing ? (devis.badge === 'DEMANDE CLIENT' && devis.montantHT === 0 ? 'Enregistrer le devis conçu' : 'Mettre à jour') : 'Créer le devis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  attacherEvenementsEdition();
}

// FONCTIONS MÉTIER
function creerDevis(donnees) {
  var newId = `DF-Q${String(donneesDevis.length + 1).padStart(3, '0')}`;
  var newNumero = `DEV-2024-${String(donneesDevis.length + 1).padStart(3, '0')}`;
  
  var nouveauDevis = {
    id: newId,
    numero: newNumero,
    initiales: donnees.client.substring(0, 2).toUpperCase(),
    couleur: "bg-terracotta",
    client: donnees.client,
    clientId: `client_${Date.now()}`,
    clientEmail: donnees.email,
    clientTel: donnees.tel || "",
    ville: "Non spécifié",
    projet: donnees.projet,
    description: donnees.description || "",
    badge: "DEVIS CONÇU",
    badgeCouleur: "bg-terra-pale text-terracotta",
    dateCreation: new Date().toISOString().split('T')[0],
    dateExpiration: donnees.expiration,
    expiration: new Date(donnees.expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    depasse: false,
    montantHT: donnees.montantHT || 0,
    montantTTC: donnees.montantTTC || 0,
    tva: donnees.tva,
    montant: (donnees.montantTTC || 0).toLocaleString('fr-FR'),
    statut: "brouillon",
    assigneA: roleUtilisateur === 'admin' ? utilisateurCourant : null,
    historique: [{ date: new Date().toISOString(), action: "Création du devis", utilisateur: roleUtilisateur || "Admin" }],
    commentaires: [],
    piecesJointes: [],
    produits: donnees.produits || []
  };
  
  donneesDevis.push(nouveauDevis);
  afficherNotification("Devis créé avec succès", "success");
  mettreAJourAffichage();
}

function modifierDevis(devisId, nouvellesDonnees) {
  var index = donneesDevis.findIndex(d => d.id === devisId);
  if (index !== -1) {
    var ancienDevis = donneesDevis[index];
    var estConception = roleUtilisateur !== 'client'
      && ancienDevis.badge === 'DEMANDE CLIENT'
      && ancienDevis.montantHT === 0;
    var actionHistorique = estConception
      ? "Devis conçu en réponse à la demande client"
      : "Modification du devis";
    var nouveauStatut = estConception ? 'brouillon' : ancienDevis.statut;
    var nouveauBadge = estConception ? 'DEVIS CONÇU' : ancienDevis.badge;

    var devisModifie = {
      ...ancienDevis,
      client: nouvellesDonnees.client || ancienDevis.client,
      clientEmail: nouvellesDonnees.email || ancienDevis.clientEmail,
      clientTel: nouvellesDonnees.tel || ancienDevis.clientTel,
      projet: nouvellesDonnees.projet || ancienDevis.projet,
      description: nouvellesDonnees.description || ancienDevis.description,
      dateExpiration: nouvellesDonnees.expiration || ancienDevis.dateExpiration,
      expiration: nouvellesDonnees.expiration ? new Date(nouvellesDonnees.expiration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ancienDevis.expiration,
      tva: nouvellesDonnees.tva || ancienDevis.tva,
      montantHT: nouvellesDonnees.montantHT !== undefined ? nouvellesDonnees.montantHT : ancienDevis.montantHT,
      montantTTC: nouvellesDonnees.montantTTC !== undefined ? nouvellesDonnees.montantTTC : ancienDevis.montantTTC,
      montant: nouvellesDonnees.montantTTC ? nouvellesDonnees.montantTTC.toLocaleString('fr-FR') : ancienDevis.montant,
      produits: nouvellesDonnees.produits || ancienDevis.produits,
      initiales: nouvellesDonnees.client ? nouvellesDonnees.client.substring(0, 2).toUpperCase() : ancienDevis.initiales,
      statut: nouveauStatut,
      badge: nouveauBadge,
      assigneA: ancienDevis.assigneA || (roleUtilisateur === 'admin' ? utilisateurCourant : ancienDevis.assigneA),
      historique: [...ancienDevis.historique, { date: new Date().toISOString(), action: actionHistorique, utilisateur: roleUtilisateur || "Admin" }]
    };

    donneesDevis[index] = devisModifie;
    afficherNotification(estConception ? "Devis conçu ! Il est prêt à être envoyé au client." : "Devis modifié avec succès", "success");
    mettreAJourAffichage();
  }
}

function supprimerDevis(devisId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
    donneesDevis = donneesDevis.filter(d => d.id !== devisId);
    afficherNotification("Devis supprimé", "success");
    mettreAJourAffichage();
  }
}

function dupliquerDevis(devisId) {
  var original = donneesDevis.find(d => d.id === devisId);
  if (original) {
    var copie = JSON.parse(JSON.stringify(original));
    copie.id = `DF-Q${String(donneesDevis.length + 1).padStart(3, '0')}`;
    copie.numero = `DEV-2024-${String(donneesDevis.length + 1).padStart(3, '0')}`;
    copie.statut = "brouillon";
    copie.badge = "DEVIS CONÇU";
    copie.dateCreation = new Date().toISOString().split('T')[0];
    copie.historique = [{ date: new Date().toISOString(), action: "Duplication du devis", utilisateur: roleUtilisateur || "Admin" }];
    donneesDevis.push(copie);
    afficherNotification("Devis dupliqué avec succès", "success");
    mettreAJourAffichage();
  }
}

function accepterDevis(devisId) {
  var devis = donneesDevis.find(d => d.id === devisId);
  if (devis) {
    devis.statut = "valide";
    devis.historique.push({
      date: new Date().toISOString(),
      action: "Validation par le client",
      utilisateur: "Client"
    });
    afficherNotification("Devis accepté avec succès ! Un commercial vous contactera.", "success");
    mettreAJourAffichage();
  }
}

function refuserDevis(devisId) {
  var devis = donneesDevis.find(d => d.id === devisId);
  if (devis) {
    devis.statut = "refuse";
    devis.historique.push({
      date: new Date().toISOString(),
      action: "Refus par le client",
      utilisateur: "Client"
    });
    afficherNotification("Devis refusé", "info");
    mettreAJourAffichage();
  }
}

function ajouterCommentaire(devisId, texte) {
  var devis = donneesDevis.find(d => d.id === devisId);
  if (devis && texte.trim()) {
    devis.commentaires.push({
      date: new Date().toISOString(),
      auteur: roleUtilisateur === 'client' ? 'Client' : 'Administrateur',
      texte: texte
    });
    afficherNotification("Commentaire ajouté", "success");
    mettreAJourAffichage();
  }
}

function genererPDF(devisId) {
  afficherNotification("Génération du PDF en cours...", "info");
  setTimeout(() => {
    afficherNotification("PDF généré avec succès", "success");
  }, 1500);
}

function envoyerDevisEmail(devisId) {
  var devis = donneesDevis.find(function(d) { return d.id === devisId; });
  if (!devis) return;

  var destinataire = devis.clientEmail || 'le client';
  devis.statut = 'en_attente';
  devis.historique.push({
    date: new Date().toISOString(),
    action: 'Devis envoyé au client par email',
    utilisateur: roleUtilisateur || 'Admin'
  });

  afficherNotification('Devis envoyé à ' + destinataire + ' — statut mis à jour : En attente', 'success');
  var modal = document.getElementById('modal-devis');
  if (modal) modal.remove();
  mettreAJourAffichage();
}

function afficherNotification(message, type) {
  var notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 animate-slide-up ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function mettreAJourAffichage() {
  var conteneur = document.getElementById("contenu-devis");
  if (!conteneur) return;
  conteneur.innerHTML = roleUtilisateur === 'client' ? afficherVueClient() : afficherVueAdmin();
  attacherTousLesEcouteurs();
}

// ÉCOUTEURS D'ÉVÉNEMENTS
function attacherTousLesEcouteurs() {
  // Navigation
  document.getElementById("nav-dashboard")?.addEventListener("click", (e) => {
    e.preventDefault();
    afficherPageDashboard("Admin");
  });
  document.getElementById("nav-produits")?.addEventListener("click", (e) => {
    e.preventDefault();
    afficherPageProduits("Admin");
  });
  document.getElementById("nav-categories")?.addEventListener("click", (e) => {
    e.preventDefault();
    afficherPageCategories("Admin");
  });
  document.getElementById("nav-orders")?.addEventListener("click", (e) => {
    e.preventDefault();
    afficherPageCommandes("Admin");
  });
  document.getElementById("nav-quotes")?.addEventListener("click", (e) => { e.preventDefault(); });
  
  // Boutons principaux
  document.getElementById("bouton-nouveau-devis")?.addEventListener("click", () => afficherModalEditionDevis());
  document.getElementById("bouton-demande-devis")?.addEventListener("click", () => afficherModalDemandeDevis());
  document.getElementById("bouton-filtrer")?.addEventListener("click", () => {
    var filtreStatut = document.getElementById("filtre-statut");
    if (filtreStatut) {
      filtreActif = filtreStatut.value;
    }
    mettreAJourAffichage();
  });
  document.getElementById("bouton-voir-plus")?.addEventListener("click", () => {
    devisAffiches += 5;
    mettreAJourAffichage();
  });
  
  // Recherche
  document.getElementById("champ-recherche-devis")?.addEventListener("input", (e) => {
    rechercheActuelle = e.target.value;
    mettreAJourAffichage();
  });
  
  // Actions sur les devis
  document.querySelectorAll(".voir-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      afficherModalDevis(btn.dataset.devisId);
    });
  });
  
  document.querySelectorAll(".modifier-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      var devis = donneesDevis.find(d => d.id === btn.dataset.devisId);
      afficherModalEditionDevis(devis);
    });
  });
  
  document.querySelectorAll(".dupliquer-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dupliquerDevis(btn.dataset.devisId);
    });
  });
  
  document.querySelectorAll(".supprimer-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      supprimerDevis(btn.dataset.devisId);
    });
  });

  document.querySelectorAll(".envoyer-devis-btn").forEach(function(btn) {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      envoyerDevisEmail(btn.dataset.devisId);
    });
  });
  
  document.querySelectorAll(".accepter-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      accepterDevis(btn.dataset.devisId);
    });
  });
  
  document.querySelectorAll(".refuser-devis-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      refuserDevis(btn.dataset.devisId);
    });
  });
  
  document.querySelectorAll(".assigner-select").forEach(select => {
    select.addEventListener("change", (e) => {
      e.stopPropagation();
      var devis = donneesDevis.find(d => d.id === select.dataset.devisId);
      if (devis) {
        devis.assigneA = select.value;
        afficherNotification("Devis réassigné", "success");
      }
    });
  });
  
  // Lignes cliquables
  document.querySelectorAll(".devis-row").forEach(row => {
    row.addEventListener("click", (e) => {
      if (!e.target.closest("button") && !e.target.closest("select")) {
        afficherModalDevis(row.dataset.devisId);
      }
    });
  });
}

function attacherEvenementsModal(devis) {
  var fermerModal = () => document.getElementById("modal-devis")?.remove();
  
  document.querySelectorAll(".fermer-modal-btn").forEach(btn => btn.addEventListener("click", fermerModal));
  document.querySelectorAll(".pdf-devis-btn").forEach(btn => btn.addEventListener("click", () => genererPDF(devis.id)));
  document.querySelectorAll(".email-devis-btn").forEach(btn => btn.addEventListener("click", () => envoyerDevisEmail(devis.id)));
  document.querySelectorAll(".modifier-devis-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      fermerModal();
      afficherModalEditionDevis(devis);
    });
  });
  document.querySelectorAll(".accepter-devis-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      accepterDevis(devis.id);
      fermerModal();
    });
  });
  document.querySelectorAll(".refuser-devis-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      refuserDevis(devis.id);
      fermerModal();
    });
  });
  document.getElementById("ajouter-commentaire-modal")?.addEventListener("click", () => {
    var texte = document.getElementById("nouveau-commentaire")?.value;
    if (texte) {
      ajouterCommentaire(devis.id, texte);
      fermerModal();
      setTimeout(() => afficherModalDevis(devis.id), 100);
    }
  });
  
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("active", "text-terracotta", "border-terracotta");
        b.classList.add("text-muted");
      });
      btn.classList.add("active", "text-terracotta", "border-terracotta");
      btn.classList.remove("text-muted");
      
      var tabName = btn.dataset.tab;
      document.querySelectorAll(".tab-content").forEach(content => content.classList.add("hidden"));
      document.getElementById(`tab-${tabName}`)?.classList.remove("hidden");
    });
  });
}

function attacherEvenementsEdition() {
  var fermerEdition = () => document.getElementById("modal-edition")?.remove();
  
  document.querySelectorAll(".fermer-edition-btn").forEach(btn => btn.addEventListener("click", fermerEdition));
  
  document.getElementById("ajouter-produit")?.addEventListener("click", () => {
    var container = document.getElementById("produits-container");
    var div = document.createElement("div");
    div.className = "produit-item flex gap-2 mb-2";
    div.innerHTML = `
      <input type="text" placeholder="Produit" class="flex-1 border border-gray-200 rounded p-1 text-sm">
      <input type="number" placeholder="Qté" value="1" class="w-20 border border-gray-200 rounded p-1 text-sm">
      <input type="number" placeholder="Prix" value="0" step="0.01" class="w-24 border border-gray-200 rounded p-1 text-sm">
      <button type="button" class="supprimer-produit text-red-500 hover:text-red-700">×</button>
    `;
    container.appendChild(div);
    
    div.querySelector(".supprimer-produit")?.addEventListener("click", function() {
      div.remove();
    });
  });
  
  document.querySelectorAll(".supprimer-produit").forEach(btn => {
    btn.addEventListener("click", function() {
      btn.closest(".produit-item")?.remove();
    });
  });
  
  document.getElementById("form-devis")?.addEventListener("submit", (e) => {
    e.preventDefault();
    
    var produits = [];
    document.querySelectorAll("#produits-container .produit-item").forEach(row => {
      var inputs = row.querySelectorAll("input");
      var nom = inputs[0]?.value;
      var quantite = parseInt(inputs[1]?.value) || 1;
      var prixUnitaire = parseFloat(inputs[2]?.value) || 0;
      
      if (nom && nom.trim() !== "") {
        produits.push({
          nom: nom,
          quantite: quantite,
          prixUnitaire: prixUnitaire,
          total: quantite * prixUnitaire
        });
      }
    });
    
    var montantHT = produits.reduce((sum, p) => sum + p.total, 0);
    var tva = parseFloat(document.getElementById("edition-tva")?.value) || 20;
    var montantTTC = montantHT * (1 + tva / 100);
    
    var client = document.getElementById("edition-client")?.value;
    var email = document.getElementById("edition-email")?.value;
    var projet = document.getElementById("edition-projet")?.value;
    var expiration = document.getElementById("edition-expiration")?.value;
    
    if (!client || !email || !projet || !expiration) {
      afficherNotification("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    
    var donnees = {
      client: client,
      email: email,
      tel: document.getElementById("edition-tel")?.value || "",
      projet: projet,
      description: document.getElementById("edition-description")?.value || "",
      expiration: expiration,
      tva: tva,
      montantHT: montantHT,
      montantTTC: montantTTC,
      produits: produits
    };
    
    if (devisEnEdition) {
      modifierDevis(devisEnEdition.id, donnees);
    } else {
      creerDevis(donnees);
    }
    
    fermerEdition();
    devisEnEdition = null;
  });
}

// Configuration Tailwind
tailwind.config = {
  theme: {
    extend: {
      colors: {
        beige: "#F5F0EA",
        terracotta: "#C97B5A",
        "terra-light": "#E8A882",
        "terra-pale": "#F2DDD0",
        charcoal: "#2C2A27",
        muted: "#9B9589",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
};