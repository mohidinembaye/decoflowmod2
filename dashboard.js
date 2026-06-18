import { afficherPageCategories } from './categories.js';
import { afficherPageProfil }     from './profil.js';
import { afficherPageDevis }      from './devis.js';
import { afficherPageProduits }   from './produits.js';
import { afficherPageClients }    from './clients.js';
import { afficherPageCommandes }  from './commandes.js';
import { attacherNavigationNavbar } from './navigation.js';

// ─── Configurations & Endpoints API ──────────────────────────────────────────
const API_URL_COMMANDES = 'http://localhost:3001/commandes';
const API_URL_PRODUITS  = 'http://localhost:3001/produits';

// Stockage dynamique local pour les KPIs et l'activité
var statsReelles = {
  chiffreAffaires: 0,
  totalCommandes: 0,
  totalProduitsStock: 0,
  commandesRecentes: []
};

// Données réelles calculées pour alimenter le diagramme (Hebdo et Mensuel)
var repartitionGraphique = {
  hebdomadaire: { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 },
  mensuel:      { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 }
};

// Dictionnaire de couleurs Tailwind pour l'état de la commande
var configurationStatuts = {
  'En préparation': { fond: 'bg-orange-50', texte: 'text-orange-500' },
  'Validée':        { fond: 'bg-blue-50',  texte: 'text-blue-500' },
  'Expédié':        { fond: 'bg-indigo-50',texte: 'text-indigo-500' },
  'Livré':          { fond: 'bg-green-50', text: 'text-green-500' },
  'En attente':     { fond: 'bg-amber-50', text: 'text-amber-500' }
};

// ─── Récupération et Agrégation des Données depuis db.json ────────────────────

async function chargerDonneesDepuisAPI() {
  try {
    var repCommandes = await fetch(API_URL_COMMANDES);
    var listCommandes = repCommandes.ok ? await repCommandes.json() : [];

    var repProduits = await fetch(API_URL_PRODUITS);
    var listProduits = repProduits.ok ? await repProduits.json() : [];

    statsReelles.chiffreAffaires = 0;
    statsReelles.totalCommandes = listCommandes.length;
    statsReelles.totalProduitsStock = listProduits.length;

    repartitionGraphique.hebdomadaire = { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 };
    repartitionGraphique.mensuel = { lun: 0, mar: 0, mer: 0, jeu: 0, ven: 0, sam: 0, dim: 0 };

    // Index UTC standard : 1 = Lundi, 2 = Mardi... 0 = Dimanche
    var conversionJours = { 1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam', 0: 'dim' };

    var maintenant = new Date();
    
    // Calcul des bornes temporelles en UTC pour s'aligner sur le db.json
    var debutSemaine = new Date(maintenant);
    var jourActuel = maintenant.getUTCDay();
    var ecartLundi = jourActuel === 0 ? -6 : 1 - jourActuel;
    debutSemaine.setUTCDate(maintenant.getUTCDate() + ecartLundi);
    debutSemaine.setUTCHours(0,0,0,0);

    var debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));

    listCommandes.forEach(function(cmd) {
      var montant = parseFloat(cmd.total || 0);
      statsReelles.chiffreAffaires += montant;

      if (cmd.dateCommande) {
        var dateCmd = new Date(cmd.dateCommande);
        if (!isNaN(dateCmd.getTime())) {
          // Utilisation de getUTCDay() à la place de getDay() pour éliminer le bug de fuseau horaire
          var jourIndex = dateCmd.getUTCDay();
          var cleJour = conversionJours[jourIndex];

          if (cleJour) {
            // Comparaison stricte des dates en UTC
            if (dateCmd >= debutSemaine) {
              repartitionGraphique.hebdomadaire[cleJour] += montant;
            }
            if (dateCmd >= debutMois) {
              repartitionGraphique.mensuel[cleJour] += montant;
            }
          }
        }
      }
    });

    var jours = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
    jours.forEach(function(j) {
      if (repartitionGraphique.mensuel[j] > 0) {
        repartitionGraphique.mensuel[j] = Math.round(repartitionGraphique.mensuel[j] / 4);
      }
    });

    statsReelles.commandesRecentes = listCommandes
      .sort((a, b) => new Date(b.dateCommande || 0) - new Date(a.dateCommande || 0))
      .slice(0, 3);

  } catch (erreur) {
    console.error("Erreur d'interconnexion avec db.json sur le Dashboard :", erreur);
  }
}

