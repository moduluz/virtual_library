// Constants
const API_BASE_URL = '/api';
const BOOKS_PER_PAGE = 12;
const STORAGE_KEYS = {
    FAVORITES: 'virtualLibrary_favorites',
    READING_PROGRESS: 'virtualLibrary_progress',
    LAST_READ: 'virtualLibrary_lastRead'
};

// DOM Elements
const booksList = document.getElementById('booksList');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchField = document.getElementById('searchField');
const bookModal = new bootstrap.Modal(document.getElementById('bookModal'));
const addBookForm = document.getElementById('addBookForm');
const toggleViewBtn = document.getElementById('toggleView');
const coverUrlInput = document.getElementById('coverUrlInput');
const coverPreview = document.getElementById('coverPreview');
const addSuccess = document.getElementById('addSuccess');
const addError = document.getElementById('addError');

// State
let currentPage = 1;
let currentSearch = '';
let currentSearchField = 'Book Name';
let isGridView = true;
let isLoading = false;
let favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]'));
let readingProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.READING_PROGRESS) || '{}');
let lastRead = JSON.parse(localStorage.getItem(STORAGE_KEYS.LAST_READ) || '{}');

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const themeIcon = themeToggle.querySelector('i');

function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

// Category Management
const categoryPills = document.querySelectorAll('.category-pill');
let currentCategory = 'all';

categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.category;
        fetchBooks(currentPage); // Refetch books with category filter
    });
});

// Event Listeners
searchInput.addEventListener('input', debounce(handleSearch, 500));
searchField.addEventListener('change', () => {
    currentSearchField = searchField.value;
    handleSearch();
});

coverUrlInput.addEventListener('input', debounce(updateCoverPreview, 500));

addBookForm.addEventListener('submit', handleAddBook);
toggleViewBtn.addEventListener('click', toggleView);

