import { afficherPageDashboard }  from './dashboard.js';
import { afficherPageProfil }     from './profil.js';
import { afficherPageDevis }      from './devis.js';
import { afficherPageProduits }   from './produits.js';
import { afficherPageCommandes }  from './commandes.js';
import { attacherNavigationNavbar } from './navigation.js';

// Importations issues de la logique de db.js et produits.js
import {
  lireSession,
  recupererTousLesProduits,
  ajouterAuPanier,
  compterArticlesPanier
} from './db.js';

// Données des catégories DecoFlow
var donneesCategories = [
  { id: 'mobilier',    icone: 'fa-couch',         nom: 'Mobilier',      articles: 42, statut: 'active'  },
  { id: 'luminaire',   icone: 'fa-lightbulb',      nom: 'Luminaire',     articles: 28, statut: 'active'  },
  { id: 'textile',     icone: 'fa-scissors',       nom: 'Textile',       articles: 15, statut: 'active'  },
  { id: 'accessoires', icone: 'fa-tag',            nom: 'Accessoires',   articles: 56, statut: 'active'  },
  { id: 'rangement',   icone: 'fa-box',            nom: 'Rangement',     articles: 20, statut: 'active'  },
  { id: 'decoration',  icone: 'fa-shapes',         nom: 'Décoration',    articles: 33, statut: 'active'  },
  { id: 'bureau',      icone: 'fa-briefcase',      nom: 'Bureau',        articles: 18, statut: 'active'  },
  { id: 'exterieur',   icone: 'fa-tree',           nom: 'Extérieur',     articles: 12, statut: 'active'  },
  { id: 'cuisine',     icone: 'fa-utensils',       nom: 'Cuisine',       articles: 9,  statut: 'active'  },
  { id: 'salle-bain',  icone: 'fa-bath',           nom: 'Salle de bain', articles: 7,  statut: 'archive' },
  { id: 'chambre',     icone: 'fa-bed',            nom: 'Chambre',       articles: 24, statut: 'archive' },
  { id: 'salon',       icone: 'fa-tv',             nom: 'Salon',         articles: 31, statut: 'archive' },
  { id: 'jardin',      icone: 'fa-seedling',       nom: 'Jardin',        articles: 5,  statut: 'archive' },
];

var filtreActif      = 'toutes';
var recherche        = '';
var categorieActive  = null; 
var listeProduitsGlobal = []; // Contiendra les vrais produits de la BDD

export async function afficherPageCategories(prenomUtilisateur) {
  history.pushState({ page: 'categories', nom: prenomUtilisateur }, '', '#categories');

  // Récupération de la session et des rôles à la manière de produits.js
  var session = lireSession();
  var role    = session ? session.role : 'client';
  var estAdmin = (role === 'admin' || role === 'superadmin');

  var conteneurApp = document.getElementById('app');
  var prenom = prenomUtilisateur || (session && session.nom) || 'Utilisateur';

  filtreActif     = 'toutes';
  recherche       = '';
  categorieActive = null;

  // Charger les vrais produits depuis db.js
  listeProduitsGlobal = await recupererTousLesProduits();

  conteneurApp.className = 'w-full';

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  conteneurApp.innerHTML = `
    <div id="page-categories" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <header id="navbar" class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div id="navbar-logo" class="flex items-center gap-2 mr-10">
          <img src="LOGOD.png" alt="DecoFlow" class="h-8" />
          <span class="font-display text-2xl font-semibold text-charcoal tracking-wide">DecoFlow</span>
        </div>

        <nav id="navbar-nav" class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard"  href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Dashboard</a>
          <a id="nav-produits"   href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
          <a id="nav-categories" href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-charcoal border-b-2 border-terracotta">Catégories</a>
          <a id="nav-orders"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
          <a id="nav-quotes"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Devis</a>
          <a id="nav-customers"  href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Clients</a>
        </nav>

        <div id="navbar-droite" class="flex items-center gap-4">
          <button type="button" aria-label="Rechercher" class="text-muted hover:text-charcoal transition">
            <i class="fa-solid fa-magnifying-glass text-sm"></i>
          </button>
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-charcoal hidden sm:block">${prenom}</span>
            <div class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center overflow-hidden">
              <i class="fa-solid fa-user text-terracotta text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      <main id="contenu-categories" class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div class="mb-6 border border-dashed border-gray-200 rounded-xl p-6 bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 class="font-display text-4xl font-semibold text-charcoal mb-1">Gestion des Catégories</h1>
            <p class="text-sm text-muted max-w-md">Organisez votre catalogue avec une structure raffinée. Créez des collections qui inspirent l'élégance et la curation artisanale.</p>
          </div>
          <button id="bouton-ajouter-categorie" type="button"
            class="${estAdmin ? '' : 'hidden'} flex items-center gap-2 bg-charcoal text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-terracotta transition-colors duration-200 whitespace-nowrap self-start">
            <i class="fa-solid fa-plus text-xs"></i> Ajouter une catégorie
          </button>
        </div>

        <div id="zone-contenu-categories"></div>

      </main>

      <div id="toast-zone" class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"></div>

      <footer id="footer" class="bg-white border-t border-gray-100 mt-auto">
        <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="font-display text-lg font-semibold text-charcoal">DecoFlow</span>
            <span class="text-xs text-muted">© 2024 DecoFlow Interior Management. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  `;

  rendreVueListe(estAdmin);
  attacherEcouteursCategories(prenom, estAdmin);
  attacherNavigationNavbar(prenom);
}

