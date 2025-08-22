// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentPage = 1;
let isLoading = false;

// API Base URL
const API_BASE_URL = window.location.origin + '/api';

// DOM Elements
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// Initialize the application
function initializeApp() {
    // Check if user is logged in
    if (authToken) {
        fetchCurrentUser();
    }
    
    // Setup smooth scrolling for navigation links
    setupSmoothScrolling();
    
    // Initialize mobile navigation
    setupMobileNavigation();
}

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    loginBtn.addEventListener('click', () => showModal(loginModal));
    registerBtn.addEventListener('click', () => showModal(registerModal));
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Switch between login and register
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        showModal(registerModal);
    });
    
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        showModal(loginModal);
    });
    
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Navigation buttons
    document.getElementById('exploreBtn').addEventListener('click', () => {
        document.getElementById('artforms').scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('artistBtn').addEventListener('click', () => {
        showModal(registerModal);
        document.getElementById('registerRole').value = 'artist';
    });
    
    // Gallery filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterGallery(e.target.dataset.filter);
        });
    });
    
    // Load more buttons
    document.getElementById('loadMoreArtworks').addEventListener('click', loadMoreArtworks);
    document.getElementById('viewAllArtists').addEventListener('click', () => {
        window.location.href = '/artists';
    });
    document.getElementById('viewAllWorkshops').addEventListener('click', () => {
        window.location.href = '/workshops';
    });
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Setup mobile navigation
function setupMobileNavigation() {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// Load initial data
async function loadInitialData() {
    try {
        showLoading();
        
        // Load featured artists
        await loadFeaturedArtists();
        
        // Load featured artworks
        await loadFeaturedArtworks();
        
        // Load upcoming workshops
        await loadUpcomingWorkshops();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showLoading();
        
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        authToken = response.token;
        currentUser = response.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        updateUIForLoggedInUser();
        loginModal.style.display = 'none';
        
        showToast('Login successful!', 'success');
        
    } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    try {
        showLoading();
        
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
        
        authToken = response.token;
        currentUser = response.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        updateUIForLoggedInUser();
        registerModal.style.display = 'none';
        
        showToast('Registration successful!', 'success');
        
    } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function fetchCurrentUser() {
    try {
        const user = await apiRequest('/auth/me');
        currentUser = user;
        updateUIForLoggedInUser();
    } catch (error) {
        console.error('Error fetching current user:', error);
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateUIForLoggedOutUser();
    showToast('Logged out successfully', 'info');
}

// UI Update functions
function updateUIForLoggedInUser() {
    const navAuth = document.querySelector('.nav-auth');
    
    navAuth.innerHTML = `
        <div class="user-menu">
            <span class="user-name">${currentUser.name}</span>
            <button class="btn btn-outline" onclick="logout()">Logout</button>
        </div>
    `;
}

function updateUIForLoggedOutUser() {
    const navAuth = document.querySelector('.nav-auth');
    
    navAuth.innerHTML = `
        <button class="btn btn-outline" id="loginBtn">Login</button>
        <button class="btn btn-primary" id="registerBtn">Join Us</button>
    `;
    
    // Re-attach event listeners
    document.getElementById('loginBtn').addEventListener('click', () => showModal(loginModal));
    document.getElementById('registerBtn').addEventListener('click', () => showModal(registerModal));
}

// Data loading functions
async function loadFeaturedArtists() {
    try {
        const response = await apiRequest('/artists/featured/list');
        displayFeaturedArtists(response);
    } catch (error) {
        console.error('Error loading featured artists:', error);
    }
}

async function loadFeaturedArtworks() {
    try {
        const response = await apiRequest('/artworks/featured/list');
        displayFeaturedArtworks(response);
    } catch (error) {
        console.error('Error loading featured artworks:', error);
    }
}

async function loadUpcomingWorkshops() {
    try {
        const response = await apiRequest('/workshops/upcoming/list');
        displayUpcomingWorkshops(response);
    } catch (error) {
        console.error('Error loading upcoming workshops:', error);
    }
}

// Display functions
function displayFeaturedArtists(artists) {
    const artistsGrid = document.getElementById('artistsGrid');
    
    if (!artists || artists.length === 0) {
        artistsGrid.innerHTML = '<p class="text-center">No featured artists available.</p>';
        return;
    }
    
    artistsGrid.innerHTML = artists.map(artist => `
        <div class="artist-card" onclick="viewArtist('${artist._id}')">
            <div class="artist-image">
                ${artist.profileImage ? 
                    `<img src="${artist.profileImage}" alt="${artist.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-user"></i>`
                }
            </div>
            <div class="artist-info">
                <div class="artist-name">${artist.name}</div>
                <div class="artist-artform">${artist.artform}</div>
                <div class="artist-location">${artist.village}, ${artist.state}</div>
                <div class="artist-rating">
                    <div class="stars">
                        ${generateStars(artist.rating)}
                    </div>
                    <span>(${artist.totalRatings || 0})</span>
                </div>
                <div class="artist-stats">
                    <span>${artist.experience} years</span>
                    <span>${artist.followers ? artist.followers.length : 0} followers</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayFeaturedArtworks(artworks) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    if (!artworks || artworks.length === 0) {
        galleryGrid.innerHTML = '<p class="text-center">No featured artworks available.</p>';
        return;
    }
    
    galleryGrid.innerHTML = artworks.map(artwork => `
        <div class="artwork-card" onclick="viewArtwork('${artwork._id}')">
            <div class="artwork-image">
                ${artwork.images && artwork.images.length > 0 ? 
                    `<img src="${artwork.images[0].url}" alt="${artwork.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-palette"></i>`
                }
            </div>
            <div class="artwork-info">
                <div class="artwork-title">${artwork.title}</div>
                <div class="artwork-artist">by ${artwork.artist.name}</div>
                <div class="artwork-artform">${artwork.artform}</div>
                ${artwork.isForSale && artwork.price ? 
                    `<div class="artwork-price">₹${artwork.price.toLocaleString()}</div>` : 
                    '<div class="artwork-price">Not for sale</div>'
                }
            </div>
        </div>
    `).join('');
}

function displayUpcomingWorkshops(workshops) {
    const workshopsGrid = document.getElementById('workshopsGrid');
    
    if (!workshops || workshops.length === 0) {
        workshopsGrid.innerHTML = '<p class="text-center">No upcoming workshops available.</p>';
        return;
    }
    
    workshopsGrid.innerHTML = workshops.map(workshop => `
        <div class="workshop-card" onclick="viewWorkshop('${workshop._id}')">
            <div class="workshop-image">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="workshop-info">
                <div class="workshop-title">${workshop.title}</div>
                <div class="workshop-artist">by ${workshop.artist.name}</div>
                <div class="workshop-details">
                    <span><i class="fas fa-calendar"></i> ${formatDate(workshop.date)}</span>
                    <span><i class="fas fa-clock"></i> ${workshop.duration}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${workshop.isOnline ? 'Online' : workshop.location}</span>
                </div>
                <div class="workshop-price">₹${workshop.price.toLocaleString()}</div>
                <div class="workshop-status ${workshop.currentParticipants >= workshop.maxParticipants ? 'full' : 'available'}">
                    ${workshop.currentParticipants >= workshop.maxParticipants ? 'Full' : `${workshop.maxParticipants - workshop.currentParticipants} spots left`}
                </div>
            </div>
        </div>
    `).join('');
}

// Filter functions
function filterGallery(filter) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    // Show loading state
    galleryGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Fetch filtered artworks
    fetchFilteredArtworks(filter);
}

async function fetchFilteredArtworks(filter) {
    try {
        let endpoint = '/artworks';
        const params = new URLSearchParams();
        
        if (filter !== 'all') {
            if (filter === 'for-sale') {
                params.append('forSale', 'true');
            } else {
                params.append('artform', filter);
            }
        }
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        const response = await apiRequest(endpoint);
        displayFeaturedArtworks(response.artworks || response);
        
    } catch (error) {
        console.error('Error fetching filtered artworks:', error);
        showToast('Error loading artworks', 'error');
    }
}

// Load more functions
async function loadMoreArtworks() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        currentPage++;
        
        const response = await apiRequest(`/artworks?page=${currentPage}`);
        appendArtworks(response.artworks);
        
        // Hide load more button if no more pages
        if (!response.pagination.hasNext) {
            document.getElementById('loadMoreArtworks').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading more artworks:', error);
        showToast('Error loading more artworks', 'error');
        currentPage--;
    } finally {
        isLoading = false;
    }
}

function appendArtworks(artworks) {
    const galleryGrid = document.getElementById('galleryGrid');
    
    const newArtworksHTML = artworks.map(artwork => `
        <div class="artwork-card" onclick="viewArtwork('${artwork._id}')">
            <div class="artwork-image">
                ${artwork.images && artwork.images.length > 0 ? 
                    `<img src="${artwork.images[0].url}" alt="${artwork.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-palette"></i>`
                }
            </div>
            <div class="artwork-info">
                <div class="artwork-title">${artwork.title}</div>
                <div class="artwork-artist">by ${artwork.artist.name}</div>
                <div class="artwork-artform">${artwork.artform}</div>
                ${artwork.isForSale && artwork.price ? 
                    `<div class="artwork-price">₹${artwork.price.toLocaleString()}</div>` : 
                    '<div class="artwork-price">Not for sale</div>'
                }
            </div>
        </div>
    `).join('');
    
    galleryGrid.insertAdjacentHTML('beforeend', newArtworksHTML);
}

// View functions
function viewArtist(artistId) {
    // Navigate to artist detail page or show modal
    window.location.href = `/artist/${artistId}`;
}

function viewArtwork(artworkId) {
    // Navigate to artwork detail page or show modal
    window.location.href = `/artwork/${artworkId}`;
}

function viewWorkshop(workshopId) {
    // Navigate to workshop detail page or show modal
    window.location.href = `/workshop/${workshopId}`;
}

// Utility functions
function showModal(modal) {
    modal.style.display = 'block';
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add toast styles if not already present
if (!document.getElementById('toastStyles')) {
    const toastStyles = document.createElement('style');
    toastStyles.id = 'toastStyles';
    toastStyles.textContent = `
        .toast-container {
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 3000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: toastSlideIn 0.3s ease;
            max-width: 300px;
        }
        
        .toast-success { background: #27ae60; }
        .toast-error { background: #e74c3c; }
        .toast-warning { background: #f39c12; }
        .toast-info { background: #3498db; }
        
        @keyframes toastSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(toastStyles);
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.artform-card, .artist-card, .artwork-card, .workshop-card');
    animateElements.forEach(el => observer.observe(el));
});

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 500);
            }
        });
    }
}

async function performSearch(query) {
    try {
        showLoading();
        
        const [artistsResponse, artworksResponse, workshopsResponse] = await Promise.all([
            apiRequest(`/artists/search/${query}`),
            apiRequest(`/artworks/search/${query}`),
            apiRequest(`/workshops/search/${query}`)
        ]);
        
        displaySearchResults(artistsResponse, artworksResponse, workshopsResponse);
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('Error performing search', 'error');
    } finally {
        hideLoading();
    }
}

function displaySearchResults(artists, artworks, workshops) {
    // Implementation for displaying search results
    // This would typically involve showing results in a modal or dedicated section
    console.log('Search results:', { artists, artworks, workshops });
}

// Initialize search if search input exists
document.addEventListener('DOMContentLoaded', setupSearch);

// Export functions for global access
window.viewArtist = viewArtist;
window.viewArtwork = viewArtwork;
window.viewWorkshop = viewWorkshop;
window.logout = logout;