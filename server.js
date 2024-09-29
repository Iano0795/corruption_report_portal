const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();

app.use(
    session({
        secret: 'hftrvh4573gv',
        resave: false,
        saveUninitialized: false,
    })
);

// Handle Multer errors globally
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the limit of 10 MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});


// Ensure 'uploads' directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
// Modify multer configuration
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
    fileFilter: (req, file, cb) => {
        // Allow only images and videos
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime']; // Added video/quicktime for MOV
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
        }
    },
});

// Create connection
const connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
});

// Check connection // Connect to database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database successfully!');
});

// Create database
connection.query('CREATE DATABASE if not exists corrupt', (err, result) => {
    if (err) throw err;
    console.log('Database created successfully');
});

// Access database
connection.query('USE corrupt', (err, result) => {
    if (err) throw err;
    console.log('Database accessed successfully');
});

// Create report table with media columns
const report = `CREATE TABLE IF NOT EXISTS report (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    accused VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    description VARCHAR(1500) NOT NULL,
    location_incidence VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    media_type VARCHAR(10) NULL,  -- To store if the file is image or video
    media_url VARCHAR(255) NULL    -- To store the file path
)`;

// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);`;

connection.query(report, (err, result) => {
    if (err) {
        console.error('Error creating Report Table:', err);
        return;
    }
    console.log('Report Table created successfully');
});

connection.query(createUsersTable, (err, result) => {
    if (err) {
        console.error('Error creating Users Table:', err);
        return;
    }
    console.log('Users Table created successfully');
});

// Display routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Login Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';

    connection.query(query, [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        return res.status(200).json({ message: 'Login successful' });
    });
});

// Fetch all reports
app.get('/api/reports', (req, res) => {
    const query = 'SELECT * FROM report ORDER BY date DESC';

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Create Report Route with Media Handling
app.post('/', upload.single('media'), (req, res) => {
    const { accused, position, description, location_incidence, date } = req.body;
    const mediaType = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null;
    const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if there's an error with file upload
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }

    const query = 'INSERT INTO report (accused, position, description, location_incidence, date, media_type, media_url) VALUES (?, ?, ?, ?, ?, ?, ?)';

    connection.query(
        query,
        [accused, position, description, location_incidence, date, mediaType, mediaUrl],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.redirect('/');
        }
    );
});
// Start server
app.listen(4300, () => {
    console.log('Server running at port 4300');
});







