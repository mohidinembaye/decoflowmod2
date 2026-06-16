import { attacherNavigationNavbar } from './navigation.js';
import {
  lireSession,
  recupererTousLesProduits,
  trouverProduitParId,
  ajouterProduit,
  modifierProduit,
  supprimerProduit,
  ajouterAuPanier,
  compterArticlesPanier
} from './db.js';

// ─── Déclarations ─────────────────────────────────────────────────────────────

var donneesProduits = [];

var categoriesDisponibles = [
  { id: 'toutes',     nom: 'Toutes les catégories' },
  { id: 'mobilier',   nom: 'Mobilier'   },
  { id: 'luminaire',  nom: 'Luminaire'  },
  { id: 'decoration', nom: 'Décoration' },
  { id: 'textile',    nom: 'Textile'    },
  { id: 'rangement',  nom: 'Rangement'  },
  { id: 'bureau',     nom: 'Bureau'     },
];

var filtreCategorie = 'toutes';
var filtreRecherche = '';
var filtreTri       = 'nom';
var vueActive       = 'grille'; // 'grille' | 'liste'

// ─── Rendu de page ────────────────────────────────────────────────────────────

export async function afficherPageProduits(prenomUtilisateur) {
  history.pushState({ page: 'produits', nom: prenomUtilisateur }, '', '#produits');

  var session = lireSession();
  var role    = session ? session.role : 'client';
  var estAdmin = (role === 'admin' || role === 'superadmin');

  var conteneurApp = document.getElementById('app');
  var prenom = prenomUtilisateur || (session && session.nom) || 'Utilisateur';

  filtreCategorie = 'toutes';
  filtreRecherche = '';
  filtreTri       = 'nom';
  vueActive       = 'grille';

  conteneurApp.className = 'w-full';

  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';

  conteneurApp.innerHTML = `
    <div id="page-produits" class="animer-fond w-full min-h-screen bg-beige flex flex-col">

      <header id="navbar" class="bg-charcoal px-4 sm:px-6 py-3 sticky top-0 z-50"></header>

      <main id="contenu-produits" class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div class="mb-6 border border-dashed border-gray-200 rounded-xl p-6 bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 class="font-display text-4xl font-semibold text-charcoal mb-1">Catalogue Produits</h1>
            <p class="text-sm text-muted max-w-md">Parcourez l'ensemble de la collection. Filtrez par catégorie, recherchez par nom ou triez selon vos besoins.</p>
          </div>
          <button id="bouton-ajouter-produit" type="button"
            class="${estAdmin ? '' : 'hidden'} flex items-center gap-2 bg-charcoal text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-terracotta transition-colors duration-200 whitespace-nowrap self-start">
            <i class="fa-solid fa-plus text-xs"></i> Ajouter un produit
          </button>
        </div>

        <div class="flex gap-6 items-start">

          <aside id="sidebar-filtres" class="hidden lg:flex flex-col gap-4 w-52 flex-shrink-0">
            <div class="bg-white border border-gray-100 rounded-xl p-5">
              <p class="text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">Catégories</p>
              <ul id="liste-filtres-categorie" class="flex flex-col gap-1"></ul>
            </div>

            <div class="bg-white border border-gray-100 rounded-xl p-5">
              <p class="text-xs font-semibold text-charcoal uppercase tracking-widest mb-3">Prix</p>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="radio" name="filtre-prix" value="tous" checked class="accent-terracotta" /> Tous
                </label>
                <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="radio" name="filtre-prix" value="bas" class="accent-terracotta" /> &lt; 50 000 Fcfa
                </label>
                <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="radio" name="filtre-prix" value="moyen" class="accent-terracotta" /> 50 000 – 150 000
                </label>
                <label class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="radio" name="filtre-prix" value="haut" class="accent-terracotta" /> &gt; 150 000 Fcfa
                </label>
              </div>
            </div>
          </aside>

          <div class="flex-1 flex flex-col gap-4">

            <div class="bg-white border border-gray-100 rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="relative flex-1 max-w-xs">
                <span class="absolute inset-y-0 left-3 flex items-center text-muted pointer-events-none">
                  <i class="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input id="champ-recherche-produits" type="text" placeholder="Rechercher un produit…"
                  class="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-xs text-charcoal placeholder-gray-400 bg-beige/40 focus:outline-none focus:border-terracotta transition" />
              </div>

              <div class="flex items-center gap-3">
                <select id="select-tri" class="border border-gray-200 rounded-lg px-3 py-2 text-xs text-charcoal bg-beige/40 focus:outline-none focus:border-terracotta transition cursor-pointer">
                  <option value="nom">Trier : Nom A–Z</option>
                  <option value="prix-asc">Prix croissant</option>
                  <option value="prix-desc">Prix décroissant</option>
                </select>

                <div class="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                  <button id="bouton-vue-grille" type="button" title="Vue grille" class="px-3 py-2 text-xs bg-charcoal text-white transition">
                    <i class="fa-solid fa-grip"></i>
                  </button>
                  <button id="bouton-vue-liste" type="button" title="Vue liste" class="px-3 py-2 text-xs text-muted hover:text-charcoal hover:bg-beige transition">
                    <i class="fa-solid fa-list"></i>
                  </button>
                </div>
              </div>
            </div>

            <div id="zone-produits" class="bg-white border border-dashed border-gray-200 rounded-xl p-6">
              <div id="conteneur-produits" class="grid grid-cols-2 sm:grid-cols-3 gap-5">
                <p class="col-span-3 text-center text-sm text-muted py-10">Chargement…</p>
              </div>
            </div>

            <p id="compteur-produits" class="text-xs text-muted text-right"></p>
          </div>
        </div>
      </main>

      <div id="modale-produit"     class="hidden fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"></div>
      <div id="modale-form-produit" class="hidden fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"></div>
      <div id="toast-zone" class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"></div>

      <footer class="bg-white border-t border-gray-100 mt-auto">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <span class="font-display text-lg font-semibold text-charcoal">DecoFlow</span>
          <span class="text-xs text-muted">© 2024 DecoFlow Interior Management.</span>
        </div>
      </footer>
    </div>
  `;

  attacherNavigationNavbar(prenom);
  rendreFiltreSidebar();

  donneesProduits = await recupererTousLesProduits();
  rendreProduits();
  attacherEcouteursProduits(prenom, estAdmin);
}

