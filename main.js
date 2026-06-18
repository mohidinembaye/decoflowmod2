import { lireSession, supprimerSession } from './db.js';

// ─── Session ──────────────────────────────────────────────────────────────────

var session = lireSession();
var ROLES_VALIDES = ['client', 'admin', 'superadmin'];

function sessionValide(s) {
  return Boolean(s && s.email && s.nom && ROLES_VALIDES.includes(s.role));
}
function estConnecte() { return sessionValide(session); }
function lireRole()    { return session ? session.role : null; }
function lireUserId()  { return session ? (session.id || session.userId || null) : null; }

function rafraichirSession() {
  session = lireSession();
  if (session && !sessionValide(session)) { supprimerSession(); session = null; }
}

// ─── Gardes ───────────────────────────────────────────────────────────────────
// Retourne true  -> on rend la page demandée
// Retourne string-> on redirige vers cette page (via changement de hash)
// Retourne false -> bloqué silencieusement

function gardePublique() {
  return estConnecte() ? 'dashboard' : true;
}
function gardeConnecte() {
  return estConnecte() ? true : 'connexion';
}
function gardeAdmin() {
  if (!estConnecte()) return 'connexion';
  var r = lireRole();
  if (r !== 'admin' && r !== 'superadmin') { alert('Accès refusé.'); return 'dashboard'; }
  return true;
}
function gardeSuperadmin() {
  if (!estConnecte()) return 'connexion';
  return lireRole() === 'superadmin' ? true : 'dashboard';
}

// ─── Table des routes ─────────────────────────────────────────────────────────

const ROUTES = {
  'accueil':           { module: './accueil.js',       fonction: 'afficherPageAccueil' },
  'connexion':         { module: './connexion.js',     fonction: 'afficherPageConnexion',    garde: gardePublique },
  'inscription':       { module: './inscription.js',   fonction: 'afficherPageInscription',  garde: gardePublique },
  'dashboard':         { module: './dashboard.js',     fonction: 'afficherPageDashboard',    garde: gardeConnecte },
  'categories':        { module: './categories.js',    fonction: 'afficherPageCategories',   garde: gardeConnecte },
  'profil':            { module: './profil.js',        fonction: 'afficherPageProfil',       garde: gardeConnecte },
  'produits':          { module: './produits.js',      fonction: 'afficherPageProduits',     garde: gardeConnecte },
  'devis':             { module: './devis.js',         fonction: 'afficherPageDevis',        garde: gardeConnecte },
  'commandes':         { module: './commandes.js',     fonction: 'afficherPageCommandes',    garde: gardeConnecte },
  'panier':            { module: './panier.js',        fonction: 'afficherPagePanier',       garde: gardeConnecte },
  'clients':           { module: './clients.js',       fonction: 'afficherPageClients',      garde: gardeAdmin },
  'admin-panel':       { module: './admin.js',         fonction: 'afficherPageAdminPanel',   garde: gardeAdmin },
  'superadmin-panel':  { module: './superadmin.js',    fonction: 'afficherPageSuperadmin',   garde: gardeSuperadmin }
};

// ─── Hooks after render ───────────────────────────────────────────────────────

var hooksApresRendu = [];
export function apresRendu(hook) { hooksApresRendu.push(hook); }

function declencherApresRendu(ctx) {
  for (var i = 0; i < hooksApresRendu.length; i++) {
    try { hooksApresRendu[i](ctx); } catch (e) { console.error('afterRender:', e); }
  }
}

// Hook par défaut : scroll en haut + titre
apresRendu(function (ctx) {
  window.scrollTo(0, 0);
  document.title = 'DecoFlow — ' + ctx.page;
});

// ─── Routeur ──────────────────────────────────────────────────────────────────

var pageActuelle = null;

function redirigerVers(page) {
  if (window.location.hash.replace('#', '') === page) {
    gererRoutage(); // même hash, on relance manuellement
  } else {
    window.location.hash = '#' + page; // déclenche hashchange -> gererRoutage
  }
}

async function gererRoutage() {
  rafraichirSession();

  var hash = window.location.hash.replace('#', '') || (estConnecte() ? 'dashboard' : 'accueil');
  var conteneurApp = document.getElementById('app');
  if (!conteneurApp) return;

  var route = ROUTES[hash];

  if (!route) {
    conteneurApp.innerHTML = '<h1 class="text-2xl font-bold text-gray-700">404 - Page Introuvable</h1>';
    return;
  }

  // Garde
  if (typeof route.garde === 'function') {
    var resultat = route.garde();
    if (resultat === false) return;
    if (typeof resultat === 'string' && resultat !== hash) { redirigerVers(resultat); return; }
  }

  try {
    var module = await import(route.module);
    var fn = module[route.fonction];
    if (typeof fn !== 'function') throw new Error('Fonction ' + route.fonction + ' introuvable dans ' + route.module);

    var prenom = session ? session.nom : undefined;
    var role   = lireRole() || 'client';
    var userId = lireUserId();

    fn(prenom, role, userId);
    pageActuelle = hash;

    // After render
    queueMicrotask(function () {
      declencherApresRendu({
        page:    hash,
        prenom:  prenom,
        role:    role,
        userId:  userId,
        session: session
      });
    });
  } catch (erreur) {
    console.error('Erreur lors du chargement de la page [' + hash + '] :', erreur);
    conteneurApp.innerHTML = '<h1 class="text-red-500 font-bold">Erreur de chargement de la page.</h1>';
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export function naviguerVers(page /*, nom */) {
  redirigerVers(page || (estConnecte() ? 'dashboard' : 'accueil'));
}

export function verifierSessionSecurisee() { rafraichirSession(); return estConnecte(); }

export function deconnecter() {
  supprimerSession();
  session = null;
  redirigerVers('connexion');
}

window.decoflowRouter = {
  naviguerVers:             naviguerVers,
  deconnecter:              deconnecter,
  verifierSessionSecurisee: verifierSessionSecurisee,
  lireSessionActive:        function () { rafraichirSession(); return session; },
  apresRendu:               apresRendu,
  pageActuelle:             function () { return pageActuelle; }
};

// ─── Démarrage ────────────────────────────────────────────────────────────────

window.addEventListener('hashchange',     gererRoutage);
window.addEventListener('DOMContentLoaded', gererRoutage);