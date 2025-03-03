// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// State management
let currentPage = 1;
let totalPages = 1;
let limit = 9; // Reduced limit for nicer grid layout
let currentQuery = '';
let currentField = 'title';

// DOM Elements
const booksContainer = document.getElementById('booksContainer');
const paginationContainer = document.getElementById('pagination');
const metaInfoContainer = document.getElementById('metaInfo');
const searchInput = document.getElementById('searchInput');
const searchField = document.getElementById('searchField');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');
const addBookBtn = document.getElementById('addBookBtn');

// Modal elements
const bookModal = document.getElementById('bookModal');
const modalTitle = document.getElementById('modalTitle');
const bookForm = document.getElementById('bookForm');
const bookId = document.getElementById('bookId');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const genreInput = document.getElementById('genre');
const yearInput = document.getElementById('year');
const descriptionInput = document.getElementById('description');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const modalMessage = document.getElementById('modalMessage');
const modalError = document.getElementById('modalError');

// Delete modal elements
const deleteModal = document.getElementById('deleteModal');
const deleteBookId = document.getElementById('deleteBookId');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteModal = document.getElementById('closeDeleteModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchBooks();
  
  // Add event listeners
  searchBtn.addEventListener('click', performSearch);
  resetBtn.addEventListener('click', resetSearch);
  addBookBtn.addEventListener('click', showAddBookModal);
  closeModal.addEventListener('click', closeBookModal);
  cancelBtn.addEventListener('click', closeBookModal);
  bookForm.addEventListener('submit', saveBook);
  
  // Delete modal event listeners
  confirmDeleteBtn.addEventListener('click', deleteBook);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  closeDeleteModal.addEventListener('click', closeDeleteModal);
  
  // Allow pressing Enter in search input
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
});

// Fetch books from API
async function fetchBooks() {
  showLoading();
  try {
    let url;
    if (currentQuery) {
      url = `${API_BASE_URL}/books/search?query=${currentQuery}&field=${currentField}&page=${currentPage}&limit=${limit}`;
    } else {
      url = `${API_BASE_URL}/books?page=${currentPage}&limit=${limit}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const data = await response.json();
    displayBooks(data.data);
    updatePagination(data.meta);
    updateMetaInfo(data.meta);
  } catch (error) {
    console.error('Error fetching books:', error);
    booksContainer.innerHTML = `
      <div class="no-books">
        <h3>Error Loading Books</h3>
        <p>${error.message}</p>
        <p>Please make sure your server is running and try again.</p>
      </div>
    `;
  }
}

// Display books in the container
function displayBooks(books) {
  if (books.length === 0) {
    booksContainer.innerHTML = `
      <div class="no-books">
        <h3>No Books Found</h3>
        <p>Try a different search or add a new book to your collection.</p>
        <button onclick="showAddBookModal()" class="btn-add" style="margin-top: 1rem;">
          Add Your First Book
        </button>
      </div>
    `;
    return;
  }
  
  booksContainer.innerHTML = '';
  
  books.forEach(book => {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    
    bookCard.innerHTML = `
      <div class="book-header">
        <div class="book-title">${book.title || 'Untitled'}</div>
        <div class="book-author">By: ${book.author || 'Unknown Author'}</div>
      </div>
      <div class="book-body">
        <div class="book-meta">
          ${book.genre ? `<span>Genre: ${book.genre}</span>` : ''}
          ${book.year ? `<span>Year: ${book.year}</span>` : ''}
        </div>
        <div class="book-description">${book.description || 'No description available.'}</div>
        <div class="book-actions">
          <button onclick="editBook('${book._id}')" class="btn-edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button onclick="showDeleteConfirmation('${book._id}')" class="btn-delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;
    
    booksContainer.appendChild(bookCard);
  });
}

// Update pagination controls
function updatePagination(meta) {
  totalPages = meta.pages;
  const maxButtons = 5;
  
  paginationContainer.innerHTML = '';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchBooks();
    }
  });
  paginationContainer.appendChild(prevBtn);
  
  // Page buttons
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.classList.toggle('current-page', i === currentPage);
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      fetchBooks();
    });
    paginationContainer.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchBooks();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

