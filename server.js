// server.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql=require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'yourUsername',  // Change this to your MySQL username
    password: 'yourPassword',  // Change this to your MySQL password
    database: 'recipeSuggestionDB',
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected');
});

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the username already exists
    const checkUserSql = 'SELECT * FROM users WHERE username = ?';
    db.query(checkUserSql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                return res.status(400).json({ message: 'User registration failed', error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    });
});

// User login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id }, 'yourSecretKey', { expiresIn: '1h' });
        res.json({ token });
    });
});

// Suggest recipes based on ingredients
app.post('/suggest-recipes', (req, res) => {
    const { ingredients } = req.body;

    // Create a dynamic query based on ingredients
    const placeholders = ingredients.map(() => '?').join(',');
    const sql = 'SELECT * FROM RECIPES WHERE INGREDIENTS IN (${placeholders})';

    db.query(sql, ingredients, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching recipes', error: err.message });
        }
        res.json(results);
    });
});

// Add a new recipe
app.post('/add-recipe', (req, res) => {
    const { name, ingredients } = req.body;
    const sql = 'INSERT INTO recipes (name, ingredients) VALUES (?, ?)';

    db.query(sql, [name, ingredients.join(', ')], (err, result) => {
        if (err) {
            return res.status(400).json({ message: 'Failed to add recipe', error: err.message });
        }
        res.status(201).json({ message: 'Recipe added successfully', recipeId: result.insertId });
    });
});

// Get all recipes
app.get('/recipes', (req, res) => {
    const sql = 'SELECT * FROM recipes';

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching recipes', error: err.message });
        }
        res.json(results);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log('Server is running on http://localhost:${PORT}');
});
