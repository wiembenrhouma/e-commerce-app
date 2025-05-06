const port = process.env.PORT || 4000;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require('cors');
const path = require("path");
require('dotenv').config(); // Pour utiliser les variables d'environnement
console.log("MONGODB_URI =", process.env.MONGODB_URI);


app.use(express.json());
app.options('*', cors());
app.use(cors({
    origin: [
      'https://e-commerce-app-4upc.vercel.app', // frontend client
      'https://e-commerce-app-sooty-nine.vercel.app' // dashboard admin (exemple)
    ],
    credentials: true
  }));
  

// Connexion à MongoDB via variable d'environnement
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce-products',
        allowed_formats: ['jpg', 'jpeg', 'png'],
    },
});

const upload = multer({ storage });

// Route de téléchargement vers Cloudinary
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: req.file.path, // URL Cloudinary directe
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

app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true, name: req.body.name });
});

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

    // ✅ Ajout du log ici :
    console.log("Nouvel utilisateur enregistré :", user);

    const token = jwt.sign({ user: { id: user._id } }, 'secret_ecom');
    res.json({ success: true, token });
});

app.post('/login', async (req, res) => {
    const user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const token = jwt.sign({ user: { id: user._id } }, 'secret_ecom');
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Mot de passe incorrect" });
        }
    } else {
        res.json({ success: false, errors: "Email incorrect" });
    }
});

app.get('/newcollections', async (req, res) => {
    const products = await Product.find({});
    const newcollection = products.slice(-8);
    res.send(newcollection);
});

app.get('/popularinwomen', async (req, res) => {
    const products = await Product.find({ category: "women" });
    const popular_in_women = products.slice(0, 4);
    res.send(popular_in_women);
});

const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send({ errors: "Token manquant" });

    try {
        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
    } catch {
        res.status(401).send({ errors: "Token invalide" });
    }
};

app.post('/addtocart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    user.cartData[req.body.itemId] += 1;
    await user.save();
    res.json({ message: "Ajouté" }); // ✅ JSON response
});

app.post('/removefromcart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    if (user.cartData[req.body.itemId] > 0) {
        user.cartData[req.body.itemId] -= 1;
        await user.save();
    }
    res.json({ message: "Supprimé" }); // ✅ JSON response
});


app.post('/getcart', fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    res.json(user.cartData);
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
