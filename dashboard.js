import { afficherPageCategories } from './categories.js';
import { afficherPageProfil }     from './profil.js';
import { afficherPageDevis }      from './devis.js';
import { afficherPageProduits }   from './produits.js';
import { afficherPageClients }    from './clients.js';
import { afficherPageCommandes }  from './commandes.js';
import { attacherNavigationNavbar } from './navigation.js';

var donneesGraphique = {
  hebdomadaire: { lun: 55, mar: 65, mer: 60, jeu: 100, ven: 70, sam: 45, dim: 40 },
  mensuel:      { lun: 30, mar: 80, mer: 50, jeu: 90,  ven: 60, sam: 75, dim: 55 }
};

// Données mock des commandes et clients pour les statistiques
var donneesStats = {
  commandes: {
    total: 48,
    evolution: "+5%",
    details: [
      { id: "#DF-8902", client: "Atelier Bourgeois", montant: "420,00 €", date: "Il y a 12 minutes" },
      { id: "#DF-8901", client: "Mme. Laurent", montant: "1 200,00 €", date: "Il y a 2 heures" },
      { id: "#DF-8900", client: "Résidence Haussmann", montant: "750,00 €", date: "Il y a 5 heures" }
    ]
  },
  clients: {
    total: 842,
    evolution: "+12%",
    recents: [
      { nom: "Atelier Pierre", ville: "Lyon, FR", date: "Il y a 1 heure" },
      { nom: "Studio Lumière", ville: "Paris, FR", date: "Il y a 3 heures" },
      { nom: "Espace Vert", ville: "Bordeaux, FR", date: "Il y a 6 heures" }
    ]
  },
  stock: {
    total: 842,
    alertes: 3
  }
};

