import { attacherNavigationNavbar } from './navigation.js';
import { lireSession } from './db.js';

// ─── Configuration de l'API ──────────────────────────────────────────────────
const API_URL_PRODUITS   = 'http://localhost:3001/produits';
const API_URL_COMMANDES  = 'http://localhost:3001/commandes';

var tousLesProduits     = [];
var toutesLesCommandes  = [];
var filtreRechercheAdmin = '';

export async function afficherPageAdminPanel(prenomUtilisateur) {
  var session = lireSession();
  var prenom  = prenomUtilisateur || (session && session.nom) || 'Admin';
  var role    = session ? session.role : null;

  if (role !== 'admin' && role !== 'superadmin') {
    import('./dashboard.js').then(function(m) { m.afficherPageDashboard(prenom); });
    return;
  }

  history.pushState({ page: 'admin-panel', nom: prenom }, '', '#admin-panel');

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  var conteneurApp = document.getElementById('app');
  conteneurApp.className = 'w-full';

  // 1. Chargement immédiat des données du serveur
  await rafraichirDonneesAdmin();

  // 2. Injection de l'interface complète (y compris la boîte modale cachée pour ajouter/modifier)
  conteneurApp.innerHTML = `
    <div id="page-admin-panel" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <header id="navbar" class="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div class="flex items-center gap-2 mr-10">
          <img src="LOGOD.png" alt="DecoFlow" class="h-8" />
          <span class="font-display text-2xl font-semibold text-charcoal tracking-wide">DecoFlow</span>
        </div>
        <nav class="hidden md:flex items-center gap-1 flex-1">
          <a id="nav-dashboard"    href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Dashboard</a>
          <a id="nav-produits"     href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Produits</a>
          <a id="nav-categories"   href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Catégories</a>
          <a id="nav-orders"       href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Commandes</a>
          <a id="nav-quotes"       href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Devis</a>
          <a id="nav-customers"    href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Clients</a>
          <a id="nav-admin-panel"  href="#" class="nav-lien px-3 py-1.5 text-sm font-medium text-charcoal border-b-2 border-terracotta">Admin</a>
          ${role === 'superadmin' ? '<a id="nav-superadmin-panel" href="#" class="nav-lien px-3 py-1.5 text-sm text-muted hover:text-charcoal border-b-2 border-transparent hover:border-terra-light transition">Superadmin</a>' : ''}
        </nav>
        <div class="flex items-center gap-4">
          <div id="profil-utilisateur" class="flex items-center gap-2 cursor-pointer">
            <span class="text-sm font-medium text-charcoal hidden sm:block">${prenom.split(' ')[0]}</span>
            <div class="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center">
              <i class="fa-solid fa-shield-halved text-white text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <div class="mb-8">
          <p class="text-xs text-terracotta uppercase tracking-widest font-semibold mb-1">Panneau Administrateur</p>
          <h1 class="font-display text-4xl font-semibold text-charcoal">Gestion du Catalogue</h1>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button id="bouton-ajouter-produit" type="button" class="rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-md transition bg-terracotta text-white w-full">
            <i class="fa-solid fa-plus text-xl"></i>
            <span class="text-xs font-semibold uppercase tracking-wider text-center">Ajouter un produit</span>
          </button>
          <div class="rounded-xl p-5 flex flex-col items-center gap-3 bg-white text-charcoal border border-gray-100 text-center text-xs justify-center font-semibold uppercase tracking-wider">
            <i class="fa-solid fa-boxes-stacked text-xl text-muted"></i> Stock global: ${tousLesProduits.reduce((s, p) => s + (parseInt(p.stock) || 0), 0)}
          </div>
          <div class="rounded-xl p-5 flex flex-col items-center gap-3 bg-white text-charcoal border border-gray-100 text-center text-xs justify-center font-semibold uppercase tracking-wider">
            <i class="fa-solid fa-file-invoice text-xl text-muted"></i> Commandes: ${toutesLesCommandes.length}
          </div>
          <div class="rounded-xl p-5 flex flex-col items-center gap-3 bg-white text-charcoal border border-gray-100 text-center text-xs justify-center font-semibold uppercase tracking-wider">
            <i class="fa-solid fa-truck text-xl text-muted"></i> En cours: ${toutesLesCommandes.filter(c => c.statut !== 'Livré').length}
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-display text-xl font-semibold text-charcoal">Catalogue Mobilier</h2>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input id="champ-recherche-admin" type="text" placeholder="Rechercher un produit…" class="border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-xs text-charcoal placeholder-gray-400 bg-beige/40 focus:outline-none focus:border-terracotta transition w-60" />
            </div>
          </div>

          <div class="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-6 py-3 border-b border-gray-100 bg-gray-50/50">
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Produit</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Catégorie</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Prix</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Stock</span>
            <span class="text-xs font-semibold text-muted uppercase tracking-wider">Actions</span>
          </div>

          <div id="liste-produits-admin"></div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <h2 class="font-display text-xl font-semibold text-charcoal mb-4">Commandes Récentes</h2>
          <div id="liste-commandes-admin" class="space-y-3"></div>
        </div>
      </main>
    </div>

    <div id="modale-produit-admin" class="hidden fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <h3 id="modale-titre" class="font-display text-2xl font-semibold text-charcoal mb-4">Ajouter un meuble</h3>
        <form id="formulaire-produit-admin" class="space-y-4">
          <input type="hidden" id="form-produit-id" />
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Nom du meuble</label>
            <input type="text" id="form-produit-nom" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Catégorie</label>
            <input type="text" id="form-produit-categorie" required placeholder="Salon, Chambre, Bureau..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Prix (FCFA)</label>
              <input type="number" id="form-produit-prix" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">Unités en Stock</label>
              <input type="number" id="form-produit-stock" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" id="btn-annuler-modale" class="px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-muted hover:text-charcoal transition">Annuler</button>
            <button type="submit" class="px-4 py-2 bg-charcoal text-white rounded-lg text-xs font-medium hover:bg-terracotta transition">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // 3. Rendu initial des listes injectées et liaisons
  rendreProduitsAdmin();
  rendreCommandesAdmin();
  attacherEcouteursAdmin(prenom);
  attacherNavigationNavbar(prenom);
}

// ─── Fetch Synchrone ──────────────────────────────────────────────────────────
async function rafraichirDonneesAdmin() {
  try {
    var [resP, resC] = await Promise.all([fetch(API_URL_PRODUITS), fetch(API_URL_COMMANDES)]);
    tousLesProduits = resP.ok ? await resP.json() : [];
    toutesLesCommandes = resC.ok ? await resC.json() : [];
  } catch (err) {
    console.error('Erreur API db.json :', err);
  }
}

// ─── Affichages Dynamiques ───────────────────────────────────────────────────
function rendreProduitsAdmin() {
  var conteneur = document.getElementById('liste-produits-admin');
  if (!conteneur) return;

  var produitsFiltrer = tousLesProduits.filter(p => 
    filtreRechercheAdmin === '' || 
    (p.nom && p.nom.toLowerCase().includes(filtreRechercheAdmin.toLowerCase())) ||
    (p.categorie && p.categorie.toLowerCase().includes(filtreRechercheAdmin.toLowerCase()))
  );

  if (produitsFiltrer.length === 0) {
    conteneur.innerHTML = `<div class="px-6 py-8 text-center text-xs text-muted">Aucun article trouvé.</div>`;
    return;
  }

  conteneur.innerHTML = produitsFiltrer.map(p => {
    var stock = parseInt(p.stock, 10) || 0;
    var stockClasse = stock === 0 ? 'text-red-500 font-semibold' : stock <= 2 ? 'text-orange-400 font-semibold' : 'text-charcoal';
    return `
      <div class="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center px-6 py-4 border-b border-gray-50 hover:bg-beige/30 transition">
        <p class="text-sm font-medium text-charcoal">${p.nom || 'Sans nom'}</p>
        <span class="text-xs text-muted">${p.categorie || '—'}</span>
        <span class="text-sm font-display font-semibold text-terracotta">${(p.prix || 0).toLocaleString('fr-FR')} FCFA</span>
        <span class="text-sm ${stockClasse}">${stock === 0 ? 'Rupture' : stock + ' en stock'}</span>
        <div class="flex gap-2">
          <button type="button" data-id="${p.id}" class="btn-modifier-produit w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-muted hover:text-terracotta transition"><i class="fa-regular fa-pen-to-square text-xs"></i></button>
          <button type="button" data-id="${p.id}" class="btn-supprimer-produit w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg text-muted hover:text-red-500 transition"><i class="fa-regular fa-trash-can text-xs"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function rendreCommandesAdmin() {
  var conteneur = document.getElementById('liste-commandes-admin');
  if (!conteneur) return;

  if (toutesLesCommandes.length === 0) {
    conteneur.innerHTML = `<div class="text-center py-4 text-xs text-muted">Aucune commande enregistrée.</div>`;
    return;
  }

  var couleurs = { 'En préparation': 'bg-orange-50 text-orange-500', 'Expédié': 'bg-blue-50 text-blue-500', 'Livré': 'bg-green-50 text-green-500' };

  conteneur.innerHTML = [...toutesLesCommandes].reverse().map(c => `
    <div class="flex items-center justify-between py-3 border-b border-gray-50">
      <div>
        <p class="text-sm font-medium text-charcoal">${c.clientNom || 'Client'} — ${c.articlePrincipal || 'Mobilier'}</p>
        <p class="text-xs text-muted">${c.reference || 'CMD-' + c.id}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm ${couleurs[c.statut] || 'bg-beige text-muted'}">${c.statut || 'En préparation'}</span>
      </div>
    </div>
  `).join('');
}

// ─── Écouteurs d'Événements Validés ──────────────────────────────────────────
function attacherEcouteursAdmin(prenom) {
  var inputRecherche = document.getElementById('champ-recherche-admin');
  if (inputRecherche) {
    inputRecherche.addEventListener('input', function() {
      filtreRechercheAdmin = inputRecherche.value;
      rendreProduitsAdmin();
    });
  }

  var modale = document.getElementById('modale-produit-admin');
  var form = document.getElementById('formulaire-produit-admin');

  // Ouvrir modale : Mode Ajout
  var btnAjouter = document.getElementById('bouton-ajouter-produit');
  if (btnAjouter) {
    btnAjouter.addEventListener('click', function() {
      form.reset();
      document.getElementById('form-produit-id').value = '';
      document.getElementById('modale-titre').textContent = "Ajouter un meuble";
      modale.classList.remove('hidden');
    });
  }

  // Fermer modale
  var btnAnnuler = document.getElementById('btn-annuler-modale');
  if (btnAnnuler) { btnAnnuler.addEventListener('click', () => modale.classList.add('hidden')); }

  // Gestion des clics sur la liste (Délégation pour Modifier / Supprimer)
  var listeProduits = document.getElementById('liste-produits-admin');
  if (listeProduits) {
    listeProduits.addEventListener('click', async function(e) {
      // 1. Bouton Supprimer
      var btnSuppr = e.target.closest('.btn-supprimer-produit');
      if (btnSuppr) {
        var id = btnSuppr.getAttribute('data-id');
        if (confirm('Voulez-vous retirer cet article du catalogue DecoFlow ?')) {
          await fetch(`${API_URL_PRODUITS}/${id}`, { method: 'DELETE' });
          afficherPageAdminPanel(prenom); // Recharger proprement la page
        }
        return;
      }

      // 2. Bouton Modifier
      var btnModif = e.target.closest('.btn-modifier-produit');
      if (btnModif) {
        var idModif = btnModif.getAttribute('data-id');
        var p = tousLesProduits.find(item => item.id == idModif);
        if (p) {
          document.getElementById('form-produit-id').value = p.id;
          document.getElementById('form-produit-nom').value = p.nom || '';
          document.getElementById('form-produit-categorie').value = p.categorie || '';
          document.getElementById('form-produit-prix').value = p.prix || 0;
          document.getElementById('form-produit-stock').value = p.stock || 0;
          document.getElementById('modale-titre').textContent = "Modifier le meuble";
          modale.classList.remove('hidden');
        }
      }
    });
  }

  // Soumission du formulaire (POST ou PUT)
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var idVal = document.getElementById('form-produit-id').value;
      
      var payload = {
        nom: document.getElementById('form-produit-nom').value,
        categorie: document.getElementById('form-produit-categorie').value,
        prix: parseFloat(document.getElementById('form-produit-prix').value) || 0,
        stock: parseInt(document.getElementById('form-produit-stock').value, 10) || 0
      };

      var url = idVal ? `${API_URL_PRODUITS}/${idVal}` : API_URL_PRODUITS;
      var methode = idVal ? 'PUT' : 'POST';

      await fetch(url, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      modale.classList.add('hidden');
      afficherPageAdminPanel(prenom); // Rafraîchissement global
    });
  }
}