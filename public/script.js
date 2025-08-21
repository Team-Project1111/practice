// Global variables
let currentUser = null;
let currentLocation = null;
let wasteMap = null;
let userStats = {};

// API base URL
const API_BASE = window.location.origin + '/api';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize application
function initializeApp() {
    // Show loading
    showLoading(true);
    
    // Load initial data
    loadCommunityImpact();
    loadWasteGuidelines();
    loadAvailableRewards();
    
    // Hide loading
    setTimeout(() => showLoading(false), 1000);
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile navigation toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Auth modal
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const authForm = document.getElementById('authForm');
    const authSwitchLink = document.getElementById('authSwitchLink');

    if (loginBtn) loginBtn.addEventListener('click', () => showModal('loginModal'));
    if (closeModal) closeModal.addEventListener('click', () => hideModal('loginModal'));
    if (authForm) authForm.addEventListener('submit', handleAuth);
    if (authSwitchLink) authSwitchLink.addEventListener('click', toggleAuthMode);

    // Report form
    const reportForm = document.getElementById('reportForm');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const reportImages = document.getElementById('reportImages');

    if (reportForm) reportForm.addEventListener('submit', handleReportSubmission);
    if (getCurrentLocationBtn) getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    if (reportImages) reportImages.addEventListener('change', handleImagePreview);

    // AI Assistant
    const aiImageInput = document.getElementById('aiImageInput');
    const aiUploadArea = document.getElementById('aiUploadArea');
    const analyzeAnotherBtn = document.getElementById('analyzeAnother');
    const searchWasteBtn = document.getElementById('searchWasteBtn');
    const wasteSearchInput = document.getElementById('wasteSearchInput');

    if (aiImageInput) aiImageInput.addEventListener('change', handleAIImageUpload);
    if (aiUploadArea) {
        aiUploadArea.addEventListener('click', () => aiImageInput.click());
        aiUploadArea.addEventListener('dragover', handleDragOver);
        aiUploadArea.addEventListener('drop', handleImageDrop);
    }
    if (analyzeAnotherBtn) analyzeAnotherBtn.addEventListener('click', resetAIAssistant);
    if (searchWasteBtn) searchWasteBtn.addEventListener('click', handleWasteSearch);
    if (wasteSearchInput) {
        wasteSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleWasteSearch();
        });
    }

    // Rewards
    setupRewardsEventListeners();

    // Map
    const findNearbyBinsBtn = document.getElementById('findNearbyBins');
    if (findNearbyBinsBtn) findNearbyBinsBtn.addEventListener('click', findNearbyBins);

    // Profile logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Show/Hide sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        loadSectionData(sectionId);
    }
}

// Load section-specific data
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'home':
            loadUserStats();
            break;
        case 'report':
            loadRecentReports();
            break;
        case 'ai-assistant':
            // AI assistant data is loaded on initialization
            break;
        case 'rewards':
            loadUserRewards();
            loadLeaderboard();
            break;
        case 'map':
            initializeMap();
            break;
        case 'profile':
            loadProfileData();
            break;
    }
}

// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token and load user data
        fetchWithAuth('/auth/profile')
            .then(response => response.json())
            .then(user => {
                currentUser = user;
                updateUIForLoggedInUser();
                loadUserStats();
            })
            .catch(error => {
                console.error('Auth check failed:', error);
                localStorage.removeItem('authToken');
            });
    }
}

function handleAuth(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const isLogin = document.getElementById('modalTitle').textContent === 'Login';
    
    const authData = {
        email: formData.get('email') || document.getElementById('authEmail').value,
        password: formData.get('password') || document.getElementById('authPassword').value
    };

    if (!isLogin) {
        authData.name = document.getElementById('authName').value;
        authData.location = {
            address: document.getElementById('authLocation').value
        };
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    showLoading(true);
    
    fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(authData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            currentUser = data.user;
            updateUIForLoggedInUser();
            hideModal('loginModal');
            showToast('success', isLogin ? 'Login successful!' : 'Registration successful!');
            loadUserStats();
        } else {
            showToast('error', data.message || 'Authentication failed');
        }
    })
    .catch(error => {
        console.error('Auth error:', error);
        showToast('error', 'Authentication failed');
    })
    .finally(() => {
        showLoading(false);
    });
}

