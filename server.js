// Required packages
require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/covers', 'uploads/pdfs'];
uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isImage = file.mimetype.startsWith('image/');
        const uploadDir = isImage ? 'uploads/covers' : 'uploads/pdfs';
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'cover') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed for covers!'), false);
        }
    } else if (file.fieldname === 'pdf') {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Configuration
const MONGODB_URI = 'mongodb://127.0.0.1:27017/personal_library';
const JWT_SECRET = 'eternal-narratives-secret-key';
const PORT = process.env.PORT || 3000;

// MongoDB Client
const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

let db, usersCollection, booksCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB.');
        
        db = client.db('personal_library');
        usersCollection = db.collection('users');
        booksCollection = db.collection('books');
        
        // Initialize database indexes
        await initializeDatabase();
        
        // Start server only after DB is connected
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Environment:', process.env.NODE_ENV || 'development');
        });
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        // Create indexes if they don't exist
        const indexes = await usersCollection.listIndexes().toArray();
        const emailIndexExists = indexes.some(index => index.key.email === 1);
        
        if (!emailIndexExists) {
            await usersCollection.createIndex({ email: 1 }, { unique: true });
            console.log('Created email index on users collection');
        }

        const bookIndexes = await booksCollection.listIndexes().toArray();
        const userIdIndexExists = bookIndexes.some(index => index.key.userId === 1);
        const textIndexExists = bookIndexes.some(index => index.key._fts === 'text');

        if (!userIdIndexExists) {
            await booksCollection.createIndex({ userId: 1 });
            console.log('Created userId index on books collection');
        }

        if (!textIndexExists) {
            await booksCollection.createIndex(
                { title: 'text', description: 'text', tags: 'text' },
                { weights: { title: 10, description: 5, tags: 3 } }
            );
            console.log('Created text search index on books collection');
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Error during database initialization:', error);
        // Don't throw the error, just log it and continue
    }
}

// Start the server
connectDB().catch(console.error);

// Authentication middleware
function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size limit exceeded (10MB max)' });
        }
        return res.status(400).json({ error: err.message });
    }
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// MongoDB Schema
const userSchema = {
    email: String,
    password: String,  // Will be hashed
    username: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
};