// Load saved data on page load
window.addEventListener('load', async () => {
    try {
        await loadBooks();
        updateLastReadSection();
        
        // Show welcome confetti
        try {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (confettiError) {
            console.warn('Confetti effect not available:', confettiError);
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Failed to initialize the application. Please refresh the page.');
    }
});

// Functions
async function fetchBooks(page = 1, search = '') {
    if (isLoading) return null;
    
    try {
        isLoading = true;
        showLoading();
        
        let url = `${API_BASE_URL}/books`;
        
        if (search) {
            url = `${API_BASE_URL}/books/search?query=${encodeURIComponent(search)}&field=${currentSearchField}`;
        }
        
        url += `${url.includes('?') ? '&' : '?'}page=${page}&limit=${BOOKS_PER_PAGE}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch books');
        }
        
        const result = await response.json();
        updateStats(result.meta.total);
        return result;
    } catch (error) {
        console.error('Error fetching books:', error);
        showError('Failed to load books. Please try again later.');
        return null;
    } finally {
        isLoading = false;
        hideLoading();
    }
}

async function fetchBookDetails(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching book details:', error);
        showError('Failed to load book details. Please try again later.');
        return null;
    }
}

function updateStats(total) {
    document.getElementById('totalBooks').textContent = total || 0;
    document.getElementById('totalFavorites').textContent = favorites.size;
    
    const reading = Object.values(readingProgress).filter(p => p > 0 && p < 100).length;
    const completed = Object.values(readingProgress).filter(p => p === 100).length;
    
    document.getElementById('currentlyReading').textContent = reading;
    document.getElementById('completedBooks').textContent = completed;
}

function updateCoverPreview() {
    const url = coverUrlInput.value;
    if (url) {
        // Create a temporary image to verify the URL
        const img = new Image();
        img.onload = () => {
            coverPreview.src = url;
            coverPreview.classList.remove('error');
        };
        img.onerror = () => {
            coverPreview.src = 'https://via.placeholder.com/200x300?text=Invalid+URL';
            coverPreview.classList.add('error');
        };
        img.src = url;
    } else {
        coverPreview.src = 'https://via.placeholder.com/200x300?text=Cover+Preview';
    }
}

async function handleAddBook(e) {
    e.preventDefault();
    
    // Reset alerts
    addSuccess.classList.add('d-none');
    addError.classList.add('d-none');
    
    try {
        const formData = new FormData(addBookForm);
        const bookData = {
            'Book Name': formData.get('Book Name'),
            'Author': formData.get('Author'),
            'URL': formData.get('URL'),
            'pdf_link': formData.get('pdf_link'),
            'description': formData.get('description')
        };
        
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });
        
        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.errors ? responseData.errors.join(', ') : 'Failed to add book');
        }
        
        // Show success message
        addSuccess.classList.remove('d-none');
        
        // Reset form and preview
        setTimeout(() => {
            addBookForm.reset();
            coverPreview.src = 'https://via.placeholder.com/200x300?text=Cover+Preview';
            bootstrap.Modal.getInstance(document.getElementById('addBookModal')).hide();
            addSuccess.classList.add('d-none');
        }, 1500);
        
        // Refresh books list
        await loadBooks();
        
    } catch (error) {
        console.error('Error:', error);
        addError.textContent = error.message;
        addError.classList.remove('d-none');
    }
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'col-md-4 col-lg-3 mb-4';
    
    const isFavorite = favorites.has(book._id);
    const progress = readingProgress[book._id] || 0;
    
    card.innerHTML = `
        <div class="book-card" data-id="${book._id}">
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${book._id}')">
                <i class="fas fa-heart"></i>
            </button>
            <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                 alt="${book['Book Name']}" 
                 class="book-cover"
                 onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'">
            <div class="book-info">
                <h5 class="book-title">${book['Book Name']}</h5>
                <p class="book-author">${book.Author}</p>
                <div class="reading-progress">
                    <div class="reading-progress-bar" style="width: ${progress}%"></div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-sm btn-primary" onclick="showBookDetails('${book._id}')">
                        <i class="fas fa-book-open"></i> Read
                    </button>
                    <div class="progress-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="updateProgress('${book._id}', Math.min(100, ${progress} + 25))">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return card;
}

function toggleView() {
    const booksList = document.getElementById('booksList');
    const toggleBtn = document.getElementById('toggleView');
    
    isGridView = !isGridView;
    
    if (isGridView) {
        booksList.classList.remove('list-view');
        booksList.classList.add('grid-view');
        toggleBtn.innerHTML = '<i class="fas fa-list"></i>';
    } else {
        booksList.classList.remove('grid-view');
        booksList.classList.add('list-view');
        toggleBtn.innerHTML = '<i class="fas fa-th-large"></i>';
    }
    
    loadBooks(currentPage);
}

async function showBookDetails(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`);
        if (!response.ok) throw new Error('Failed to fetch book details');
        
        const book = await response.json();
        const progress = readingProgress[bookId] || 0;
        const isFavorite = favorites.has(bookId);
        
        const modalBody = document.getElementById('bookDetails');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                         class="img-fluid rounded" 
                         alt="${book['Book Name']}">
                    <button class="btn btn-block btn-${isFavorite ? 'primary' : 'outline-primary'} mt-3" onclick="toggleFavorite('${bookId}')">
                        <i class="fas fa-heart"></i> ${isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </button>
                </div>
                <div class="col-md-8">
                    <h4 class="book-title">${book['Book Name']}</h4>
                    <p class="book-author">by ${book.Author}</p>
                    <div class="reading-progress mb-3">
                        <div class="reading-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-controls mb-3">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="updateProgress('${bookId}', Math.max(0, ${progress} - 25))">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="progress-text">${progress}% Complete</span>
                        <button class="btn btn-sm btn-outline-primary ms-2" onclick="updateProgress('${bookId}', Math.min(100, ${progress} + 25))">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    ${book.description ? `<p class="mt-3">${book.description}</p>` : ''}
                    ${book.pdf_link ? `
                        <a href="${book.pdf_link}" 
                           class="btn btn-primary mt-3" 
                           target="_blank">
                            <i class="fas fa-book-reader"></i> Read PDF
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        const modalInstance = new bootstrap.Modal(document.getElementById('bookModal'));
        modalInstance.show();
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load book details');
    }
}

function toggleFavorite(bookId) {
    if (favorites.has(bookId)) {
        favorites.delete(bookId);
    } else {
        favorites.add(bookId);
        showConfetti();
    }
    saveFavorites();
    loadBooks();
}

function updateProgress(bookId, progress) {
    // Ensure progress is between 0 and 100
    progress = Math.max(0, Math.min(100, parseInt(progress)));
    
    // Update the progress in storage
    readingProgress[bookId] = progress;
    saveReadingProgress();
    
    // Update last read time if progress changed
    saveLastRead(bookId);
    
    // Update UI elements
    const progressBars = document.querySelectorAll(`[data-id="${bookId}"] .reading-progress-bar`);
    progressBars.forEach(bar => {
        bar.style.width = `${progress}%`;
    });
    
    // Update progress text if in modal
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${progress}% Complete`;
    }
    
    // Update progress ring in recently read section
    const progressRing = document.querySelector(`[data-book-id="${bookId}"] .progress-circle`);
    if (progressRing) {
        progressRing.style.transform = `rotate(${progress * 3.6}deg)`;
    }
    
    // Update stats without full reload
    const reading = Object.values(readingProgress).filter(p => p > 0 && p < 100).length;
    const completed = Object.values(readingProgress).filter(p => p === 100).length;
    
    document.getElementById('currentlyReading').textContent = reading;
    document.getElementById('completedBooks').textContent = completed;
    
    // Update recently read section
    updateLastReadSection();
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete book');
        
        bookModal.hide();
        loadBooks();
    } catch (error) {
        showError('Failed to delete book. Please try again.');
    }
}

function showConfetti() {
    confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.7 }
    });
}

async function handleSearch() {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadBooks();
}

async function changePage(page) {
    currentPage = page;
    loadBooks();
    window.scrollTo(0, 0);
}

async function loadBooks(page = 1) {
    try {
        console.log('Loading books for page:', page);
        const response = await fetch(`${API_BASE_URL}/books?page=${page}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.error || 'Failed to load books');
        }
        
        const data = await response.json();
        console.log('Books loaded:', data);
        
        // Update pagination
        updatePagination(data.meta);
        
        // Render books
        renderBooks(data.data);
        
        // Update stats
        updateStats(data.meta.total);
        
    } catch (error) {
        console.error('Error loading books:', error);
        document.getElementById('booksList').innerHTML = `
            <div class="alert alert-danger" role="alert">
                ${error.message}. <button onclick="loadBooks()" class="btn btn-link p-0">Try again</button>
            </div>
        `;
    }
}

