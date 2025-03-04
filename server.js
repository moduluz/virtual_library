// Required packages
require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection string
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'admin';
const collectionName = "books";

// MongoDB client configuration
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
let booksCollection;

// Connect to MongoDB
async function connectToMongo() {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log(`Target database: ${dbName}, collection: ${collectionName}`);
        
        await client.connect();
        console.log('Successfully connected to MongoDB');
        
        const db = client.db(dbName);
        booksCollection = db.collection(collectionName);
        
        // Test the connection by counting documents
        const count = await booksCollection.countDocuments({});
        console.log(`Found ${count} documents in ${dbName}.${collectionName}`);
        
        return booksCollection;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        throw error;
    }
}

// Initialize MongoDB connection
connectToMongo().then(() => {
    console.log('MongoDB connection initialized');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}).catch(error => {
    console.error('Failed to initialize MongoDB:', error);
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Book schema validation
const bookSchema = {
    'Book Name': String,
    'URL': String,
    'Author': String,
    'pdf_link': String,
    'description': String
};

// Validate book data
function validateBook(book) {
    const errors = [];
    
    if (!book || typeof book !== 'object') {
        errors.push('Invalid book data format');
        return errors;
    }
    
    // Required fields
    if (!book['Book Name'] || typeof book['Book Name'] !== 'string' || !book['Book Name'].trim()) {
        errors.push('Book Name is required and must be a non-empty string');
    }
    
    if (!book['Author'] || typeof book['Author'] !== 'string' || !book['Author'].trim()) {
        errors.push('Author is required and must be a non-empty string');
    }
    
    // Optional fields
    if (book['URL'] && typeof book['URL'] !== 'string') {
        errors.push('URL must be a string if provided');
    }
    
    if (book['pdf_link'] && typeof book['pdf_link'] !== 'string') {
        errors.push('pdf_link must be a string if provided');
    }
    
    if (book['description'] && typeof book['description'] !== 'string') {
        errors.push('description must be a string if provided');
    }
    
    return errors;
}

// Serve the frontend - both root and /ui should serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/ui', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IMPORTANT: Move the search route before the :id route to prevent conflicts
// Search books
app.get('/api/books/search', async (req, res) => {
  try {
    const { query, field = 'Book Name', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Create search criteria
    let searchCriteria = {};
    if (query) {
      searchCriteria[field] = { $regex: query, $options: 'i' }; // Case-insensitive search
    }
    
    const books = await booksCollection.find(searchCriteria)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
      
    const total = await booksCollection.countDocuments(searchCriteria);
    
    res.json({
      data: books,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        query,
        field
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all books with pagination
app.get('/api/books', async (req, res) => {
    try {
        console.log('Fetching books...');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        console.log(`Query params - page: ${page}, limit: ${limit}, skip: ${skip}`);
        
        const books = await booksCollection.find({})
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const total = await booksCollection.countDocuments({});
        
        console.log(`Found ${books.length} books out of ${total} total`);
        
        res.json({
            data: books,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ 
            error: 'Failed to fetch books',
            details: error.message 
        });
    }
});

// GET a single book by ID - MOVED AFTER search route
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await booksCollection.findOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new book
app.post('/api/books', async (req, res) => {
    try {
        console.log('Raw request body:', req.body); // Debug log
        
        // Basic request validation
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ 
                error: 'Invalid request body',
                received: req.body 
            });
        }
        
        // Validate the book data
        const errors = validateBook(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        // Insert the book
        const result = await booksCollection.insertOne(req.body);
        
        if (!result.acknowledged) {
            throw new Error('Failed to insert book into database');
        }
        
        // Return the complete book data with _id
        const insertedBook = {
            _id: result.insertedId,
            ...req.body
        };
        
        res.status(201).json(insertedBook);
        
    } catch (error) {
        console.error('Error adding book:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const errors = validateBook(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }
        
        const result = await booksCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Book not found" });
        }
        
        res.json({ message: "Book updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const result = await booksCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to the Books API",
    endpoints: {
      getAllBooks: "GET /api/books",
      searchBooks: "GET /api/books/search?query=keyword&field=title",
      getBookById: "GET /api/books/:id",
      createBook: "POST /api/books",
      updateBook: "PUT /api/books/:id",
      deleteBook: "DELETE /api/books/:id"
    },
    version: "1.0"
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
}