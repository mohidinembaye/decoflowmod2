import { attacherNavigationNavbar } from './navigation.js';
import {
  lireSession,
  creerDevis,
  modifierDevis,
  supprimerDevis,
  recupererDevisUtilisateur,
  recupererTousLesDevis,
  recupererAdministrateurs,
  creerNotification
} from './db.js';

// ─── Déclarations ─────────────────────────────────────────────────────────────

var SESSION        = null;
var ROLE           = null;
var EST_ADMIN      = false;
var FILTRE_ACTIF   = '';
var RECHERCHE      = '';

var STATUT_CONFIG = {
  'En attente':          { label: 'En attente',          couleur: 'bg-yellow-100 text-yellow-800', icone: 'fa-hourglass-half' },
  'Devis envoyé':        { label: 'Devis envoyé',        couleur: 'bg-blue-100 text-blue-700',     icone: 'fa-paper-plane' },
  'Accepté':             { label: 'Accepté',              couleur: 'bg-green-100 text-green-800',   icone: 'fa-circle-check' },
  'Refusé':              { label: 'Refusé',               couleur: 'bg-red-100 text-red-800',       icone: 'fa-circle-xmark' },
  'Expiré':              { label: 'Expiré',               couleur: 'bg-gray-100 text-gray-500',     icone: 'fa-clock' }
};

var STATUTS_LISTE = Object.keys(STATUT_CONFIG);

// ─── Rendu page ───────────────────────────────────────────────────────────────

export async function afficherPageDevis(prenomUtilisateur) {
  history.pushState({ page: 'devis', nom: prenomUtilisateur }, '', '#devis');

  SESSION  = lireSession();
  if (!SESSION) {
    if (window.decoflowRouter) window.decoflowRouter.naviguerVers('connexion');
    return;
  }

  ROLE      = SESSION.role;
  EST_ADMIN = (ROLE === 'admin' || ROLE === 'superadmin');

  var prenom = prenomUtilisateur || SESSION.nom || 'Utilisateur';

  var conteneurApp = document.getElementById('app');
  document.getElementById('corps-application').className =
    'font-body bg-beige min-h-screen block p-0 transition-all duration-300';
  conteneurApp.className = 'w-full';

  conteneurApp.innerHTML = `
    <div class="animer-fond w-full min-h-screen bg-beige flex flex-col">
      <header id="navbar" class="bg-charcoal px-4 sm:px-6 py-3 sticky top-0 z-50"></header>

      <main class="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">

        <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs text-terracotta uppercase tracking-widest font-semibold mb-1">
              ${EST_ADMIN ? 'Gestion' : 'Mon espace'}
            </p>
            <h1 class="font-display text-4xl font-semibold text-charcoal">
              ${EST_ADMIN ? 'Demandes de devis' : 'Mes devis'}
            </h1>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            ${EST_ADMIN ? `
              <select id="filtre-statut-devis" class="border border-gray-200 rounded-lg px-3 py-2 text-xs text-charcoal bg-white focus:outline-none focus:border-terracotta">
                <option value="">Tous les statuts</option>
                ${STATUTS_LISTE.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('')}
              </select>
            ` : ''}
            ${!EST_ADMIN ? `
              <button id="btn-nouvelle-demande" class="flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-lg hover:bg-terracotta/80 transition text-sm font-medium">
                <i class="fa-solid fa-plus"></i> Faire une demande
              </button>
            ` : ''}
            <button id="rafraichir-devis" class="text-xs text-muted hover:text-charcoal flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <i class="fa-solid fa-rotate"></i> Actualiser
            </button>
          </div>
        </div>

        ${EST_ADMIN ? '<div id="stats-devis" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"></div>' : ''}

        <div id="liste-devis" class="flex flex-col gap-3">
          <p class="text-sm text-muted text-center py-10">Chargement…</p>
        </div>
      </main>

      <div id="toast-zone" class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"></div>
    </div>
  `;

  attacherNavigationNavbar(prenom);
  await chargerDevis();
  attacherEcouteursPrincipaux();
}

