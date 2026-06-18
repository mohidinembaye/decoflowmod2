import { attacherNavigationNavbar }                        from './navigation.js';
import { lireSession, recupererTousLesUtilisateurs,
         modifierRoleUtilisateur, supprimerUtilisateur }   from './db.js';

// ─── Configurations & Endpoints API ──────────────────────────────────────────
const API_URL_COMMANDES     = 'http://localhost:3001/commandes';
const API_URL_PRODUITS      = 'http://localhost:3001/produits';
const API_URL_NOTIFICATIONS = 'http://localhost:3001/notifications';

// ─── Déclarations ─────────────────────────────────────────────────────────────
var listeUtilisateurs = [];

// ─── Rendu Principal ──────────────────────────────────────────────────────────

export async function afficherPageSuperadmin(prenomUtilisateur) {
  var session = lireSession();
  var prenom  = prenomUtilisateur || (session && session.nom) || 'Superadmin';

  if (!session || session.role !== 'superadmin') {
    import('./dashboard.js').then(function(m) { m.afficherPageDashboard(prenom); });
    return;
  }

  history.pushState({ page: 'superadmin-panel', nom: prenom }, '', '#superadmin-panel');

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  var conteneurApp = document.getElementById('app');
  conteneurApp.className = 'w-full';

  // 1. Récupération des données réelles
  listeUtilisateurs = await recupererTousLesUtilisateurs();
  
  var totalCommandes = 0;
  var totalProduits = 0;
  var topProduitsCalculateurs = {}; 

  try {
    var repCommandes = await fetch(API_URL_COMMANDES);
    var listCmds = repCommandes.ok ? await repCommandes.json() : [];
    
    listCmds.forEach(function(cmd) {
      totalCommandes += parseFloat(cmd.total || 0);

      if (cmd.statut !== 'Annulé' && cmd.statut !== 'Refusée' && cmd.articles) {
        cmd.articles.forEach(function(art) {
          var idProd = art.produitId || art.nom;
          if (!topProduitsCalculateurs[idProd]) {
            topProduitsCalculateurs[idProd] = {
              nom: art.nom,
              prix: parseFloat(art.prix || 0),
              quantiteVendue: 0
            };
          }
          topProduitsCalculateurs[idProd].quantiteVendue += parseInt(art.quantite || 1);
        });
      }
    });
  } catch (e) {
    console.error("Impossible de charger les commandes", e);
  }

  try {
    var repProduits = await fetch(API_URL_PRODUITS);
    var listProds = repProduits.ok ? await repProduits.json() : [];
    totalProduits = listProds.length;
  } catch (e) {
    console.error("Impossible de charger les produits", e);
  }

  var tableauTopProduits = Object.values(topProduitsCalculateurs)
    .sort((a, b) => b.quantiteVendue - a.quantiteVendue)
    .slice(0, 4);

  var maxVentes = tableauTopProduits.length > 0 ? tableauTopProduits[0].quantiteVendue : 1;
  var caFormate = new Intl.NumberFormat('fr-FR').format(totalCommandes);

  // 2. Injection HTML
  conteneurApp.innerHTML = `
    <div id="page-superadmin" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <header id="navbar" class="bg-charcoal px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-2 mr-10">
          <img src="LOGOD.png" alt="DecoFlow" class="h-8 brightness-0 invert" />
          <span class="font-display text-2xl font-semibold text-white tracking-wide">DecoFlow</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider bg-terracotta text-white px-2 py-0.5 rounded-sm ml-2">Superadmin</span>
        </div>
        <nav class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard"        href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Dashboard</a>
          <a id="nav-produits"         href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
          <a id="nav-categories"       href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Catégories</a>
          <a id="nav-orders"           href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
          <a id="nav-quotes"           href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Devis</a>
          <a id="nav-admin-panel"      href="#" class="nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition">Admin</a>
          <a id="nav-superadmin-panel" href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-white border-b-2 border-terracotta">Superadmin</a>
        </nav>
        <div class="flex items-center gap-4">
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-white hidden sm:block">${prenom.split(' ')[0]}</span>
            <div class="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
              <i class="fa-solid fa-crown text-white text-sm"></i>
            </div>
          </div>
          <button id="bouton-deconnexion" type="button"
            class="text-xs text-white/60 hover:text-red-300 transition flex items-center gap-1">
            <i class="fa-solid fa-right-from-bracket text-xs"></i>
          </button>
        </div>
      </header>

      <main class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div class="mb-8">
          <p class="text-xs text-terracotta uppercase tracking-widest font-semibold mb-1">Direction Générale</p>
          <h1 class="font-display text-4xl font-semibold text-charcoal">Panneau Superadmin</h1>
          <p class="text-sm text-muted mt-1">Gestion des rôles utilisateurs, KPIs financiers et configuration système.</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          ${construireKpi('fa-chart-line',    caFormate,    'Fcfa CA cumulé',   'text-terracotta')}
          ${construireKpi('fa-users',         listeUtilisateurs.length, 'Utilisateurs',     'text-charcoal')}
          ${construireKpi('fa-box',           totalProduits, 'Produits actifs',  'text-charcoal')}
          ${construireKpi('fa-percent',       '18,4',       '% Marge nette',    'text-terracotta')}
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 class="font-display text-xl font-semibold text-charcoal mb-4">Top Produits — Rentabilité (Données Réelles)</h2>
          <div class="space-y-3">
            ${tableauTopProduits.length > 0 ? 
              tableauTopProduits.map(function(prod) {
                var pct = Math.round((prod.quantiteVendue / maxVentes) * 100);
                var prixFormate = new Intl.NumberFormat('fr-FR').format(prod.prix) + ' Fcfa';
                return construireLigneRentabilite(prod.nom, prixFormate, prod.quantiteVendue, pct);
              }).join('')
              : '<p class="text-sm text-muted text-center py-4">Aucun produit vendu pour le moment dans les commandes réelles.</p>'
            }
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-display text-xl font-semibold text-charcoal">Gestion des Utilisateurs</h2>
            <span class="text-xs text-muted">Modifiez les rôles ou supprimez des comptes</span>
          </div>

          <div class="grid grid-cols-[2fr_2fr_1.5fr_auto] px-6 py-3 border-b border-gray-100">
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Utilisateur</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Email</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Rôle actuel</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Actions</span>
          </div>

          <div id="liste-utilisateurs-superadmin">
            <p class="text-center text-sm text-muted py-8">Chargement des utilisateurs…</p>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <h2 class="font-display text-xl font-semibold text-charcoal mb-4">Configuration Système</h2>
          <div class="grid md:grid-cols-3 gap-4">
            ${construireCarteConfig('fa-truck', 'Frais de livraison', 'Zones, tarifs, délais de livraison mobilier lourd', 'config-livraison')}
            ${construireCarteConfig('fa-percent', 'TVA & Taxes', 'Taux de TVA appliqués aux produits', 'config-tva')}
            ${construireCarteConfig('fa-bell', 'Historique Notifications', 'Alertes de commandes, devis et actions système', 'config-notifications')}
          </div>
        </div>

      </main>
    </div>
  `;

  attacherNavigationNavbar(prenom);
  rendreListeUtilisateurs(listeUtilisateurs, prenom);
  attacherEcouteursSuperadmin(prenom);
}