function toggleAuthMode(e) {
    e.preventDefault();
    const modalTitle = document.getElementById('modalTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const nameGroup = document.getElementById('nameGroup');
    const locationGroup = document.getElementById('locationGroup');
    const authSwitchText = document.getElementById('authSwitchText');
    const authSwitchLink = document.getElementById('authSwitchLink');

    const isCurrentlyLogin = modalTitle.textContent === 'Login';

    if (isCurrentlyLogin) {
        // Switch to register
        modalTitle.textContent = 'Register';
        authSubmitBtn.textContent = 'Register';
        nameGroup.style.display = 'block';
        locationGroup.style.display = 'block';
        authSwitchText.innerHTML = 'Already have an account? <a href="#" id="authSwitchLink">Login here</a>';
    } else {
        // Switch to login
        modalTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        nameGroup.style.display = 'none';
        locationGroup.style.display = 'none';
        authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" id="authSwitchLink">Register here</a>';
    }

    // Re-attach event listener to new switch link
    document.getElementById('authSwitchLink').addEventListener('click', toggleAuthMode);
}

function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');
    const userPoints = document.getElementById('userPoints');
    const userName = document.getElementById('userName');
    const userLevel = document.getElementById('userLevel');

    if (currentUser) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        userPoints.style.display = 'flex';
        
        userName.textContent = currentUser.name;
        userLevel.textContent = currentUser.level;
        userLevel.className = `user-level ${currentUser.level.toLowerCase()}`;
        
        // Update points display
        const pointsSpan = userPoints.querySelector('span');
        pointsSpan.textContent = `${currentUser.points} Points`;
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    
    // Reset UI
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('userPoints').style.display = 'none';
    
    // Reset stats
    resetUserStats();
    
    showToast('info', 'Logged out successfully');
    showSection('home');
}

// Utility function for authenticated requests
function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(API_BASE + endpoint, {
        ...options,
        headers
    });
}

// Report submission
function handleReportSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('warning', 'Please login to submit reports');
        showModal('loginModal');
        return;
    }

    const formData = new FormData(e.target);
    const reportData = {
        reportType: formData.get('reportType') || document.getElementById('reportType').value,
        description: formData.get('description') || document.getElementById('reportDescription').value,
        location: {
            address: formData.get('location') || document.getElementById('reportLocation').value,
            coordinates: currentLocation || { lat: 0, lng: 0 }
        }
    };

    // Handle images if any
    const images = [];
    const imageFiles = document.getElementById('reportImages').files;
    
    showLoading(true);
    
    // For demo purposes, we'll simulate image upload
    // In a real app, you'd upload images to a cloud service
    Promise.resolve().then(() => {
        return fetchWithAuth('/reports', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    })
    .then(response => response.json())
    .then(data => {
        if (data.report) {
            showToast('success', `Report submitted successfully! You earned ${data.pointsAwarded} points.`);
            document.getElementById('reportForm').reset();
            document.getElementById('imagePreview').innerHTML = '';
            
            // Update user points
            if (currentUser) {
                currentUser.points += data.pointsAwarded;
                updateUIForLoggedInUser();
            }
            
            // Refresh recent reports
            loadRecentReports();
        } else {
            showToast('error', data.message || 'Failed to submit report');
        }
    })
    .catch(error => {
        console.error('Report submission error:', error);
        showToast('error', 'Failed to submit report');
    })
    .finally(() => {
        showLoading(false);
    });
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Reverse geocode to get address
                reverseGeocode(currentLocation.lat, currentLocation.lng)
                    .then(address => {
                        document.getElementById('reportLocation').value = address;
                        showToast('success', 'Location detected successfully');
                    })
                    .catch(error => {
                        console.error('Reverse geocoding failed:', error);
                        document.getElementById('reportLocation').value = `${currentLocation.lat}, ${currentLocation.lng}`;
                        showToast('info', 'Location coordinates detected');
                    });
                
                showLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                showToast('error', 'Failed to get current location');
                showLoading(false);
            }
        );
    } else {
        showToast('error', 'Geolocation is not supported by this browser');
    }
}