export function afficherPageDashboard(prenomUtilisateur, role = "admin", userId = null) {
  
  // Vérifier si l'utilisateur a accès au dashboard
  if (role === 'client') {
    // Rediriger le client vers la page des devis
    afficherPageDevis(prenomUtilisateur, role, userId);
    return;
  }

  var conteneurApp = document.getElementById('app');
  var prenom = prenomUtilisateur || 'Utilisateur';
  var roleUtilisateur = role || 'admin';
  
  history.pushState({ page: 'dashboard', nom: prenomUtilisateur }, '', '#dashboard');

  conteneurApp.className = 'w-full';

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  conteneurApp.innerHTML = `
    <div id="page-dashboard" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <header id="navbar" class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">

        <div id="navbar-logo" class="flex items-center gap-2 mr-10">
          <img id="image-logo" src="LOGOD.png" alt="DecoFlow" class="h-8" />
          <span class="font-display text-2xl font-semibold text-charcoal tracking-wide">DecoFlow</span>
        </div>

        <nav id="navbar-nav" class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard"  href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-charcoal border-b-2 border-terracotta">Dashboard</a>
          <a id="nav-produits"   href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
          <a id="nav-categories" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Catégories</a>
          <a id="nav-orders"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
          <a id="nav-quotes"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Devis</a>
          <a id="nav-customers"  href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Clients</a>
        </nav>

        <div id="navbar-droite" class="flex items-center gap-4">
          <button id="bouton-recherche" type="button" aria-label="Rechercher" class="text-muted hover:text-charcoal transition">
            <i class="fa-solid fa-magnifying-glass text-sm"></i>
          </button>
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span id="nom-utilisateur" class="text-sm font-medium text-charcoal hidden sm:block">${prenom} (${roleUtilisateur === 'superadmin' ? 'Super Admin' : 'Admin'})</span>
            <div id="avatar-utilisateur" class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center overflow-hidden">
              <i class="fa-solid fa-user text-terracotta text-sm"></i>
            </div>
          </div>
        </div>

      </header>

      <main id="contenu-principal" class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div id="section-bienvenue" class="mb-8 border border-dashed border-gray-200 rounded-xl p-6 bg-white">
          <h1 id="titre-bienvenue" class="font-display text-4xl font-semibold text-charcoal mb-1">
            Bienvenue, <span id="prenom-utilisateur">${prenom}</span>
          </h1>
          <p id="sous-titre-bienvenue" class="text-sm text-muted">
            ${roleUtilisateur === 'superadmin' ? 'Supervision complète de l\'activité DecoFlow.' : 'Voici un aperçu de l\'activité de DecoFlow aujourd\'hui.'}
          </p>
        </div>

        <div id="grille-principale" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div id="colonne-gauche" class="lg:col-span-2 flex flex-col gap-6">

            <div id="section-kpi" class="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div id="carte-chiffre-affaires" class="bg-white rounded-xl p-5 border border-gray-100">
                <div class="flex items-center gap-2 mb-3">
                  <i class="fa-regular fa-tv text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Chiffre d'affaires</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">12 000 840 Fcfa</p>
                <p class="text-xs text-green-500 flex items-center gap-1">
                  <i class="fa-solid fa-arrow-trend-up"></i> +12% vs hier
                </p>
              </div>

              <div id="carte-commandes" class="bg-white rounded-xl p-5 border border-gray-100 cursor-pointer hover:border-terracotta transition">
                <div class="flex items-center gap-2 mb-7">
                  <i class="fa-regular fa-square text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Commandes</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">${donneesStats.commandes.total}</p>
                <p class="text-xs text-green-500 flex items-center gap-1">
                  <i class="fa-solid fa-arrow-trend-up"></i> ${donneesStats.commandes.evolution} vs hier
                </p>
              </div>

              <div id="carte-stock" class="bg-white rounded-xl p-5 border border-gray-100">
                <div class="flex items-center gap-2 mb-3">
                  <i class="fa-regular fa-rectangle-list text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Stock</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">${donneesStats.stock.total}</p>
                <p class="text-xs text-muted">Total articles actifs</p>
              </div>

            </div>

            <div id="carte-graphique" class="bg-white rounded-xl p-6 sm:p-11 border border-gray-100">
              <div class="flex items-center justify-between mb-10">
                <h2 class="text-base font-semibold text-charcoal">Performance des revenus</h2>
                <div class="flex rounded-lg overflow-hidden border border-gray-200">
                  <button id="bouton-hebdomadaire" type="button" class="btn-periode px-3 py-1.5 text-xs font-medium bg-charcoal text-white">Hebdomadaire</button>
                  <button id="bouton-mensuel"      type="button" class="btn-periode px-3 py-1.5 text-xs font-medium bg-white text-muted hover:bg-beige transition">Mensuel</button>
                </div>
              </div>
              <div id="graphique-barres" class="flex items-end justify-between gap-2 h-64">
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-lun" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:55%"></div><span class="text-xs text-muted">LUN</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-mar" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:65%"></div><span class="text-xs text-muted">MAR</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-mer" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:60%"></div><span class="text-xs text-muted">MER</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-jeu" class="barre-graphique w-full rounded-t-md bg-charcoal"    style="height:100%"></div><span class="text-xs text-muted">JEU</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-ven" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:70%"></div><span class="text-xs text-muted">VEN</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-sam" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:45%"></div><span class="text-xs text-muted">SAM</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-dim" class="barre-graphique w-full rounded-t-md bg-terra-pale" style="height:40%"></div><span class="text-xs text-muted">DIM</span></div>
              </div>
            </div>

          </div>

          <div id="colonne-droite" class="flex flex-col gap-8">

            <div id="carte-activite" class="bg-white rounded-xl p-5 border border-gray-100 flex-1">
              <h2 class="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Activité récente</h2>
              <ul class="flex flex-col gap-4">
                ${donneesStats.commandes.details.map(function(cmd) {
                  return `
                    <li class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center flex-shrink-0 text-xs font-semibold text-terracotta">${cmd.client.charAt(0)}</div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-charcoal leading-snug">Commande ${cmd.id}</p>
                        <p class="text-xs text-muted mt-0.5">${cmd.date} · ${cmd.montant}</p>
                      </div>
                    </li>
                  `;
                }).join('')}
              </ul>
              <div class="mt-5 pt-4 border-t border-gray-100">
                <a id="lien-historique" href="#" class="flex items-center justify-between text-sm text-charcoal hover:text-terracotta transition font-medium group">
                  <span>Voir toutes les commandes</span>
                  <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </a>
              </div>
            </div>

            <div id="carte-promo" class="relative rounded-xl overflow-hidden min-h-[340px] bg-charcoal flex flex-col justify-end">
              <img src="bureau.png" alt="" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div class="relative z-10 p-5">
                <p class="text-terra-light text-xs font-semibold uppercase tracking-widest mb-1">Focus Collection</p>
                <h3 class="font-display text-white text-xl font-semibold leading-tight mb-2">Élégance de Bureau 2024</h3>
                <p class="text-white/70 text-xs leading-relaxed mb-3">Découvrez notre nouvelle sélection curatée pour les espaces de travail exécutifs.</p>
                <a id="lien-explorer" href="#" class="inline-flex items-center gap-1.5 text-xs font-medium text-terra-light hover:text-white transition">
                  Explorer la gamme <i class="fa-solid fa-arrow-right text-xs"></i>
                </a>
              </div>
            </div>

          </div>

        </div>

      </main>

      <footer id="footer" class="bg-white border-t border-gray-100 mt-auto">
        <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="font-display text-lg font-semibold text-charcoal">DecoFlow</span>
            <span class="text-xs text-muted">© 2024 DecoFlow Interior Management. All rights reserved.</span>
          </div>
          <nav class="flex items-center gap-5">
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Legal Notice</a>
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Privacy Policy</a>
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Contact Us</a>
            <a href="#" class="text-xs text-muted hover:text-charcoal transition">Terms of Service</a>
          </nav>
        </div>
      </footer>

    </div>
  `;

  attacherEcouteursDashboard(prenom, roleUtilisateur);
}