// ─── Rendu liste utilisateurs ─────────────────────────────────────────────────

function rendreListeUtilisateurs(utilisateurs, prenom) {
  var conteneur = document.getElementById('liste-utilisateurs-superadmin');
  if (!conteneur) return;

  conteneur.innerHTML = '';

  if (utilisateurs.length === 0) {
    var vide = document.createElement('p');
    vide.className = 'text-center text-sm text-muted py-8';
    vide.textContent = 'Aucun utilisateur trouvé.';
    conteneur.appendChild(vide);
    return;
  }

  utilisateurs.forEach(function(utilisateur) {
    var ligne = document.createElement('div');
    ligne.className = 'grid grid-cols-[2fr_2fr_1.5fr_auto] items-center px-6 py-4 border-b border-gray-50 hover:bg-beige/30 transition';
    ligne.setAttribute('data-id', utilisateur.id);

    var colonneNom = document.createElement('div');
    var nom = document.createElement('p');
    nom.className = 'text-sm font-medium text-charcoal';
    nom.textContent = utilisateur.nom;
    var entreprise = document.createElement('p');
    entreprise.className = 'text-xs text-muted';
    entreprise.textContent = utilisateur.entreprise || '—';
    colonneNom.appendChild(nom);
    colonneNom.appendChild(entreprise);

    var colonneEmail = document.createElement('p');
    colonneEmail.className = 'text-sm text-muted';
    colonneEmail.textContent = utilisateur.email;

    var colonneRole = document.createElement('div');
    var selectRole = document.createElement('select');
    selectRole.className = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-charcoal bg-beige/40 focus:outline-none focus:border-terracotta transition';
    selectRole.setAttribute('data-id', utilisateur.id);

    var roles = ['client', 'admin', 'superadmin'];
    roles.forEach(function(r) {
      var option = document.createElement('option');
      option.value = r;
      option.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      option.selected = utilisateur.role === r;
      selectRole.appendChild(option);
    });
    colonneRole.appendChild(selectRole);

    var colonneActions = document.createElement('div');
    colonneActions.className = 'flex gap-2';

    var boutonSauvegarder = document.createElement('button');
    boutonSauvegarder.type = 'button';
    boutonSauvegarder.className = 'w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-muted hover:text-terracotta hover:border-terracotta transition';
    boutonSauvegarder.setAttribute('data-id', utilisateur.id);
    boutonSauvegarder.setAttribute('data-action', 'sauvegarder-role');
    boutonSauvegarder.title = 'Sauvegarder le rôle';
    var iconeSauve = document.createElement('i');
    iconeSauve.className = 'fa-regular fa-floppy-disk text-xs';
    boutonSauvegarder.appendChild(iconeSauve);

    var boutonSupprimer = document.createElement('button');
    boutonSupprimer.type = 'button';
    boutonSupprimer.className = 'w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-muted hover:text-red-400 hover:border-red-200 transition';
    boutonSupprimer.setAttribute('data-id', utilisateur.id);
    boutonSupprimer.setAttribute('data-action', 'supprimer-utilisateur');
    boutonSupprimer.setAttribute('data-nom', utilisateur.nom);
    boutonSupprimer.title = 'Supprimer l\'utilisateur';
    var iconeSuppr = document.createElement('i');
    iconeSuppr.className = 'fa-regular fa-trash-can text-xs';
    boutonSupprimer.appendChild(iconeSuppr);

    colonneActions.appendChild(boutonSauvegarder);
    colonneActions.appendChild(boutonSupprimer);

    ligne.appendChild(colonneNom);
    ligne.appendChild(colonneEmail);
    ligne.appendChild(colonneRole);
    ligne.appendChild(colonneActions);

    conteneur.appendChild(ligne);
  });
}

