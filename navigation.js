import { afficherPageDashboard }    from './dashboard.js';
import { afficherPageCategories }   from './categories.js';
import { afficherPageProfil }       from './profil.js';
import { afficherPageDevis }        from './devis.js';
import { afficherPageProduits }     from './produits.js';
import { afficherPageCommandes }    from './commandes.js';
import { afficherPagePanier }       from './panier.js';
import { afficherPageClients }      from './clients.js';
import { afficherPageAdminPanel }   from './admin.js';
import { afficherPageSuperadmin }   from './superadmin.js';
import {
  lireSession,
  supprimerSession,
  compterArticlesPanier,
  recupererNotificationsAdmin,
  compterNotificationsNonLues,
  marquerNotificationLue,
  marquerToutesLuesAdmin
} from './db.js';

// ─── Fonctions ────────────────────────────────────────────────────────────────

var LIENS_NAVIGATION = {
  'nav-dashboard':        { page: 'dashboard',        label: 'Dashboard',  roles: [ 'admin', 'superadmin'] },
  'nav-produits':         { page: 'produits',         label: 'Produits',   roles: ['client', 'admin', 'superadmin'] },
  'nav-categories':       { page: 'categories',       label: 'Catégories', roles: ['client', 'admin', 'superadmin'] },
  'nav-orders':           { page: 'commandes',        label: 'Commandes',  roles: ['client', 'admin', 'superadmin'] },
  'nav-quotes':           { page: 'devis',            label: 'Devis',      roles: ['client', 'admin', 'superadmin'] },
  'nav-customers':        { page: 'clients',          label: 'Clients',    roles: ['admin', 'superadmin'] },
  'nav-admin-panel':      { page: 'admin-panel',      label: 'Admin',      roles: ['admin', 'superadmin'] },
  'nav-superadmin-panel': { page: 'superadmin-panel', label: 'Superadmin', roles: ['superadmin'] }
};

var ORDRE_NAVIGATION = [
  'nav-dashboard', 'nav-produits', 'nav-categories', 'nav-orders',
  'nav-quotes', 'nav-customers', 'nav-admin-panel', 'nav-superadmin-panel'
];

function prevenir(e) { if (e && typeof e.preventDefault === 'function') e.preventDefault(); }

function attacherLien(id, action) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', function(e) { prevenir(e); action(); });
}

function naviguer(page, prenom, fallback) {
  if (window.decoflowRouter && typeof window.decoflowRouter.naviguerVers === 'function') {
    window.decoflowRouter.naviguerVers(page, prenom);
    return;
  }
  fallback();
}

