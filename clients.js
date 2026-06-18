import { afficherPageDashboard }  from './dashboard.js';
import { afficherPageCategories } from './categories.js';
import { afficherPageProfil }     from './profil.js';
import { afficherPageDevis }      from './devis.js';
import { afficherPageProduits }   from './produits.js';
import { afficherPageCommandes }  from './commandes.js';
import { attacherNavigationNavbar } from './navigation.js';

// ─── Configuration & Variables Globales ───────────────────────────────────────
const API_URL_UTILISATEURS = 'http://localhost:3001/utilisateurs';

var donneesClients = []; // Tableau dynamique connecté à db.json
var filtreStatutActif   = 'tous';
var filtreRechercheClients = '';
var pageActuelle        = 1;
var clientsParPage      = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

var couleursStatutClient = {
  'actif':    { fond: 'bg-[#E8F8EE]', texte: 'text-green-600' },
  'inactif':  { fond: 'bg-gray-100',  texte: 'text-gray-500'  },
  'prospect': { fond: 'bg-[#FFF3E8]', texte: 'text-[#C97B5A]' },
};

var libellesStatutClient = {
  'actif':    'Actif',
  'inactif':  'Inactif',
  'prospect': 'Prospect',
};

function badgeStatutClient(statut) {
  var c = couleursStatutClient[statut] || { fond: 'bg-gray-100', texte: 'text-gray-500' };
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${c.fond} ${c.texte}">${libellesStatutClient[statut] || statut}</span>`;
}

function formaterMontantClient(valeur) {
  return (valeur || 0).toLocaleString('fr-FR') + ' FCFA';
}

function filtrerClients() {
  return donneesClients.filter(function(cl) {
    var correspondStatut =
      filtreStatutActif === 'tous' || cl.statut === filtreStatutActif;

    var correspondRecherche =
      filtreRechercheClients === '' ||
      (cl.nom && cl.nom.toLowerCase().includes(filtreRechercheClients.toLowerCase())) ||
      (cl.email && cl.email.toLowerCase().includes(filtreRechercheClients.toLowerCase())) ||
      (cl.ville && cl.ville.toLowerCase().includes(filtreRechercheClients.toLowerCase()));

    return correspondStatut && correspondRecherche;
  });
}

// ─── Récupération de l'API db.json ───────────────────────────────────────────

async function chargerClientsDepuisAPI() {
  try {
    var reponse = await fetch(API_URL_UTILISATEURS);
    if (!reponse.ok) throw new Error('Impossible de récupérer les clients.');
    
    var tousLesUtilisateurs = await reponse.json();
    
    // On isole les utilisateurs qui possèdent le rôle 'client' ou n'ont pas de rôle défini
    donneesClients = tousLesUtilisateurs.filter(function(user) {
      return !user.role || user.role === 'client'; 
    });

    // Nettoyage et complétion des propriétés par défaut
    donneesClients.forEach(function(cl) {
      if (!cl.nom) cl.nom = "Client Anonyme";
      if (!cl.initiales) {
        var morceaux = cl.nom.split(' ');
        cl.initiales = morceaux.length > 1 ? morceaux[0][0] + morceaux[1][0] : morceaux[0][0];
      }
      if (!cl.couleurAvatar) cl.couleurAvatar = 'bg-[#C4A882]';
      if (!cl.statut)        cl.statut = 'actif';
      if (!cl.totalDepense)  cl.totalDepense = 0;
      if (!cl.projets)       cl.projets = 0;
      if (!cl.email)         cl.email = "Non renseigné";
      if (!cl.telephone)     cl.telephone = "Non renseigné";
      if (!cl.ville)         cl.ville = "Dakar";
    });

  } catch (erreur) {
    console.error("Erreur de liaison API db.json :", erreur);
    donneesClients = []; 
  }
}

// ─── Affichage principal ──────────────────────────────────────────────────────

