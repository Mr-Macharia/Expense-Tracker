const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Set up sessions
app.use(session({
    secret: 'your_secret_key', // Change to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true in production if using HTTPS
}));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
        throw err;
    }
    console.log('MySQL Connected...');
});

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).send('Unauthorized. Please log in.');
    }
}

// Register User
app.post('/api/register', async (req, res) => {
    const { name, profile_name, email, password, country, phone_number } = req.body;

    if (!name || !profile_name || !email || !password || !country || !phone_number) {
        return res.status(400).send('Please fill in all fields');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = {
            name,
            profile_name,
            email,
            country,
            phone_number,
            password: hashedPassword,
            registration_date: new Date()
        };

        const sql = 'INSERT INTO users SET ?';
        db.query(sql, user, (err, result) => {
            if (err) {
                console.error('Error registering user:', err);
                return res.status(500).send('Error registering user');
            }
            res.status(201).send('User registered successfully');
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Server error');
    }
});

// Login User with session management
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Please provide both email and password');
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Error logging in');
        }

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).send('Incorrect email or password');
        }

        req.session.userId = results[0].id;
        req.session.userName = results[0].name;

        // Debugging Statement
        console.log('Login successful. Session userId:', req.session.userId);
        
        res.json({ message: 'Login successful' });
    });
});

// Logout User
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

// Get all expenses for logged-in user
app.get('/api/expenses', isAuthenticated, (req, res) => {
    const user_id = req.session.userId;
    
    const sql = 'SELECT * FROM expenses WHERE user_id = ?';
    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching expenses:', err);
            return res.status(500).send('Error fetching expenses');
        }

        res.json(results);
    });
});

// Add Expense (requires login)
app.post('/api/expenses', isAuthenticated, (req, res) => {
    const { category, notes, amount, date } = req.body;
    const userId = req.session.userId;

    // Debugging Statement
    console.log('Adding expense. Current session userId:', userId);

    if (!category || !notes || !amount || !date) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: Please log in again' });
    }

    const sql = 'INSERT INTO expenses (user_id, expense_date, category, amount, notes) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [userId, date, category, amount, notes], (err, result) => {
        if (err) {
            console.error('Error adding expense:', err);
            res.status(500).json({ message: 'Error adding expense' });
        } else {
            res.status(201).json({ message: 'Expense added successfully!' });
        }
    });
});

// Get a single expense by ID (requires login)
app.get('/api/expenses/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?';
    
    db.query(sql, [id, req.session.userId], (err, result) => {
        if (err) {
            console.error('Error fetching expense:', err);
            return res.status(500).send('Error fetching expense');
        }

        if (result.length === 0) {
            return res.status(404).send('Expense not found or not authorized');
        }

        res.json(result[0]); // Send back the single expense
    });
});

// Update an expense (requires login)
app.put('/api/expenses/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { category, notes, amount, date } = req.body;

    if (!category || !notes || !amount || !date) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const sql = 'UPDATE expenses SET category = ?, notes = ?, amount = ?, expense_date = ? WHERE expense_id = ? AND user_id = ?';
    db.query(sql, [category, notes, amount, date, id, req.session.userId], (err, result) => {
        if (err) {
            console.error('Error updating expense:', err);
            return res.status(500).send('Error updating expense');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Expense not found or not authorized');
        }

        res.send('Expense updated successfully');
    });
});



// Delete Expense (requires login)
app.delete('/api/expenses/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM expenses WHERE expense_id = ? AND user_id = ?';
    db.query(sql, [id, req.session.userId], (err, result) => {
        if (err) {
            console.error('Error deleting expense:', err);
            return res.status(500).send('Error deleting expense');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Expense not found or not authorized');
        }
        res.send('Expense deleted successfully');
    });
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route to serve index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
