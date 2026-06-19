// ─── Configuration ────────────────────────────────────────────────────────────

var API_BASE = 'https://ton-app.onrender.com';
const API_URL         = API_BASE + '/utilisateurs';
const API_PRODUITS    = API_BASE + '/produits';
const API_COMMANDES   = API_BASE + '/commandes';
const API_DEVIS          = API_BASE + '/devis';
const API_NOTIFICATIONS  = API_BASE + '/notifications';
const CLE_SESSION        = 'decoflow_session';
const CLE_PANIER_PREF = 'decoflow_panier_';

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export async function trouverUtilisateurParEmail(email) {
  try {
    var reponse = await fetch(API_URL + '?email=' + encodeURIComponent(email.toLowerCase()));
    if (!reponse.ok) throw new Error('Erreur réseau');
    var liste = await reponse.json();
    return liste.length > 0 ? liste[0] : null;
  } catch (erreur) {
    console.error('Erreur db.js (trouverUtilisateurParEmail) :', erreur);
    return null;
  }
}

export async function recupererTousLesUtilisateurs() {
  try {
    var reponse = await fetch(API_URL);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererTousLesUtilisateurs) :', erreur);
    return [];
  }
}

export async function ajouterUtilisateur(nouvelUtilisateur) {
  var reponse = await fetch(API_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(nouvelUtilisateur)
  });
  if (!reponse.ok) throw new Error('Impossible d\'ajouter l\'utilisateur');
  return await reponse.json();
}

export async function modifierUtilisateur(id, donnees) {
  var reponse = await fetch(API_URL + '/' + id, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(donnees)
  });
  if (!reponse.ok) throw new Error('Impossible de modifier l\'utilisateur');
  return await reponse.json();
}

export async function modifierRoleUtilisateur(id, nouveauRole) {
  return modifierUtilisateur(id, { role: nouveauRole });
}

export async function supprimerUtilisateur(id) {
  var reponse = await fetch(API_URL + '/' + id, { method: 'DELETE' });
  if (!reponse.ok) throw new Error('Impossible de supprimer l\'utilisateur');
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function lireSession() {
  var donnees = localStorage.getItem(CLE_SESSION);
  if (!donnees) return null;
  try { return JSON.parse(donnees); }
  catch (e) { return null; }
}

export function sauvegarderSession(donneesSession) {
  localStorage.setItem(CLE_SESSION, JSON.stringify(donneesSession));
}

export function supprimerSession() {
  localStorage.removeItem(CLE_SESSION);
}

export function lireRoleSession() {
  var session = lireSession();
  return session ? session.role : null;
}

// ─── Produits ─────────────────────────────────────────────────────────────────

export async function recupererTousLesProduits() {
  try {
    var reponse = await fetch(API_PRODUITS);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererTousLesProduits) :', erreur);
    return [];
  }
}

export async function trouverProduitParId(id) {
  try {
    var reponse = await fetch(API_PRODUITS + '/' + encodeURIComponent(id));
    if (!reponse.ok) return null;
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (trouverProduitParId) :', erreur);
    return null;
  }
}

export async function ajouterProduit(nouveauProduit) {
  var reponse = await fetch(API_PRODUITS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(nouveauProduit)
  });
  if (!reponse.ok) throw new Error('Impossible d\'ajouter le produit');
  return await reponse.json();
}

export async function modifierProduit(id, donnees) {
  var reponse = await fetch(API_PRODUITS + '/' + encodeURIComponent(id), {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(donnees)
  });
  if (!reponse.ok) throw new Error('Impossible de modifier le produit');
  return await reponse.json();
}

