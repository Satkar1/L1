// Police Dashboard Main Controller - COMPLETE VERSION
class PoliceDashboard {
    constructor() {
        this.currentTab = 'draft-fir';
        this.apiBase = 'http://localhost:5001/api/police';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 30000);
        this.showTab("draft-fir");
    }

    setupEventListeners() {
        // Sidebar tab switching
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.getAttribute('data-tab');
                this.showTab(tab);
            });
        });

        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab) {
                    this.showTab(tab);
                }
            });
        });

        // Case filter
        const caseFilter = document.getElementById('caseFilter');
        if (caseFilter) {
            caseFilter.addEventListener('change', () => {
                this.loadPendingCases();
            });
        }

        // Legal search
        const legalSearch = document.getElementById('legalSearch');
        if (legalSearch) {
            legalSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchLegalResources();
                }
            });
        }
    }

    showTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Map tab names to their corresponding content IDs
        const tabMap = {
            'draft-fir': 'draft-fir',
            'case-management': 'case-management-tab', 
            'crime-analytics': 'crime-analytics-tab',
            'criminal-matching': 'criminal-matching-tab',
            'legal-resources': 'legal-resources-tab'
        };
        
        const contentId = tabMap[tabName] || tabName;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Deactivate all sidebar buttons
        document.querySelectorAll('.sidebar-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.getElementById(contentId);
        if (targetTab) {
            targetTab.classList.add('active');
            
            // Activate corresponding sidebar button
            const correspondingBtn = document.querySelector(`.sidebar-btn[data-tab="${tabName}"]`);
            if (correspondingBtn) {
                correspondingBtn.classList.add('active');
            }

            // Load tab-specific data
            this.loadTabData(tabName);
        }

        this.currentTab = tabName;
    }

    async loadTabData(tabName) {
        try {
            switch(tabName) {
                case 'pending-cases':
                    await this.loadPendingCases();
                    break;
                case 'case-updates':
                    await this.loadCaseUpdates();
                    break;
                case 'analytics':
                    await this.loadAnalytics();
                    break;
                case 'criminal-matching':
                    await this.loadCriminalMatching();
                    break;
                case 'hotspots':
                    await this.loadHotspots();
                    break;
                case 'legal-resources':
                    await this.loadLegalResources();
                    break;
                case 'templates':
                    await this.loadTemplates();
                    break;
                case 'dashboard-overview':
                    await this.loadDashboardOverview();
                    break;
            }
        } catch (error) {
            console.error(`Error loading tab ${tabName}:`, error);
        }
    }

    async loadDashboardOverview() {
        try {
            const response = await fetch(`${this.apiBase}/dashboard/overview`);
            const data = await response.json();

            if (data.success) {
                this.updateDashboardStats(data.overview);
            }
        } catch (error) {
            console.error('Failed to load dashboard overview:', error);
        }
    }

    updateDashboardStats(overview) {
        if (!overview) return;

        // Update statistics
        if (document.getElementById('todayCases')) {
            document.getElementById('todayCases').textContent = overview.today_cases || 0;
        }
        if (document.getElementById('pendingCases')) {
            document.getElementById('pendingCases').textContent = overview.pending_cases || 0;
        }
        
        // Update badge counts
        if (document.getElementById('pendingCount')) {
            document.getElementById('pendingCount').textContent = overview.pending_cases || 0;
        }
        if (document.getElementById('updatesCount')) {
            document.getElementById('updatesCount').textContent = overview.recent_activity?.length || 0;
        }

        // Update recent activity
        this.updateRecentActivity(overview.recent_activity);
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container || !activities) return;

        if (activities.length === 0) {
            container.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        container.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="material-icons">update</i>
                </div>
                <div class="activity-details">
                    <strong>${activity.fir_number}</strong>
                    <span>${activity.incident_type} - ${this.formatTime(activity.last_updated)}</span>
                </div>
            </div>
        `).join('');
    }

    async loadPendingCases() {
        try {
            this.showLoading('pendingCasesList', 'Loading pending cases...');
            
            const filter = document.getElementById('caseFilter')?.value;
            const response = await fetch(`${this.apiBase}/cases/pending`);
            const data = await response.json();

            if (data.success) {
                this.displayPendingCases(data.cases, filter);
            } else {
                this.showError('pendingCasesList', 'Failed to load pending cases');
            }
        } catch (error) {
            console.error('Failed to load pending cases:', error);
            this.showError('pendingCasesList', 'Error loading pending cases');
        }
    }

    displayPendingCases(cases, filter = 'all') {
        const container = document.getElementById('pendingCasesList');
        if (!container) return;

        if (!cases || cases.length === 0) {
            container.innerHTML = '<div class="no-data">No pending cases requiring immediate attention</div>';
            return;
        }

        // Apply filter
        let filteredCases = cases;
        if (filter === 'high') {
            filteredCases = cases.filter(c => c.analysis?.priority === 'high');
        } else if (filter === 'medium') {
            filteredCases = cases.filter(c => c.analysis?.priority === 'medium');
        } else if (filter === 'old') {
            filteredCases = cases.filter(c => (c.days_pending || 0) > 7);
        }

        if (filteredCases.length === 0) {
            container.innerHTML = `<div class="no-data">No cases match the "${filter}" filter</div>`;
            return;
        }

        container.innerHTML = filteredCases.map(caseItem => `
            <div class="case-card priority-${caseItem.analysis?.priority || 'medium'}">
                <div class="case-header">
                    <h4>${caseItem.fir_number} - ${caseItem.incident_type}</h4>
                    <span class="case-days">${caseItem.days_pending || 0} days pending</span>
                </div>
                <div class="case-details">
                    <p><strong>Location:</strong> ${caseItem.incident_location}</p>
                    <p><strong>Victim:</strong> ${caseItem.victim_name}</p>
                    <p><strong>Officer:</strong> ${caseItem.investigating_officer}</p>
                </div>
                <div class="case-analysis">
                    <span class="priority-badge ${caseItem.analysis?.priority || 'medium'}">
                        ${caseItem.analysis?.priority || 'medium'} priority
                    </span>
                    ${caseItem.analysis?.action_items ? 
                        caseItem.analysis.action_items.map(item => 
                            `<span class="action-item">${item}</span>`
                        ).join('') : ''
                    }
                </div>
                <div class="case-actions">
                    <button class="btn-view" onclick="viewCaseDetails('${caseItem.fir_number}')">View Details</button>
                    <button class="btn-update" onclick="updateCaseStatus('${caseItem.fir_number}')">Update Status</button>
                </div>
            </div>
        `).join('');
    }

    async loadCaseUpdates() {
        try {
            this.showLoading('caseUpdatesList', 'Loading recent updates...');
            
            const response = await fetch(`${this.apiBase}/cases/updates`);
            const data = await response.json();

            if (data.success) {
                this.displayCaseUpdates(data.updates);
            } else {
                this.showError('caseUpdatesList', 'Failed to load case updates');
            }
        } catch (error) {
            console.error('Failed to load case updates:', error);
            this.showError('caseUpdatesList', 'Error loading case updates');
        }
    }

    displayCaseUpdates(updates) {
        const container = document.getElementById('caseUpdatesList');
        if (!container) return;

        if (!updates || updates.length === 0) {
            container.innerHTML = '<div class="no-data">No recent case updates</div>';
            return;
        }

        container.innerHTML = updates.map(update => `
            <div class="update-item">
                <div class="update-icon">
                    <i class="material-icons">event</i>
                </div>
                <div class="update-content">
                    <h4>${update.fir_number} - ${update.incident_type}</h4>
                    <p>${update.update_type} by ${update.officer}</p>
                    <small>${this.formatTime(update.last_updated)}</small>
                </div>
            </div>
        `).join('');
    }

    async loadAnalytics() {
        try {
            this.showLoading('analyticsResults', 'Generating analytics report...');
            
            // For now, show static analytics - can be enhanced with real data
            setTimeout(() => {
                this.displayAnalytics();
            }, 1000);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showError('analyticsResults', 'Error loading analytics');
        }
    }

    displayAnalytics() {
        const container = document.getElementById('analyticsResults');
        if (!container) return;

        container.innerHTML = `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <h3>Crime Statistics</h3>
                    <div class="stats-overview">
                        <div class="stat-item">
                            <span>Total Cases This Month:</span>
                            <strong>24</strong>
                        </div>
                        <div class="stat-item">
                            <span>Resolution Rate:</span>
                            <strong>65%</strong>
                        </div>
                        <div class="stat-item">
                            <span>Avg Response Time:</span>
                            <strong>2.3 hours</strong>
                        </div>
                    </div>
                </div>

                <div class="analytics-card">
                    <h3>Top Crime Types</h3>
                    <div class="crime-types">
                        <div class="crime-type-item">
                            <span>Theft</span>
                            <span class="count">8 cases</span>
                        </div>
                        <div class="crime-type-item">
                            <span>Fraud</span>
                            <span class="count">6 cases</span>
                        </div>
                        <div class="crime-type-item">
                            <span>Assault</span>
                            <span class="count">4 cases</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-chart">
                <h3>Weekly Crime Trend</h3>
                <div class="chart-placeholder">
                    <i class="material-icons">bar_chart</i>
                    <p>Crime analytics chart will be displayed here</p>
                </div>
            </div>
        `;
    }

    async loadCriminalMatching() {
        try {
            const container = document.getElementById('matchingResults');
            if (container) {
                container.innerHTML = `
                    <div class="matching-instructions">
                        <h4>🔍 Criminal Pattern Matching</h4>
                        <p>Enter case details above to find similar criminal patterns from our database.</p>
                        <div class="feature-list">
                            <div class="feature-item">
                                <i class="material-icons">fingerprint</i>
                                <span>Modus Operandi Analysis</span>
                            </div>
                            <div class="feature-item">
                                <i class="material-icons">compare</i>
                                <span>Pattern Recognition</span>
                            </div>
                            <div class="feature-item">
                                <i class="material-icons">warning</i>
                                <span>Risk Assessment</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load criminal matching:', error);
        }
    }

    async loadHotspots() {
        try {
            this.showLoading('hotspotsList', 'Loading crime hotspots...');
            
            const response = await fetch(`${this.apiBase}/analytics/hotspots`);
            const data = await response.json();

            if (data.success) {
                this.displayHotspots(data.hotspots);
            } else {
                this.showError('hotspotsList', 'Failed to load crime hotspots');
            }
        } catch (error) {
            console.error('Failed to load hotspots:', error);
            this.showError('hotspotsList', 'Error loading hotspots');
        }
    }

    displayHotspots(hotspots) {
        const container = document.getElementById('hotspotsList');
        if (!container) return;

        if (!hotspots || Object.keys(hotspots).length === 0) {
            container.innerHTML = '<div class="no-data">No hotspot data available</div>';
            return;
        }

        container.innerHTML = Object.entries(hotspots).slice(0, 8).map(([location, count]) => `
            <div class="hotspot-item">
                <div class="hotspot-location">
                    <i class="material-icons">location_on</i>
                    <span>${location}</span>
                </div>
                <div class="hotspot-stats">
                    <span class="count">${count} cases</span>
                    <span class="risk-level">${count > 5 ? 'High' : count > 2 ? 'Medium' : 'Low'} Risk</span>
                </div>
            </div>
        `).join('');
    }

    async loadLegalResources() {
        try {
            this.showLoading('legalResources', 'Loading legal resources...');
            
            const response = await fetch(`${this.apiBase}/legal/resources`);
            const data = await response.json();

            if (data.success) {
                this.displayLegalResources(data.resources);
            } else {
                this.displayLegalResources(this.getDefaultLegalResources());
            }
        } catch (error) {
            console.error('Failed to load legal resources:', error);
            this.displayLegalResources(this.getDefaultLegalResources());
        }
    }

    getDefaultLegalResources() {
        return {
            ipc_sections: [
                {section: '379', title: 'Theft', penalty: '3 years or fine'},
                {section: '420', title: 'Cheating', penalty: '7 years and fine'},
                {section: '302', title: 'Murder', penalty: 'Life imprisonment or death'},
                {section: '354', title: 'Assault', penalty: '2 years or fine'},
                {section: '376', title: 'Rape', penalty: '10 years to life'},
                {section: '395', title: 'Robbery', penalty: '10 years and fine'}
            ],
            procedures: [
                {title: 'FIR Registration', steps: ['Verify complainant', 'Record statement', 'Register FIR']},
                {title: 'Evidence Collection', steps: ['Secure scene', 'Collect evidence', 'Document chain']}
            ],
            templates: [
                {name: 'Charge Sheet', type: 'document'},
                {name: 'Search Warrant', type: 'request'}
            ]
        };
    }

    displayLegalResources(resources) {
        const container = document.getElementById('legalResources');
        if (!container) return;

        const ipcSections = resources.ipc_sections || [];
        
        container.innerHTML = `
            <div class="resources-tabs">
                <button class="resource-tab active" data-type="ipc">IPC Sections</button>
                <button class="resource-tab" data-type="procedures">Procedures</button>
                <button class="resource-tab" data-type="templates">Templates</button>
            </div>
            
            <div class="resources-content">
                <div class="resource-section active" id="ipc-section">
                    <div class="ipc-sections-grid">
                        ${ipcSections.map(section => `
                            <div class="ipc-card">
                                <div class="ipc-header">
                                    <h4>Section ${section.section}</h4>
                                    <span class="section-title">${section.title}</span>
                                </div>
                                <div class="ipc-penalty">
                                    <strong>Penalty:</strong> ${section.penalty}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="resource-section" id="procedures-section">
                    <div class="procedures-list">
                        ${resources.procedures ? resources.procedures.map(proc => `
                            <div class="procedure-card">
                                <h4>${proc.title}</h4>
                                <ol>
                                    ${proc.steps.map(step => `<li>${step}</li>`).join('')}
                                </ol>
                            </div>
                        `).join('') : '<p>No procedures available</p>'}
                    </div>
                </div>
                
                <div class="resource-section" id="templates-section">
                    <div class="templates-grid">
                        ${resources.templates ? resources.templates.map(template => `
                            <div class="template-card">
                                <i class="material-icons">description</i>
                                <h4>${template.name}</h4>
                                <p>${template.type} template</p>
                                <button class="btn-download" onclick="downloadTemplate('${template.name}')">Download</button>
                            </div>
                        `).join('') : '<p>No templates available</p>'}
                    </div>
                </div>
            </div>
        `;

        // Setup resource tab switching
        this.setupResourceTabs();
    }

    setupResourceTabs() {
        document.querySelectorAll('.resource-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs and sections
                document.querySelectorAll('.resource-tab, .resource-section').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Show corresponding section
                const sectionId = e.target.getAttribute('data-type') + '-section';
                const section = document.getElementById(sectionId);
                if (section) {
                    section.classList.add('active');
                }
            });
        });
    }

    loadTemplates() {
        // Static templates content
        console.log('Templates loaded');
    }

    searchLegalResources() {
        const searchTerm = document.getElementById('legalSearch')?.value;
        if (searchTerm) {
            alert(`Searching for: "${searchTerm}" - Advanced search coming soon!`);
        } else {
            alert('Please enter a search term');
        }
    }

    showLoading(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="material-icons">refresh</i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="material-icons">error</i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    async updateSystemStatus() {
        try {
            const response = await fetch('http://localhost:5001/api/fir/health');
            const data = await response.json();

            const dbStatus = document.getElementById('dbStatus');
            const aiStatus = document.getElementById('aiStatus');

            if (dbStatus && aiStatus) {
                if (data.status === 'healthy') {
                    dbStatus.textContent = '● Online';
                    dbStatus.className = 'status-indicator online';
                    aiStatus.textContent = '● Online';
                    aiStatus.className = 'status-indicator online';
                } else {
                    dbStatus.textContent = '● Offline';
                    dbStatus.className = 'status-indicator offline';
                    aiStatus.textContent = '● Degraded';
                    aiStatus.className = 'status-indicator degraded';
                }
            }
        } catch (error) {
            const dbStatus = document.getElementById('dbStatus');
            const aiStatus = document.getElementById('aiStatus');
            if (dbStatus && aiStatus) {
                dbStatus.textContent = '● Offline';
                dbStatus.className = 'status-indicator offline';
                aiStatus.textContent = '● Offline';
                aiStatus.className = 'status-indicator offline';
            }
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleString();
    }
}

// Global functions for HTML onclick handlers
function showTab(tabName) {
    if (window.policeDashboard) {
        window.policeDashboard.showTab(tabName);
    }
}

function viewCaseDetails(firNumber) {
    alert(`Viewing details for ${firNumber} - Detailed view coming soon!`);
}

function updateCaseStatus(firNumber) {
    const newStatus = prompt(`Update status for ${firNumber}:`, 'Under Investigation');
    if (newStatus) {
        fetch(`http://localhost:5001/api/police/cases/${firNumber}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, notes: 'Status updated via dashboard' })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert('Status updated successfully');
                  if (window.policeDashboard) {
                      window.policeDashboard.loadPendingCases();
                  }
              } else {
                  alert('Error updating status: ' + data.error);
              }
          });
    }
}

function generateAnalytics() {
    if (window.policeDashboard) {
        window.policeDashboard.loadAnalytics();
    }
}

function findCriminalMatches() {
    const caseDescription = document.getElementById('caseDescription')?.value;
    if (caseDescription) {
        alert(`Searching criminal patterns for: "${caseDescription}" - Advanced matching coming soon!`);
    } else {
        alert('Please enter case details to search for matches');
    }
}

function searchLegalResources() {
    if (window.policeDashboard) {
        window.policeDashboard.searchLegalResources();
    }
}

function downloadTemplate(templateName) {
    alert(`Downloading ${templateName} template - Feature coming soon!`);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.policeDashboard = new PoliceDashboard();
});