// ─── Filtres / tri ────────────────────────────────────────────────────────────

function rendreFiltreSidebar() {
  var liste = document.getElementById('liste-filtres-categorie');
  if (!liste) return;
  liste.innerHTML = '';

  categoriesDisponibles.forEach(function(cat) {
    var li = document.createElement('li');
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.setAttribute('data-categorie', cat.id);
    bouton.className = cat.id === filtreCategorie
      ? 'w-full text-left text-sm font-medium text-terracotta px-2 py-1 rounded-md bg-terra-pale transition'
      : 'w-full text-left text-sm text-muted px-2 py-1 rounded-md hover:text-charcoal hover:bg-beige transition';
    bouton.textContent = cat.nom;
    li.appendChild(bouton);
    liste.appendChild(li);
  });
}

function obtenirProduitsFiltres() {
  var filtrePrix = document.querySelector('input[name="filtre-prix"]:checked');
  var valeurPrix = filtrePrix ? filtrePrix.value : 'tous';

  return donneesProduits
    .filter(function(p) {
      var correspondCategorie = filtreCategorie === 'toutes' || p.categorie === filtreCategorie;
      var correspondRecherche = filtreRecherche === '' || p.nom.toLowerCase().includes(filtreRecherche.toLowerCase());
      var correspondPrix =
        valeurPrix === 'tous'  ||
        (valeurPrix === 'bas'   && p.prix < 50000)   ||
        (valeurPrix === 'moyen' && p.prix >= 50000 && p.prix <= 150000) ||
        (valeurPrix === 'haut'  && p.prix > 150000);
      return correspondCategorie && correspondRecherche && correspondPrix;
    })
    .sort(function(a, b) {
      if (filtreTri === 'prix-asc')  return a.prix - b.prix;
      if (filtreTri === 'prix-desc') return b.prix - a.prix;
      return a.nom.localeCompare(b.nom, 'fr');
    });
}

