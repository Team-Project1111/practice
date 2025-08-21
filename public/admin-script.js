// Global variables
let currentAdmin = null;
let dashboardCharts = {};
let refreshInterval = null;

// API base URL
const API_BASE = window.location.origin + '/api';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    setupEventListeners();
    initializeDashboard();
});

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').substring(1);
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update page title
            document.getElementById('pageTitle').textContent = 
                link.textContent.replace(/\d+/, '').trim();
        });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Refresh data button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboardData);
    }

    // Logout
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Filter event listeners
    setupFilterEventListeners();
    
    // Modal event listeners
    setupModalEventListeners();
    
    // Form event listeners
    setupFormEventListeners();
}

function setupFilterEventListeners() {
    // Reports filters
    const reportFilters = ['reportStatusFilter', 'reportTypeFilter', 'reportPriorityFilter'];
    reportFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', loadReportsData);
        }
    });

    // Bins filters
    const binFilters = ['binStatusFilter', 'binTypeFilterAdmin'];
    binFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', loadBinsData);
        }
    });

    // Timeframe selectors
    const timeframeSelectors = ['reportsTimeframe', 'analyticsTimeframe'];
    timeframeSelectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.addEventListener('change', () => {
                if (selectorId === 'reportsTimeframe') {
                    updateReportsChart();
                } else if (selectorId === 'analyticsTimeframe') {
                    loadAnalyticsData();
                }
            });
        }
    });

    // User search
    const searchBtn = document.getElementById('searchUsersBtn');
    const searchInput = document.getElementById('userSearch');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', searchUsers);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchUsers();
        });
    }
}

function setupModalEventListeners() {
    // Close modal buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) hideModal(modal.id);
        });
    });

    // Add buttons
    const addBinBtn = document.getElementById('addBinBtn');
    const addRewardBtn = document.getElementById('addRewardBtn');
    
    if (addBinBtn) addBinBtn.addEventListener('click', () => showAddBinModal());
    if (addRewardBtn) addRewardBtn.addEventListener('click', () => showAddRewardModal());
}

function setupFormEventListeners() {
    // Reward form
    const rewardForm = document.getElementById('rewardForm');
    if (rewardForm) {
        rewardForm.addEventListener('submit', handleRewardSubmission);
    }

    const cancelRewardBtn = document.getElementById('cancelReward');
    if (cancelRewardBtn) {
        cancelRewardBtn.addEventListener('click', () => hideModal('rewardModal'));
    }
}

// Authentication
function checkAdminAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        redirectToLogin();
        return;
    }

    fetchWithAuth('/auth/profile')
        .then(response => response.json())
        .then(user => {
            if (user.role !== 'admin') {
                showToast('error', 'Admin access required');
                redirectToLogin();
                return;
            }
            currentAdmin = user;
            document.getElementById('adminName').textContent = user.name;
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            redirectToLogin();
        });
}

function redirectToLogin() {
    localStorage.removeItem('authToken');
    window.location.href = '/';
}

function handleLogout() {
    localStorage.removeItem('authToken');
    showToast('info', 'Logged out successfully');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
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

// Dashboard initialization
function initializeDashboard() {
    showSection('dashboard');
    loadDashboardData();
    
    // Set up auto-refresh
    refreshInterval = setInterval(refreshDashboardData, 30000); // 30 seconds
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        loadSectionData(sectionId);
    }
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'reports':
            loadReportsData();
            break;
        case 'bins':
            loadBinsData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'rewards':
            loadRewardsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'alerts':
            loadAlertsData();
            break;
    }
}

