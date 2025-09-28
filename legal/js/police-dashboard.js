// Police Dashboard Tab Management
class PoliceDashboard {
    constructor() {
        this.currentTab = 'draft-fir';
        this.initializeDashboard();
    }

    initializeDashboard() {
        // Set up tab switching
        this.setupTabListeners();
        
        // Show the default tab on load
        this.showTab('draft-fir');
        
        // Initialize system status
        this.checkSystemStatus();
        
        console.log('Police Dashboard initialized');
    }

    setupTabListeners() {
        // Add click listeners to sidebar buttons
        const sidebarButtons = document.querySelectorAll('.sidebar-btn');
        
        sidebarButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Add click listeners to tab filters (case management)
        const tabFilters = document.querySelectorAll('.tab-filter');
        tabFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const filterType = filter.getAttribute('data-filter');
                this.filterCases(filterType, filter);
            });
        });
    }

    switchTab(tabId) {
        // Update sidebar button states
        const sidebarButtons = document.querySelectorAll('.sidebar-btn');
        sidebarButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
            }
        });

        // Hide all tab contents
        const tabContents = document.querySelectorAll('.police-tab-content');
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });

        // Show the selected tab
        const targetTab = document.getElementById(`${tabId}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabId;
            
            // Load tab-specific content if needed
            this.loadTabContent(tabId);
        } else {
            console.error(`Tab with id '${tabId}-tab' not found`);
        }
    }

    loadTabContent(tabId) {
        switch(tabId) {
            case 'case-management':
                this.loadCaseManagement();
                break;
            case 'crime-analytics':
                this.loadCrimeAnalytics();
                break;
            case 'criminal-matching':
                this.loadCriminalMatching();
                break;
            case 'legal-resources':
                this.loadLegalResources();
                break;
            // 'draft-fir' tab content is already loaded
        }
    }

    loadCaseManagement() {
        // Simulate loading cases
        const loadingElement = document.getElementById('casesLoading');
        const contentElement = document.getElementById('casesContent');
        
        if (loadingElement && contentElement) {
            loadingElement.style.display = 'block';
            contentElement.style.display = 'none';
            
            setTimeout(() => {
                // Simulate API call delay
                this.displayMockCases();
                loadingElement.style.display = 'none';
                contentElement.style.display = 'block';
            }, 1000);
        }
    }

    displayMockCases() {
        const casesContent = document.getElementById('casesContent');
        if (!casesContent) return;

        const mockCases = [
            {
                id: 1,
                firNumber: 'PS/2024/01/0001',
                type: 'Theft',
                status: 'Under Investigation',
                priority: 'high',
                daysOpen: 3,
                location: 'Market Street',
                officer: 'Inspector Sharma'
            },
            {
                id: 2,
                firNumber: 'PS/2024/01/0002',
                type: 'Assault',
                status: 'Evidence Collection',
                priority: 'medium',
                daysOpen: 1,
                location: 'Central Park',
                officer: 'Sub-Inspector Verma'
            },
            {
                id: 3,
                firNumber: 'PS/2024/01/0003',
                type: 'Fraud',
                status: 'Witness Interview',
                priority: 'low',
                daysOpen: 5,
                location: 'Business District',
                officer: 'Inspector Gupta'
            }
        ];

        casesContent.innerHTML = mockCases.map(caseItem => `
            <div class="case-card priority-${caseItem.priority}">
                <div class="case-header">
                    <h4>${caseItem.firNumber} - ${caseItem.type}</h4>
                    <span class="case-days">${caseItem.daysOpen} days</span>
                </div>
                <div class="case-details">
                    <p><strong>Status:</strong> ${caseItem.status}</p>
                    <p><strong>Location:</strong> ${caseItem.location}</p>
                    <p><strong>Officer:</strong> ${caseItem.officer}</p>
                    <p><strong>Priority:</strong> ${caseItem.priority.toUpperCase()}</p>
                </div>
                <div class="case-analysis">
                    <span class="priority-badge ${caseItem.priority}">${caseItem.priority.toUpperCase()} PRIORITY</span>
                    <span class="action-item">Evidence Pending</span>
                </div>
                <div class="case-actions">
                    <button class="btn-view" onclick="viewCase(${caseItem.id})">View Details</button>
                    <button class="btn-update" onclick="updateCase(${caseItem.id})">Update Status</button>
                </div>
            </div>
        `).join('');
    }

    filterCases(filterType, clickedFilter) {
        // Update filter buttons
        const filters = document.querySelectorAll('.tab-filter');
        filters.forEach(filter => filter.classList.remove('active'));
        clickedFilter.classList.add('active');

        // In a real implementation, this would filter the cases
        console.log(`Filtering cases by: ${filterType}`);
        // For now, we'll just reload the mock data
        this.displayMockCases();
    }

    loadCrimeAnalytics() {
        // Analytics will be loaded when user clicks "Generate Report"
        console.log('Crime Analytics tab loaded');
    }

    loadCriminalMatching() {
        // Criminal matching interface is ready
        console.log('Criminal Matching tab loaded');
    }

    loadLegalResources() {
        // Load legal resources
        const resourcesGrid = document.getElementById('legalResourcesGrid');
        if (resourcesGrid) {
            resourcesGrid.innerHTML = `
                <div class="resource-card">
                    <h3>IPC Sections Database</h3>
                    <p>Complete Indian Penal Code with search functionality</p>
                    <button class="btn-view" onclick="openIPCDatabase()">Browse</button>
                </div>
                <div class="resource-card">
                    <h3>Legal Procedures</h3>
                    <p>Step-by-step guides for investigation procedures</p>
                    <button class="btn-view" onclick="openProcedures()">View Guides</button>
                </div>
                <div class="resource-card">
                    <h3>Case Law Database</h3>
                    <p>Important court judgments and precedents</p>
                    <button class="btn-view" onclick="openCaseLaw()">Search Cases</button>
                </div>
            `;
        }
    }

    checkSystemStatus() {
        // Simulate system status check
        const statusElement = document.getElementById('systemStatus');
        if (statusElement) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-online';
        }

        // Update pending cases badge
        const pendingBadge = document.getElementById('pendingBadge');
        if (pendingBadge) {
            pendingBadge.textContent = '3'; // Mock data
        }
    }
}

// Global functions for HTML onclick attributes
function generateAnalytics() {
    if (window.analyticsDashboard) {
        window.analyticsDashboard.generateAnalytics();
    }
}

function findCriminalMatches() {
    const description = document.getElementById('caseDescription').value;
    if (!description.trim()) {
        alert('Please enter case details to search for matches.');
        return;
    }
    // This would be implemented in criminal-search.js
    console.log('Searching for criminal matches:', description);
}

function searchLegalResources() {
    const query = document.getElementById('legalSearch').value;
    if (!query.trim()) {
        alert('Please enter a search term.');
        return;
    }
    console.log('Searching legal resources for:', query);
}

// Mock functions for case management
function viewCase(caseId) {
    alert(`Viewing case ${caseId} - This would open a detailed view in a real implementation.`);
}

function updateCase(caseId) {
    alert(`Updating case ${caseId} - This would open an update form in a real implementation.`);
}

// Mock functions for legal resources
function openIPCDatabase() {
    alert('Opening IPC Database - This would show a searchable IPC section database.');
}

function openProcedures() {
    alert('Opening Legal Procedures - This would show investigation procedure guides.');
}

function openCaseLaw() {
    alert('Opening Case Law Database - This would show important court judgments.');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.policeDashboard = new PoliceDashboard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PoliceDashboard;
}