function rendreProduits() {
  var conteneur = document.getElementById('conteneur-produits');
  var compteur  = document.getElementById('compteur-produits');
  if (!conteneur) return;

  var session  = lireSession();
  var role     = session ? session.role : 'client';
  var estAdmin = (role === 'admin' || role === 'superadmin');

  conteneur.innerHTML = '';

  var produitsFiltres = obtenirProduitsFiltres();

  if (vueActive === 'grille') {
    conteneur.className = 'grid grid-cols-2 sm:grid-cols-3 gap-5';
  } else {
    conteneur.className = 'flex flex-col gap-3';
  }

  if (produitsFiltres.length === 0) {
    var vide = document.createElement('p');
    vide.className = 'col-span-3 text-center text-sm text-muted py-10';
    vide.textContent = 'Aucun produit trouvé.';
    conteneur.appendChild(vide);
    if (compteur) compteur.textContent = '';
    return;
  }

  produitsFiltres.forEach(function(produit) {
    var carte = vueActive === 'grille'
      ? creerCarteGrille(produit, estAdmin)
      : creerCarteListe(produit, estAdmin);
    conteneur.appendChild(carte);
  });

  if (compteur) {
    compteur.textContent = produitsFiltres.length + ' produit' + (produitsFiltres.length > 1 ? 's' : '') + ' affiché' + (produitsFiltres.length > 1 ? 's' : '');
  }
}

// ─── Cartes produit ───────────────────────────────────────────────────────────

function creerCarteGrille(produit, estAdmin) {
  var carte = document.createElement('div');
  carte.className = 'group flex flex-col border border-gray-100 rounded-xl overflow-hidden hover:border-terracotta hover:shadow-sm transition';
  carte.setAttribute('data-id', produit.id);

  var imageConteneur = document.createElement('div');
  imageConteneur.className = 'relative aspect-square bg-[#C4A882] overflow-hidden cursor-pointer';
  imageConteneur.addEventListener('click', function() { ouvrirModaleProduit(produit); });

  var image = document.createElement('img');
  image.src = produit.image;
  image.alt = produit.nom;
  image.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300';
  image.onerror = function() { image.style.opacity = '0.3'; };

  if (produit.vedette) {
    var badge = document.createElement('span');
    badge.className = 'absolute top-2 left-2 bg-terracotta text-white text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm';
    badge.textContent = 'Vedette';
    imageConteneur.appendChild(badge);
  }

  imageConteneur.appendChild(image);

  var corps = document.createElement('div');
  corps.className = 'p-4 flex flex-col gap-1 bg-white';

  var nomEl = document.createElement('p');
  nomEl.className = 'text-sm font-medium text-charcoal leading-tight cursor-pointer';
  nomEl.textContent = produit.nom;
  nomEl.addEventListener('click', function() { ouvrirModaleProduit(produit); });

  var categorieEl = document.createElement('p');
  categorieEl.className = 'text-xs text-muted capitalize';
  categorieEl.textContent = produit.categorie;

  var prixEl = document.createElement('p');
  prixEl.className = 'text-sm font-semibold text-charcoal mt-1';
  prixEl.textContent = produit.prix.toLocaleString('fr-FR') + ' Fcfa';

  corps.appendChild(nomEl);
  corps.appendChild(categorieEl);
  corps.appendChild(prixEl);

  // Actions
  var actions = document.createElement('div');
  actions.className = 'flex gap-2 mt-3';

  if (estAdmin) {
    var btnEditer = boutonIcone('fa-pen-to-square', 'Éditer', 'flex-1 border border-gray-200 hover:border-terracotta hover:text-terracotta');
    btnEditer.addEventListener('click', function() { ouvrirFormulaireProduit(produit); });
    var btnSupprimer = boutonIcone('fa-trash-can', 'Supprimer', 'flex-1 border border-gray-200 hover:border-red-300 hover:text-red-500');
    btnSupprimer.addEventListener('click', function() { confirmerSuppressionProduit(produit); });
    actions.appendChild(btnEditer);
    actions.appendChild(btnSupprimer);
  } else {
    var btnPanier = document.createElement('button');
    btnPanier.type = 'button';
    btnPanier.className = 'flex-1 bg-charcoal text-white text-xs uppercase tracking-widest px-3 py-2 hover:bg-terracotta transition flex items-center justify-center gap-2';
    btnPanier.innerHTML = '<i class="fa-solid fa-cart-plus text-xs"></i> Ajouter';
    btnPanier.addEventListener('click', function(e) {
      e.stopPropagation();
      ajouterAuPanier(produit, 1);
      mettreAJourCompteurPanier();
      afficherToast(produit.nom + ' ajouté au panier');
    });
    actions.appendChild(btnPanier);
  }

  corps.appendChild(actions);

  carte.appendChild(imageConteneur);
  carte.appendChild(corps);
  return carte;
}