// ─── Chargement ───────────────────────────────────────────────────────────────

async function chargerDevis() {
  var selectFiltre = document.getElementById('filtre-statut-devis');
  if (selectFiltre) FILTRE_ACTIF = selectFiltre.value;

  var devis = EST_ADMIN
    ? await recupererTousLesDevis()
    : await recupererDevisUtilisateur(SESSION.id);

  if (FILTRE_ACTIF) {
    devis = devis.filter(function(d) { return d.statut === FILTRE_ACTIF; });
  }

  if (EST_ADMIN) rendreStatsDevis(devis);

  var liste = document.getElementById('liste-devis');
  if (!liste) return;

  if (devis.length === 0) {
    liste.innerHTML = `
      <div class="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
        <i class="fa-regular fa-folder-open text-4xl text-terra-light mb-4 block"></i>
        <h2 class="font-display text-2xl text-charcoal mb-2">Aucune demande</h2>
        <p class="text-sm text-muted">
          ${EST_ADMIN ? 'Aucune demande ne correspond à ce filtre.' : 'Vous n\'avez pas encore fait de demande de devis.'}
        </p>
      </div>
    `;
    return;
  }

  liste.innerHTML = '';
  devis.forEach(function(d) {
    liste.appendChild(creerCarteDevis(d));
  });
}

// ─── Stats admin ──────────────────────────────────────────────────────────────