function genererBadgeStatut(statut) {
  var s = configurationStatuts[statut] || { fond: 'bg-gray-50', texte: 'text-gray-400' };
  return `<span class="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm ${s.fond} ${s.texte}">${statut || 'Inconnu'}</span>`;
}

// ─── Affichage Principal du Tableau de Bord ───────────────────────────────────

export async function afficherPageDashboard(prenomUtilisateur, role = "admin", userId = null) {
  
  if (role === 'client') {
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

  // Attendre la récolte et le tri de db.json
  await chargerDonneesDepuisAPI();

  conteneurApp.innerHTML = `
    <div id="page-dashboard" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <!-- Navbar -->
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
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span id="nom-utilisateur" class="text-sm font-medium text-charcoal hidden sm:block">${prenom} (${roleUtilisateur === 'superadmin' ? 'Super Admin' : 'Admin'})</span>
            <div id="avatar-utilisateur" class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center overflow-hidden">
              <i class="fa-solid fa-user text-terracotta text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      <!-- Contenu -->
      <main id="contenu-principal" class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div id="section-bienvenue" class="mb-8 border border-dashed border-gray-200 rounded-xl p-6 bg-white">
          <h1 id="titre-bienvenue" class="font-display text-4xl font-semibold text-charcoal mb-1">
            Bienvenue, <span id="prenom-utilisateur">${prenom}</span>
          </h1>
          <p id="sous-titre-bienvenue" class="text-sm text-muted">
            Analyse et performances réelles issues de votre base de données locale.
          </p>
        </div>

        <div id="grille-principale" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Gauche -->
          <div id="colonne-gauche" class="lg:col-span-2 flex flex-col gap-6">

            <div id="section-kpi" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div id="carte-chiffre-affaires" class="bg-white rounded-xl p-5 border border-gray-100">
                <div class="flex items-center gap-2 mb-3">
                  <i class="fa-regular fa-credit-card text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Chiffre d'affaires</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">${statsReelles.chiffreAffaires.toLocaleString('fr-FR')} FCFA</p>
                <p class="text-xs text-green-500 flex items-center gap-1">
                  <i class="fa-solid fa-arrow-trend-up"></i> Base db.json connectée
                </p>
              </div>

              <div id="carte-commandes" class="bg-white rounded-xl p-5 border border-gray-100 cursor-pointer hover:border-terracotta transition">
                <div class="flex items-center gap-2 mb-3">
                  <i class="fa-regular fa-square text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Commandes</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">${statsReelles.totalCommandes}</p>
                <p class="text-xs text-muted">Transactions totales</p>
              </div>

              <div id="carte-stock" class="bg-white rounded-xl p-5 border border-gray-100">
                <div class="flex items-center gap-2 mb-3">
                  <i class="fa-regular fa-rectangle-list text-muted text-sm"></i>
                  <span class="text-xs text-muted uppercase tracking-wider">Stock</span>
                </div>
                <p class="text-2xl font-semibold text-charcoal font-display mb-1">${statsReelles.totalProduitsStock}</p>
                <p class="text-xs text-muted">Articles en base</p>
              </div>
            </div>

            <!-- Graphique Hebdo / Mensuel -->
            <div id="carte-graphique" class="bg-white rounded-xl p-6 sm:p-11 border border-gray-100">
              <div class="flex items-center justify-between mb-10">
                <div>
                  <h2 id="titre-graphe" class="text-base font-semibold text-charcoal">Performance des revenus</h2>
                  <p id="sous-titre-graphe" class="text-xs text-muted mt-0.5">Vue basée sur la chronologie de vos commandes</p>
                </div>
                <div class="flex rounded-lg overflow-hidden border border-gray-200">
                  <button id="bouton-hebdomadaire" type="button" class="btn-periode px-3 py-1.5 text-xs font-medium bg-charcoal text-white">Hebdomadaire</button>
                  <button id="bouton-mensuel"      type="button" class="btn-periode px-3 py-1.5 text-xs font-medium bg-white text-muted hover:bg-beige transition">Mensuel</button>
                </div>
              </div>
              
              <div id="graphique-barres" class="flex items-end justify-between gap-2 h-64">
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-lun" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">LUN</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-mar" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">MAR</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-mer" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">MER</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-jeu" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">JEU</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-ven" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">VEN</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-sam" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">SAM</span></div>
                <div class="flex flex-col items-center gap-2 flex-1"><div id="barre-dim" class="barre-graphique w-full rounded-t-md bg-terra-pale transition-all duration-500" style="height:0%"></div><span class="text-xs text-muted">DIM</span></div>
              </div>
            </div>

          </div>

          <!-- Droite : Activité récente Dynamique -->
          <div id="colonne-droite" class="flex flex-col gap-8">

            <div id="carte-activite" class="bg-white rounded-xl p-5 border border-gray-100 flex-1">
              <h2 class="text-xs font-semibold text-charcoal uppercase tracking-wider mb-4">Activité récente</h2>
              <ul class="flex flex-col gap-4">
                ${statsReelles.commandesRecentes.length === 0 
                  ? '<p class="text-xs text-muted py-2">Aucune commande en base.</p>' 
                  : statsReelles.commandesRecentes.map(function(cmd) {
                      
                      // Lecture directe de la propriété utilisateurNom de ton db.json
                      var clientNom = cmd.utilisateurNom || "Client — Réf #" + (cmd.id || "Inconnue");

                      // Extraction sécurisée des initiales (ex: "Aminata Diallo" -> "AD")
                      var initiales = clientNom.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      if (!initiales) initiales = "CL";

                      var montantFormate = (cmd.total || 0).toLocaleString('fr-FR') + ' FCFA';
                      var etatCommande = cmd.statut || 'En attente';
                      
                      return `
                        <li class="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div class="flex items-start gap-3 min-w-0">
                            <div class="w-8 h-8 rounded-full bg-terra-pale flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-terracotta">${initiales}</div>
                            <div class="min-w-0">
                              <p class="text-sm font-medium text-charcoal truncate leading-snug">${clientNom}</p>
                              <p class="text-xs text-muted mt-0.5">Réf: #${cmd.id} · <span class="font-semibold text-charcoal">${montantFormate}</span></p>
                            </div>
                          </div>
                          <div class="flex-shrink-0 pl-2">
                            ${genererBadgeStatut(etatCommande)}
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
                <h3 class="font-display text-white text-xl font-semibold leading-tight mb-2">Élégance de Bureau</h3>
                <p class="text-white/70 text-xs leading-relaxed mb-3">Découvrez notre sélection curatée pour les espaces de travail exécutifs.</p>
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
            <span class="text-xs text-muted">© 2026 DecoFlow Interior Management. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  `;

  // Initialisation par défaut sur le flux Hebdomadaire réel
  mettreAJourGraphique('hebdomadaire');
  attacherEcouteursDashboard(prenom, roleUtilisateur);
}

function mettreAJourGraphique(periode) {
  var jours = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
  var valeurs = repartitionGraphique[periode];
  
  var valeursTableau = jours.map(function(j) { return valeurs[j] || 0; });
  var valeurMax = Math.max.apply(null, valeursTableau);

  var sousTitre = document.getElementById('sous-titre-graphe');
  if (sousTitre) {
    sousTitre.innerText = periode === 'hebdomadaire' 
      ? 'Chiffre d\'affaires total généré cette semaine' 
      : 'Moyenne hebdomadaire des ventes enregistrées ce mois-ci';
  }

  jours.forEach(function(jour) {
    var barre = document.getElementById('barre-' + jour);
    if (!barre) return;
    
    var montantJour = valeurs[jour] || 0;
    var hauteurPourcentage = 0;
    
    if (valeurMax > 0 && montantJour > 0) {
      hauteurPourcentage = Math.max(6, (montantJour / valeurMax) * 100);
    }

    barre.style.height = hauteurPourcentage + '%';
    barre.title = montantJour.toLocaleString('fr-FR') + ' FCFA' + (periode === 'mensuel' ? ' (Moyenne)' : '');

    if (montantJour === valeurMax && valeurMax > 0) {
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

  attacherNavigationNavbar(prenom);

  var carteCommandes = document.getElementById('carte-commandes');
  if (carteCommandes) {
    carteCommandes.addEventListener('click', function() {
      afficherPageCommandes(prenom);
    });
  }

  var lienExplorer = document.getElementById('lien-explorer');
  if (lienExplorer) {
    lienExplorer.addEventListener('click', function(evenement) {
      evenement.preventDefault();
      afficherPageCategories(prenom);
    });
  }

  var lienHistorique = document.getElementById('lien-historique');
  if (lienHistorique) {
    lienHistorique.addEventListener('click', function(evenement) {
      evenement.preventDefault();
      afficherPageCommandes(prenom);
    });
  }

  var profilUtilisateur = document.getElementById('profil-utilisateur');
  if (profilUtilisateur) {
    profilUtilisateur.addEventListener('click', function() {
      afficherPageProfil(prenom);
    });
  }
}