function creerCarteListe(produit, estAdmin) {
  var ligne = document.createElement('div');
  ligne.className = 'flex items-center gap-4 border border-gray-100 rounded-xl p-3 hover:border-terracotta transition';
  ligne.setAttribute('data-id', produit.id);

  var imageConteneur = document.createElement('div');
  imageConteneur.className = 'w-14 h-14 rounded-lg overflow-hidden bg-[#C4A882] flex-shrink-0 cursor-pointer';
  imageConteneur.addEventListener('click', function() { ouvrirModaleProduit(produit); });

  var image = document.createElement('img');
  image.src = produit.image;
  image.alt = produit.nom;
  image.className = 'w-full h-full object-cover';
  image.onerror = function() { image.style.opacity = '0.3'; };
  imageConteneur.appendChild(image);

  var infos = document.createElement('div');
  infos.className = 'flex-1 min-w-0 cursor-pointer';
  infos.addEventListener('click', function() { ouvrirModaleProduit(produit); });

  var nomEl = document.createElement('p');
  nomEl.className = 'text-sm font-medium text-charcoal truncate';
  nomEl.textContent = produit.nom;

  var categorieEl = document.createElement('p');
  categorieEl.className = 'text-xs text-muted capitalize';
  categorieEl.textContent = produit.categorie;

  infos.appendChild(nomEl);
  infos.appendChild(categorieEl);

  var prixEl = document.createElement('p');
  prixEl.className = 'text-sm font-semibold text-charcoal flex-shrink-0';
  prixEl.textContent = produit.prix.toLocaleString('fr-FR') + ' Fcfa';

  ligne.appendChild(imageConteneur);
  ligne.appendChild(infos);
  ligne.appendChild(prixEl);

  if (estAdmin) {
    var btnEditer = boutonIcone('fa-pen-to-square', '', 'w-8 h-8 border border-gray-200 hover:border-terracotta hover:text-terracotta');
    btnEditer.addEventListener('click', function() { ouvrirFormulaireProduit(produit); });
    var btnSupprimer = boutonIcone('fa-trash-can', '', 'w-8 h-8 border border-gray-200 hover:border-red-300 hover:text-red-500');
    btnSupprimer.addEventListener('click', function() { confirmerSuppressionProduit(produit); });
    var wrap = document.createElement('div');
    wrap.className = 'flex gap-1';
    wrap.appendChild(btnEditer);
    wrap.appendChild(btnSupprimer);
    ligne.appendChild(wrap);
  } else {
    var btnPanier = document.createElement('button');
    btnPanier.type = 'button';
    btnPanier.className = 'bg-charcoal text-white text-xs uppercase tracking-widest px-4 py-2 hover:bg-terracotta transition flex items-center gap-2 flex-shrink-0';
    btnPanier.innerHTML = '<i class="fa-solid fa-cart-plus text-xs"></i> Ajouter';
    btnPanier.addEventListener('click', function(e) {
      e.stopPropagation();
      ajouterAuPanier(produit, 1);
      mettreAJourCompteurPanier();
      afficherToast(produit.nom + ' ajouté au panier');
    });
    ligne.appendChild(btnPanier);
  }

  return ligne;
}

