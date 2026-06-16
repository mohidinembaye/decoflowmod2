import { attacherNavigationNavbar } from './navigation.js';
import {
  lireSession,
  lirePanier,
  modifierQuantitePanier,
  retirerDuPanier,
  viderPanier,
  totalPanier,
  passerCommande
} from './db.js';

// ─── Rendu ────────────────────────────────────────────────────────────────────

export function afficherPagePanier(prenomUtilisateur) {
  history.pushState({ page: 'panier', nom: prenomUtilisateur }, '', '#panier');

  var session = lireSession();
  if (!session) {
    if (window.decoflowRouter) window.decoflowRouter.naviguerVers('connexion');
    return;
  }

  var prenom = prenomUtilisateur || session.nom || 'Utilisateur';
  var conteneurApp = document.getElementById('app');

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';
  conteneurApp.className = 'w-full';

  conteneurApp.innerHTML = `
    <div class="animer-fond w-full min-h-screen bg-beige flex flex-col">
      <header id="navbar" class="bg-charcoal px-4 sm:px-6 py-3 sticky top-0 z-50"></header>

      <main class="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div class="mb-6">
          <p class="text-xs text-terracotta uppercase tracking-widest font-semibold mb-1">Votre sélection</p>
          <h1 class="font-display text-4xl font-semibold text-charcoal">Panier</h1>
        </div>

        <div id="contenu-panier" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start"></div>
      </main>

      <div id="toast-zone" class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"></div>
    </div>
  `;

  attacherNavigationNavbar(prenom);
  rendreContenuPanier();
}

function rendreContenuPanier() {
  var conteneur = document.getElementById('contenu-panier');
  if (!conteneur) return;
  var articles = lirePanier();

  if (articles.length === 0) {
    conteneur.innerHTML = `
      <div class="col-span-full bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
        <i class="fa-solid fa-cart-shopping text-4xl text-terra-light mb-4"></i>
        <h2 class="font-display text-2xl text-charcoal mb-2">Votre panier est vide</h2>
        <p class="text-sm text-muted mb-6">Découvrez notre catalogue et ajoutez vos coups de cœur.</p>
        <button id="aller-produits" class="bg-charcoal text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-terracotta transition">
          Parcourir les produits
        </button>
      </div>
    `;
    document.getElementById('aller-produits').addEventListener('click', function() {
      if (window.decoflowRouter) window.decoflowRouter.naviguerVers('produits');
    });
    return;
  }

  conteneur.innerHTML = `
    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div id="liste-articles" class="divide-y divide-gray-100"></div>
    </div>
    <aside class="bg-white border border-gray-100 rounded-xl p-5 sticky top-24">
      <h3 class="font-display text-xl text-charcoal mb-4">Récapitulatif</h3>
      <div class="flex justify-between text-sm mb-2">
        <span class="text-muted">Articles</span>
        <span id="recap-nb" class="text-charcoal font-medium"></span>
      </div>
      <div class="flex justify-between text-sm mb-4">
        <span class="text-muted">Sous-total</span>
        <span id="recap-sous-total" class="text-charcoal font-medium"></span>
      </div>
      <div class="border-t border-gray-100 pt-4 mb-5">
        <div class="flex justify-between">
          <span class="font-display text-lg text-charcoal">Total</span>
          <span id="recap-total" class="font-display text-lg font-semibold text-terracotta"></span>
        </div>
      </div>
      <button id="bouton-commander" class="w-full bg-charcoal text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-terracotta transition mb-2">
        Passer la commande
      </button>
      <button id="bouton-vider" class="w-full border border-gray-200 text-xs uppercase tracking-widest text-muted hover:text-red-500 hover:border-red-200 px-5 py-3 transition">
        Vider le panier
      </button>
    </aside>
  `;

  var liste = document.getElementById('liste-articles');
  articles.forEach(function(a) {
    var ligne = document.createElement('div');
    ligne.className = 'flex items-center gap-4 p-4';
    ligne.innerHTML = `
      <div class="w-20 h-20 rounded-lg overflow-hidden bg-[#C4A882] flex-shrink-0">
        <img src="${a.image}" alt="${a.nom}" class="w-full h-full object-cover" onerror="this.style.opacity='0.3'" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-charcoal">${a.nom}</p>
        <p class="text-xs text-muted capitalize">${a.categorie || ''}</p>
        <p class="text-sm text-charcoal mt-1">${a.prix.toLocaleString('fr-FR')} Fcfa</p>
      </div>
      <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
        <button data-action="moins" data-id="${a.produitId}" class="px-3 py-1 text-charcoal hover:bg-beige">−</button>
        <span class="px-3 text-sm text-charcoal min-w-[2rem] text-center">${a.quantite}</span>
        <button data-action="plus" data-id="${a.produitId}" class="px-3 py-1 text-charcoal hover:bg-beige">+</button>
      </div>
      <p class="font-display text-base font-semibold text-charcoal w-28 text-right">${(a.prix * a.quantite).toLocaleString('fr-FR')} Fcfa</p>
      <button data-action="retirer" data-id="${a.produitId}" class="text-muted hover:text-red-500 transition w-8 h-8 flex items-center justify-center">
        <i class="fa-regular fa-trash-can"></i>
      </button>
    `;
    liste.appendChild(ligne);
  });

  liste.addEventListener('click', function(e) {
    var bouton = e.target.closest('button[data-action]');
    if (!bouton) return;
    var action = bouton.getAttribute('data-action');
    var id     = bouton.getAttribute('data-id');
    var courant = lirePanier().find(function(x) { return x.produitId === id; });
    if (!courant) return;
    if (action === 'plus')    modifierQuantitePanier(id, courant.quantite + 1);
    if (action === 'moins')   modifierQuantitePanier(id, Math.max(1, courant.quantite - 1));
    if (action === 'retirer') retirerDuPanier(id);
    rendreContenuPanier();
    mettreAJourCompteurNavbar();
  });

  document.getElementById('recap-nb').textContent = articles.reduce(function(s, a) { return s + a.quantite; }, 0);
  document.getElementById('recap-sous-total').textContent = totalPanier().toLocaleString('fr-FR') + ' Fcfa';
  document.getElementById('recap-total').textContent      = totalPanier().toLocaleString('fr-FR') + ' Fcfa';

  document.getElementById('bouton-vider').addEventListener('click', function() {
    if (!confirm('Vider le panier ?')) return;
    viderPanier();
    rendreContenuPanier();
    mettreAJourCompteurNavbar();
  });

  document.getElementById('bouton-commander').addEventListener('click', ouvrirFormulaireCommande);
}