// Book Schema with User Reference
const bookSchema = {
    title: { type: String, required: true },
    description: String,
    coverImage: String,  // URL to stored image
    pdfFile: String,     // URL to stored PDF
    userId: ObjectId,    // Reference to user who added the book
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
};

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // Validate required fields
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            email,
            username,
            password: hashedPassword,
            createdAt: new Date(),
            lastLogin: new Date()
        };

        const result = await usersCollection.insertOne(user);
        
        // Generate JWT
        const token = jwt.sign({ userId: result.insertedId }, JWT_SECRET);

        res.status(201).json({
            token,
            user: {
                id: result.insertedId,
                email,
                username
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

app.post('/api/auth/verify', authenticateUser, async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.userId) });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        res.json({
            valid: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Book Routes
app.get('/api/books', authenticateUser, async (req, res) => {
    try {
        const books = await booksCollection.find({ userId: new ObjectId(req.userId) }).toArray();
        res.json(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Error fetching books' });
    }
});

// Search books
app.get('/api/books/search', authenticateUser, async (req, res) => {
    try {
        const { query } = req.query;
        const searchQuery = query ? 
            { 
                $and: [
                    { userId: new ObjectId(req.userId) },
                    { $text: { $search: query } }
                ]
            } : 
            { userId: new ObjectId(req.userId) };
            
        const books = await booksCollection.find(searchQuery).toArray();
        res.json(books);
    } catch (error) {
        console.error('Error searching books:', error);
        res.status(500).json({ error: 'Error searching books' });
    }
});

app.post('/api/books', authenticateUser, upload.fields([
    { name: 'cover', maxCount: 1, optional: true },
    { name: 'pdf', maxCount: 1, optional: true }
]), async (req, res) => {
    try {
        console.log('Received book data:', req.body); // Debug log
        const { title, description, tags, coverImageUrl } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const book = {
            userId: new ObjectId(req.userId),
            title,
            description: description || '',
            tags: tags ? JSON.parse(tags) : [],
            coverImage: coverImageUrl || (req.files?.cover ? `/uploads/covers/${req.files.cover[0].filename}` : '/default-cover.png'),
            pdfFile: req.files?.pdf ? `/uploads/pdfs/${req.files.pdf[0].filename}` : null,
            readingProgress: {
                currentPage: 0,
                totalPages: 0,
                status: 'not-started'
            },
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Attempting to save book:', book); // Debug log
        const result = await booksCollection.insertOne(book);
        console.log('Book saved successfully:', result); // Debug log
        
        res.status(201).json({ ...book, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ 
            error: 'Error creating book', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.get('/api/books/:id', authenticateUser, async (req, res) => {
    try {
        const book = await booksCollection.findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.userId)
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).json({ error: 'Error fetching book' });
    }
});

app.put('/api/books/:id', authenticateUser, upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
    try {
        const bookId = new ObjectId(req.params.id);
        const { title, description, tags, metadata, readingProgress, isFavorite } = req.body;

        const oldBook = await booksCollection.findOne({
            _id: bookId,
            userId: new ObjectId(req.userId)
        });

        if (!oldBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const updateData = {
            title: title || oldBook.title,
            description: description || oldBook.description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : oldBook.tags,
            metadata: metadata ? JSON.parse(metadata) : oldBook.metadata,
            readingProgress: readingProgress ? JSON.parse(readingProgress) : oldBook.readingProgress,
            isFavorite: isFavorite !== undefined ? isFavorite === 'true' : oldBook.isFavorite,
            updatedAt: new Date()
        };

        if (req.files.cover) {
            // Delete old cover if exists
            if (oldBook.coverImage) {
                const oldPath = path.join(__dirname, oldBook.coverImage);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.coverImage = `/uploads/covers/${req.files.cover[0].filename}`;
        }

        if (req.files.pdf) {
            // Delete old PDF if exists
            if (oldBook.pdfFile) {
                const oldPath = path.join(__dirname, oldBook.pdfFile);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.pdfFile = `/uploads/pdfs/${req.files.pdf[0].filename}`;
        }

        await booksCollection.updateOne(
            { _id: bookId },
            { $set: updateData }
        );

        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        console.error('Error updating book:', error);
        res.status(500).json({ error: 'Error updating book' });
    }
});

app.delete('/api/books/:id', authenticateUser, async (req, res) => {
    try {
        const book = await booksCollection.findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.userId)
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Delete associated files
        if (book.coverImage) {
            const coverPath = path.join(__dirname, book.coverImage);
            if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        }
        if (book.pdfFile) {
            const pdfPath = path.join(__dirname, book.pdfFile);
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        }

        await booksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        res.status(500).json({ error: 'Error deleting book' });
    }
});

// Toggle favorite status
app.post('/api/books/:id/favorite', authenticateUser, async (req, res) => {
    try {
        const book = await booksCollection.findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.userId)
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        await booksCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { 
                isFavorite: !book.isFavorite,
                updatedAt: new Date()
            }}
        );

        res.json({ message: 'Favorite status updated successfully' });
    } catch (error) {
        console.error('Error updating favorite status:', error);
        res.status(500).json({ error: 'Error updating favorite status' });
    }
});

// Update reading progress
app.put('/api/books/:id/progress', authenticateUser, async (req, res) => {
    try {
        const { currentPage, totalPages, status } = req.body;

        const book = await booksCollection.findOne({
            _id: new ObjectId(req.params.id),
            userId: new ObjectId(req.userId)
        });

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        await booksCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: {
                readingProgress: {
                    currentPage: parseInt(currentPage) || 0,
                    totalPages: parseInt(totalPages) || book.readingProgress.totalPages,
                    status: status || book.readingProgress.status
                },
                updatedAt: new Date()
            }}
        );

        res.json({ message: 'Reading progress updated successfully' });
    } catch (error) {
        console.error('Error updating reading progress:', error);
        res.status(500).json({ error: 'Error updating reading progress' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404 errors - This should be the last middleware
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
});