// Dashboard data loading
function loadDashboardData() {
    showLoading(true);
    
    Promise.all([
        fetchWithAuth('/analytics/dashboard'),
        fetchWithAuth('/reports/stats/overview'),
        fetchWithAuth('/bins/stats/overview'),
        fetchWithAuth('/bins/alerts/critical')
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([dashboardData, reportsStats, binsStats, alerts]) => {
        updateKPICards(dashboardData, reportsStats, binsStats);
        updateReportsChart(dashboardData.trends.dailyReports);
        updateBinStatusChart(binsStats.byStatus);
        updateRecentActivity(dashboardData.trends, alerts);
        updateWardPerformance(dashboardData.trends.wardStats);
        updateAlertCount(alerts.totalAlerts);
    })
    .catch(error => {
        console.error('Failed to load dashboard data:', error);
        showToast('error', 'Failed to load dashboard data');
    })
    .finally(() => {
        showLoading(false);
    });
}

function updateKPICards(dashboardData, reportsStats, binsStats) {
    // Total Reports
    document.getElementById('totalReports').textContent = reportsStats.overview.totalReports || 0;
    document.getElementById('reportsTrend').textContent = '+12%'; // Mock trend
    
    // Active Bins
    document.getElementById('totalBins').textContent = binsStats.overview.activeBins || 0;
    document.getElementById('binsTrend').textContent = binsStats.overview.totalBins || 0;
    
    // Active Users
    document.getElementById('activeUsers').textContent = dashboardData.users.activeUsers || 0;
    document.getElementById('usersTrend').textContent = '+8%'; // Mock trend
    
    // Resolution Rate
    const resolutionRate = reportsStats.overview.totalReports > 0 ? 
        Math.round((reportsStats.overview.resolvedReports / reportsStats.overview.totalReports) * 100) : 0;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;
    document.getElementById('resolutionTrend').textContent = '+5%'; // Mock trend
    
    // Update header stats
    document.getElementById('criticalAlerts').textContent = binsStats.overview.criticalBins || 0;
    document.getElementById('pendingReports').textContent = reportsStats.overview.pendingReports || 0;
}

function updateReportsChart(dailyData = []) {
    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dashboardCharts.reportsChart) {
        dashboardCharts.reportsChart.destroy();
    }

    // Prepare data
    const labels = dailyData.map(item => new Date(item._id).toLocaleDateString());
    const data = dailyData.map(item => item.count);
    const resolvedData = dailyData.map(item => item.resolved);

    dashboardCharts.reportsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Reports',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Resolved Reports',
                    data: resolvedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateBinStatusChart(statusData = []) {
    const ctx = document.getElementById('binStatusChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (dashboardCharts.binStatusChart) {
        dashboardCharts.binStatusChart.destroy();
    }

    // Prepare data
    const labels = statusData.map(item => item._id);
    const data = statusData.map(item => item.count);
    const colors = labels.map(label => {
        switch(label) {
            case 'normal': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'critical': return '#ef4444';
            case 'maintenance': return '#6b7280';
            default: return '#667eea';
        }
    });

    dashboardCharts.binStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateRecentActivity(trends, alerts) {
    // Update recent reports
    const recentReportsContainer = document.getElementById('recentReports');
    recentReportsContainer.innerHTML = '';
    
    // Mock recent reports data
    const mockReports = [
        { id: 'RPT-001', type: 'overflowing_bin', status: 'pending', time: '5 min ago' },
        { id: 'RPT-002', type: 'illegal_dumping', status: 'in_progress', time: '12 min ago' },
        { id: 'RPT-003', type: 'pickup_request', status: 'resolved', time: '1 hour ago' }
    ];
    
    mockReports.forEach(report => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <h5>${report.id}</h5>
            <p>${report.type.replace('_', ' ')}</p>
            <span class="status ${report.status}">${report.status}</span>
            <p>${report.time}</p>
        `;
        recentReportsContainer.appendChild(item);
    });

    // Update critical bins
    const criticalBinsContainer = document.getElementById('criticalBins');
    criticalBinsContainer.innerHTML = '';
    
    if (alerts.critical && alerts.critical.length > 0) {
        alerts.critical.slice(0, 5).forEach(bin => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <h5>${bin.binId}</h5>
                <p>${bin.location.address}</p>
                <span class="status ${bin.status}">${bin.status}</span>
                <p>${bin.currentLevel}% full</p>
            `;
            criticalBinsContainer.appendChild(item);
        });
    } else {
        criticalBinsContainer.innerHTML = '<p>No critical bins at the moment.</p>';
    }
}

function updateWardPerformance(wardStats = []) {
    const wardContainer = document.getElementById('wardStats');
    wardContainer.innerHTML = '';
    
    if (wardStats.length === 0) {
        wardContainer.innerHTML = '<p>No ward data available.</p>';
        return;
    }
    
    wardStats.slice(0, 6).forEach(ward => {
        const item = document.createElement('div');
        item.className = 'ward-item';
        item.innerHTML = `
            <h4>${ward._id || 'Unknown Ward'}</h4>
            <span class="ward-stat">${ward.reportCount}</span>
            <p>Reports</p>
        `;
        wardContainer.appendChild(item);
    });
}