function ouvrirFormulaireCommande() {
  var overlay = document.createElement('div');
  overlay.id = 'overlay-commande';
  overlay.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
      <div class="flex items-start justify-between mb-4">
        <h2 class="font-display text-2xl font-semibold text-charcoal">Finaliser la commande</h2>
        <button id="fermer-commande" class="text-muted hover:text-charcoal text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="form-commande" class="flex flex-col gap-3">
        <div>
          <label class="text-xs text-muted">Adresse de livraison</label>
          <input name="adresse" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-xs text-muted">Ville</label>
            <input name="ville" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
          </div>
          <div class="flex-1">
            <label class="text-xs text-muted">Téléphone</label>
            <input name="telephone" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
          </div>
        </div>
        <div>
          <label class="text-xs text-muted">Mode de paiement</label>
          <select name="paiement" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta">
            <option value="livraison">Paiement à la livraison</option>
            <option value="wave">Wave</option>
            <option value="orange-money">Orange Money</option>
          </select>
        </div>
        <div id="erreur-commande" class="hidden text-xs text-red-500"></div>
        <button type="submit" class="bg-charcoal text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-terracotta transition mt-2">
          Confirmer la commande
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  function fermer() { overlay.remove(); }
  document.getElementById('fermer-commande').addEventListener('click', fermer);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) fermer(); });

  document.getElementById('form-commande').addEventListener('submit', async function(e) {
    e.preventDefault();
    var form = e.target;
    try {
      var commande = await passerCommande({
        adresse:   form.adresse.value.trim(),
        ville:     form.ville.value.trim(),
        telephone: form.telephone.value.trim(),
        paiement:  form.paiement.value
      });
      fermer();
      afficherToast('Commande #' + commande.id + ' enregistrée');
      mettreAJourCompteurNavbar();
      if (window.decoflowRouter) window.decoflowRouter.naviguerVers('commandes');
    } catch (err) {
      var erreur = document.getElementById('erreur-commande');
      erreur.textContent = err.message || 'Erreur';
      erreur.classList.remove('hidden');
    }
  });
}

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

function mettreAJourCompteurNavbar() {
  var badge = document.getElementById('badge-panier');
  if (!badge) return;
  var n = lirePanier().reduce(function(s, a) { return s + a.quantite; }, 0);
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}