function reverseGeocode(lat, lng) {
    // In a real app, use Google Maps Geocoding API
    return new Promise((resolve, reject) => {
        // Mock reverse geocoding
        setTimeout(() => {
            resolve(`Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }, 1000);
    });
}

function handleImagePreview(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid #e5e7eb';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

// AI Assistant functions
function handleAIImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        analyzeWasteImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#667eea';
    e.currentTarget.style.background = 'linear-gradient(135deg, #f0f9ff, #e0f2fe)';
}

function handleImageDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        document.getElementById('aiImageInput').files = files;
        analyzeWasteImage(files[0]);
    }
    
    // Reset styles
    e.currentTarget.style.borderColor = '#d1d5db';
    e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb, #f3f4f6)';
}

function analyzeWasteImage(file) {
    showLoading(true);
    
    const formData = new FormData();
    formData.append('image', file);
    
    fetch(API_BASE + '/ai/classify', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayAIResult(data.analysis, file);
        } else {
            showToast('error', data.message || 'Failed to analyze image');
        }
    })
    .catch(error => {
        console.error('AI analysis error:', error);
        showToast('error', 'Failed to analyze image');
    })
    .finally(() => {
        showLoading(false);
    });
}

function displayAIResult(analysis, imageFile) {
    const uploadArea = document.getElementById('aiUploadArea');
    const resultArea = document.getElementById('aiResult');
    
    // Hide upload area, show result
    uploadArea.style.display = 'none';
    resultArea.style.display = 'block';
    
    // Display analyzed image
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('analyzedImage').src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
    
    // Display analysis results
    const categoryBadge = document.getElementById('categoryBadge');
    categoryBadge.textContent = analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1);
    categoryBadge.className = `category-badge ${analysis.category}`;
    
    document.getElementById('detectedItem').textContent = analysis.detectedItem;
    document.getElementById('confidenceScore').textContent = Math.round(analysis.confidence * 100);
    document.getElementById('disposalTips').textContent = analysis.tips;
    
    // Display suggestions
    const suggestionsList = document.getElementById('suggestionsList');
    suggestionsList.innerHTML = '';
    analysis.suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
    });
}

function resetAIAssistant() {
    document.getElementById('aiUploadArea').style.display = 'block';
    document.getElementById('aiResult').style.display = 'none';
    document.getElementById('aiImageInput').value = '';
}

function handleWasteSearch() {
    const query = document.getElementById('wasteSearchInput').value.trim();
    if (!query) {
        showToast('warning', 'Please enter a search term');
        return;
    }
    
    showLoading(true);
    
    fetch(API_BASE + `/ai/suggest/${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data);
        })
        .catch(error => {
            console.error('Search error:', error);
            showToast('error', 'Search failed');
        })
        .finally(() => {
            showLoading(false);
        });
}

function displaySearchResults(data) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (data.suggestions && data.suggestions.length > 0) {
        data.suggestions.forEach(suggestion => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            if (suggestion.item) {
                resultItem.innerHTML = `
                    <h4>${suggestion.item}</h4>
                    <p><strong>Category:</strong> ${suggestion.category}</p>
                    <p><strong>Tips:</strong> ${suggestion.tips}</p>
                `;
            } else {
                resultItem.innerHTML = `
                    <h4>${suggestion.category} Waste</h4>
                    <p>${suggestion.message}</p>
                    ${suggestion.examples ? `<p><strong>Examples:</strong> ${suggestion.examples.join(', ')}</p>` : ''}
                `;
            }
            
            resultsContainer.appendChild(resultItem);
        });
    } else {
        resultsContainer.innerHTML = `
            <div class="search-result-item">
                <h4>No results found</h4>
                <p>${data.message || 'Try a different search term or upload an image for better classification.'}</p>
            </div>
        `;
    }
}

// Load waste guidelines
function loadWasteGuidelines() {
    fetch(API_BASE + '/ai/guidelines')
        .then(response => response.json())
        .then(data => {
            displayWasteGuidelines(data.guidelines);
        })
        .catch(error => {
            console.error('Failed to load guidelines:', error);
        });
}

function displayWasteGuidelines(guidelines) {
    const guidelinesGrid = document.getElementById('guidelinesGrid');
    guidelinesGrid.innerHTML = '';
    
    Object.keys(guidelines).forEach(category => {
        const guideline = guidelines[category];
        const card = document.createElement('div');
        card.className = `guideline-card ${category}`;
        
        card.innerHTML = `
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)} Waste</h4>
            <p>${guideline.description}</p>
            <div class="guideline-examples">
                <h5>Examples:</h5>
                <ul>
                    ${guideline.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
            </div>
            <div class="guideline-examples">
                <h5>Tips:</h5>
                <ul>
                    ${guideline.tips.map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
        
        guidelinesGrid.appendChild(card);
    });
}

// Rewards functions
function setupRewardsEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            filterRewards(category);
        });
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const tab = e.target.dataset.tab;
            loadUserRewards(tab);
        });
    });
}

function loadAvailableRewards() {
    fetch(API_BASE + '/rewards')
        .then(response => response.json())
        .then(rewards => {
            displayRewards(rewards);
        })
        .catch(error => {
            console.error('Failed to load rewards:', error);
        });
}

function displayRewards(rewards) {
    const rewardsGrid = document.getElementById('rewardsList');
    rewardsGrid.innerHTML = '';
    
    rewards.forEach(reward => {
        const card = document.createElement('div');
        card.className = 'reward-card';
        card.dataset.category = reward.category;
        
        const canRedeem = currentUser && currentUser.points >= reward.pointsRequired;
        const isExpired = new Date(reward.validUntil) < new Date();
        
        card.innerHTML = `
            <div class="reward-card-header">
                <span class="reward-category">${reward.category}</span>
                <h4>${reward.title}</h4>
                <div class="reward-points">${reward.pointsRequired} points</div>
            </div>
            <div class="reward-card-body">
                <p>${reward.description}</p>
                <div class="reward-value">${reward.value}</div>
                <div class="reward-expiry">Valid until: ${new Date(reward.validUntil).toLocaleDateString()}</div>
                <button class="btn ${canRedeem && !isExpired ? 'btn-success' : 'btn-secondary'}" 
                        onclick="redeemReward('${reward._id}')"
                        ${!canRedeem || isExpired ? 'disabled' : ''}>
                    ${isExpired ? 'Expired' : (canRedeem ? 'Redeem' : 'Insufficient Points')}
                </button>
            </div>
        `;
        
        rewardsGrid.appendChild(card);
    });
}

function filterRewards(category) {
    const cards = document.querySelectorAll('.reward-card');
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function redeemReward(rewardId) {
    if (!currentUser) {
        showToast('warning', 'Please login to redeem rewards');
        showModal('loginModal');
        return;
    }
    
    showLoading(true);
    
    fetchWithAuth(`/rewards/${rewardId}/redeem`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.userReward) {
            showToast('success', 'Reward redeemed successfully!');
            currentUser.points = data.remainingPoints;
            updateUIForLoggedInUser();
            loadAvailableRewards(); // Refresh rewards
            loadUserRewards(); // Refresh user rewards
        } else {
            showToast('error', data.message || 'Failed to redeem reward');
        }
    })
    .catch(error => {
        console.error('Redemption error:', error);
        showToast('error', 'Failed to redeem reward');
    })
    .finally(() => {
        showLoading(false);
    });
}

function loadUserRewards(status = 'active') {
    if (!currentUser) return;
    
    fetchWithAuth(`/rewards/my-rewards?status=${status}`)
        .then(response => response.json())
        .then(rewards => {
            displayUserRewards(rewards);
        })
        .catch(error => {
            console.error('Failed to load user rewards:', error);
        });
}

function displayUserRewards(rewards) {
    const rewardsList = document.getElementById('myRewardsList');
    rewardsList.innerHTML = '';
    
    if (rewards.length === 0) {
        rewardsList.innerHTML = '<p>No rewards found.</p>';
        return;
    }
    
    rewards.forEach(userReward => {
        const reward = userReward.rewardId;
        const item = document.createElement('div');
        item.className = 'user-reward-item';
        
        item.innerHTML = `
            <div class="reward-info">
                <h4>${reward.title}</h4>
                <p>${reward.description}</p>
                <div class="reward-code">Code: <strong>${userReward.redemptionCode}</strong></div>
                <div class="reward-dates">
                    Redeemed: ${new Date(userReward.redeemedAt).toLocaleDateString()}
                    ${userReward.usedAt ? `| Used: ${new Date(userReward.usedAt).toLocaleDateString()}` : ''}
                </div>
            </div>
            <div class="reward-status">
                <span class="status ${userReward.status}">${userReward.status}</span>
            </div>
        `;
        
        rewardsList.appendChild(item);
    });
}

function loadLeaderboard() {
    fetch(API_BASE + '/rewards/leaderboard?limit=10')
        .then(response => response.json())
        .then(users => {
            displayLeaderboard(users);
        })
        .catch(error => {
            console.error('Failed to load leaderboard:', error);
        });
}

function displayLeaderboard(users) {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    
    users.forEach((user, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        item.innerHTML = `
            <div class="rank">${medal}</div>
            <div class="user-info">
                <div class="name">${user.name}</div>
                <div class="level">${user.level}</div>
            </div>
            <div class="points">${user.points} pts</div>
        `;
        
        if (currentUser && user._id === currentUser.id) {
            item.classList.add('current-user');
        }
        
        leaderboard.appendChild(item);
    });
}

// Map functions
function initializeMap() {
    if (typeof google === 'undefined') {
        document.getElementById('wasteMap').innerHTML = 
            '<p>Map functionality requires Google Maps API key. Please configure it in the admin panel.</p>';
        return;
    }
    
    // Initialize Google Map
    const mapOptions = {
        zoom: 13,
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    };
    
    wasteMap = new google.maps.Map(document.getElementById('wasteMap'), mapOptions);
    
    // Try to center on user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            wasteMap.setCenter(userLocation);
            currentLocation = userLocation;
            
            // Add user location marker
            new google.maps.Marker({
                position: userLocation,
                map: wasteMap,
                title: 'Your Location',
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }
            });
            
            // Load nearby bins
            loadNearbyBins(userLocation);
        });
    }
}

function findNearbyBins() {
    if (!currentLocation) {
        getCurrentLocation();
        return;
    }
    
    loadNearbyBins(currentLocation);
}

function loadNearbyBins(location) {
    const binType = document.getElementById('binTypeFilter').value;
    let url = `/bins?lat=${location.lat}&lng=${location.lng}&radius=5`;
    if (binType) url += `&binType=${binType}`;
    
    fetch(API_BASE + url)
        .then(response => response.json())
        .then(data => {
            displayBinsOnMap(data.bins);
            displayBinsList(data.bins);
        })
        .catch(error => {
            console.error('Failed to load bins:', error);
            showToast('error', 'Failed to load nearby bins');
        });
}

function displayBinsOnMap(bins) {
    if (!wasteMap) return;
    
    // Clear existing markers (except user location)
    // In a real app, you'd track markers to clear them properly
    
    bins.forEach(bin => {
        const marker = new google.maps.Marker({
            position: bin.location.coordinates,
            map: wasteMap,
            title: `${bin.binType} bin (${bin.currentLevel}% full)`,
            icon: {
                url: getBinMarkerIcon(bin.binType, bin.status),
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <h4>${bin.binType.charAt(0).toUpperCase() + bin.binType.slice(1)} Bin</h4>
                    <p><strong>Status:</strong> ${bin.status}</p>
                    <p><strong>Fill Level:</strong> ${bin.currentLevel}%</p>
                    <p><strong>Address:</strong> ${bin.location.address}</p>
                    <p><strong>Last Collected:</strong> ${new Date(bin.lastCollected).toLocaleDateString()}</p>
                </div>
            `
        });
        
        marker.addListener('click', () => {
            infoWindow.open(wasteMap, marker);
        });
    });
}