function updateAlertCount(count) {
    const alertCountElement = document.getElementById('alertCount');
    if (alertCountElement) {
        alertCountElement.textContent = count || 0;
        alertCountElement.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Reports section
function loadReportsData() {
    const statusFilter = document.getElementById('reportStatusFilter')?.value || '';
    const typeFilter = document.getElementById('reportTypeFilter')?.value || '';
    const priorityFilter = document.getElementById('reportPriorityFilter')?.value || '';
    
    let url = '/reports?limit=50';
    if (statusFilter) url += `&status=${statusFilter}`;
    if (typeFilter) url += `&reportType=${typeFilter}`;
    if (priorityFilter) url += `&priority=${priorityFilter}`;
    
    showLoading(true);
    
    fetchWithAuth(url)
        .then(response => response.json())
        .then(data => {
            displayReportsTable(data.reports);
            updateReportsPagination(data.pagination);
        })
        .catch(error => {
            console.error('Failed to load reports:', error);
            showToast('error', 'Failed to load reports');
        })
        .finally(() => {
            showLoading(false);
        });
}

function displayReportsTable(reports) {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';
    
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.reportId}</td>
            <td>${report.reportType.replace('_', ' ')}</td>
            <td>${report.reportedBy?.name || 'Unknown'}</td>
            <td>${report.location.address}</td>
            <td><span class="status ${report.priority}">${report.priority}</span></td>
            <td><span class="status ${report.status}">${report.status}</span></td>
            <td>${new Date(report.createdAt).toLocaleDateString()}</td>
            <td class="table-actions">
                <button class="action-btn view" onclick="viewReport('${report._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="updateReportStatus('${report._id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateReportsPagination(pagination) {
    const paginationContainer = document.getElementById('reportsPagination');
    paginationContainer.innerHTML = '';
    
    // Add pagination buttons
    for (let i = 1; i <= pagination.pages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === pagination.current ? 'active' : '';
        button.addEventListener('click', () => loadReportsPage(i));
        paginationContainer.appendChild(button);
    }
}

function viewReport(reportId) {
    fetchWithAuth(`/reports/${reportId}`)
        .then(response => response.json())
        .then(report => {
            displayReportModal(report);
        })
        .catch(error => {
            console.error('Failed to load report details:', error);
            showToast('error', 'Failed to load report details');
        });
}

function displayReportModal(report) {
    const modalBody = document.getElementById('reportModalBody');
    modalBody.innerHTML = `
        <div class="report-details">
            <div class="detail-group">
                <h4>Report Information</h4>
                <p><strong>ID:</strong> ${report.reportId}</p>
                <p><strong>Type:</strong> ${report.reportType.replace('_', ' ')}</p>
                <p><strong>Priority:</strong> <span class="status ${report.priority}">${report.priority}</span></p>
                <p><strong>Status:</strong> <span class="status ${report.status}">${report.status}</span></p>
            </div>
            
            <div class="detail-group">
                <h4>Reporter</h4>
                <p><strong>Name:</strong> ${report.reportedBy?.name || 'Unknown'}</p>
                <p><strong>Email:</strong> ${report.reportedBy?.email || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Location</h4>
                <p><strong>Address:</strong> ${report.location.address}</p>
                <p><strong>Ward:</strong> ${report.location.ward || 'Unknown'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Description</h4>
                <p>${report.description}</p>
            </div>
            
            <div class="detail-group">
                <h4>Timeline</h4>
                <p><strong>Created:</strong> ${new Date(report.createdAt).toLocaleString()}</p>
                ${report.actualResolutionTime ? `<p><strong>Resolved:</strong> ${new Date(report.actualResolutionTime).toLocaleString()}</p>` : ''}
            </div>
            
            ${report.status !== 'resolved' ? `
                <div class="detail-group">
                    <h4>Actions</h4>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="updateReportStatus('${report._id}', 'acknowledged')">Acknowledge</button>
                        <button class="btn btn-warning" onclick="updateReportStatus('${report._id}', 'in_progress')">Start Work</button>
                        <button class="btn btn-success" onclick="updateReportStatus('${report._id}', 'resolved')">Mark Resolved</button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('reportModal');
}

function updateReportStatus(reportId, newStatus) {
    const statusData = { status: newStatus };
    
    if (newStatus === 'resolved') {
        statusData.resolution = {
            description: 'Issue resolved by admin',
            images: []
        };
    }
    
    fetchWithAuth(`/reports/${reportId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.report) {
            showToast('success', 'Report status updated successfully');
            hideModal('reportModal');
            loadReportsData(); // Refresh the table
        } else {
            showToast('error', data.message || 'Failed to update report status');
        }
    })
    .catch(error => {
        console.error('Failed to update report status:', error);
        showToast('error', 'Failed to update report status');
    });
}

// Bins section
function loadBinsData() {
    const statusFilter = document.getElementById('binStatusFilter')?.value || '';
    const typeFilter = document.getElementById('binTypeFilterAdmin')?.value || '';
    
    let url = '/bins?limit=50';
    if (statusFilter) url += `&status=${statusFilter}`;
    if (typeFilter) url += `&binType=${typeFilter}`;
    
    showLoading(true);
    
    fetchWithAuth(url)
        .then(response => response.json())
        .then(data => {
            displayBinsGrid(data.bins);
        })
        .catch(error => {
            console.error('Failed to load bins:', error);
            showToast('error', 'Failed to load bins');
        })
        .finally(() => {
            showLoading(false);
        });
}

function displayBinsGrid(bins) {
    const binsGrid = document.getElementById('binsGrid');
    binsGrid.innerHTML = '';
    
    bins.forEach(bin => {
        const card = document.createElement('div');
        card.className = 'bin-card';
        
        const fillLevelClass = bin.currentLevel >= 85 ? 'critical' : 
                              bin.currentLevel >= 70 ? 'warning' : 'normal';
        
        card.innerHTML = `
            <div class="bin-card-header">
                <div class="bin-id">${bin.binId}</div>
                <span class="bin-type ${bin.binType}">${bin.binType}</span>
            </div>
            <div class="bin-card-body">
                <div class="bin-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${bin.location.address}
                </div>
                <div class="fill-level">
                    <div class="fill-level-label">
                        <span>Fill Level</span>
                        <span>${bin.currentLevel}%</span>
                    </div>
                    <div class="fill-level-bar">
                        <div class="fill-level-progress ${fillLevelClass}" 
                             style="width: ${bin.currentLevel}%"></div>
                    </div>
                </div>
                <div class="bin-status-badge status ${bin.status}">${bin.status}</div>
                <div class="bin-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewBin('${bin._id}')">View</button>
                    ${bin.currentLevel >= 70 ? `<button class="btn btn-warning btn-sm" onclick="scheduleBinCollection('${bin._id}')">Schedule</button>` : ''}
                    ${bin.currentLevel > 0 ? `<button class="btn btn-success btn-sm" onclick="markBinCollected('${bin._id}')">Collected</button>` : ''}
                </div>
            </div>
        `;
        
        binsGrid.appendChild(card);
    });
}

function viewBin(binId) {
    fetchWithAuth(`/bins/${binId}`)
        .then(response => response.json())
        .then(bin => {
            displayBinModal(bin);
        })
        .catch(error => {
            console.error('Failed to load bin details:', error);
            showToast('error', 'Failed to load bin details');
        });
}

function displayBinModal(bin) {
    const modalBody = document.getElementById('binModalBody');
    modalBody.innerHTML = `
        <div class="bin-details">
            <div class="detail-group">
                <h4>Bin Information</h4>
                <p><strong>ID:</strong> ${bin.binId}</p>
                <p><strong>Type:</strong> ${bin.binType}</p>
                <p><strong>Status:</strong> <span class="status ${bin.status}">${bin.status}</span></p>
                <p><strong>Capacity:</strong> ${bin.capacity}%</p>
                <p><strong>Current Level:</strong> ${bin.currentLevel}%</p>
            </div>
            
            <div class="detail-group">
                <h4>Location</h4>
                <p><strong>Address:</strong> ${bin.location.address}</p>
                <p><strong>Ward:</strong> ${bin.location.ward || 'Unknown'}</p>
                <p><strong>Landmark:</strong> ${bin.location.landmark || 'None'}</p>
            </div>
            
            <div class="detail-group">
                <h4>Collection Schedule</h4>
                <p><strong>Frequency:</strong> ${bin.collectionFrequency}</p>
                <p><strong>Last Collected:</strong> ${new Date(bin.lastCollected).toLocaleString()}</p>
                <p><strong>Next Scheduled:</strong> ${bin.nextScheduledCollection ? new Date(bin.nextScheduledCollection).toLocaleString() : 'Not scheduled'}</p>
            </div>
            
            ${bin.sensorData ? `
                <div class="detail-group">
                    <h4>Sensor Data</h4>
                    <p><strong>Temperature:</strong> ${bin.sensorData.temperature || 'N/A'}°C</p>
                    <p><strong>Humidity:</strong> ${bin.sensorData.humidity || 'N/A'}%</p>
                    <p><strong>Last Updated:</strong> ${new Date(bin.sensorData.lastUpdated).toLocaleString()}</p>
                </div>
            ` : ''}
            
            <div class="detail-group">
                <h4>Actions</h4>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="markBinCollected('${bin._id}')">Mark as Collected</button>
                    <button class="btn btn-warning" onclick="scheduleBinMaintenance('${bin._id}')">Schedule Maintenance</button>
                    <button class="btn btn-secondary" onclick="updateBinLevel('${bin._id}')">Update Level</button>
                </div>
            </div>
        </div>
    `;
    
    showModal('binModal');
}

function markBinCollected(binId) {
    fetchWithAuth(`/bins/${binId}/collect`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.bin) {
            showToast('success', 'Bin marked as collected successfully');
            hideModal('binModal');
            loadBinsData(); // Refresh the grid
        } else {
            showToast('error', data.message || 'Failed to mark bin as collected');
        }
    })
    .catch(error => {
        console.error('Failed to mark bin as collected:', error);
        showToast('error', 'Failed to mark bin as collected');
    });
}

function scheduleBinCollection(binId) {
    // In a real app, this would open a scheduling modal
    showToast('info', 'Collection scheduled for tomorrow morning');
}

function scheduleBinMaintenance(binId) {
    fetchWithAuth(`/bins/${binId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'maintenance' })
    })
    .then(response => response.json())
    .then(data => {
        if (data.bin) {
            showToast('success', 'Maintenance scheduled successfully');
            hideModal('binModal');
            loadBinsData();
        } else {
            showToast('error', 'Failed to schedule maintenance');
        }
    })
    .catch(error => {
        console.error('Failed to schedule maintenance:', error);
        showToast('error', 'Failed to schedule maintenance');
    });
}