// ─── Constructeurs ────────────────────────────────────────────────────────────

function construireKpi(icone, valeur, label, couleurVal) {
  return `
    <div class="bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-beige flex items-center justify-center flex-shrink-0">
        <i class="fa-solid ${icone} text-terracotta text-sm"></i>
      </div>
      <div>
        <p class="font-display text-xl font-semibold ${couleurVal}">${valeur}</p>
        <p class="text-xs text-muted">${label}</p>
      </div>
    </div>
  `;
}

function construireLigneRentabilite(nom, prix, ventes, pourcentage) {
  return `
    <div class="py-3 border-b border-gray-50">
      <div class="flex items-center justify-between mb-1.5">
        <p class="text-sm font-medium text-charcoal">${nom}</p>
        <div class="flex items-center gap-3">
          <span class="text-xs text-muted">${ventes} vendu(s)</span>
          <span class="text-sm font-semibold font-display text-terracotta">${prix}</span>
        </div>
      </div>
      <div class="w-full bg-beige rounded-full h-1.5">
        <div class="bg-terracotta h-1.5 rounded-full barre-graphique" style="width: ${pourcentage}%"></div>
      </div>
    </div>
  `;
}

function construireCarteConfig(icone, titre, description, idAction) {
  return `
    <div id="${idAction}" class="border border-gray-100 rounded-xl p-5 hover:border-terracotta transition cursor-pointer bg-white group">
      <i class="fa-solid ${icone} text-terracotta text-lg mb-3 block group-hover:scale-110 transition-transform"></i>
      <p class="text-sm font-semibold text-charcoal mb-1">${titre}</p>
      <p class="text-xs text-muted">${description}</p>
    </div>
  `;
}