export async function afficherPageClients(prenomUtilisateur) {
  history.pushState({ page: 'clients', nom: prenomUtilisateur }, '', '#clients');

  var conteneurApp = document.getElementById('app');
  var prenom = prenomUtilisateur || 'Utilisateur';

  filtreStatutActif      = 'tous';
  filtreRechercheClients = '';
  pageActuelle           = 1;

  // Chargement asynchrone des données réelles depuis le db.json
  await chargerClientsDepuisAPI();

  conteneurApp.className = 'w-full';

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  // Calculs en temps réel pour la section KPI
  var totalClientsEnregistres = donneesClients.length;
  var totalClientsActifs = donneesClients.filter(c => c.statut === 'actif').length;
  var sommeChiffreAffaires = donneesClients.reduce((acc, c) => acc + (c.totalDepense || 0), 0).toLocaleString('fr-FR');

  conteneurApp.innerHTML = `
    <div id="page-clients" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <!-- ── Navbar ── -->
      <header id="navbar" class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">

        <div id="navbar-logo" class="flex items-center gap-2 mr-10">
          <img src="LOGOD.png" alt="DecoFlow" class="h-8" />
          <span class="font-display text-2xl font-semibold text-charcoal tracking-wide">DecoFlow</span>
        </div>

        <nav id="navbar-nav" class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard"  href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Dashboard</a>
          <a id="nav-produits"   href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
          <a id="nav-categories" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Catégories</a>
          <a id="nav-orders"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
          <a id="nav-quotes"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Devis</a>
          <a id="nav-customers"  href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-charcoal border-b-2 border-terracotta">Clients</a>
        </nav>

        <div id="navbar-droite" class="flex items-center gap-4">
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-charcoal hidden sm:block">${prenom}</span>
            <div class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center overflow-hidden">
              <i class="fa-solid fa-user text-terracotta text-sm"></i>
            </div>
          </div>
        </div>

      </header>

      <!-- ── Contenu ── -->
      <main id="contenu-clients" class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <!-- En-tête section -->
        <div class="mb-6 border border-dashed border-gray-200 rounded-xl p-6 bg-white">
          <h1 class="font-display text-4xl font-semibold text-charcoal mb-1">Gestion des Clients</h1>
          <p class="text-sm text-muted">Répertoire & suivi clientèle en temps réel</p>
        </div>

        <!-- KPI Dynamiques -->
        <div id="section-kpi-clients" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          <div class="bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-muted uppercase tracking-wider">Total Clients</span>
            </div>
            <i class="fa-regular fa-user text-muted text-sm mb-2 block"></i>
            <p class="text-3xl font-semibold text-charcoal font-display">${totalClientsEnregistres}</p>
            <p class="text-xs text-muted mt-1">Enregistrés dans la base</p>
          </div>

          <div class="bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-muted uppercase tracking-wider">Clients Actifs</span>
            </div>
            <i class="fa-regular fa-circle-check text-muted text-sm mb-2 block"></i>
            <p class="text-3xl font-semibold text-charcoal font-display">${totalClientsActifs}</p>
            <p class="text-xs text-muted mt-1">Comptes actifs configurés</p>
          </div>

          <div class="bg-white rounded-xl p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-muted uppercase tracking-wider">Valeur Cumulée</span>
            </div>
            <i class="fa-regular fa-credit-card text-muted text-sm mb-2 block"></i>
            <p class="text-3xl font-semibold text-charcoal font-display">${sommeChiffreAffaires}</p>
            <p class="text-xs text-muted mt-1">FCFA cumulés en compte</p>
          </div>

        </div>

        <!-- Barre de recherche + filtres -->
        <div class="bg-white border border-gray-100 rounded-xl px-5 py-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div class="relative flex-1 max-w-xs">
            <span class="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none">
              <i class="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input id="champ-recherche-clients" type="text" placeholder="Rechercher un client, ville…"
              class="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-xs text-charcoal placeholder-gray-400 bg-beige/40 focus:outline-none focus:border-terracotta transition" />
          </div>

          <div id="filtres-statut-clients" class="flex items-center gap-1 flex-wrap">
            <button data-statut="tous"     type="button" class="btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition">Tous</button>
            <button data-statut="actif"    type="button" class="btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition">Actifs</button>
            <button data-statut="inactif"  type="button" class="btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition">Inactifs</button>
            <button data-statut="prospect" type="button" class="btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition">Prospects</button>
          </div>

        </div>

        <!-- Tableau des clients -->
        <div class="bg-white border border-dashed border-gray-200 rounded-xl overflow-hidden mb-4">

          <!-- En-tête tableau -->
          <div class="grid grid-cols-[1.5fr_1.8fr_1fr_1fr_1.2fr_1fr_auto] gap-4 px-6 py-3 border-b border-gray-100 text-[10px] font-semibold text-muted uppercase tracking-wider">
            <span>Client</span>
            <span>Email</span>
            <span>Téléphone</span>
            <span>Ville</span>
            <span>Total dépensé</span>
            <span>Statut</span>
            <span>Actions</span>
          </div>

          <!-- Lignes dynamiques -->
          <div id="corps-tableau-clients"></div>

          <!-- Pied tableau -->
          <div id="pied-tableau-clients" class="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <p id="compteur-clients" class="text-xs text-muted"></p>
            <div id="pagination-clients" class="flex items-center gap-1"></div>
          </div>

        </div>

      </main>

      <!-- Footer -->
      <footer id="footer" class="bg-white border-t border-gray-100 mt-auto">
        <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="font-display text-lg font-semibold text-charcoal">DecoFlow</span>
            <span class="text-xs text-muted">© 2024 DecoFlow. L'excellence de design sénégalaise.</span>
          </div>
        </div>
      </footer>

    </div>
  `;

  rendreTableauClients();
  attacherEcouteursClients(prenom);
  attacherNavigationNavbar(prenom);
}

