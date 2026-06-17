import { attacherNavigationNavbar } from './navigation.js';
import {
  lireSession,
  recupererCommandesUtilisateur,
  recupererToutesLesCommandes,
  modifierStatutCommande,
  validerCommande,
  refuserCommande
} from './db.js';

// ─── Déclarations ─────────────────────────────────────────────────────────────

var STATUTS_COMMANDE = ['En attente de validation', 'En préparation', 'Expédié', 'Livré', 'Annulé', 'Validée', 'Refusée'];

var COULEURS_STATUT = {
  'En attente de validation': 'bg-yellow-50 text-yellow-700',
  'En préparation':           'bg-orange-50 text-orange-600',
  'Expédié':                  'bg-blue-50 text-blue-600',
  'Livré':                    'bg-green-50 text-green-600',
  'Annulé':                   'bg-red-50 text-red-600',
  'Validée':                  'bg-emerald-50 text-emerald-600',
  'Refusée':                  'bg-red-100 text-red-700'
};

// ─── Rendu page ───────────────────────────────────────────────────────────────

export async function afficherPageCommandes(prenomUtilisateur) {
  history.pushState({ page: 'commandes', nom: prenomUtilisateur }, '', '#commandes');

  var session = lireSession();
  if (!session) {
    if (window.decoflowRouter) window.decoflowRouter.naviguerVers('connexion');
    return;
  }

  var prenom   = prenomUtilisateur || session.nom || 'Utilisateur';
  var role     = session.role;
  var estAdmin = (role === 'admin' || role === 'superadmin');

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
              ${estAdmin ? 'Gestion' : 'Mon espace'}
            </p>
            <h1 class="font-display text-4xl font-semibold text-charcoal">
              ${estAdmin ? 'Toutes les commandes' : 'Mes commandes'}
            </h1>
          </div>
          <div class="flex items-center gap-3">
            ${estAdmin ? `
              <div class="flex gap-2">
                <select id="filtre-statut-commandes" class="border border-gray-200 rounded-lg px-3 py-2 text-xs text-charcoal bg-white focus:outline-none focus:border-terracotta">
                  <option value="">Tous les statuts</option>
                  ${STATUTS_COMMANDE.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('')}
                </select>
              </div>
            ` : ''}
            <button id="rafraichir-commandes" class="text-xs text-muted hover:text-charcoal flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <i class="fa-solid fa-rotate"></i> Actualiser
            </button>
          </div>
        </div>

        ${estAdmin ? `
          <div id="stats-commandes" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"></div>
        ` : ''}

        <div id="liste-commandes" class="flex flex-col gap-3">
          <p class="text-sm text-muted text-center py-10">Chargement…</p>
        </div>
      </main>

      <div id="toast-zone" class="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"></div>
    </div>
  `;

  attacherNavigationNavbar(prenom);
  await chargerCommandes(session, estAdmin);
  attacherEcouteursCommandes(session, estAdmin);
}

// ─── Chargement ───────────────────────────────────────────────────────────────

async function chargerCommandes(session, estAdmin) {
  var filtre = '';
  var selectFiltre = document.getElementById('filtre-statut-commandes');
  if (selectFiltre) filtre = selectFiltre.value;

  var commandes = estAdmin
    ? await recupererToutesLesCommandes()
    : await recupererCommandesUtilisateur(session.id);

  if (filtre) {
    commandes = commandes.filter(function(c) { return c.statut === filtre; });
  }

  if (estAdmin) rendreStatsCommandes(commandes);

  var liste = document.getElementById('liste-commandes');
  if (!liste) return;

  if (commandes.length === 0) {
    liste.innerHTML = `
      <div class="bg-white border border-dashed border-gray-200 rounded-xl p-10 text-center">
        <i class="fa-solid fa-box-open text-4xl text-terra-light mb-4 block"></i>
        <h2 class="font-display text-2xl text-charcoal mb-2">Aucune commande</h2>
        <p class="text-sm text-muted">
          ${estAdmin ? "Aucune commande ne correspond à ce filtre." : "Vous n'avez pas encore passé de commande."}
        </p>
        ${!estAdmin ? `
          <button id="aller-produits-cmd" class="mt-5 bg-charcoal text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-terracotta transition inline-block">
            Parcourir le catalogue
          </button>
        ` : ''}
      </div>
    `;
    var btnProduits = document.getElementById('aller-produits-cmd');
    if (btnProduits) {
      btnProduits.addEventListener('click', function() {
        if (window.decoflowRouter) window.decoflowRouter.naviguerVers('produits');
      });
    }
    return;
  }

  liste.innerHTML = '';
  commandes.forEach(function(cmd) {
    liste.appendChild(creerCarteCommande(cmd, estAdmin));
  });
}

// ─── Stats admin ──────────────────────────────────────────────────────────────

function rendreStatsCommandes(commandes) {
  var zone = document.getElementById('stats-commandes');
  if (!zone) return;

  var totalRevenu   = commandes.reduce(function(s, c) { return s + (c.total || 0); }, 0);
  var nbEnAttente   = commandes.filter(function(c) { return c.statut === 'En attente de validation'; }).length;
  var nbEnCours     = commandes.filter(function(c) { return c.statut === 'En préparation'; }).length;
  var nbExpedies    = commandes.filter(function(c) { return c.statut === 'Expédié'; }).length;

  var stats = [
    { label: 'Total commandes', valeur: commandes.length,   icone: 'fa-solid fa-receipt',       couleur: 'text-charcoal' },
    { label: 'En attente',      valeur: nbEnAttente,         icone: 'fa-solid fa-hourglass-half', couleur: 'text-yellow-600' },
    { label: 'En préparation',  valeur: nbEnCours,           icone: 'fa-solid fa-clock',          couleur: 'text-orange-500' },
    { label: 'Chiffre d\'affaires', valeur: totalRevenu.toLocaleString('fr-FR') + ' Fcfa', icone: 'fa-solid fa-coins', couleur: 'text-terracotta' }
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

// ─── Carte commande ───────────────────────────────────────────────────────────

function creerCarteCommande(cmd, estAdmin) {
  var carte = document.createElement('div');
  carte.className = 'bg-white border border-gray-100 rounded-xl overflow-hidden';

  var date = new Date(cmd.dateCommande);
  var dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
              + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  var classesStatut = COULEURS_STATUT[cmd.statut] || 'bg-beige text-muted';

  carte.innerHTML = `
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p class="text-xs text-muted uppercase tracking-widest">Commande #${cmd.id}</p>
        <p class="font-display text-lg text-charcoal">${cmd.utilisateurNom || 'Client'}</p>
        ${estAdmin ? `<p class="text-xs text-muted">${cmd.utilisateurEmail || ''}</p>` : ''}
        <p class="text-xs text-muted">${dateStr}</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <span class="statut-badge text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm ${classesStatut}">${cmd.statut}</span>
        <span class="font-display text-xl font-semibold text-terracotta">${(cmd.total || 0).toLocaleString('fr-FR')} Fcfa</span>
        <button data-toggle="${cmd.id}" class="text-xs text-muted hover:text-charcoal flex items-center gap-1 border border-gray-200 rounded px-2 py-1">
          Détails <i class="fa-solid fa-chevron-down text-[10px] icone-toggle"></i>
        </button>
      </div>
    </div>

    <div id="details-${cmd.id}" class="hidden px-5 py-4 bg-beige/30">
      <div class="grid gap-2 mb-4">
        ${(cmd.articles || []).map(function(a) {
          return `
            <div class="flex items-center gap-3 text-sm">
              <div class="w-10 h-10 rounded bg-[#C4A882] overflow-hidden flex-shrink-0">
                <img src="${a.image}" alt="${a.nom}" class="w-full h-full object-cover" onerror="this.style.opacity='0.3'" />
              </div>
              <span class="flex-1 text-charcoal">${a.nom}</span>
              <span class="text-muted">× ${a.quantite}</span>
              <span class="font-medium text-charcoal w-28 text-right">${((a.prix || 0) * a.quantite).toLocaleString('fr-FR')} Fcfa</span>
            </div>
          `;
        }).join('')}
      </div>

      ${cmd.livraison ? `
        <div class="text-xs text-muted border-t border-gray-200 pt-3 mt-2">
          <p><strong class="text-charcoal">Livraison :</strong>
            ${cmd.livraison.adresse || ''}${cmd.livraison.ville ? ', ' + cmd.livraison.ville : ''}
            ${cmd.livraison.telephone ? ' — ' + cmd.livraison.telephone : ''}
            ${cmd.livraison.paiement ? ' — ' + cmd.livraison.paiement : ''}
          </p>
        </div>
      ` : ''}

      ${estAdmin ? `
        <div class="zone-actions-admin mt-4 border-t border-gray-200 pt-3">
          ${cmd.statut === 'En attente de validation' ? `
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-xs text-yellow-700 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-clock"></i> En attente de votre décision
              </span>
              <div class="flex gap-2 ml-auto">
                <button data-valider-id="${cmd.id}" class="btn-valider flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-2 transition">
                  <i class="fa-solid fa-check"></i> Valider
                </button>
                <button data-refuser-id="${cmd.id}" class="btn-refuser flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2 transition">
                  <i class="fa-solid fa-xmark"></i> Refuser
                </button>
              </div>
            </div>
            <div id="motif-refus-${cmd.id}" class="hidden mt-3">
              <textarea data-motif-id="${cmd.id}" rows="2" placeholder="Motif du refus (optionnel)…" class="w-full border border-red-200 rounded-lg px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-red-400 resize-none"></textarea>
              <div class="flex gap-2 mt-2 justify-end">
                <button data-annuler-motif="${cmd.id}" class="text-xs text-muted border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">Annuler</button>
                <button data-confirmer-refus="${cmd.id}" class="text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 transition">Confirmer le refus</button>
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-3 flex-wrap">
              <label class="text-xs text-muted">Modifier le statut :</label>
              <select data-statut-id="${cmd.id}" class="select-statut-commande border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-terracotta">
                ${['En préparation', 'Expédié', 'Livré', 'Annulé'].map(function(s) {
                  return '<option value="' + s + '"' + (s === cmd.statut ? ' selected' : '') + '>' + s + '</option>';
                }).join('')}
              </select>
              <button data-annuler-id="${cmd.id}" class="${(cmd.statut === 'Annulé' || cmd.statut === 'Refusée') ? 'hidden' : ''} text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                <i class="fa-solid fa-ban"></i> Annuler
              </button>
            </div>
          `}
        </div>
      ` : ''}
    </div>
  `;

  // Toggle détails
  carte.querySelector('button[data-toggle]').addEventListener('click', function() {
    var det    = carte.querySelector('#details-' + cmd.id);
    var icone  = this.querySelector('.icone-toggle');
    var ouvert = !det.classList.contains('hidden');
    det.classList.toggle('hidden', ouvert);
    if (icone) icone.className = ouvert
      ? 'fa-solid fa-chevron-down text-[10px] icone-toggle'
      : 'fa-solid fa-chevron-up text-[10px] icone-toggle';
  });

  // Écouteurs admin
  if (estAdmin) {

    // ── Bouton Valider ────────────────────────────────────────────────────────
    var btnValider = carte.querySelector('button[data-valider-id]');
    if (btnValider) {
      btnValider.addEventListener('click', async function() {
        btnValider.disabled = true;
        btnValider.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validation…';
        try {
          await validerCommande(cmd.id);
          cmd.statut = 'Validée';
          mettreAJourBadgeStatut(carte, 'Validée');
          remplacerZoneActionsParStatut(carte, cmd, 'Validée');
          afficherToast('Commande #' + cmd.id + ' validée ✓');
        } catch (err) {
          alert(err.message || 'Erreur lors de la validation');
          btnValider.disabled = false;
          btnValider.innerHTML = '<i class="fa-solid fa-check"></i> Valider';
        }
      });
    }

    // ── Bouton Refuser (ouvre le champ motif) ─────────────────────────────────
    var btnRefuser = carte.querySelector('button[data-refuser-id]');
    var zoneMotif  = carte.querySelector('#motif-refus-' + cmd.id);
    if (btnRefuser && zoneMotif) {
      btnRefuser.addEventListener('click', function() {
        zoneMotif.classList.toggle('hidden');
        btnRefuser.classList.toggle('hidden');
      });

      var btnAnnulerMotif = zoneMotif.querySelector('button[data-annuler-motif]');
      if (btnAnnulerMotif) {
        btnAnnulerMotif.addEventListener('click', function() {
          zoneMotif.classList.add('hidden');
          btnRefuser.classList.remove('hidden');
        });
      }

      var btnConfirmerRefus = zoneMotif.querySelector('button[data-confirmer-refus]');
      if (btnConfirmerRefus) {
        btnConfirmerRefus.addEventListener('click', async function() {
          var textarea = zoneMotif.querySelector('textarea[data-motif-id]');
          var motif    = textarea ? textarea.value.trim() : '';
          btnConfirmerRefus.disabled = true;
          btnConfirmerRefus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
          try {
            await refuserCommande(cmd.id, motif);
            cmd.statut = 'Refusée';
            mettreAJourBadgeStatut(carte, 'Refusée');
            remplacerZoneActionsParStatut(carte, cmd, 'Refusée');
            afficherToast('Commande #' + cmd.id + ' refusée');
          } catch (err) {
            alert(err.message || 'Erreur lors du refus');
            btnConfirmerRefus.disabled = false;
            btnConfirmerRefus.innerHTML = 'Confirmer le refus';
          }
        });
      }
    }

    // ── Select statut (commandes déjà traitées) ───────────────────────────────
    var selectStatut = carte.querySelector('select[data-statut-id]');
    if (selectStatut) {
      selectStatut.addEventListener('change', async function() {
        var nouveauStatut = selectStatut.value;
        try {
          await modifierStatutCommande(cmd.id, nouveauStatut);
          cmd.statut = nouveauStatut;
          mettreAJourBadgeStatut(carte, nouveauStatut);
          afficherToast('Statut mis à jour : ' + nouveauStatut);
        } catch (err) {
          alert(err.message || 'Erreur lors de la mise à jour');
          selectStatut.value = cmd.statut;
        }
      });
    }

    // ── Bouton Annuler ────────────────────────────────────────────────────────
    var boutonAnnuler = carte.querySelector('button[data-annuler-id]');
    if (boutonAnnuler) {
      boutonAnnuler.addEventListener('click', async function() {
        if (!confirm('Annuler la commande #' + cmd.id + ' ?')) return;
        try {
          await modifierStatutCommande(cmd.id, 'Annulé');
          cmd.statut = 'Annulé';
          if (selectStatut) selectStatut.value = 'Annulé';
          mettreAJourBadgeStatut(carte, 'Annulé');
          boutonAnnuler.classList.add('hidden');
          afficherToast('Commande annulée');
        } catch (err) {
          alert(err.message || 'Erreur');
        }
      });
    }
  }

  return carte;
}

// ─── Utilitaires carte ────────────────────────────────────────────────────────

function mettreAJourBadgeStatut(carte, statut) {
  var badge = carte.querySelector('.statut-badge');
  if (!badge) return;
  badge.textContent = statut;
  badge.className = 'statut-badge text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm ' + (COULEURS_STATUT[statut] || 'bg-beige text-muted');
}

function remplacerZoneActionsParStatut(carte, cmd, statut) {
  var zone = carte.querySelector('.zone-actions-admin');
  if (!zone) return;

  var STATUTS_POST_VALIDATION = ['En préparation', 'Expédié', 'Livré', 'Annulé'];

  if (statut === 'Validée') {
    zone.innerHTML = `
      <div class="flex items-center gap-3 flex-wrap">
        <label class="text-xs text-muted">Modifier le statut :</label>
        <select data-statut-id="${cmd.id}" class="select-statut-commande border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-terracotta">
          ${STATUTS_POST_VALIDATION.map(function(s) {
            return '<option value="' + s + '">' + s + '</option>';
          }).join('')}
        </select>
      </div>
    `;
    var select = zone.querySelector('select[data-statut-id]');
    if (select) {
      select.addEventListener('change', async function() {
        var nv = select.value;
        try {
          await modifierStatutCommande(cmd.id, nv);
          cmd.statut = nv;
          mettreAJourBadgeStatut(carte, nv);
          afficherToast('Statut mis à jour : ' + nv);
        } catch (err) {
          alert(err.message || 'Erreur');
          select.value = cmd.statut;
        }
      });
    }
  } else if (statut === 'Refusée') {
    zone.innerHTML = `
      <p class="text-xs text-red-500 flex items-center gap-1.5">
        <i class="fa-solid fa-ban"></i> Commande refusée — aucune action possible.
      </p>
    `;
  }
}

// ─── Écouteurs ────────────────────────────────────────────────────────────────

function attacherEcouteursCommandes(session, estAdmin) {
  var btnRafraichir = document.getElementById('rafraichir-commandes');
  if (btnRafraichir) {
    btnRafraichir.addEventListener('click', function() {
      chargerCommandes(session, estAdmin);
    });
  }

  var selectFiltre = document.getElementById('filtre-statut-commandes');
  if (selectFiltre) {
    selectFiltre.addEventListener('change', function() {
      chargerCommandes(session, estAdmin);
    });
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

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