// ─── Écouteurs d'Événements & Modales Config ──────────────────────────────────

function attacherEcouteursSuperadmin(prenom) {
  var conteneur = document.getElementById('liste-utilisateurs-superadmin');
  if (conteneur) {
    var nouveauConteneur = conteneur.cloneNode(true);
    conteneur.parentNode.replaceChild(nouveauConteneur, conteneur);

    nouveauConteneur.addEventListener('click', async function(evenement) {
      var bouton = evenement.target.closest('button[data-action]');
      if (!bouton) return;

      var id     = bouton.getAttribute('data-id');
      var action = bouton.getAttribute('data-action');

      if (action === 'sauvegarder-role') {
        var selectRole = nouveauConteneur.querySelector('select[data-id="' + id + '"]');
        if (!selectRole) return;
        var nouveauRole = selectRole.value;
        try {
          await modifierRoleUtilisateur(id, nouveauRole);
          afficherNotification('Rôle mis à jour avec succès.', 'succes');
        } catch (e) {
          afficherNotification('Erreur lors de la mise à jour.', 'erreur');
        }
      }

      if (action === 'supprimer-utilisateur') {
        var nomUtilisateur = bouton.getAttribute('data-nom');
        if (!confirm('Supprimer le compte de ' + nomUtilisateur + ' ? Cette action est irréversible.')) return;
        try {
          await supprimerUtilisateur(id);
          listeUtilisateurs = listeUtilisateurs.filter(function(u) { return String(u.id) !== String(id); });
          rendreListeUtilisateurs(listeUtilisateurs, prenom);
          afficherNotification('Utilisateur supprimé.', 'succes');
        } catch (e) {
          afficherNotification('Erreur lors de la suppression.', 'erreur');
        }
      }
    });
  }

  // Écouteurs pour les cartes de configuration système
  var btnLivraison = document.getElementById('config-livraison');
  var btnTVA       = document.getElementById('config-tva');
  var btnNotifs    = document.getElementById('config-notifications');

  if (btnLivraison) btnLivraison.addEventListener('click', function() { ouvrirModalParametrage('livraison'); });
  if (btnTVA)       btnTVA.addEventListener('click', function() { ouvrirModalParametrage('tva'); });
  if (btnNotifs)    btnNotifs.addEventListener('click', ouvrirModalNotificationsHistorique);
}

// ─── Logique des Modales Système ──────────────────────────────────────────────

