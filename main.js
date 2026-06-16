import { afficherPageAccueil }      from "./accueil.js";
import { afficherPageConnexion }    from "./connexion.js";
import { afficherPageInscription }  from "./inscription.js";
import { afficherPageDashboard }    from "./dashboard.js";
import { afficherPageCategories }   from "./categories.js";
import { afficherPageProfil }       from "./profil.js";
import { afficherPageDevis }        from "./devis.js";
import { afficherPageProduits }     from "./produits.js";
import { afficherPageCommandes }    from "./commandes.js";
import { afficherPagePanier }       from "./panier.js";
import { afficherPageClients }      from "./clients.js";
import { afficherPageAdminPanel }   from "./admin.js";
import { afficherPageSuperadmin }   from "./superadmin.js";
import { lireSession, supprimerSession } from "./db.js";

var session = lireSession();
var ROLES_VALIDES = ["client", "admin", "superadmin"];
var PAGES_CONNECTEES = ["dashboard", "categories", "profil", "produits", "devis", "commandes", "panier"];

function sessionValide(s) {
  return Boolean(s && s.email && s.nom && ROLES_VALIDES.includes(s.role));
}
function estConnecte()  { return sessionValide(session); }
function lireRole()     { return session ? session.role : null; }
function lireUserId()   { return session ? (session.id || session.userId || null) : null; }

function rafraichirSession() {
  session = lireSession();
  if (session && !sessionValide(session)) { supprimerSession(); session = null; }
}

function gardePublique() { if (estConnecte()) { rendrePage("dashboard", session.nom); return false; } return true; }
function gardeConnecte() { if (!estConnecte()) { rendrePage("connexion"); return false; } return true; }
function gardeAdmin() {
  if (!estConnecte()) { rendrePage("connexion"); return false; }
  var r = lireRole();
  if (r !== "admin" && r !== "superadmin") { alert("Accès refusé."); rendrePage("dashboard", session.nom); return false; }
  return true;
}
function gardeSuperadmin() {
  if (!estConnecte()) { rendrePage("connexion"); return false; }
  if (lireRole() !== "superadmin") { rendrePage("dashboard", session.nom); return false; }
  return true;
}

function normaliserPage(page) { return (page || "").replace("#", "").trim() || null; }
function nomFallback(nom) { return nom || (session && session.nom) || undefined; }

function rendrePage(page, nom) {
  var role   = lireRole() || "client";
  var userId = lireUserId();
  var prenom = nomFallback(nom);

  var routes = {
    accueil:              function () { afficherPageAccueil(); },
    connexion:            function () { afficherPageConnexion(); },
    inscription:          function () { afficherPageInscription(); },
    dashboard:            function () { afficherPageDashboard(prenom, role, userId); },
    categories:           function () { afficherPageCategories(prenom, role, userId); },
    profil:               function () { afficherPageProfil(prenom, role, userId); },
    produits:             function () { afficherPageProduits(prenom, role, userId); },
    devis:                function () { afficherPageDevis(prenom, role, userId); },
    commandes:            function () { afficherPageCommandes(prenom, role, userId); },
    panier:               function () { afficherPagePanier(prenom, role, userId); },
    clients:              function () { afficherPageClients(prenom, role, userId); },
    "admin-panel":        function () { afficherPageAdminPanel(prenom, role, userId); },
    "superadmin-panel":   function () { afficherPageSuperadmin(prenom, role, userId); }
  };
  (routes[page] || routes.accueil)();
}

export function naviguerVers(page, nom) {
  rafraichirSession();
  var p = normaliserPage(page) || (estConnecte() ? "dashboard" : "accueil");

  if (p === "connexion" || p === "inscription")     { if (gardePublique())   rendrePage(p, nom); return; }
  if (PAGES_CONNECTEES.includes(p))                 { if (gardeConnecte())   rendrePage(p, nom); return; }
  if (p === "admin-panel" || p === "clients")       { if (gardeAdmin())      rendrePage(p, nom); return; }
  if (p === "superadmin-panel")                     { if (gardeSuperadmin()) rendrePage(p, nom); return; }
  if (p === "accueil")                              { rendrePage("accueil"); return; }

  rendrePage(estConnecte() ? "dashboard" : "accueil", nomFallback(nom));
}

function naviguerDepuisHistorique(page, nom) {
  var orig = history.pushState;
  history.pushState = function (etat, titre, url) { history.replaceState(etat, titre, url); };
  try { naviguerVers(page, nom); } finally { history.pushState = orig; }
}

function naviguerDepuisHashInitial() {
  var p = normaliserPage(window.location.hash) || (estConnecte() ? "dashboard" : "accueil");
  naviguerVers(p, session && session.nom);
}

export function verifierSessionSecurisee() { rafraichirSession(); return estConnecte(); }

export function deconnecter() {
  supprimerSession();
  session = null;
  rendrePage("connexion");
}

window.decoflowRouter = {
  naviguerVers: naviguerVers,
  deconnecter: deconnecter,
  verifierSessionSecurisee: verifierSessionSecurisee,
  lireSessionActive: function () { rafraichirSession(); return session; }
};

rafraichirSession();
if (!window.location.hash) window.location.hash = '#accueil';
naviguerDepuisHashInitial();

window.addEventListener("popstate", function (e) {
  rafraichirSession();
  if (!e.state || !e.state.page) {
    naviguerDepuisHistorique(window.location.hash, session && session.nom);
    return;
  }
  naviguerDepuisHistorique(e.state.page, e.state.nom);
});