// Display metadata about results
function updateMetaInfo(meta) {
  if (!meta) return;
  
  let info = `Showing ${meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to ${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total} books`;
  
  if (meta.query) {
    info += ` (Filtered by "${meta.query}" in ${meta.field})`;
  }
  
  metaInfoContainer.textContent = info;
}

// Perform search
function performSearch() {
  currentQuery = searchInput.value.trim();
  currentField = searchField.value;
  currentPage = 1;
  fetchBooks();
}

// Reset search
function resetSearch() {
  searchInput.value = '';
  searchField.value = 'title';
  currentQuery = '';
  currentField = 'title';
  currentPage = 1;
  fetchBooks();
}

// Show loading state
function showLoading() {
  booksContainer.innerHTML = '';
  
  // Create loading placeholders
  for (let i = 0; i < limit; i++) {
    const loadingCard = document.createElement('div');
    loadingCard.className = 'book-card loading-card';
    loadingCard.innerHTML = `
      <div class="book-header" style="height: 70px; background: #eee;"></div>
      <div class="book-body">
        <div style="height: 20px; background: #eee; margin-bottom: 10px;"></div>
        <div style="height: 20px; background: #eee; margin-bottom: 10px; width: 70%;"></div>
        <div style="height: 60px; background: #eee; margin-bottom: 20px;"></div>
        <div style="height: 40px; background: #eee;"></div>
      </div>
    `;
    booksContainer.appendChild(loadingCard);
  }
}

// Add book modal
function showAddBookModal() {
  modalTitle.textContent = 'Add New Book';
  bookId.value = '';
  bookForm.reset();
  hideModalMessages();
  bookModal.style.display = 'block';
}

// Edit book
function editBook(id) {
  hideModalMessages();
  modalTitle.textContent = 'Edit Book';
  bookId.value = id;
  
  // Fetch book data
  fetch(`${API_BASE_URL}/books/${id}`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch book details');
      return response.json();
    })
    .then(book => {
      titleInput.value = book.title || '';
      authorInput.value = book.author || '';
      genreInput.value = book.genre || '';
      yearInput.value = book.year || '';
      descriptionInput.value = book.description || '';
      bookModal.style.display = 'block';
    })
    .catch(error => {
      showErrorMessage(error.message);
    });
}

// Show delete confirmation modal
function showDeleteConfirmation(id) {
    deleteBookId.value = id;
    deleteModal.style.display = 'block';
  }
  
  // Delete book 
  function deleteBook() {
    const id = deleteBookId.value;
    
    fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete book');
        }
        return response.json();
      })
      .then(data => {
        closeDeleteModal();
        fetchBooks(); // Refresh the book list
      })
      .catch(error => {
        console.error('Error deleting book:', error);
        // Optionally show error message to user
      });
  }
  
  // Close delete modal
  function closeDeleteModal() {
    deleteModal.style.display = 'none';
  }

// Save book (add or update)
function saveBook(e) {
  e.preventDefault();
  hideModalMessages();
  
  const id = bookId.value;
  const bookData = {
    title: titleInput.value,
    author: authorInput.value,
    genre: genreInput.value,
    year: yearInput.value ? parseInt(yearInput.value) : null,
    description: descriptionInput.value
  };
  
  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE_URL}/books/${id}` : `${API_BASE_URL}/books`;
  
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save book');
      }
      return response.json();
    })
    .then(data => {
      showSuccessMessage(id ? 'Book updated successfully!' : 'Book added successfully!');
      closeBookModal();
      fetchBooks(); // Refresh the book list
    })
    .catch(error => {
      showErrorMessage(error.message);
    });
}

// Helper functions for modal messages
function showSuccessMessage(message) {
  modalMessage.textContent = message;
  modalMessage.style.display = 'block';
  modalError.style.display = 'none';
}

function showErrorMessage(message) {
  modalError.textContent = message;
  modalError.style.display = 'block';
  modalMessage.style.display = 'none';
}

function hideModalMessages() {
  modalMessage.style.display = 'none';
  modalError.style.display = 'none';
}

function closeBookModal() {
  bookModal.style.display = 'none';
  bookForm.reset();
  hideModalMessages();
}