function pageActiveDepuisUrl() {
  return (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
}

function classesLienNav(estActif) {
  return estActif
    ? 'nav-lien px-3 py-1.5 text-sm font-medium text-white border-b-2 border-terracotta'
    : 'nav-lien px-3 py-1.5 text-sm text-white/60 hover:text-white border-b-2 border-transparent hover:border-terra-light transition';
}

function construireLienNav(id, role, pageActive) {
  var config = LIENS_NAVIGATION[id];
  if (!config || !config.roles.includes(role)) return '';
  return '<a id="' + id + '" href="#" class="' + classesLienNav(config.page === pageActive) + '">' + config.label + '</a>';
}

function libelleRole(role) {
  return ({ client: 'Client', admin: 'Admin', superadmin: 'Superadmin' })[role] || 'Client';
}

function iconeRole(role) {
  if (role === 'superadmin') return 'fa-solid fa-crown';
  if (role === 'admin') return 'fa-solid fa-shield-halved';
  return 'fa-solid fa-user';
}

function appliquerDesignNavbar(role, prenom) {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  var nbPanier = compterArticlesPanier();
  var afficheBadge = (role === 'client') && nbPanier > 0;

  navbar.className = 'bg-charcoal px-4 sm:px-6 py-3 sticky top-0 z-50';
  navbar.innerHTML = `
    <div class="w-full max-w-7xl mx-auto flex items-start gap-6">
      <div id="navbar-logo" class="flex items-center gap-2 min-w-max">
        <img src="LOGOD.png" alt="DecoFlow" class="h-8 brightness-0 invert" />
        <span class="font-display text-2xl font-semibold text-white tracking-wide">DecoFlow</span>
        <span class="text-[10px] font-semibold uppercase tracking-wider bg-terracotta text-white px-2 py-0.5 rounded-sm ml-1">
          ${libelleRole(role)}
        </span>
      </div>

      <nav id="navbar-nav" class="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto whitespace-nowrap"></nav>

      <div id="navbar-droite" class="flex items-center gap-3 min-w-max ml-auto">
        ${role === 'client' ? `
          <button id="bouton-panier" type="button" class="relative text-white/80 hover:text-white transition w-9 h-9 flex items-center justify-center" title="Mon panier">
            <i class="fa-solid fa-cart-shopping text-base"></i>
            <span id="badge-panier" class="${afficheBadge ? '' : 'hidden'} absolute -top-1 -right-1 bg-terracotta text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">${nbPanier}</span>
          </button>
        ` : ''}
        ${(role === 'admin' || role === 'superadmin') ? `
          <div id="conteneur-cloche" class="relative">
            <button id="bouton-notifications" type="button"
              class="relative text-white/80 hover:text-white transition w-9 h-9 flex items-center justify-center"
              title="Notifications">
              <i class="fa-solid fa-bell text-base"></i>
              <span id="badge-notifications" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">0</span>
            </button>
            <div id="panneau-notifications"
              class="hidden absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[300] overflow-hidden"
              style="max-height:420px;">
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span class="font-display text-base font-semibold text-charcoal" style="font-family:'Cormorant Garamond',serif;">Notifications</span>
                <button id="bouton-tout-lire" class="text-[10px] text-terracotta hover:underline uppercase tracking-wider font-semibold">Tout marquer lu</button>
              </div>
              <div id="liste-notifications" class="overflow-y-auto" style="max-height:340px;">
                <p class="text-xs text-center text-gray-400 py-8">Chargement…</p>
              </div>
            </div>
          </div>
        ` : ''}
        <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
          <span class="text-sm font-medium text-white hidden sm:block">${(prenom || 'Utilisateur').split(' ')[0]}</span>
          <div class="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
            <i class="${iconeRole(role)} text-white text-sm"></i>
          </div>
        </div>
        <button id="bouton-deconnexion" type="button" class="text-xs text-white/60 hover:text-red-300 transition flex items-center gap-1">
          <i class="fa-solid fa-right-from-bracket text-xs"></i>
          <span class="hidden lg:inline">Déconnexion</span>
        </button>
      </div>
    </div>
  `;
}

function appliquerMenuRole(role) {
  var nav = document.getElementById('navbar-nav');
  if (!nav) return;
  var pageActive = pageActiveDepuisUrl();
  nav.innerHTML = ORDRE_NAVIGATION
    .map(function (id) { return construireLienNav(id, role, pageActive); })
    .join('');
}

function masquerElement(id) {
  var element = document.getElementById(id);
  if (element) element.classList.add('hidden');
}

function appliquerPermissionsInterface(role) {
  if (role === 'client') {
    masquerElement('bouton-ajouter-produit');
    masquerElement('bouton-ajouter-categorie');
    return;
  }
  var btn1 = document.getElementById('bouton-ajouter-produit');
  if (btn1) btn1.classList.remove('hidden');
  var btn2 = document.getElementById('bouton-ajouter-categorie');
  if (btn2) btn2.classList.remove('hidden');
}

export function attacherNavigationNavbar(prenomUtilisateur) {
  var prenom  = prenomUtilisateur || 'Utilisateur';
  var session = lireSession();
  var role    = session && session.role ? session.role : 'client';

  appliquerDesignNavbar(role, prenom);
  appliquerMenuRole(role);
  appliquerPermissionsInterface(role);

  attacherLien('nav-dashboard',  function() { naviguer('dashboard',  prenom, function() { afficherPageDashboard(prenom); }); });
  attacherLien('nav-produits',   function() { naviguer('produits',   prenom, function() { afficherPageProduits(prenom); }); });
  attacherLien('nav-categories', function() { naviguer('categories', prenom, function() { afficherPageCategories(prenom); }); });
  attacherLien('nav-orders',     function() { naviguer('commandes',  prenom, function() { afficherPageCommandes(prenom); }); });
  attacherLien('nav-quotes',     function() { naviguer('devis',      prenom, function() { afficherPageDevis(prenom); }); });
  attacherLien('nav-customers',  function() { naviguer('clients',    prenom, function() { afficherPageClients(prenom); }); });
  attacherLien('bouton-panier',  function() { naviguer('panier',     prenom, function() { afficherPagePanier(prenom); }); });

  if (role === 'admin' || role === 'superadmin') {
    attacherLien('nav-admin-panel', function() { naviguer('admin-panel', prenom, function() { afficherPageAdminPanel(prenom); }); });
  }
  if (role === 'superadmin') {
    attacherLien('nav-superadmin-panel', function() { naviguer('superadmin-panel', prenom, function() { afficherPageSuperadmin(prenom); }); });
  }

  attacherLien('profil-utilisateur', function() { naviguer('profil', prenom, function() { afficherPageProfil(prenom); }); });

  var boutonDeconnexion = document.getElementById('bouton-deconnexion');
  if (boutonDeconnexion) {
    boutonDeconnexion.addEventListener('click', function() {
      if (window.decoflowRouter) { window.decoflowRouter.deconnecter(); return; }
      supprimerSession();
      window.location.hash = '#accueil';
    });
  }

  // Cloche notifications (admin/superadmin uniquement)
  if (role === 'admin' || role === 'superadmin') {
    initialiserCloche();
  }
}

// ─── Cloche notifications ─────────────────────────────────────────────────────

async function initialiserCloche() {
  await rafraichirBadgeNotifications();

  var bouton = document.getElementById('bouton-notifications');
  var panneau = document.getElementById('panneau-notifications');
  if (!bouton || !panneau) return;

  // Bug corrigé : on charge quand on OUVRE (panneau était caché = hidden présent)
  bouton.addEventListener('click', function(e) {
    e.stopPropagation();
    var estache = panneau.classList.contains('hidden');
    panneau.classList.toggle('hidden');
    if (estache) chargerListeNotifications(); // on vient d'ouvrir
  });

  // Bug corrigé : utiliser une variable nommée sur window pour éviter l'accumulation
  if (window._decoflowFermerNotifs) {
    document.removeEventListener('click', window._decoflowFermerNotifs);
  }
  window._decoflowFermerNotifs = function(e) {
    var conteneur = document.getElementById('conteneur-cloche');
    if (conteneur && !conteneur.contains(e.target)) {
      var p = document.getElementById('panneau-notifications');
      if (p) p.classList.add('hidden');
    }
  };
  document.addEventListener('click', window._decoflowFermerNotifs);

  var boutonToutLire = document.getElementById('bouton-tout-lire');
  if (boutonToutLire) {
    boutonToutLire.addEventListener('click', async function() {
      await marquerToutesLuesAdmin();
      await rafraichirBadgeNotifications();
      await chargerListeNotifications();
    });
  }
}

async function rafraichirBadgeNotifications() {
  var badge = document.getElementById('badge-notifications');
  if (!badge) return;
  var nb = await compterNotificationsNonLues();
  badge.textContent = nb > 9 ? '9+' : nb;
  // Forcer l'affichage inline-flex via style pour contourner Tailwind CDN
  if (nb > 0) {
    badge.style.display = 'flex';
    badge.classList.remove('hidden');
  } else {
    badge.style.display = '';
    badge.classList.add('hidden');
  }
}

async function chargerListeNotifications() {
  var liste = document.getElementById('liste-notifications');
  if (!liste) return;

  liste.innerHTML = '<p class="text-xs text-center text-gray-400 py-8">Chargement…</p>';
  var notifications = await recupererNotificationsAdmin();

  if (notifications.length === 0) {
    liste.innerHTML = `
      <div class="text-center py-10">
        <i class="fa-regular fa-bell-slash text-2xl text-gray-300 mb-2 block"></i>
        <p class="text-xs text-gray-400">Aucune notification</p>
      </div>
    `;
    return;
  }

  liste.innerHTML = '';
  notifications.forEach(function(notif) {
    var el = document.createElement('div');
    var icone = notif.type === 'commande'
      ? 'fa-solid fa-bag-shopping text-blue-500'
      : 'fa-solid fa-file-invoice text-terracotta';
    var fond = notif.lue ? 'bg-white' : 'bg-orange-50';
    var dateStr = new Date(notif.date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    el.className = fond + ' border-b border-gray-100 px-4 py-3 hover:bg-beige transition cursor-pointer flex items-start gap-3';
    el.innerHTML = `
      <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <i class="${icone} text-sm"></i>
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-charcoal leading-snug">${notif.titre}</p>
        <p class="text-xs text-muted mt-0.5 leading-snug truncate">${notif.message}</p>
        <p class="text-[10px] text-gray-400 mt-1">${dateStr}</p>
      </div>
      ${!notif.lue ? '<span class="w-2 h-2 rounded-full bg-terracotta flex-shrink-0 mt-2"></span>' : ''}
    `;

    el.addEventListener('click', async function() {
      if (!notif.lue) {
        await marquerNotificationLue(notif.id);
        notif.lue = true;
        el.classList.remove('bg-orange-50');
        el.classList.add('bg-white');
        var point = el.querySelector('span.bg-terracotta');
        if (point) point.remove();
        await rafraichirBadgeNotifications();
      }
      // Naviguer vers la page correspondante
      var page = notif.type === 'commande' ? 'commandes' : 'devis';
      var panneau = document.getElementById('panneau-notifications');
      if (panneau) panneau.classList.add('hidden');
      if (window.decoflowRouter) window.decoflowRouter.naviguerVers(page);
    });

    liste.appendChild(el);
  });
}