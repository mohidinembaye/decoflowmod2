const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');

const app = express();

// ── CORS : autoriser toutes les origines ──────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Répondre aux requêtes OPTIONS (preflight)
app.options('*', cors());

app.use(express.json());

// ── Fichiers statiques (index.html, main.js, style.css...) ───────────────────
app.use(express.static(path.join(__dirname, '.')));

// ── Connexion MongoDB ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URL)
  .then(function() { console.log('✓ MongoDB connecté'); })
  .catch(function(err) { console.error('✗ Erreur MongoDB :', err); });

// ── Schémas ───────────────────────────────────────────────────────────────────

var utilisateurSchema = new mongoose.Schema({
  nom: String, email: String, motDePasse: String,
  role: String, entreprise: String, dateInscription: String,
  preferences: Object, biographie: String, telephone: String
});

var produitSchema = new mongoose.Schema({
  nom: String, categorie: String, prix: Number,
  image: String, stock: Number, vedette: Boolean, description: String
});

var commandeSchema = new mongoose.Schema({
  utilisateurId: String, utilisateurNom: String, utilisateurEmail: String,
  articles: Array, total: Number, statut: String,
  dateCommande: String, livraison: Object,
  valideePar: String, dateValidation: String, commentaireAdmin: String
});

var devisSchema = new mongoose.Schema({
  utilisateurId: String, utilisateurNom: String, utilisateurEmail: String,
  entreprise: String, produitId: String, produitNom: String,
  quantite: Number, message: String, statut: String,
  produits: Array, montantHT: Number, montantTTC: Number,
  montantPropose: Number, reponseAdmin: String,
  dateDevis: String, dateMiseAJour: String
});

var notificationSchema = new mongoose.Schema({
  type: String, titre: String, message: String,
  clientNom: String, clientEmail: String, referenceId: Number,
  cible: String, adminId: String, lue: Boolean, date: String
});

var Utilisateur  = mongoose.model('Utilisateur',  utilisateurSchema);
var Produit      = mongoose.model('Produit',       produitSchema);
var Commande     = mongoose.model('Commande',      commandeSchema);
var Devis        = mongoose.model('Devis',         devisSchema);
var Notification = mongoose.model('Notification',  notificationSchema);

// ── Utilitaire ────────────────────────────────────────────────────────────────

function formaterDoc(doc) {
  var obj = doc._id ? doc : doc;
  var result = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  result.id = result._id ? result._id.toString() : result.id;
  delete result._id;
  delete result.__v;
  return result;
}

// ── Routes utilisateurs ───────────────────────────────────────────────────────

app.get('/utilisateurs', async function(req, res) {
  try {
    var filtre = {};
    if (req.query.email) filtre.email = req.query.email.toLowerCase();
    if (req.query.role)  filtre.role  = req.query.role;
    var docs = await Utilisateur.find(filtre).lean();
    res.json(docs.map(formaterDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/utilisateurs/:id', async function(req, res) {
  try {
    var doc = await Utilisateur.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/utilisateurs', async function(req, res) {
  try {
    var corps = req.body;
    if (corps.email) corps.email = corps.email.toLowerCase();
    var doc = await Utilisateur.create(corps);
    res.status(201).json(formaterDoc(doc.toObject()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/utilisateurs/:id', async function(req, res) {
  try {
    var doc = await Utilisateur.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routes produits ───────────────────────────────────────────────────────────

app.get('/produits', async function(req, res) {
  try {
    var docs = await Produit.find().lean();
    res.json(docs.map(formaterDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/produits/:id', async function(req, res) {
  try {
    var doc = await Produit.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/produits', async function(req, res) {
  try {
    var doc = await Produit.create(req.body);
    res.status(201).json(formaterDoc(doc.toObject()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/produits/:id', async function(req, res) {
  try {
    var doc = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/produits/:id', async function(req, res) {
  try {
    await Produit.findByIdAndDelete(req.params.id);
    res.json({});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routes commandes ──────────────────────────────────────────────────────────

app.get('/commandes', async function(req, res) {
  try {
    var filtre = {};
    if (req.query.utilisateurId) filtre.utilisateurId = req.query.utilisateurId;
    var docs = await Commande.find(filtre).sort({ dateCommande: -1 }).lean();
    res.json(docs.map(formaterDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/commandes', async function(req, res) {
  try {
    var doc = await Commande.create(req.body);
    res.status(201).json(formaterDoc(doc.toObject()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/commandes/:id', async function(req, res) {
  try {
    var doc = await Commande.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routes devis ──────────────────────────────────────────────────────────────

app.get('/devis', async function(req, res) {
  try {
    var filtre = {};
    if (req.query.utilisateurId) filtre.utilisateurId = String(req.query.utilisateurId);
    var docs = await Devis.find(filtre).sort({ dateDevis: -1 }).lean();
    res.json(docs.map(formaterDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/devis', async function(req, res) {
  try {
    var doc = await Devis.create(req.body);
    res.status(201).json(formaterDoc(doc.toObject()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/devis/:id', async function(req, res) {
  try {
    var doc = await Devis.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Routes notifications ──────────────────────────────────────────────────────

app.get('/notifications', async function(req, res) {
  try {
    var filtre = {};
    if (req.query.cible)   filtre.cible   = req.query.cible;
    if (req.query.adminId) filtre.adminId = req.query.adminId;
    var docs = await Notification.find(filtre).sort({ date: -1 }).lean();
    res.json(docs.map(formaterDoc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/notifications', async function(req, res) {
  try {
    var doc = await Notification.create(req.body);
    res.status(201).json(formaterDoc(doc.toObject()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/notifications/:id', async function(req, res) {
  try {
    var doc = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({});
    res.json(formaterDoc(doc));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Route fallback : renvoyer index.html pour le router SPA ──────────────────
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
var PORT = process.env.PORT || 3001;
app.listen(PORT, function() {
  console.log('✓ Serveur DecoFlow lancé sur le port ' + PORT);
});