function boutonIcone(icone, label, classesExtras) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'inline-flex items-center justify-center gap-1 text-xs text-muted rounded-lg px-2 py-2 transition ' + (classesExtras || '');
  btn.innerHTML = '<i class="fa-regular ' + icone + ' text-xs"></i>' + (label ? ' <span class="uppercase tracking-widest">' + label + '</span>' : '');
  return btn;
}

// ─── Modale détails produit ───────────────────────────────────────────────────

function ouvrirModaleProduit(produit) {
  var session  = lireSession();
  var role     = session ? session.role : 'client';
  var estAdmin = (role === 'admin' || role === 'superadmin');

  var modale = document.getElementById('modale-produit');
  modale.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
      <div class="md:w-1/2 bg-[#C4A882] aspect-square md:aspect-auto">
        <img src="${produit.image}" alt="${produit.nom}" class="w-full h-full object-cover" onerror="this.style.opacity='0.3'" />
      </div>
      <div class="md:w-1/2 p-6 flex flex-col gap-3 overflow-y-auto">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-[10px] uppercase tracking-widest text-terracotta font-semibold">${produit.categorie}</p>
            <h2 class="font-display text-2xl font-semibold text-charcoal leading-tight">${produit.nom}</h2>
          </div>
          <button id="fermer-modale-produit" type="button" class="text-muted hover:text-charcoal text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-sm text-muted leading-relaxed">${produit.description || 'Aucune description.'}</p>
        <p class="text-xs text-muted">Stock disponible : <span class="font-semibold text-charcoal">${produit.stock != null ? produit.stock : '—'}</span></p>
        <p class="font-display text-3xl font-semibold text-charcoal mt-2">${produit.prix.toLocaleString('fr-FR')} Fcfa</p>

        ${estAdmin ? '' : `
          <div class="flex items-center gap-3 mt-4">
            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button id="qte-moins" type="button" class="px-3 py-2 text-charcoal hover:bg-beige">−</button>
              <input id="qte-valeur" type="number" min="1" value="1" class="w-12 text-center text-sm border-0 focus:outline-none" />
              <button id="qte-plus" type="button" class="px-3 py-2 text-charcoal hover:bg-beige">+</button>
            </div>
            <button id="ajouter-au-panier" type="button"
              class="flex-1 bg-charcoal text-white text-xs uppercase tracking-widest px-5 py-3 hover:bg-terracotta transition flex items-center justify-center gap-2">
              <i class="fa-solid fa-cart-plus text-xs"></i> Ajouter au panier
            </button>
          </div>
        `}
      </div>
    </div>
  `;
  modale.classList.remove('hidden');

  document.getElementById('fermer-modale-produit').addEventListener('click', fermerModaleProduit);
  modale.addEventListener('click', function(e) { if (e.target === modale) fermerModaleProduit(); });

  if (!estAdmin) {
    var champ = document.getElementById('qte-valeur');
    document.getElementById('qte-moins').addEventListener('click', function() {
      champ.value = Math.max(1, parseInt(champ.value || 1, 10) - 1);
    });
    document.getElementById('qte-plus').addEventListener('click', function() {
      champ.value = parseInt(champ.value || 1, 10) + 1;
    });
    document.getElementById('ajouter-au-panier').addEventListener('click', function() {
      var qte = Math.max(1, parseInt(champ.value || 1, 10));
      ajouterAuPanier(produit, qte);
      mettreAJourCompteurPanier();
      afficherToast(produit.nom + ' × ' + qte + ' ajouté au panier');
      fermerModaleProduit();
    });
  }
}

function fermerModaleProduit() {
  var modale = document.getElementById('modale-produit');
  modale.classList.add('hidden');
  modale.innerHTML = '';
}

// ─── Modale formulaire produit (admin) ────────────────────────────────────────

function ouvrirFormulaireProduit(produitExistant) {
  var modale = document.getElementById('modale-form-produit');
  var enEdition = !!produitExistant;
  var p = produitExistant || { nom: '', categorie: 'mobilier', prix: '', image: '', stock: 0, vedette: false, description: '' };

  modale.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between mb-4">
        <h2 class="font-display text-2xl font-semibold text-charcoal">${enEdition ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
        <button id="fermer-form-produit" type="button" class="text-muted hover:text-charcoal text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="formulaire-produit" class="flex flex-col gap-3">
        ${champ('nom', 'Nom', 'text', p.nom, true)}
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="text-xs text-muted">Catégorie</label>
            <select name="categorie" required class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta">
              ${['mobilier','luminaire','decoration','textile','rangement','bureau']
                .map(function(c){ return '<option value="'+c+'"'+(c===p.categorie?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>'; }).join('')}
            </select>
          </div>
          ${champ('prix', 'Prix (Fcfa)', 'number', p.prix, true)}
        </div>
        <div class="flex gap-3">
          ${champ('stock', 'Stock', 'number', p.stock, false)}
          ${champ('image', 'Image (URL ou nom de fichier)', 'text', p.image, false)}
        </div>
        <div>
          <label class="text-xs text-muted">Description</label>
          <textarea name="description" rows="3" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta">${p.description || ''}</textarea>
        </div>
        <label class="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" name="vedette" ${p.vedette ? 'checked' : ''} class="accent-terracotta" />
          Produit vedette
        </label>
        <div id="erreur-form-produit" class="hidden text-xs text-red-500"></div>
        <div class="flex gap-2 mt-2">
          <button type="button" id="annuler-form-produit" class="flex-1 border border-gray-200 text-charcoal text-xs uppercase tracking-widest px-4 py-3 hover:bg-beige transition">Annuler</button>
          <button type="submit" class="flex-1 bg-charcoal text-white text-xs uppercase tracking-widest px-4 py-3 hover:bg-terracotta transition">
            ${enEdition ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  `;
  modale.classList.remove('hidden');

  document.getElementById('fermer-form-produit').addEventListener('click', fermerFormulaireProduit);
  document.getElementById('annuler-form-produit').addEventListener('click', fermerFormulaireProduit);
  modale.addEventListener('click', function(e) { if (e.target === modale) fermerFormulaireProduit(); });

  document.getElementById('formulaire-produit').addEventListener('submit', async function(e) {
    e.preventDefault();
    var form = e.target;
    var donnees = {
      nom:         form.nom.value.trim(),
      categorie:   form.categorie.value,
      prix:        parseInt(form.prix.value, 10) || 0,
      stock:       parseInt(form.stock.value, 10) || 0,
      image:       form.image.value.trim() || 'canape.jpeg',
      vedette:     form.vedette.checked,
      description: form.description.value.trim()
    };

    if (!donnees.nom || donnees.prix <= 0) {
      var erreur = document.getElementById('erreur-form-produit');
      erreur.textContent = 'Nom et prix sont obligatoires.';
      erreur.classList.remove('hidden');
      return;
    }

    try {
      if (enEdition) {
        await modifierProduit(produitExistant.id, donnees);
        afficherToast('Produit modifié');
      } else {
        donnees.id = 'p' + Date.now();
        await ajouterProduit(donnees);
        afficherToast('Produit ajouté');
      }
      fermerFormulaireProduit();
      donneesProduits = await recupererTousLesProduits();
      rendreProduits();
    } catch (err) {
      var erreur2 = document.getElementById('erreur-form-produit');
      erreur2.textContent = err.message || 'Erreur';
      erreur2.classList.remove('hidden');
    }
  });
}

