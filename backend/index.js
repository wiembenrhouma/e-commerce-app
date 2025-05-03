const port = process.env.PORT || 4000;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require('cors');
const path = require("path");
require('dotenv').config(); // Pour utiliser les variables d'environnement

app.use(express.json());
app.use(cors({
    origin: [
      'https://e-commerce-app-4upc.vercel.app', // frontend client
      'https://e-commerce-app-sooty-nine.vercel.app' // dashboard admin
    ],
    credentials: true
}));

// Connexion à MongoDB via variable d'environnement
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Image storage config
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

app.use('/images', express.static('upload/images'));

// Fonction pour vérifier et extraire le token JWT de la requête
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send({ errors: "Token manquant" });

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET); // Utilisation du secret de l'environnement
        req.user = data.user;
        next();
    } catch {
        res.status(401).send({ errors: "Token invalide" });
    }
};

// Point de téléchargement d'image
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `https://e-commerce-app-p6bd.onrender.com/images/${req.file.filename}`
    });
});

// Product Schema
const Product = mongoose.model("Product", {
    id: Number,
    name: String,
    image: String,
    category: String,
    new_price: Number,
    old_price: Number,
    date: { type: Date, default: Date.now },
    avilable: { type: Boolean, default: true },
});

// Ajouter un produit
app.post('/addproduct', async (req, res) => {
    const products = await Product.find({});
    const id = products.length > 0 ? products.slice(-1)[0].id + 1 : 1;

    const product = new Product({
        id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });

    await product.save();
    res.json({ success: true, name: req.body.name });
});

// Supprimer un produit
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
});

// Récupérer tous les produits
app.get('/allproducts', async (req, res) => {
    const products = await Product.find({});
    res.send(products);
});

// User Schema
const Users = mongoose.model('Users', {
    name: String,
    email: { type: String, unique: true },
    password: String,
    cartData: Object,
    date: { type: Date, default: Date.now },
});

// Inscription
app.post('/signup', async (req, res) => {
    const check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Email déjà utilisé" });
    }

    const cart = Array.from({ length: 300 }, (_, i) => [i, 0]).reduce((obj, [k, v]) => {
        obj[k] = v;
        return obj;
    }, {});

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save();
    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET);
    res.json({ success: true, token });
});

// Connexion
app.post('/login', async (req, res) => {
    const user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Mot de passe incorrect" });
        }
    } else {
        res.json({ success: false, errors: "Email incorrect" });
    }
});

// Ajouter au panier
app.post('/addtocart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    user.cartData[req.body.itemId] += 1;
    await user.save();
    res.send("Ajouté");
});

// Supprimer du panier
app.post('/removefromcart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    if (user.cartData[req.body.itemId] > 0) {
        user.cartData[req.body.itemId] -= 1;
        await user.save();
    }
    res.send("Supprimé");
});

// Récupérer le panier
app.post('/getcart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    res.json(user.cartData);
});

// Récupérer les collections
app.get('/newcollections', async (req, res) => {
    const products = await Product.find({});
    const newcollection = products.slice(-8);
    res.send(newcollection);
});

// Récupérer les produits populaires pour femmes
app.get('/popularinwomen', async (req, res) => {
    const products = await Product.find({ category: "women" });
    const popular_in_women = products.slice(0, 4);
    res.send(popular_in_women);
});

// Tri par prix
app.get('/products/women', async (req, res) => {
    const sortOrder = req.query.sort === 'desc' ? -1 : 1;
    const products = await Product.find({ category: "women" }).sort({ new_price: sortOrder });
    res.json(products);
});

app.get('/products/men', async (req, res) => {
    const sortOrder = req.query.sort === 'desc' ? -1 : 1;
    const products = await Product.find({ category: "men" }).sort({ new_price: sortOrder });
    res.json(products);
});

app.get('/products/kid', async (req, res) => {
    const sortOrder = req.query.sort === 'desc' ? -1 : 1;
    const products = await Product.find({ category: "kid" }).sort({ new_price: sortOrder });
    res.json(products);
});

// Page d'accueil
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Lancer le serveur
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