export async function supprimerProduit(id) {
  var reponse = await fetch(API_PRODUITS + '/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!reponse.ok) throw new Error('Impossible de supprimer le produit');
}

// ─── Panier (par utilisateur, en localStorage) ────────────────────────────────

function clePanier() {
  var session = lireSession();
  if (!session || !session.id) return CLE_PANIER_PREF + 'invite';
  return CLE_PANIER_PREF + session.id;
}

export function lirePanier() {
  var brut = localStorage.getItem(clePanier());
  if (!brut) return [];
  try { return JSON.parse(brut) || []; }
  catch (e) { return []; }
}

function sauverPanier(panier) {
  localStorage.setItem(clePanier(), JSON.stringify(panier));
}

export function ajouterAuPanier(produit, quantite) {
  if (!produit || !produit.id) return [];
  var qte = Math.max(1, parseInt(quantite || 1, 10));
  var panier = lirePanier();
  var existant = panier.find(function(a) { return a.produitId === produit.id; });
  if (existant) {
    existant.quantite += qte;
  } else {
    panier.push({
      produitId: produit.id,
      nom:       produit.nom,
      prix:      produit.prix,
      image:     produit.image,
      categorie: produit.categorie,
      quantite:  qte
    });
  }
  sauverPanier(panier);
  return panier;
}

export function modifierQuantitePanier(produitId, quantite) {
  var qte = Math.max(1, parseInt(quantite || 1, 10));
  var panier = lirePanier().map(function(a) {
    return a.produitId === produitId ? Object.assign({}, a, { quantite: qte }) : a;
  });
  sauverPanier(panier);
  return panier;
}

export function retirerDuPanier(produitId) {
  var panier = lirePanier().filter(function(a) { return a.produitId !== produitId; });
  sauverPanier(panier);
  return panier;
}

export function viderPanier() {
  sauverPanier([]);
}

export function compterArticlesPanier() {
  return lirePanier().reduce(function(s, a) { return s + (a.quantite || 0); }, 0);
}

export function totalPanier() {
  return lirePanier().reduce(function(s, a) { return s + (a.prix || 0) * (a.quantite || 0); }, 0);
}

// ─── Commandes ────────────────────────────────────────────────────────────────

// Nouveau: Récupérer les administrateurs
export async function recupererAdministrateurs() {
  try {
    var reponse = await fetch(API_URL + '?role=admin');
    if (!reponse.ok) throw new Error('Erreur réseau');
    var admins = await reponse.json();
    
    // Ajouter les superadmins aussi
    var reponseSuper = await fetch(API_URL + '?role=superadmin');
    if (reponseSuper.ok) {
      var superAdmins = await reponseSuper.json();
      admins = admins.concat(superAdmins);
    }
    return admins;
  } catch (erreur) {
    console.error('Erreur db.js (recupererAdministrateurs) :', erreur);
    return [];
  }
}

export async function passerCommande(infosLivraison) {
  var session = lireSession();
  if (!session) throw new Error('Vous devez être connecté pour passer commande.');

  var articles = lirePanier();
  if (articles.length === 0) throw new Error('Votre panier est vide.');

  var montantTotal = totalPanier();

  var commande = {
    utilisateurId:    session.id,
    utilisateurNom:   session.nom,
    utilisateurEmail: session.email,
    articles:         articles,
    total:            montantTotal,
    statut:           'En attente de validation', // Nouveau statut initial
    dateCommande:     new Date().toISOString(),
    livraison:        infosLivraison || {},
    valideePar:       null, // ID de l'admin qui a validé
    dateValidation:   null,
    commentaireAdmin: ''
  };

  var reponse = await fetch(API_COMMANDES, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(commande)
  });
  if (!reponse.ok) throw new Error('Impossible d\'enregistrer la commande');

  var creee = await reponse.json();
  viderPanier();

  // Notification vers tous les admins et superadmins
  try {
    var admins = await recupererAdministrateurs();
    for (var i = 0; i < admins.length; i++) {
      await creerNotification({
        type:        'commande',
        titre:       'Nouvelle commande en attente',
        message:     session.nom + ' a passé une commande de ' + montantTotal.toLocaleString('fr-FR') + ' Fcfa',
        clientNom:   session.nom,
        clientEmail: session.email,
        referenceId: creee.id,
        cible:       'admin',
        adminId:     admins[i].id
      });
    }
  } catch (e) { console.warn('Notification commande non envoyée :', e); }

  return creee;
}