function rendreVueListe(estAdmin) {
  var zone = document.getElementById('zone-contenu-categories');
  if (!zone) return;

  zone.innerHTML = `
    <div class="bg-white border border-gray-100 rounded-xl px-5 py-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div id="filtres-categories" class="flex items-center gap-1">
        <button id="filtre-toutes"   type="button" class="btn-filtre px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition">Toutes</button>
        <button id="filtre-actives"  type="button" class="btn-filtre px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition">Actives</button>
        <button id="filtre-archives" type="button" class="btn-filtre px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition">Archives</button>
      </div>
      <div class="relative">
        <span class="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none">
          <i class="fa-solid fa-magnifying-glass text-xs"></i>
        </span>
        <input id="champ-recherche-categories" type="text" placeholder="Rechercher une catégorie…"
          class="border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-xs text-charcoal placeholder-gray-400 bg-beige/40 focus:outline-none focus:border-terracotta transition w-56" />
      </div>
    </div>

    <div id="grille-categories" class="bg-white border border-dashed border-gray-200 rounded-xl p-6 mb-8">
      <div id="liste-categories" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"></div>
    </div>
  `;

  rendreGrilleCategories(estAdmin);
  attacherEcouteursFiltres(estAdmin);
}

function rendreVueDetailCategorie(cat, estAdmin) {
  categorieActive = cat.id;
  var zone = document.getElementById('zone-contenu-categories');
  if (!zone) return;

  var badgeStatut = cat.statut === 'active'
    ? '<span class="bg-green-100 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full">Active</span>'
    : '<span class="bg-gray-100 text-muted text-xs font-medium px-2.5 py-1 rounded-full">Archivée</span>';

  // Filtrer les vrais produits liés à cette catégorie
  var produitsDeLaCategorie = listeProduitsGlobal.filter(p => p.categorie.toLowerCase() === cat.id.toLowerCase());

  zone.innerHTML = `
    <div class="animer-fond">
      <div class="flex items-center gap-2 mb-6 text-xs text-muted">
        <button id="bouton-retour-liste" type="button" class="flex items-center gap-1.5 hover:text-terracotta transition">
          <i class="fa-solid fa-arrow-left text-xs"></i> Catégories
        </button>
        <span>/</span>
        <span class="text-charcoal font-medium">${cat.nom}</span>
      </div>

      <div class="bg-white border border-gray-100 rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-terra-pale flex items-center justify-center flex-shrink-0">
          <i class="fa-solid ${cat.icone} text-2xl text-terracotta"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h2 class="font-display text-3xl font-semibold text-charcoal">${cat.nom}</h2>
            ${badgeStatut}
          </div>
          <p class="text-sm text-muted">${produitsDeLaCategorie.length} articles répertoriés dans cette catégorie</p>
        </div>
        
        <div class="flex items-center gap-2 self-start sm:self-center ${estAdmin ? '' : 'hidden'}">
          <button type="button" class="border border-gray-200 text-charcoal text-xs uppercase tracking-widest px-4 py-2 hover:bg-beige transition-colors duration-200">
            <i class="fa-regular fa-pen-to-square mr-1.5"></i> Modifier
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 ${estAdmin ? '' : 'hidden'}">
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <p class="text-xs text-muted uppercase tracking-wider mb-2">Total articles</p>
          <p class="text-3xl font-semibold text-charcoal font-display">${produitsDeLaCategorie.length}</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <p class="text-xs text-muted uppercase tracking-wider mb-2">Chiffre d'affaires</p>
          <p class="text-3xl font-semibold text-charcoal font-display">${(produitsDeLaCategorie.reduce((acc, p) => acc + p.prix, 0)).toLocaleString('fr-FR')} Fcfa</p>
        </div>
      </div>

      <div class="bg-white border border-dashed border-gray-200 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-charcoal uppercase tracking-wider">Articles disponibles</h3>
        </div>
        <div id="liste-produits-categorie-zone" class="flex flex-col gap-3">
          </div>
      </div>
    </div>
  `;

  // Rendre et attacher les écouteurs d'achat sur les produits réels
  injecterArticlesEtEcouteurs(produitsDeLaCategorie, estAdmin);

  document.getElementById('bouton-retour-liste').addEventListener('click', function() {
    categorieActive = null;
    rendreVueListe(estAdmin);
  });
}

