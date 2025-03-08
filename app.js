// API endpoints
const API = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    verify: '/api/auth/verify',
    books: '/api/books',
    search: '/api/books/search'
};

// Global state
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginFormElement = document.getElementById('login-form');
const registerFormElement = document.getElementById('register-form');
const usernameDisplay = document.getElementById('username-display');
const booksGridElement = document.getElementById('books-grid');
const addBookModal = document.getElementById('add-book-modal');
const searchInput = document.getElementById('search-input');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const booksError = document.getElementById('books-error');

// Error handling functions
function showError(element, message) {
    if (typeof message === 'object') {
        // If message is an error object, try to extract meaningful information
        message = message.message || JSON.stringify(message);
    }
    element.textContent = message;
    element.style.display = 'block';
    element.classList.add('visible');
    setTimeout(() => {
        element.classList.remove('visible');
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    }, 5000);
}

function clearErrors() {
    [loginError, registerError, booksError].forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
        el.style.display = 'none';
    });
}

// Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(API.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        
        showApp();
        loadBooks();
    } catch (error) {
        showError(loginError, error.message);
        console.error('Login error:', error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearErrors();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(API.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed');

        // Auto-login after registration
        const loginResponse = await fetch(API.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.error || 'Auto-login failed');

        authToken = loginData.token;
        currentUser = loginData.user;
        localStorage.setItem('authToken', authToken);
        
        showApp();
        loadBooks();
    } catch (error) {
        showError(registerError, error.message);
        console.error('Registration error:', error);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    clearErrors();
    showAuth();
}

// Book Management Functions
async function loadBooks() {
    try {
        const response = await fetch(API.books, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        showError(booksError, 'Error loading books. Please try again.');
        console.error('Error loading books:', error);
    }
}

async function handleAddBook(event) {
    event.preventDefault();
    clearErrors();
    
    try {
        const formData = new FormData();
        const title = document.getElementById('book-title').value;
        if (!title.trim()) {
            throw new Error('Title is required');
        }
        
        const description = document.getElementById('book-description').value;
        const tags = document.getElementById('book-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);
        const coverImageUrl = document.getElementById('cover-image-url').value;
        
        formData.append('title', title);
        formData.append('description', description);
        formData.append('tags', JSON.stringify(tags));
        
        // Handle cover image (URL or file)
        if (coverImageUrl) {
            formData.append('coverImageUrl', coverImageUrl);
        } else {
            const coverImage = document.getElementById('cover-image').files[0];
            if (coverImage) {
                formData.append('cover', coverImage);
            }
        }
        
        // Handle optional PDF
        const pdfFile = document.getElementById('pdf-file').files[0];
        if (pdfFile) {
            formData.append('pdf', pdfFile);
        }

        const response = await fetch(API.books, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.details || 'Failed to add book');
        }

        hideAddBookModal();
        document.getElementById('add-book-form').reset();
        await loadBooks(); // Reload the books list
        showError(booksError, 'Book added successfully!'); // Show success message
    } catch (error) {
        console.error('Error adding book:', error);
        showError(booksError, error.message || 'Failed to add book. Please try again.');
    }
}

async function searchBooks() {
    const query = searchInput.value.trim();
    clearErrors();
    
    try {
        const response = await fetch(`${API.search}?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Failed to search books');
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        showError(booksError, 'Error searching books. Please try again.');
        console.error('Error searching books:', error);
    }
}

// UI Functions
function displayBooks(books) {
    if (!Array.isArray(books)) {
        console.error('Expected books to be an array, got:', books);
        books = [];
    }
    
    booksGridElement.innerHTML = books.length === 0 
        ? '<div class="no-books">No books found. Add some books to your library!</div>'
        : books.map(book => `
            <div class="book-card">
                <img src="${book.coverImage || '/default-cover.png'}" alt="${book.title}" class="book-cover" onerror="this.src='/default-cover.png'">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-description">${book.description || 'No description available'}</p>
                    <div class="book-tags">
                        ${(book.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
}

function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    usernameDisplay.textContent = currentUser ? `Welcome, ${currentUser.username}!` : '';
}

function toggleAuthForm() {
    clearErrors();
    loginFormElement.classList.toggle('hidden');
    registerFormElement.classList.toggle('hidden');
}

function showAddBookModal() {
    clearErrors();
    addBookModal.classList.remove('hidden');
}

function hideAddBookModal() {
    clearErrors();
    addBookModal.classList.add('hidden');
    document.getElementById('add-book-form').reset();
}

// Initialize app
async function initApp() {
    if (authToken) {
        try {
            const response = await fetch(API.verify, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Invalid token');
            }
            
            const data = await response.json();
            currentUser = data.user;
            showApp();
            loadBooks();
        } catch (error) {
            console.error('Auth verification failed:', error);
            logout(); // Clear invalid token and show auth form
        }
    } else {
        showAuth();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    
    // Add event listeners for forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('add-book-form').addEventListener('submit', handleAddBook);
    
    // Add event listener for search input
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });
});