function mettreAJourGraphique(periode) {
  var jours     = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  var valeurs   = donneesGraphique[periode];
  var valeurMax = Math.max.apply(null, jours.map(function(j) { return valeurs[j]; }));

  jours.forEach(function(jour) {
    var barre = document.getElementById('barre-' + jour);
    if (!barre) return;
    var valeur = valeurs[jour];
    barre.style.height = valeur + '%';
    if (valeur === valeurMax) {
      barre.classList.remove('bg-terra-pale');
      barre.classList.add('bg-charcoal');
    } else {
      barre.classList.remove('bg-charcoal');
      barre.classList.add('bg-terra-pale');
    }
  });
}

function attacherEcouteursDashboard(prenom, role) {

  var boutonHebdo   = document.getElementById('bouton-hebdomadaire');
  var boutonMensuel = document.getElementById('bouton-mensuel');

  if (boutonHebdo && boutonMensuel) {
    boutonHebdo.addEventListener('click', function() {
      boutonHebdo.classList.add('bg-charcoal', 'text-white');
      boutonHebdo.classList.remove('bg-white', 'text-muted');
      boutonMensuel.classList.add('bg-white', 'text-muted');
      boutonMensuel.classList.remove('bg-charcoal', 'text-white');
      mettreAJourGraphique('hebdomadaire');
    });

    boutonMensuel.addEventListener('click', function() {
      boutonMensuel.classList.add('bg-charcoal', 'text-white');
      boutonMensuel.classList.remove('bg-white', 'text-muted');
      boutonHebdo.classList.add('bg-white', 'text-muted');
      boutonHebdo.classList.remove('bg-charcoal', 'text-white');
      mettreAJourGraphique('mensuel');
    });
  }

  // Navbar centralisée
  attacherNavigationNavbar(prenom);

  // ── Carte Commandes (KPI) → Commandes ──
  var carteCommandes = document.getElementById('carte-commandes');
  if (carteCommandes) {
    carteCommandes.addEventListener('click', function() {
      afficherPageCommandes(prenom);
    });
  }

  // ── Lien Explorer la gamme → Catégories ──
  var lienExplorer = document.getElementById('lien-explorer');
  if (lienExplorer) {
    lienExplorer.addEventListener('click', function(evenement) {
      evenement.preventDefault();
      afficherPageCategories(prenom);
    });
  }

  // ── Lien historique → Commandes ──
  var lienHistorique = document.getElementById('lien-historique');
  if (lienHistorique) {
    lienHistorique.addEventListener('click', function(evenement) {
      evenement.preventDefault();
      afficherPageCommandes(prenom);
    });
  }

  // ── Profil utilisateur → Page Profil ──
  var profilUtilisateur = document.getElementById('profil-utilisateur');
  if (profilUtilisateur) {
    profilUtilisateur.addEventListener('click', function() {
      afficherPageProfil(prenom);
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
};