function champ(nom, label, type, valeur, requis) {
  return `
    <div class="flex-1">
      <label class="text-xs text-muted">${label}</label>
      <input name="${nom}" type="${type}" ${requis ? 'required' : ''} value="${valeur != null ? valeur : ''}"
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta" />
    </div>
  `;
}

function fermerFormulaireProduit() {
  var modale = document.getElementById('modale-form-produit');
  modale.classList.add('hidden');
  modale.innerHTML = '';
}

async function confirmerSuppressionProduit(produit) {
  if (!confirm('Supprimer définitivement « ' + produit.nom + ' » ?')) return;
  try {
    await supprimerProduit(produit.id);
    donneesProduits = await recupererTousLesProduits();
    rendreProduits();
    afficherToast('Produit supprimé');
  } catch (err) {
    alert(err.message || 'Erreur lors de la suppression');
  }
}

// ─── Toast + compteur panier ──────────────────────────────────────────────────

function afficherToast(message) {
  var zone = document.getElementById('toast-zone');
  if (!zone) return;
  var toast = document.createElement('div');
  toast.className = 'bg-charcoal text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse';
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

// ─── Vue / écouteurs ─────────────────────────────────────────────────────────

function mettreAJourBoutonsVue() {
  var boutonGrille = document.getElementById('bouton-vue-grille');
  var boutonListe  = document.getElementById('bouton-vue-liste');
  if (!boutonGrille || !boutonListe) return;

  if (vueActive === 'grille') {
    boutonGrille.className = 'px-3 py-2 text-xs bg-charcoal text-white transition';
    boutonListe.className  = 'px-3 py-2 text-xs text-muted hover:text-charcoal hover:bg-beige transition';
  } else {
    boutonGrille.className = 'px-3 py-2 text-xs text-muted hover:text-charcoal hover:bg-beige transition';
    boutonListe.className  = 'px-3 py-2 text-xs bg-charcoal text-white transition';
  }
}

function attacherEcouteursProduits(prenom, estAdmin) {
  var champRecherche = document.getElementById('champ-recherche-produits');
  champRecherche.addEventListener('input', function() {
    filtreRecherche = champRecherche.value;
    rendreProduits();
  });

  var selectTri = document.getElementById('select-tri');
  selectTri.addEventListener('change', function() {
    filtreTri = selectTri.value;
    rendreProduits();
  });

  document.getElementById('bouton-vue-grille').addEventListener('click', function() {
    vueActive = 'grille'; mettreAJourBoutonsVue(); rendreProduits();
  });
  document.getElementById('bouton-vue-liste').addEventListener('click', function() {
    vueActive = 'liste'; mettreAJourBoutonsVue(); rendreProduits();
  });

  var listeFiltres = document.getElementById('liste-filtres-categorie');
  if (listeFiltres) {
    listeFiltres.addEventListener('click', function(e) {
      var bouton = e.target.closest('button[data-categorie]');
      if (!bouton) return;
      filtreCategorie = bouton.getAttribute('data-categorie');
      rendreFiltreSidebar();
      rendreProduits();
    });
  }

  var sidebarFiltres = document.getElementById('sidebar-filtres');
  if (sidebarFiltres) {
    sidebarFiltres.addEventListener('change', function(e) {
      if (e.target.name === 'filtre-prix') rendreProduits();
    });
  }

  if (estAdmin) {
    var boutonAjouter = document.getElementById('bouton-ajouter-produit');
    if (boutonAjouter) boutonAjouter.addEventListener('click', function() { ouvrirFormulaireProduit(null); });
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