function updatePagination(meta) {
    const pagination = document.getElementById('pagination');
    if (!meta || !meta.pages) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= meta.pages; i++) {
        html += `
            <li class="page-item ${i === meta.page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadBooks(${i}); return false;">${i}</a>
            </li>
        `;
    }
    pagination.innerHTML = html;
}

function showLoading() {
    booksList.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function hideLoading() {
    // Content will be replaced by renderBooks
}

function showError(message) {
    booksList.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        </div>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Functions for persistent storage
function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites]));
}

function saveReadingProgress() {
    localStorage.setItem(STORAGE_KEYS.READING_PROGRESS, JSON.stringify(readingProgress));
}

function saveLastRead(bookId) {
    const now = new Date().toISOString();
    lastRead[bookId] = now;
    localStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(lastRead));
}

function updateLastReadSection() {
    // Remove any existing last read section first
    const existingSection = document.querySelector('.last-read-section');
    if (existingSection) {
        existingSection.remove();
    }

    // Sort books by last read date
    const sortedBooks = Object.entries(lastRead)
        .sort(([, a], [, b]) => new Date(b) - new Date(a))
        .slice(0, 3); // Only show 3 most recent books

    if (sortedBooks.length > 0) {
        const lastReadSection = document.createElement('div');
        lastReadSection.className = 'last-read-section col-12 mb-4';
        lastReadSection.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h5 class="mb-3">
                        <i class="fas fa-history"></i> Continue Reading
                    </h5>
                    <div class="recent-books-grid">
                        ${sortedBooks.map(([bookId, date]) => `
                            <div class="recent-book-card" onclick="showBookDetails('${bookId}')">
                                <div class="d-flex align-items-center">
                                    <div class="recent-book-progress">
                                        <div class="progress-ring">
                                            <div class="progress-circle" style="transform: rotate(${(readingProgress[bookId] || 0) * 3.6}deg)"></div>
                                        </div>
                                        <span class="progress-text">${readingProgress[bookId] || 0}%</span>
                                    </div>
                                    <div class="ms-3">
                                        <small class="text-muted d-block">Last read: ${new Date(date).toLocaleDateString()}</small>
                                        <div class="progress mt-2" style="height: 4px; width: 100px;">
                                            <div class="progress-bar bg-primary" style="width: ${readingProgress[bookId] || 0}%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the stats row
        const statsRow = document.querySelector('.row.mb-4');
        if (statsRow && statsRow.nextSibling) {
            statsRow.parentNode.insertBefore(lastReadSection, statsRow.nextSibling);
        }
    }
}

function renderBooks(books) {
    if (isGridView) {
        renderGridView(books);
    } else {
        renderListView(books);
    }
}

function renderGridView(books) {
    const booksContainer = document.getElementById('booksList');
    booksContainer.className = 'row g-4';
    
    if (!books || books.length === 0) {
        booksContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No books found. Add some books to your library!
                </div>
            </div>
        `;
        return;
    }
    
    booksContainer.innerHTML = books.map((book) => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="book-card" data-id="${book._id}">
                <button class="favorite-btn ${favorites.has(book._id) ? 'active' : ''}" onclick="toggleFavorite('${book._id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                     class="book-cover" 
                     alt="${book['Book Name']}"
                     onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'">
                <div class="book-info">
                    <h5 class="book-title">${book['Book Name']}</h5>
                    <p class="book-author">${book.Author}</p>
                    <div class="reading-progress">
                        <div class="reading-progress-bar" style="width: ${readingProgress[book._id] || 0}%"></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-sm btn-primary" onclick="showBookDetails('${book._id}')">
                            <i class="fas fa-book-open"></i> Read
                        </button>
                        <div class="progress-controls">
                            <button class="btn btn-sm btn-outline-primary" onclick="updateProgress('${book._id}', Math.min(100, (readingProgress[book._id] || 0) + 25))">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderListView(books) {
    const booksContainer = document.getElementById('booksList');
    booksContainer.className = 'list-group';
    
    if (!books || books.length === 0) {
        booksContainer.innerHTML = `
            <div class="alert alert-info">
                No books found. Add some books to your library!
            </div>
        `;
        return;
    }
    
    booksContainer.innerHTML = books.map((book) => `
        <div class="list-group-item">
            <div class="row align-items-center">
                <div class="col-auto">
                    <img src="${book.URL || 'https://via.placeholder.com/50x75?text=No+Cover'}" 
                         alt="${book['Book Name']}"
                         style="width: 50px; height: 75px; object-fit: cover;">
                </div>
                <div class="col">
                    <h5 class="mb-1">${book['Book Name']}</h5>
                    <p class="mb-1">${book.Author}</p>
                    <div class="reading-progress" style="width: 200px">
                        <div class="reading-progress-bar" style="width: ${readingProgress[book._id] || 0}%"></div>
                    </div>
                </div>
                <div class="col-auto">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="showBookDetails('${book._id}')">
                        <i class="fas fa-book-open"></i> Read
                    </button>
                    <button class="favorite-btn ${favorites.has(book._id) ? 'active' : ''}" onclick="toggleFavorite('${book._id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize
window.showBookDetails = showBookDetails;
window.changePage = changePage;
window.toggleFavorite = toggleFavorite;
window.updateProgress = updateProgress;
window.deleteBook = deleteBook;
loadBooks(); 