// Nouveau: Valider une commande (admin/superadmin)
export async function validerCommande(id, commentaire = '') {
  var session = lireSession();
  if (!session) throw new Error('Vous devez être connecté.');
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    throw new Error('Seuls les administrateurs peuvent valider une commande.');
  }

  var commande = await recupererCommandeParId(id);
  if (!commande) throw new Error('Commande introuvable');

  var commandeModifiee = {
    ...commande,
    statut: 'Validée',
    valideePar: session.id,
    dateValidation: new Date().toISOString(),
    commentaireAdmin: commentaire || ''
  };

  var reponse = await fetch(API_COMMANDES + '/' + encodeURIComponent(id), {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(commandeModifiee)
  });
  if (!reponse.ok) throw new Error('Impossible de valider la commande');

  // Notifier le client
  try {
    await creerNotification({
      type:        'commande',
      titre:       'Votre commande a été validée',
      message:     'Votre commande #' + id + ' a été validée par ' + session.nom,
      clientNom:   commande.utilisateurNom,
      clientEmail: commande.utilisateurEmail,
      referenceId: id,
      cible:       'client',
      adminId:     commande.utilisateurId
    });
  } catch (e) { console.warn('Notification client non envoyée :', e); }

  return await reponse.json();
}

// Nouveau: Refuser une commande (admin/superadmin)
export async function refuserCommande(id, commentaire = '') {
  var session = lireSession();
  if (!session) throw new Error('Vous devez être connecté.');
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    throw new Error('Seuls les administrateurs peuvent refuser une commande.');
  }

  var commande = await recupererCommandeParId(id);
  if (!commande) throw new Error('Commande introuvable');

  var commandeModifiee = {
    ...commande,
    statut: 'Refusée',
    valideePar: session.id,
    dateValidation: new Date().toISOString(),
    commentaireAdmin: commentaire || ''
  };

  var reponse = await fetch(API_COMMANDES + '/' + encodeURIComponent(id), {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(commandeModifiee)
  });
  if (!reponse.ok) throw new Error('Impossible de refuser la commande');

  // Notifier le client
  try {
    await creerNotification({
      type:        'commande',
      titre:       'Votre commande a été refusée',
      message:     'Votre commande #' + id + ' a été refusée. Motif: ' + (commentaire || 'Non spécifié'),
      clientNom:   commande.utilisateurNom,
      clientEmail: commande.utilisateurEmail,
      referenceId: id,
      cible:       'client',
      adminId:     commande.utilisateurId
    });
  } catch (e) { console.warn('Notification client non envoyée :', e); }

  return await reponse.json();
}

// Nouveau: Récupérer une commande par ID
export async function recupererCommandeParId(id) {
  try {
    var reponse = await fetch(API_COMMANDES + '/' + encodeURIComponent(id));
    if (!reponse.ok) return null;
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererCommandeParId) :', erreur);
    return null;
  }
}

export async function recupererCommandesUtilisateur(utilisateurId) {
  try {
    var url = API_COMMANDES + '?utilisateurId=' + encodeURIComponent(utilisateurId) + '&_sort=dateCommande&_order=desc';
    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererCommandesUtilisateur) :', erreur);
    return [];
  }
}

export async function recupererToutesLesCommandes() {
  try {
    var reponse = await fetch(API_COMMANDES + '?_sort=dateCommande&_order=desc');
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererToutesLesCommandes) :', erreur);
    return [];
  }
}

export async function modifierStatutCommande(id, statut) {
  var reponse = await fetch(API_COMMANDES + '/' + encodeURIComponent(id), {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ statut: statut })
  });
  if (!reponse.ok) throw new Error('Impossible de modifier le statut');
  return await reponse.json();
}

// ─── Devis ────────────────────────────────────────────────────────────────────

export async function creerDevis(infosDevis) {
  var session = lireSession();
  if (!session) throw new Error('Vous devez être connecté pour faire une demande de devis.');

  var devis = {
    utilisateurId:    String(session.id),
    utilisateurNom:   session.nom,
    utilisateurEmail: session.email,
    entreprise:       session.entreprise || '',
    produitId:        infosDevis.produitId || null,
    produitNom:       infosDevis.produitNom || '',
    quantite:         parseInt(infosDevis.quantite, 10) || 1,
    message:          infosDevis.message || '',
    statut:           'En attente',
    montantPropose:   null,
    reponseAdmin:     '',
    dateDevis:        new Date().toISOString(),
    dateMiseAJour:    new Date().toISOString()
  };

  var reponse = await fetch(API_DEVIS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(devis)
  });
  if (!reponse.ok) throw new Error('Impossible d\'enregistrer le devis');
  var cree = await reponse.json();

  // Notification vers tous les admins et superadmins
  try {
    var admins = await recupererAdministrateurs();
    for (var i = 0; i < admins.length; i++) {
      await creerNotification({
        type:        'devis',
        titre:       'Nouvelle demande de devis',
        message:     session.nom + ' a demandé un devis pour "' + (infosDevis.produitNom || 'un produit') + '"',
        clientNom:   session.nom,
        clientEmail: session.email,
        referenceId: cree.id,
        cible:       'admin',
        adminId:     admins[i].id
      });
    }
  } catch (e) { console.warn('Notification devis non envoyée :', e); }

  return cree;
}