function getBinMarkerIcon(binType, status) {
    // Return appropriate marker icon based on bin type and status
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    
    if (status === 'critical' || status === 'overflowing') {
        return baseUrl + 'red-dot.png';
    } else if (status === 'warning') {
        return baseUrl + 'yellow-dot.png';
    } else {
        return baseUrl + 'green-dot.png';
    }
}

function displayBinsList(bins) {
    const binsList = document.getElementById('binsList');
    binsList.innerHTML = '';
    
    if (bins.length === 0) {
        binsList.innerHTML = '<p>No bins found in your area.</p>';
        return;
    }
    
    bins.forEach(bin => {
        const item = document.createElement('div');
        item.className = 'bin-item';
        
        item.innerHTML = `
            <h5>${bin.binType.charAt(0).toUpperCase() + bin.binType.slice(1)} Bin</h5>
            <p>${bin.location.address}</p>
            <div class="bin-details">
                <span class="bin-status ${bin.status}">${bin.status}</span>
                <span>Fill: ${bin.currentLevel}%</span>
                <span>Distance: ${calculateDistance(currentLocation, bin.location.coordinates).toFixed(1)}km</span>
            </div>
        `;
        
        binsList.appendChild(item);
    });
}

function calculateDistance(pos1, pos2) {
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Data loading functions
function loadUserStats() {
    if (!currentUser) {
        resetUserStats();
        return;
    }
    
    fetchWithAuth('/analytics/my-stats')
        .then(response => response.json())
        .then(data => {
            updateUserStatsDisplay(data);
        })
        .catch(error => {
            console.error('Failed to load user stats:', error);
        });
}

function updateUserStatsDisplay(data) {
    document.getElementById('userReports').textContent = data.user.recyclingStats.totalReports;
    document.getElementById('userPointsDisplay').textContent = data.user.points;
    document.getElementById('userRank').textContent = data.impact.rank;
    document.getElementById('co2Saved').textContent = `${data.impact.co2Saved} kg`;
    
    // Update profile section if active
    if (document.getElementById('profile').classList.contains('active')) {
        document.getElementById('profileName').textContent = data.user.name;
        document.getElementById('profilePoints').textContent = data.user.points;
        document.getElementById('profileReports').textContent = data.user.recyclingStats.totalReports;
        document.getElementById('profileRank').textContent = data.impact.rank;
        document.getElementById('profileLevel').textContent = data.user.level;
        
        // Update environmental impact
        document.getElementById('impactCO2').textContent = `${data.impact.co2Saved} kg`;
        document.getElementById('impactWater').textContent = `${data.impact.co2Saved * 15} L`; // Mock calculation
        document.getElementById('impactEnergy').textContent = `${data.impact.co2Saved * 3.2} kWh`; // Mock calculation
        document.getElementById('impactTrees').textContent = Math.round(data.impact.co2Saved / 22);
        
        // Display recent activity
        displayRecentActivity(data.recentActivity);
    }
}

function resetUserStats() {
    document.getElementById('userReports').textContent = '0';
    document.getElementById('userPointsDisplay').textContent = '0';
    document.getElementById('userRank').textContent = '-';
    document.getElementById('co2Saved').textContent = '0 kg';
}

function displayRecentActivity(activities) {
    const activityList = document.getElementById('recentActivity');
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p>No recent activity.</p>';
        return;
    }
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        item.innerHTML = `
            <h5>${activity.reportType.replace('_', ' ').toUpperCase()}</h5>
            <p>Status: ${activity.status} | Points: ${activity.pointsAwarded || 0}</p>
            <p>${new Date(activity.createdAt).toLocaleDateString()}</p>
        `;
        
        activityList.appendChild(item);
    });
}

