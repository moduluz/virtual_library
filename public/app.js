// Constants
const API_BASE_URL = 'http://localhost:3000/api';
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
let favorites = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]'));
let readingProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.READING_PROGRESS) || '{}');
let lastRead = JSON.parse(localStorage.getItem(STORAGE_KEYS.LAST_READ) || '{}');

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
    // Show welcome confetti
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });

    // Load books and update UI
    await loadBooks();
    updateLastReadSection();
});

// Functions
async function fetchBooks(page = 1, search = '') {
    try {
        let url = `${API_BASE_URL}/books`;
        
        if (search) {
            url = `${API_BASE_URL}/books/search?query=${encodeURIComponent(search)}&field=${currentSearchField}`;
        }
        
        url += `${url.includes('?') ? '&' : '?'}page=${page}&limit=${BOOKS_PER_PAGE}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        updateStats(result.meta.total);
        return result;
    } catch (error) {
        console.error('Error fetching books:', error);
        showError('Failed to load books. Please try again later.');
        return null;
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
    document.getElementById('totalBooks').textContent = total;
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

function toggleView() {
    isGridView = !isGridView;
    toggleViewBtn.innerHTML = isGridView ? 
        '<i class="fas fa-th-large"></i>' : 
        '<i class="fas fa-list"></i>';
    loadBooks();
}

function renderBooks(books) {
    if (isGridView) {
        renderGridView(books);
    } else {
        renderListView(books);
    }
}

function renderGridView(books) {
    booksList.innerHTML = books.map(book => `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="card book-card h-100">
                <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                     class="card-img-top book-cover" 
                     alt="${book['Book Name']}"
                     onclick="showBookDetails('${book._id}')">
                <div class="card-body">
                    <h5 class="book-title">${book['Book Name']}</h5>
                    <p class="book-author">${book.Author}</p>
                    ${renderProgress(book._id)}
                    <button class="favorite-btn" onclick="toggleFavorite('${book._id}')">
                        ${favorites.has(book._id) ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderListView(books) {
    booksList.innerHTML = books.map(book => `
        <div class="col-12 mb-3">
            <div class="card book-card">
                <div class="row g-0">
                    <div class="col-md-2">
                        <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                             class="img-fluid rounded-start" 
                             alt="${book['Book Name']}"
                             style="height: 200px; object-fit: cover;"
                             onclick="showBookDetails('${book._id}')">
                    </div>
                    <div class="col-md-10">
                        <div class="card-body">
                            <h5 class="book-title">${book['Book Name']}</h5>
                            <p class="book-author">${book.Author}</p>
                            ${renderProgress(book._id)}
                            <button class="favorite-btn" onclick="toggleFavorite('${book._id}')">
                                ${favorites.has(book._id) ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProgress(bookId) {
    const progress = readingProgress[bookId] || 0;
    return `
        <div class="reading-progress">
            <div class="reading-progress-bar" style="width: ${progress}%"></div>
        </div>
        <small class="text-muted">${progress}% completed</small>
    `;
}

async function showBookDetails(bookId) {
    const book = await fetchBookDetails(bookId);
    if (!book) return;
    
    // Update last read date when viewing details
    saveLastRead(bookId);
    updateLastReadSection();
    
    const modalBody = document.getElementById('bookDetails');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${book.URL || 'https://via.placeholder.com/300x400?text=No+Cover'}" 
                     class="img-fluid modal-book-cover" 
                     alt="${book['Book Name']}">
                <div class="book-actions mt-3">
                    <button class="action-btn" onclick="toggleFavorite('${book._id}')">
                        ${favorites.has(book._id) ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                    </button>
                    <button class="action-btn" onclick="deleteBook('${book._id}')">
                        🗑️ Delete
                    </button>
                </div>
                ${lastRead[book._id] ? `
                    <div class="mt-3 text-muted">
                        <small>Last read: ${new Date(lastRead[book._id]).toLocaleString()}</small>
                    </div>
                ` : ''}
            </div>
            <div class="col-md-8">
                <h3>${book['Book Name']}</h3>
                <p class="text-muted">by ${book.Author}</p>
                <div class="mb-3">
                    <label>Reading Progress</label>
                    <input type="range" class="form-range" 
                           value="${readingProgress[book._id] || 0}"
                           onchange="updateProgress('${book._id}', this.value)">
                    <small class="text-muted">${readingProgress[book._id] || 0}% completed</small>
                </div>
                ${book.description ? `
                    <div class="mb-3">
                        <h5>Description</h5>
                        <p>${book.description}</p>
                    </div>
                ` : ''}
                ${book.pdf_link ? `
                    <div class="mt-3">
                        <h4>Read Book</h4>
                        <iframe src="${book.pdf_link}" class="pdf-viewer"></iframe>
                    </div>
                ` : '<p class="text-muted">PDF not available for this book.</p>'}
            </div>
        </div>
    `;
    
    bookModal.show();
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
    readingProgress[bookId] = parseInt(progress);
    saveReadingProgress();
    saveLastRead(bookId);
    loadBooks();
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

async function loadBooks() {
    showLoading();
    const result = await fetchBooks(currentPage, currentSearch);
    if (result) {
        renderBooks(result.data);
        renderPagination(result.meta);
    }
    hideLoading();
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

function renderPagination(meta) {
    const totalPages = meta.pages;
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${meta.page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${meta.page - 1})">&laquo;</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= meta.page - 2 && i <= meta.page + 2)
        ) {
            paginationHTML += `
                <li class="page-item ${i === meta.page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (
            i === meta.page - 3 || 
            i === meta.page + 3
        ) {
            paginationHTML += `
                <li class="page-item disabled">
                    <a class="page-link" href="#">...</a>
                </li>
            `;
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${meta.page === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${meta.page + 1})">&raquo;</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
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
    // Sort books by last read date
    const sortedBooks = Object.entries(lastRead)
        .sort(([, a], [, b]) => new Date(b) - new Date(a))
        .slice(0, 5); // Keep only the 5 most recent

    if (sortedBooks.length > 0) {
        const lastReadSection = document.createElement('div');
        lastReadSection.className = 'row mb-4';
        lastReadSection.innerHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5>📚 Recently Read</h5>
                        <div class="recent-books">
                            ${sortedBooks.map(([bookId, date]) => `
                                <div class="recent-book" onclick="showBookDetails('${bookId}')">
                                    <small class="text-muted">Last read: ${new Date(date).toLocaleDateString()}</small>
                                    <div class="progress mt-1" style="height: 4px;">
                                        <div class="progress-bar" style="width: ${readingProgress[bookId] || 0}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const statsRow = document.querySelector('.row.mb-4');
        statsRow.parentNode.insertBefore(lastReadSection, statsRow.nextSibling);
    }
}

// Initialize
window.showBookDetails = showBookDetails;
window.changePage = changePage;
window.toggleFavorite = toggleFavorite;
window.updateProgress = updateProgress;
window.deleteBook = deleteBook;
loadBooks(); 