function creerConteneurModal(titre, contenuHTML) {
  var existant = document.getElementById('modal-systeme-superadmin');
  if (existant) existant.remove();

  var modal = document.createElement('div');
  modal.id = 'modal-systeme-superadmin';
  modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4';
  
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-beige/30">
        <h3 class="font-display text-xl font-semibold text-charcoal">${titre}</h3>
        <button id="fermer-modal-sys" class="text-muted hover:text-red-500 transition">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
      <div class="p-6 overflow-y-auto flex-1">
        ${contenuHTML}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  document.getElementById('fermer-modal-sys').addEventListener('click', function() { modal.remove(); });
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

function ouvrirModalParametrage(type) {
  var estTVA = (type === 'tva');
  var cleStorage = estTVA ? 'decoflow_config_tva' : 'decoflow_config_livraison';
  var valeurDefaut = estTVA ? '18' : '15000';
  var valeurActuelle = localStorage.getItem(cleStorage) || valeurDefaut;
  
  var titre = estTVA ? 'Paramétrage TVA (%)' : 'Frais de livraison de base (Fcfa)';
  var symbole = estTVA ? '%' : 'Fcfa';

  var html = `
    <div class="flex flex-col gap-4">
      <p class="text-sm text-muted mb-2">Modifiez la valeur par défaut appliquée à l'ensemble du catalogue.</p>
      <div class="relative">
        <input type="number" id="input-config-valeur" value="${valeurActuelle}" 
          class="w-full border border-gray-200 rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:border-terracotta transition" />
        <span class="absolute right-4 top-3 text-muted font-medium">${symbole}</span>
      </div>
      <button id="sauvegarder-config-btn" class="mt-4 bg-terracotta text-white font-semibold rounded-lg px-4 py-3 hover:bg-[#b06a4b] transition flex items-center justify-center gap-2">
        <i class="fa-solid fa-floppy-disk"></i> Enregistrer les modifications
      </button>
    </div>
  `;

  creerConteneurModal(titre, html);

  document.getElementById('sauvegarder-config-btn').addEventListener('click', function() {
    var nvVal = document.getElementById('input-config-valeur').value;
    localStorage.setItem(cleStorage, nvVal);
    document.getElementById('modal-systeme-superadmin').remove();
    afficherNotification('Configuration système mise à jour.', 'succes');
  });
}

async function ouvrirModalNotificationsHistorique() {
  creerConteneurModal("Historique du Système", "<p class='text-center text-muted text-sm py-10'><i class='fa-solid fa-spinner fa-spin mr-2'></i> Chargement des logs...</p>");

  try {
    var rep = await fetch(API_URL_NOTIFICATIONS);
    var notifs = rep.ok ? await rep.json() : [];
    
    // Tri de la plus récente à la plus ancienne
    notifs.sort((a, b) => new Date(b.date) - new Date(a.date));

    var html = notifs.length === 0 
      ? "<p class='text-sm text-muted text-center py-6'>Aucune activité récente sur le système.</p>"
      : notifs.map(function(n) {
          var iconeType = n.type === 'commande' ? '<i class="fa-solid fa-box text-blue-500"></i>' : '<i class="fa-solid fa-file-invoice text-terracotta"></i>';
          var dateLocale = new Date(n.date).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
          
          return `
            <div class="py-4 border-b border-gray-50 last:border-0 flex gap-4 items-start">
              <div class="w-8 h-8 rounded bg-gray-50 flex items-center justify-center flex-shrink-0 mt-1">${iconeType}</div>
              <div>
                <p class="text-sm font-semibold text-charcoal">${n.titre}</p>
                <p class="text-xs text-muted mt-0.5 leading-relaxed">${n.message}</p>
                <p class="text-[10px] font-medium text-gray-400 mt-2 uppercase tracking-wider">${dateLocale} — Réf #${n.referenceId}</p>
              </div>
            </div>
          `;
        }).join('');

    // Mise à jour de la modale existante avec les vraies données
    var modale = document.getElementById('modal-systeme-superadmin');
    if (modale) {
      modale.querySelector('.overflow-y-auto').innerHTML = html;
    }
  } catch(e) {
    var modale = document.getElementById('modal-systeme-superadmin');
    if (modale) modale.querySelector('.overflow-y-auto').innerHTML = "<p class='text-sm text-red-500'>Erreur de connexion à la base de données.</p>";
  }
}

// ─── Toasts ───────────────────────────────────────────────────────────────────

function afficherNotification(message, type) {
  var ancienneNotif = document.getElementById('notif-systeme');
  if (ancienneNotif) ancienneNotif.remove();

  var notification = document.createElement('div');
  notification.id = 'notif-systeme';
  notification.className = [
    'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition duration-300 transform translate-y-0',
    type === 'succes' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
  ].join(' ');
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(function() { notification.remove(); }, 3000);
}