function loadCommunityImpact() {
    fetch(API_BASE + '/analytics/environmental-impact')
        .then(response => response.json())
        .then(data => {
            updateCommunityImpactDisplay(data);
        })
        .catch(error => {
            console.error('Failed to load community impact:', error);
        });
}

function updateCommunityImpactDisplay(data) {
    document.getElementById('activeUsers').textContent = data.recyclingStats.participatingUsers;
    document.getElementById('totalRecycled').textContent = `${data.environmentalImpact.wasteReduced} kg`;
    document.getElementById('treesEquivalent').textContent = data.environmentalImpact.treesEquivalent;
    document.getElementById('waterSaved').textContent = `${data.environmentalImpact.waterSaved}L`;
}

function loadRecentReports() {
    if (!currentUser) return;
    
    fetchWithAuth('/reports?limit=5')
        .then(response => response.json())
        .then(data => {
            displayRecentReports(data.reports);
        })
        .catch(error => {
            console.error('Failed to load recent reports:', error);
        });
}

function displayRecentReports(reports) {
    const reportsList = document.getElementById('recentReportsList');
    reportsList.innerHTML = '';
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<p>No reports submitted yet.</p>';
        return;
    }
    
    reports.forEach(report => {
        const item = document.createElement('div');
        item.className = 'report-item';
        
        item.innerHTML = `
            <div class="report-header">
                <h4>${report.reportType.replace('_', ' ').toUpperCase()}</h4>
                <span class="status ${report.status}">${report.status}</span>
            </div>
            <p>${report.description}</p>
            <div class="report-meta">
                <span>📍 ${report.location.address}</span>
                <span>📅 ${new Date(report.createdAt).toLocaleDateString()}</span>
                <span>🎯 ${report.pointsAwarded || 0} points</span>
            </div>
        `;
        
        reportsList.appendChild(item);
    });
}

function loadProfileData() {
    if (!currentUser) return;
    
    // Profile data is loaded with user stats
    loadUserStats();
}

// Utility functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    if (wasteMap) {
        google.maps.event.trigger(wasteMap, 'resize');
    }
});