function injecterArticlesEtEcouteurs(produits, estAdmin) {
  var zoneEncart = document.getElementById('liste-produits-categorie-zone');
  if (!zoneEncart) return;

  if (produits.length === 0) {
    zoneEncart.innerHTML = '<p class="text-xs text-muted text-center py-4">Aucun article disponible dans cette catégorie.</p>';
    return;
  }

  zoneEncart.innerHTML = '';

  produits.forEach(function(produit) {
    var itemRow = document.createElement('div');
    itemRow.className = 'flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg hover:border-terracotta transition bg-white';
    
    itemRow.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-md bg-[#C4A882] overflow-hidden flex-shrink-0">
          <img src="${produit.image}" alt="${produit.nom}" class="w-full h-full object-cover" onerror="this.style.opacity='0.3'"/>
        </div>
        <div>
          <p class="text-sm font-medium text-charcoal">${produit.nom}</p>
          <p class="text-xs text-muted">Stock : ${produit.stock != null ? produit.stock : 0}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <p class="text-sm font-semibold text-charcoal">${produit.prix.toLocaleString('fr-FR')} Fcfa</p>
        ${estAdmin ? '' : `
          <button type="button" data-id="${produit.id}" class="bouton-acheter-cat bg-charcoal text-white text-[11px] uppercase tracking-widest px-3 py-2 hover:bg-terracotta transition flex items-center gap-1.5">
            <i class="fa-solid fa-cart-plus"></i> Commander
          </button>
        `}
      </div>
    `;

    // Attacher l'événement d'ajout direct au panier sur le bouton
    if (!estAdmin) {
      var btnAchat = itemRow.querySelector('.bouton-acheter-cat');
      btnAchat.addEventListener('click', function(e) {
        e.stopPropagation();
        ajouterAuPanier(produit, 1);
        mettreAJourCompteurPanier();
        afficherToast(produit.nom + ' ajouté au panier');
      });
    }

    zoneEncart.appendChild(itemRow);
  });
}

function rendreGrilleCategories(estAdmin) {
  var listElement = document.getElementById('liste-categories');
  if (!listElement) return;
  listElement.innerHTML = '';

  var categoriesFiltrees = donneesCategories.filter(function(cat) {
    var correspondFiltre =
      filtreActif === 'toutes'   ||
      (filtreActif === 'actives'  && cat.statut === 'active')  ||
      (filtreActif === 'archives' && cat.statut === 'archive');

    var correspondRecherche =
      recherche === '' ||
      cat.nom.toLowerCase().includes(recherche.toLowerCase());

    return correspondFiltre && correspondRecherche;
  });

  if (categoriesFiltrees.length === 0) {
    listElement.innerHTML = '<p class="col-span-4 text-center text-sm text-muted py-8">Aucune catégorie trouvée.</p>';
    return;
  }

  categoriesFiltrees.forEach(function(cat) {
    var carte = document.createElement('div');
    carte.className = 'flex flex-col items-center justify-center gap-3 p-6 border border-gray-100 rounded-xl hover:border-terracotta hover:shadow-sm transition cursor-pointer group bg-white';
    
    // Compter le nombre réel de produits pour l'affichage dynamique de la carte
    var nbProduitsReels = listeProduitsGlobal.filter(p => p.categorie.toLowerCase() === cat.id.toLowerCase()).length;

    carte.innerHTML = `
      <i class="fa-solid ${cat.icone} text-2xl text-muted group-hover:text-terracotta transition"></i>
      <p class="text-sm font-medium text-charcoal">${cat.nom}</p>
      <p class="text-xs text-muted">${nbProduitsReels} Article${nbProduitsReels > 1 ? 's' : ''}</p>
    `;

    carte.addEventListener('click', function() {
      rendreVueDetailCategorie(cat, estAdmin);
    });

    listElement.appendChild(carte);
  });
}

function attacherEcouteursFiltres(estAdmin) {
  var boutonToutes   = document.getElementById('filtre-toutes');
  var boutonActives  = document.getElementById('filtre-actives');
  var boutonArchives = document.getElementById('filtre-archives');
  var champRecherche = document.getElementById('champ-recherche-categories');

  if (!boutonToutes) return;

  function activerFiltre(filtre) {
    filtreActif = filtre;
    [boutonToutes, boutonActives, boutonArchives].forEach(btn => {
      btn.className = 'btn-filtre px-3 py-1.5 text-xs rounded-md font-medium text-muted hover:text-charcoal hover:bg-beige transition';
    });
    if (filtre === 'toutes')   boutonToutes.className   = 'btn-filtre px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition';
    if (filtre === 'actives')  boutonActives.className  = 'btn-filtre px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition';
    if (filtre === 'archives') boutonArchives.className = 'btn-filtre px-3 py-1.5 text-xs rounded-md font-medium bg-charcoal text-white transition';
    rendreGrilleCategories(estAdmin);
  }

  boutonToutes.addEventListener('click',   function() { activerFiltre('toutes');   });
  boutonActives.addEventListener('click',  function() { activerFiltre('actives');  });
  boutonArchives.addEventListener('click', function() { activerFiltre('archives'); });

  champRecherche.addEventListener('input', function() {
    recherche = champRecherche.value;
    rendreGrilleCategories(estAdmin);
  });
}

function attacherEcouteursCategories(prenom, estAdmin) {
  var lienCategories = document.getElementById('nav-categories');
  if (!lienCategories) return;

  lienCategories.addEventListener('click', function(evenement) {
    evenement.preventDefault();
    categorieActive = null;
    rendreVueListe(estAdmin);
  });
}

// Fonctions Toasts et Panier issues directement de produits.js
function afficherToast(message) {
  var zone = document.getElementById('toast-zone');
  if (!zone) return;
  var toast = document.createElement('div');
  toast.className = 'bg-charcoal text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2';
  toast.innerHTML = '<i class="fa-solid fa-check text-terra-light"></i> ' + message;
  zone.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 1800);
  setTimeout(function() { toast.remove(); }, 2200);
}

function mettreAJourCompteurPanier() {
  var badge = document.getElementById('badge-panier');
  if (!badge) return;
  var n = compterArticlesPanier();
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}