// Users section
function loadUsersData() {
    showLoading(true);
    
    fetchWithAuth('/auth/users?limit=50') // This endpoint would need to be created
        .then(response => response.json())
        .then(data => {
            displayUsersTable(data.users || []);
        })
        .catch(error => {
            console.error('Failed to load users:', error);
            // Mock users data for demo
            displayUsersTable(generateMockUsers());
        })
        .finally(() => {
            showLoading(false);
        });
}

function generateMockUsers() {
    return [
        { _id: '1', name: 'John Doe', email: 'john@example.com', level: 'Gold', points: 2500, recyclingStats: { totalReports: 15 }, createdAt: new Date('2024-01-15'), isActive: true },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', level: 'Silver', points: 1800, recyclingStats: { totalReports: 12 }, createdAt: new Date('2024-02-01'), isActive: true },
        { _id: '3', name: 'Mike Johnson', email: 'mike@example.com', level: 'Bronze', points: 850, recyclingStats: { totalReports: 8 }, createdAt: new Date('2024-02-15'), isActive: true }
    ];
}

function displayUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="level-badge ${user.level?.toLowerCase()}">${user.level}</span></td>
            <td>${user.points}</td>
            <td>${user.recyclingStats?.totalReports || 0}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td><span class="status ${user.isActive ? 'normal' : 'warning'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td class="table-actions">
                <button class="action-btn view" onclick="viewUser('${user._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editUser('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    if (!query) {
        loadUsersData();
        return;
    }
    
    // Mock search functionality
    showToast('info', `Searching for users matching "${query}"`);
    // In a real app, make API call with search query
}