function rendreStatsDevis(devis) {
  var zone = document.getElementById('stats-devis');
  if (!zone) return;

  var nbAttente  = devis.filter(function(d) { return d.statut === 'En attente'; }).length;
  var nbEnvoyes  = devis.filter(function(d) { return d.statut === 'Devis envoyé'; }).length;
  var nbAcceptes = devis.filter(function(d) { return d.statut === 'Accepté'; }).length;
  var montant    = devis
    .filter(function(d) { return d.statut === 'Accepté'; })
    .reduce(function(s, d) { return s + (d.montantTTC || 0); }, 0);

  var stats = [
    { label: 'Demandes reçues', valeur: devis.length,                                    icone: 'fa-solid fa-file-invoice',  couleur: 'text-charcoal' },
    { label: 'En attente',      valeur: nbAttente,                                        icone: 'fa-solid fa-hourglass-half', couleur: 'text-yellow-600' },
    { label: 'Devis envoyés',   valeur: nbEnvoyes,                                        icone: 'fa-solid fa-paper-plane',    couleur: 'text-blue-500' },
    { label: 'Montant accepté', valeur: montant.toLocaleString('fr-FR') + ' Fcfa',        icone: 'fa-solid fa-coins',          couleur: 'text-terracotta' }
  ];

  zone.innerHTML = stats.map(function(s) {
    return `
      <div class="bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center gap-3">
        <span class="w-9 h-9 rounded-lg bg-beige flex items-center justify-center flex-shrink-0">
          <i class="${s.icone} ${s.couleur} text-sm"></i>
        </span>
        <div>
          <p class="text-xs text-muted">${s.label}</p>
          <p class="font-display text-lg font-semibold text-charcoal">${s.valeur}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Carte devis ──────────────────────────────────────────────────────────────

function creerCarteDevis(d) {
  var carte = document.createElement('div');
  carte.className = 'bg-white border border-gray-100 rounded-xl overflow-hidden';

  var cfg          = STATUT_CONFIG[d.statut] || STATUT_CONFIG['En attente'];
  var dateStr      = new Date(d.dateDevis).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  var estEnAttente = d.statut === 'En attente';
  var estEnvoye    = d.statut === 'Devis envoyé';

  carte.innerHTML = `
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p class="text-xs text-muted uppercase tracking-widest">Demande #${d.id}</p>
        <p class="font-display text-lg text-charcoal">${d.utilisateurNom || 'Client'}</p>
        ${EST_ADMIN ? '<p class="text-xs text-muted">' + (d.utilisateurEmail || '') + '</p>' : ''}
        <p class="text-xs text-muted">${dateStr}</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="statut-badge text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm ${cfg.couleur}">
          <i class="fa-solid ${cfg.icone} mr-1"></i>${cfg.label}
        </span>
        ${(d.montantTTC && d.montantTTC > 0) ? `
          <span class="font-display text-xl font-semibold text-terracotta">${d.montantTTC.toLocaleString('fr-FR')} Fcfa</span>
        ` : ''}
        <button data-toggle="${d.id}" class="text-xs text-muted hover:text-charcoal flex items-center gap-1 border border-gray-200 rounded px-2 py-1">
          Détails <i class="fa-solid fa-chevron-down text-[10px] icone-toggle"></i>
        </button>
      </div>
    </div>

    <div id="details-devis-${d.id}" class="hidden px-5 py-4 bg-beige/30">

      <!-- Message du client -->
      <div class="mb-4">
        <p class="text-xs text-muted uppercase tracking-widest mb-1">Message du client</p>
        <p class="text-sm text-charcoal whitespace-pre-line bg-white rounded-lg px-4 py-3 border border-gray-100">${d.message || d.produitNom || '—'}</p>
      </div>

      <!-- Produits du devis (si créé par admin) -->
      ${(d.produits && d.produits.length > 0) ? `
        <div class="mb-4">
          <p class="text-xs text-muted uppercase tracking-widest mb-2">Détail du devis</p>
          <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-muted uppercase tracking-wider">
                <tr>
                  <th class="text-left px-4 py-2">Produit</th>
                  <th class="text-center px-4 py-2">Qté</th>
                  <th class="text-right px-4 py-2">Prix unit.</th>
                  <th class="text-right px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                ${d.produits.map(function(p) {
                  return `
                    <tr class="border-t border-gray-50">
                      <td class="px-4 py-2 text-charcoal">${p.nom}</td>
                      <td class="px-4 py-2 text-center text-muted">×${p.quantite}</td>
                      <td class="px-4 py-2 text-right text-muted">${(p.prixUnitaire || 0).toLocaleString('fr-FR')} Fcfa</td>
                      <td class="px-4 py-2 text-right font-medium text-charcoal">${((p.prixUnitaire || 0) * p.quantite).toLocaleString('fr-FR')} Fcfa</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot class="border-t border-gray-200 bg-beige/30">
                ${d.montantHT ? `<tr><td colspan="3" class="px-4 py-1.5 text-right text-xs text-muted">Sous-total HT</td><td class="px-4 py-1.5 text-right text-xs text-muted">${d.montantHT.toLocaleString('fr-FR')} Fcfa</td></tr>` : ''}
                <tr><td colspan="3" class="px-4 py-2 text-right text-sm font-semibold text-charcoal">Total TTC</td><td class="px-4 py-2 text-right text-sm font-bold text-terracotta">${(d.montantTTC || 0).toLocaleString('fr-FR')} Fcfa</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Zone actions admin : créer/envoyer le devis -->
      ${EST_ADMIN ? `
        <div class="zone-actions-admin border-t border-gray-200 pt-4 mt-2">
          ${estEnAttente ? `
            <p class="text-xs text-yellow-700 font-medium mb-3 flex items-center gap-1.5">
              <i class="fa-solid fa-pen-ruler"></i> Créez le devis en réponse à cette demande
            </p>
            <button data-concevoir="${d.id}" class="btn-concevoir flex items-center gap-2 text-xs font-semibold bg-charcoal text-white rounded-lg px-4 py-2.5 hover:bg-terracotta transition">
              <i class="fa-solid fa-file-invoice"></i> Créer et envoyer le devis
            </button>
          ` : estEnvoye ? `
            <p class="text-xs text-blue-600 flex items-center gap-1.5">
              <i class="fa-solid fa-paper-plane"></i> Devis envoyé — en attente de réponse du client.
            </p>
          ` : `
            <p class="text-xs text-muted flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i> Traitement terminé (${d.statut}).
            </p>
          `}
        </div>
      ` : ''}

      <!-- Zone actions client : accepter/refuser -->
      ${!EST_ADMIN && estEnvoye ? `
        <div class="zone-actions-client border-t border-gray-200 pt-4 mt-2">
          <p class="text-xs text-blue-700 font-medium mb-3 flex items-center gap-1.5">
            <i class="fa-solid fa-paper-plane"></i> Un devis vous a été envoyé — votre décision :
          </p>
          <div class="flex gap-2">
            <button data-accepter="${d.id}" class="btn-accepter flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-2 transition">
              <i class="fa-solid fa-check"></i> Accepter
            </button>
            <button data-refuser="${d.id}" class="btn-refuser-client flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2 transition">
              <i class="fa-solid fa-xmark"></i> Refuser
            </button>
          </div>
        </div>
      ` : ''}

    </div>
  `;

  // Toggle détails
  carte.querySelector('button[data-toggle]').addEventListener('click', function() {
    var det   = carte.querySelector('#details-devis-' + d.id);
    var icone = this.querySelector('.icone-toggle');
    var ouvert = !det.classList.contains('hidden');
    det.classList.toggle('hidden', ouvert);
    if (icone) icone.className = ouvert
      ? 'fa-solid fa-chevron-down text-[10px] icone-toggle'
      : 'fa-solid fa-chevron-up text-[10px] icone-toggle';
  });

  // Admin : concevoir le devis
  var btnConcevoir = carte.querySelector('button[data-concevoir]');
  if (btnConcevoir) {
    btnConcevoir.addEventListener('click', function() {
      ouvrirModalConceptionDevis(d, carte);
    });
  }

  // Client : accepter
  var btnAccepter = carte.querySelector('button[data-accepter]');
  if (btnAccepter) {
    btnAccepter.addEventListener('click', async function() {
      if (!confirm('Accepter ce devis de ' + (d.montantTTC || 0).toLocaleString('fr-FR') + ' Fcfa ?')) return;
      btnAccepter.disabled = true;
      try {
        await modifierDevis(d.id, { statut: 'Accepté', dateMiseAJour: new Date().toISOString() });
        await notifierAdmins('devis', 'Devis accepté par ' + SESSION.nom, SESSION.nom, SESSION.email, d.id);
        d.statut = 'Accepté';
        mettreAJourBadgeDevis(carte, 'Accepté');
        carte.querySelector('.zone-actions-client').innerHTML = `
          <p class="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check"></i> Vous avez accepté ce devis.
          </p>`;
        afficherToast('Devis accepté ✓');
      } catch (err) {
        alert(err.message || 'Erreur');
        btnAccepter.disabled = false;
      }
    });
  }

  // Client : refuser
  var btnRefuserClient = carte.querySelector('button[data-refuser]');
  if (btnRefuserClient) {
    btnRefuserClient.addEventListener('click', async function() {
      if (!confirm('Refuser ce devis ?')) return;
      btnRefuserClient.disabled = true;
      try {
        await modifierDevis(d.id, { statut: 'Refusé', dateMiseAJour: new Date().toISOString() });
        await notifierAdmins('devis', 'Devis refusé par ' + SESSION.nom, SESSION.nom, SESSION.email, d.id);
        d.statut = 'Refusé';
        mettreAJourBadgeDevis(carte, 'Refusé');
        carte.querySelector('.zone-actions-client').innerHTML = `
          <p class="text-xs text-red-500 flex items-center gap-1.5">
            <i class="fa-solid fa-ban"></i> Vous avez refusé ce devis.
          </p>`;
        afficherToast('Devis refusé');
      } catch (err) {
        alert(err.message || 'Erreur');
        btnRefuserClient.disabled = false;
      }
    });
  }

  return carte;
}

// ─── Modal conception devis (admin) ──────────────────────────────────────────

function ouvrirModalConceptionDevis(demande, carte) {
  var modal = document.createElement('div');
  modal.id = 'modal-conception';
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto';

  modal.innerHTML = `
    <div class="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-2xl font-semibold text-charcoal">Créer le devis</h2>
          <p class="text-xs text-muted mt-0.5">Pour ${demande.utilisateurNom} — Demande #${demande.id}</p>
        </div>
        <button id="fermer-modal-conception" class="text-gray-400 hover:text-gray-600">
          <i class="fa-solid fa-times text-xl"></i>
        </button>
      </div>

      <!-- Rappel message client -->
      <div class="px-6 pt-4">
        <p class="text-xs text-muted uppercase tracking-widest mb-1">Demande du client</p>
        <p class="text-sm text-charcoal bg-beige rounded-lg px-4 py-3 whitespace-pre-line">${demande.message || demande.produitNom || '—'}</p>
      </div>

      <div class="p-6 space-y-4">

        <div>
          <label class="block text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">Produits du devis</label>
          <div id="lignes-produits" class="space-y-2"></div>
          <button id="ajouter-ligne" class="mt-2 text-xs text-terracotta hover:text-terracotta/80 flex items-center gap-1">
            <i class="fa-solid fa-plus"></i> Ajouter un produit
          </button>
        </div>

        <div class="bg-beige/50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span class="text-sm font-semibold text-charcoal">Total TTC</span>
          <span id="total-ttc-apercu" class="font-display text-xl font-semibold text-terracotta">0 Fcfa</span>
        </div>

        <div>
          <label class="block text-xs font-semibold text-charcoal uppercase tracking-widest mb-1">Note / commentaire (optionnel)</label>
          <textarea id="note-devis" rows="2" placeholder="Conditions, délais, informations complémentaires…"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-terracotta resize-none"></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="annuler-conception" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm hover:bg-beige transition">Annuler</button>
          <button id="envoyer-devis-conception" class="flex-1 bg-charcoal text-white rounded-lg px-4 py-2.5 text-sm hover:bg-terracotta transition font-medium">
            <i class="fa-solid fa-paper-plane mr-1"></i> Envoyer au client
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Ajouter la première ligne vide
  ajouterLigneProduit(modal);
  recalculerTotal(modal);

  var fermer = function() { modal.remove(); };
  modal.querySelector('#fermer-modal-conception').addEventListener('click', fermer);
  modal.querySelector('#annuler-conception').addEventListener('click', fermer);

  modal.querySelector('#ajouter-ligne').addEventListener('click', function() {
    ajouterLigneProduit(modal);
  });

  modal.querySelector('#envoyer-devis-conception').addEventListener('click', async function() {
    var produits = lireLignesProduits(modal);
    if (produits.length === 0) {
      afficherToast('Ajoutez au moins un produit', 'erreur');
      return;
    }

    var montantHT  = produits.reduce(function(s, p) { return s + p.total; }, 0);
    var montantTTC = Math.round(montantHT * 1.18); // TVA 18% par défaut
    var note       = modal.querySelector('#note-devis').value.trim();

    var btn = modal.querySelector('#envoyer-devis-conception');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Envoi…';

    try {
      await modifierDevis(demande.id, {
        statut:        'Devis envoyé',
        produits:      produits,
        montantHT:     montantHT,
        montantTTC:    montantTTC,
        reponseAdmin:  note,
        dateMiseAJour: new Date().toISOString()
      });

      // Notifier le client
      try {
        await creerNotification({
          type:        'devis',
          titre:       'Votre devis est prêt',
          message:     'Un devis de ' + montantTTC.toLocaleString('fr-FR') + ' Fcfa vous a été envoyé.',
          clientNom:   demande.utilisateurNom,
          clientEmail: demande.utilisateurEmail,
          referenceId: demande.id,
          cible:       'client',
          adminId:     demande.utilisateurId
        });
      } catch (e) { console.warn('Notif client non envoyée', e); }

      fermer();
      afficherToast('Devis envoyé à ' + demande.utilisateurNom + ' ✓');

      // Mettre à jour la carte sans recharger
      demande.statut    = 'Devis envoyé';
      demande.produits  = produits;
      demande.montantHT = montantHT;
      demande.montantTTC = montantTTC;
      mettreAJourBadgeDevis(carte, 'Devis envoyé');
      var zoneAdmin = carte.querySelector('.zone-actions-admin');
      if (zoneAdmin) {
        zoneAdmin.innerHTML = `
          <p class="text-xs text-blue-600 flex items-center gap-1.5">
            <i class="fa-solid fa-paper-plane"></i> Devis envoyé — en attente de réponse du client.
          </p>`;
      }
      // Mettre à jour le montant dans l'en-tête de la carte
      var spanMontant = carte.querySelector('.font-display.text-xl');
      if (spanMontant) {
        spanMontant.textContent = montantTTC.toLocaleString('fr-FR') + ' Fcfa';
      } else {
        var enTete = carte.querySelector('.flex.items-center.gap-3.flex-wrap');
        if (enTete) {
          var span = document.createElement('span');
          span.className = 'font-display text-xl font-semibold text-terracotta';
          span.textContent = montantTTC.toLocaleString('fr-FR') + ' Fcfa';
          enTete.insertBefore(span, enTete.querySelector('.statut-badge').nextSibling);
        }
      }
      // Afficher la table des produits dans les détails
      await chargerDevis();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'envoi');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-1"></i> Envoyer au client';
    }
  });
}

function ajouterLigneProduit(modal) {
  var container = modal.querySelector('#lignes-produits');
  var ligne = document.createElement('div');
  ligne.className = 'ligne-produit grid grid-cols-[1fr_60px_90px_28px] gap-2 items-center';
  ligne.innerHTML = `
    <input type="text" placeholder="Nom du produit" class="input-nom border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-terracotta">
    <input type="number" placeholder="Qté" value="1" min="1" class="input-qte border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-terracotta">
    <input type="number" placeholder="Prix" value="0" min="0" class="input-prix border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:border-terracotta">
    <button type="button" class="btn-suppr-ligne text-red-400 hover:text-red-600 text-lg leading-none">×</button>
  `;
  container.appendChild(ligne);

  ligne.querySelector('.btn-suppr-ligne').addEventListener('click', function() {
    ligne.remove();
    recalculerTotal(modal);
  });
  ligne.querySelector('.input-qte').addEventListener('input', function() { recalculerTotal(modal); });
  ligne.querySelector('.input-prix').addEventListener('input', function() { recalculerTotal(modal); });
}

function recalculerTotal(modal) {
  var total = 0;
  modal.querySelectorAll('.ligne-produit').forEach(function(ligne) {
    var qte  = parseInt(ligne.querySelector('.input-qte').value) || 0;
    var prix = parseFloat(ligne.querySelector('.input-prix').value) || 0;
    total += qte * prix;
  });
  var ttc = Math.round(total * 1.18);
  var span = modal.querySelector('#total-ttc-apercu');
  if (span) span.textContent = ttc.toLocaleString('fr-FR') + ' Fcfa';
}

function lireLignesProduits(modal) {
  var produits = [];
  modal.querySelectorAll('.ligne-produit').forEach(function(ligne) {
    var nom  = ligne.querySelector('.input-nom').value.trim();
    var qte  = parseInt(ligne.querySelector('.input-qte').value) || 1;
    var prix = parseFloat(ligne.querySelector('.input-prix').value) || 0;
    if (nom) produits.push({ nom: nom, quantite: qte, prixUnitaire: prix, total: qte * prix });
  });
  return produits;
}

// ─── Modal demande client ─────────────────────────────────────────────────────

function ouvrirModalDemandeClient() {
  var modal = document.createElement('div');
  modal.id = 'modal-demande-client';
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';

  modal.innerHTML = `
    <div class="bg-white rounded-xl max-w-lg w-full">
      <div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 class="font-display text-2xl font-semibold text-charcoal">Demande de devis</h2>
          <p class="text-xs text-muted mt-0.5">Notre équipe vous répondra sous 48h</p>
        </div>
        <button id="fermer-demande-client" class="text-gray-400 hover:text-gray-600">
          <i class="fa-solid fa-times text-xl"></i>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-charcoal uppercase tracking-widest mb-2">
            Décrivez vos besoins <span class="text-terracotta">*</span>
          </label>
          <textarea id="champ-message-demande" rows="6"
            placeholder="Indiquez les produits qui vous intéressent, les quantités souhaitées, votre budget approximatif, toute information utile…"
            class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-terracotta resize-none transition"></textarea>
          <p class="text-xs text-muted mt-1">Exemple : "Je cherche 2 canapés velours, 1 table basse en marbre et 4 chaises pour un salon de 30m². Budget autour de 400 000 Fcfa."</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button id="annuler-demande-client" class="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm hover:bg-beige transition">Annuler</button>
          <button id="envoyer-demande-client" class="flex-1 bg-terracotta text-white rounded-lg px-4 py-2.5 text-sm hover:bg-terracotta/80 transition font-medium">
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  var fermer = function() { modal.remove(); };
  modal.querySelector('#fermer-demande-client').addEventListener('click', fermer);
  modal.querySelector('#annuler-demande-client').addEventListener('click', fermer);

  modal.querySelector('#envoyer-demande-client').addEventListener('click', async function() {
    var message = modal.querySelector('#champ-message-demande').value.trim();
    if (!message) {
      modal.querySelector('#champ-message-demande').classList.add('border-red-400');
      return;
    }

    var btn = modal.querySelector('#envoyer-demande-client');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Envoi…';

    try {
      await creerDevis({ message: message, produitNom: message });
      fermer();
      afficherToast('Demande envoyée ! Notre équipe vous répondra sous 48h ✓');
      await chargerDevis();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'envoi');
      btn.disabled = false;
      btn.innerHTML = 'Envoyer la demande';
    }
  });
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function mettreAJourBadgeDevis(carte, statut) {
  var badge = carte.querySelector('.statut-badge');
  if (!badge) return;
  var cfg = STATUT_CONFIG[statut] || STATUT_CONFIG['En attente'];
  badge.className = 'statut-badge text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm ' + cfg.couleur;
  badge.innerHTML = '<i class="fa-solid ' + cfg.icone + ' mr-1"></i>' + cfg.label;
}

async function notifierAdmins(type, message, nomClient, emailClient, referenceId) {
  try {
    var admins = await recupererAdministrateurs();
    for (var i = 0; i < admins.length; i++) {
      await creerNotification({
        type:        type,
        titre:       message,
        message:     message,
        clientNom:   nomClient,
        clientEmail: emailClient,
        referenceId: referenceId,
        cible:       'admin',
        adminId:     admins[i].id
      });
    }
  } catch (e) { console.warn('Notification admins non envoyée :', e); }
}

// ─── Écouteurs principaux ─────────────────────────────────────────────────────

function attacherEcouteursPrincipaux() {
  var btnRafraichir = document.getElementById('rafraichir-devis');
  if (btnRafraichir) {
    btnRafraichir.addEventListener('click', function() { chargerDevis(); });
  }

  var selectFiltre = document.getElementById('filtre-statut-devis');
  if (selectFiltre) {
    selectFiltre.addEventListener('change', function() { chargerDevis(); });
  }

  var btnNouvelleDemande = document.getElementById('btn-nouvelle-demande');
  if (btnNouvelleDemande) {
    btnNouvelleDemande.addEventListener('click', function() { ouvrirModalDemandeClient(); });
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function afficherToast(message, type) {
  var zone = document.getElementById('toast-zone');
  if (!zone) return;
  var toast = document.createElement('div');
  var estErreur = type === 'erreur';
  toast.className = (estErreur ? 'bg-red-600' : 'bg-charcoal') + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2';
  toast.innerHTML = '<i class="fa-solid ' + (estErreur ? 'fa-exclamation' : 'fa-check') + ' text-terra-light"></i> ' + message;
  zone.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(function() { toast.remove(); }, 2600);
}