// ─── Rendu tableau ────────────────────────────────────────────────────────────

function rendreTableauClients() {
  var corps      = document.getElementById('corps-tableau-clients');
  var compteur   = document.getElementById('compteur-clients');
  var pagination = document.getElementById('pagination-clients');

  if (!corps) return;

  var clientsFiltres = filtrerClients();
  var total          = clientsFiltres.length;
  var debut          = (pageActuelle - 1) * clientsParPage;
  var fin            = Math.min(debut + clientsParPage, total);
  var clientsPage    = clientsFiltres.slice(debut, fin);
  var totalPages     = Math.max(1, Math.ceil(total / clientsParPage));

  corps.innerHTML = '';

  if (clientsPage.length === 0) {
    var ligneVide = document.createElement('div');
    ligneVide.className = 'px-6 py-12 text-center text-sm text-muted';
    ligneVide.textContent = 'Aucun client trouvé.';
    corps.appendChild(ligneVide);
  } else {
    clientsPage.forEach(function(cl) {
      var ligne = document.createElement('div');
      ligne.className = 'grid grid-cols-[1.5fr_1.8fr_1fr_1fr_1.2fr_1fr_auto] gap-4 px-6 py-4 border-b border-gray-50 hover:bg-beige/30 transition items-center';
      ligne.setAttribute('data-id', cl.id);

      ligne.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full ${cl.couleurAvatar} flex items-center justify-center flex-shrink-0">
            <span class="text-[10px] font-bold text-white">${cl.initiales}</span>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-charcoal truncate">${cl.nom}</p>
            <p class="text-[10px] text-muted">${cl.projets} projet${cl.projets > 1 ? 's' : ''}</p>
          </div>
        </div>

        <span class="text-xs text-muted truncate">${cl.email}</span>
        <span class="text-xs text-muted">${cl.telephone}</span>
        <span class="text-xs text-muted">${cl.ville}</span>
        <span class="text-xs font-semibold text-charcoal">${formaterMontantClient(cl.totalDepense)}</span>

        <div>${badgeStatutClient(cl.statut)}</div>

        <div class="flex items-center">
          <button class="btn-actions-client text-muted hover:text-charcoal transition p-1" data-id="${cl.id}" type="button" title="Actions">
            <i class="fa-solid fa-ellipsis-vertical text-sm"></i>
          </button>
        </div>
      `;

      corps.appendChild(ligne);
    });
  }

  // Compteur
  if (compteur) {
    compteur.textContent = total === 0
      ? 'Aucun résultat'
      : `Affichage de ${debut + 1}–${fin} sur ${total} clients`;
  }

  // Pagination
  if (pagination) {
    pagination.innerHTML = '';

    var boutonPrev = document.createElement('button');
    boutonPrev.type = 'button';
    boutonPrev.className = 'w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-muted hover:text-charcoal hover:border-charcoal transition text-xs disabled:opacity-40';
    boutonPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    boutonPrev.disabled = pageActuelle <= 1;
    boutonPrev.addEventListener('click', function() {
      if (pageActuelle > 1) { pageActuelle--; rendreTableauClients(); }
    });
    pagination.appendChild(boutonPrev);

    for (var p = 1; p <= totalPages; p++) {
      var boutonPage = document.createElement('button');
      boutonPage.type = 'button';
      boutonPage.textContent = p;
      boutonPage.className = p === pageActuelle
        ? 'w-7 h-7 flex items-center justify-center rounded text-xs font-semibold bg-charcoal text-white'
        : 'w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-xs text-muted hover:text-charcoal hover:border-charcoal transition';

      (function(numero) {
        boutonPage.addEventListener('click', function() {
          pageActuelle = numero;
          rendreTableauClients();
        });
      })(p);

      pagination.appendChild(boutonPage);
    }

    var boutonSuiv = document.createElement('button');
    boutonSuiv.type = 'button';
    boutonSuiv.className = 'w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-muted hover:text-charcoal hover:border-charcoal transition text-xs disabled:opacity-40';
    boutonSuiv.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    boutonSuiv.disabled = pageActuelle >= totalPages;
    boutonSuiv.addEventListener('click', function() {
      if (pageActuelle < totalPages) { pageActuelle++; rendreTableauClients(); }
    });
    pagination.appendChild(boutonSuiv);
  }
}

// ─── Écouteurs ────────────────────────────────────────────────────────────────

function mettreAJourBoutonsStatutClient(statut) {
  var boutons = document.querySelectorAll('#filtres-statut-clients .btn-statut-client');
  boutons.forEach(function(btn) {
    if (btn.getAttribute('data-statut') === statut) {
      btn.className = 'btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition';
    } else {
      btn.className = 'btn-statut-client px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition';
    }
  });
}

function attacherEcouteursClients(prenom) {

  // Filtres statut
  var zoneFiltres = document.getElementById('filtres-statut-clients');
  if (zoneFiltres) {
    zoneFiltres.addEventListener('click', function(evenement) {
      var btn = evenement.target.closest('.btn-statut-client');
      if (!btn) return;
      filtreStatutActif = btn.getAttribute('data-statut');
      pageActuelle = 1;
      mettreAJourBoutonsStatutClient(filtreStatutActif);
      rendreTableauClients();
    });
  }

  // Recherche live
  var champRecherche = document.getElementById('champ-recherche-clients');
  if (champRecherche) {
    champRecherche.addEventListener('input', function() {
      filtreRechercheClients = champRecherche.value;
      pageActuelle = 1;
      rendreTableauClients();
    });
  }
}

tailwind.config = {
  theme: {
    extend: {
      colors: {
        beige:         '#F5F0EA',
        terracotta:    '#C97B5A',
        'terra-light': '#E8A882',
        'terra-pale':  '#F2DDD0',
        charcoal:      '#2C2A27',
        muted:         '#9B9589',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body:    ['Inter', 'sans-serif'],
      },
    }
  }
}