export async function recupererDevisUtilisateur(utilisateurId) {
  try {
    var url = API_DEVIS + '?utilisateurId=' + encodeURIComponent(String(utilisateurId)) + '&_sort=dateDevis&_order=desc';
    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererDevisUtilisateur) :', erreur);
    return [];
  }
}

export async function recupererTousLesDevis() {
  try {
    var reponse = await fetch(API_DEVIS + '?_sort=dateDevis&_order=desc');
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererTousLesDevis) :', erreur);
    return [];
  }
}

export async function modifierDevis(id, donnees) {
  var patch = Object.assign({}, donnees, { dateMiseAJour: new Date().toISOString() });
  var reponse = await fetch(API_DEVIS + '/' + encodeURIComponent(id), {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch)
  });
  if (!reponse.ok) throw new Error('Impossible de modifier le devis');
  return await reponse.json();
}

export async function supprimerDevis(id) {
  var reponse = await fetch(API_DEVIS + '/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!reponse.ok) throw new Error('Impossible de supprimer le devis');
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function creerNotification(infos) {
  var notification = {
    type:        infos.type        || 'info',
    titre:       infos.titre       || 'Notification',
    message:     infos.message     || '',
    clientNom:   infos.clientNom   || '',
    clientEmail: infos.clientEmail || '',
    referenceId: infos.referenceId || null,
    cible:       infos.cible       || 'admin',
    adminId:     infos.adminId     || null,
    lue:         false,
    date:        new Date().toISOString()
  };
  var reponse = await fetch(API_NOTIFICATIONS, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(notification)
  });
  if (!reponse.ok) throw new Error('Impossible d\'enregistrer la notification');
  return await reponse.json();
}

export async function recupererNotificationsAdmin(adminId = null) {
  try {
    var url = API_NOTIFICATIONS + '?cible=admin&_sort=date&_order=desc';
    if (adminId) {
      url = API_NOTIFICATIONS + '?adminId=' + encodeURIComponent(adminId) + '&_sort=date&_order=desc';
    }
    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererNotificationsAdmin) :', erreur);
    return [];
  }
}

export async function recupererNotificationsClient(clientId) {
  try {
    var url = API_NOTIFICATIONS + '?cible=client&adminId=' + encodeURIComponent(clientId) + '&_sort=date&_order=desc';
    var reponse = await fetch(url);
    if (!reponse.ok) throw new Error('Erreur réseau');
    return await reponse.json();
  } catch (erreur) {
    console.error('Erreur db.js (recupererNotificationsClient) :', erreur);
    return [];
  }
}

export async function compterNotificationsNonLues(adminId = null) {
  try {
    var notifications = await recupererNotificationsAdmin(adminId);
    return notifications.filter(function(n) { return n.lue === false || n.lue === 'false'; }).length;
  } catch (e) {
    return 0;
  }
}

export async function marquerNotificationLue(id) {
  var reponse = await fetch(API_NOTIFICATIONS + '/' + encodeURIComponent(id), {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ lue: true })
  });
  if (!reponse.ok) throw new Error('Impossible de marquer la notification');
  return await reponse.json();
}

export async function marquerToutesLuesAdmin(adminId = null) {
  try {
    var notifications = await recupererNotificationsAdmin(adminId);
    var nonLues = notifications.filter(function(n) { return n.lue === false || n.lue === 'false'; });
    await Promise.all(nonLues.map(function(n) { return marquerNotificationLue(n.id); }));
  } catch (e) {
    console.warn('Erreur marquerToutesLues :', e);
  }
}