// Rewards section
function loadRewardsData() {
    Promise.all([
        fetchWithAuth('/rewards'),
        fetchWithAuth('/rewards/stats/overview')
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([rewards, stats]) => {
        displayRewardsGrid(rewards);
        // Display stats if needed
    })
    .catch(error => {
        console.error('Failed to load rewards data:', error);
        showToast('error', 'Failed to load rewards data');
    });
}

function displayRewardsGrid(rewards) {
    const rewardsGrid = document.getElementById('rewardsAdminGrid');
    rewardsGrid.innerHTML = '';
    
    rewards.forEach(reward => {
        const card = document.createElement('div');
        card.className = 'reward-admin-card';
        
        const isExpired = new Date(reward.validUntil) < new Date();
        
        card.innerHTML = `
            <div class="reward-card">
                <div class="reward-card-header">
                    <span class="reward-category">${reward.category}</span>
                    <h4>${reward.title}</h4>
                    <div class="reward-points">${reward.pointsRequired} points</div>
                </div>
                <div class="reward-card-body">
                    <p>${reward.description}</p>
                    <div class="reward-value">${reward.value}</div>
                    <div class="reward-stats">
                        <span>Redeemed: ${reward.currentRedemptions}/${reward.maxRedemptions === -1 ? '∞' : reward.maxRedemptions}</span>
                        <span>Valid until: ${new Date(reward.validUntil).toLocaleDateString()}</span>
                        <span class="status ${isExpired ? 'expired' : 'active'}">${isExpired ? 'Expired' : 'Active'}</span>
                    </div>
                    <div class="reward-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editReward('${reward._id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteReward('${reward._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
        
        rewardsGrid.appendChild(card);
    });
}

function showAddRewardModal() {
    document.getElementById('rewardModalTitle').textContent = 'Add Reward';
    document.getElementById('rewardForm').reset();
    showModal('rewardModal');
}

function handleRewardSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const rewardData = {
        title: formData.get('title') || document.getElementById('rewardTitle').value,
        description: formData.get('description') || document.getElementById('rewardDescription').value,
        category: formData.get('category') || document.getElementById('rewardCategory').value,
        pointsRequired: parseInt(formData.get('pointsRequired') || document.getElementById('rewardPoints').value),
        value: formData.get('value') || document.getElementById('rewardValue').value,
        validUntil: formData.get('validUntil') || document.getElementById('rewardValidUntil').value,
        terms: 'Standard terms and conditions apply.',
        maxRedemptions: -1 // Unlimited by default
    };
    
    showLoading(true);
    
    fetchWithAuth('/rewards', {
        method: 'POST',
        body: JSON.stringify(rewardData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.reward) {
            showToast('success', 'Reward created successfully');
            hideModal('rewardModal');
            loadRewardsData();
        } else {
            showToast('error', data.message || 'Failed to create reward');
        }
    })
    .catch(error => {
        console.error('Failed to create reward:', error);
        showToast('error', 'Failed to create reward');
    })
    .finally(() => {
        showLoading(false);
    });
}

// Analytics section
function loadAnalyticsData() {
    const timeframe = document.getElementById('analyticsTimeframe')?.value || '30';
    
    Promise.all([
        fetchWithAuth(`/analytics/environmental-impact?timeframe=${timeframe}`),
        fetchWithAuth(`/analytics/collection-efficiency?timeframe=${timeframe}`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([impactData, efficiencyData]) => {
        updateEnvironmentalMetrics(impactData.environmentalImpact);
        updateEfficiencyChart(efficiencyData.collectionStats);
        updateEngagementChart(impactData.recyclingStats);
        displayRouteOptimization(efficiencyData.routeOptimization);
    })
    .catch(error => {
        console.error('Failed to load analytics data:', error);
        showToast('error', 'Failed to load analytics data');
    });
}

function updateEnvironmentalMetrics(metrics) {
    document.getElementById('totalCO2Saved').textContent = `${metrics.co2Saved} kg`;
    document.getElementById('totalWaterSaved').textContent = `${metrics.waterSaved} L`;
    document.getElementById('totalEnergySaved').textContent = `${metrics.energySaved} kWh`;
    document.getElementById('totalWasteRecycled').textContent = `${metrics.wasteReduced} kg`;
}

function updateEfficiencyChart(collectionStats) {
    const ctx = document.getElementById('efficiencyChart');
    if (!ctx) return;

    if (dashboardCharts.efficiencyChart) {
        dashboardCharts.efficiencyChart.destroy();
    }

    const labels = collectionStats.map(item => item._id);
    const data = collectionStats.map(item => item.averageFillLevel);

    dashboardCharts.efficiencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Fill Level (%)',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateEngagementChart(stats) {
    const ctx = document.getElementById('engagementChart');
    if (!ctx) return;

    if (dashboardCharts.engagementChart) {
        dashboardCharts.engagementChart.destroy();
    }

    dashboardCharts.engagementChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Recyclable', 'Biodegradable', 'Hazardous'],
            datasets: [{
                data: [
                    stats.totalRecyclableItems,
                    stats.totalBiodegradableItems,
                    stats.totalHazardousItems
                ],
                backgroundColor: ['#10b981', '#8b5cf6', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function displayRouteOptimization(routeData) {
    const routeMap = document.getElementById('routeMap');
    routeMap.innerHTML = '<p>Route optimization map would be displayed here with Google Maps integration.</p>';
    
    const suggestions = document.getElementById('routeSuggestions');
    suggestions.innerHTML = '';
    
    routeData.slice(0, 3).forEach((ward, index) => {
        const suggestion = document.createElement('div');
        suggestion.className = 'route-suggestion';
        suggestion.innerHTML = `
            <h5>Route ${index + 1}: ${ward._id}</h5>
            <p>Optimize collection for ${ward.totalBins} bins with ${ward.averageFillLevel.toFixed(1)}% average fill level</p>
        `;
        suggestions.appendChild(suggestion);
    });
}

// Alerts section
function loadAlertsData() {
    fetchWithAuth('/analytics/alerts')
        .then(response => response.json())
        .then(data => {
            displayAlerts(data);
        })
        .catch(error => {
            console.error('Failed to load alerts:', error);
            displayMockAlerts();
        });
}

function displayMockAlerts() {
    const mockAlerts = {
        criticalAlerts: [
            { id: 1, title: 'Bin BIN-001 Overflowing', message: 'Immediate attention required', time: '5 min ago' },
            { id: 2, title: 'Multiple Reports in Ward A', message: '5 new reports in the last hour', time: '15 min ago' }
        ],
        warningAlerts: [
            { id: 3, title: 'Bin BIN-045 at 85% capacity', message: 'Schedule collection soon', time: '1 hour ago' },
            { id: 4, title: 'Sensor connectivity issues', message: '3 bins not reporting data', time: '2 hours ago' }
        ],
        infoAlerts: [
            { id: 5, title: 'Weekly report ready', message: 'Analytics report for last week is available', time: '1 day ago' }
        ]
    };
    
    displayAlerts(mockAlerts);
}

function displayAlerts(alerts) {
    // Display critical alerts
    const criticalContainer = document.getElementById('criticalAlertsList');
    criticalContainer.innerHTML = '';
    
    (alerts.criticalAlerts || []).forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item critical';
        item.innerHTML = `
            <h5>${alert.title}</h5>
            <p>${alert.message}</p>
            <span class="alert-time">${alert.time}</span>
        `;
        criticalContainer.appendChild(item);
    });
    
    // Display warning alerts
    const warningContainer = document.getElementById('warningAlertsList');
    warningContainer.innerHTML = '';
    
    (alerts.warningAlerts || []).forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item warning';
        item.innerHTML = `
            <h5>${alert.title}</h5>
            <p>${alert.message}</p>
            <span class="alert-time">${alert.time}</span>
        `;
        warningContainer.appendChild(item);
    });
    
    // Display info alerts
    const infoContainer = document.getElementById('infoAlertsList');
    infoContainer.innerHTML = '';
    
    (alerts.infoAlerts || []).forEach(alert => {
        const item = document.createElement('div');
        item.className = 'alert-item info';
        item.innerHTML = `
            <h5>${alert.title}</h5>
            <p>${alert.message}</p>
            <span class="alert-time">${alert.time}</span>
        `;
        infoContainer.appendChild(item);
    });
}

// Utility functions
function refreshDashboardData() {
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        loadSectionData(activeSection.id);
    }
}

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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Destroy charts
    Object.values(dashboardCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
});