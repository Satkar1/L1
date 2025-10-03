// Legal Resources Manager
class LegalResourcesManager {
    constructor() {
        this.apiBase = 'http://localhost:5001/api/police';
        this.resources = null;
        this.currentType = 'ipc';
    }

    async loadResources() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/legal/resources`);
            const data = await response.json();

            if (data.success) {
                this.resources = data.resources;
                this.displayResources();
            } else {
                // Fallback to default resources
                this.resources = this.getDefaultResources();
                this.displayResources();
            }
        } catch (error) {
            console.error('Failed to load legal resources:', error);
            this.resources = this.getDefaultResources();
            this.displayResources();
        }
    }

    getDefaultResources() {
        return {
            ipc_sections: [
                { section: '302', title: 'Murder', penalty: 'Life imprisonment or death', description: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.' },
                { section: '379', title: 'Theft', penalty: '3 years or fine', description: 'Whoever intending to take dishonestly any movable property out of the possession of any person without that person\'s consent.' },
                { section: '420', title: 'Cheating and dishonestly inducing delivery of property', penalty: '7 years and fine', description: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person.' },
                { section: '354', title: 'Assault or criminal force to woman with intent to outrage her modesty', penalty: '2 years or fine', description: 'Whoever assaults or uses criminal force to any woman, intending to outrage or knowing it to be likely that he will thereby outrage her modesty.' },
                { section: '376', title: 'Rape', penalty: '10 years to life', description: 'A man is said to commit "rape" who has sexual intercourse with a woman in circumstances falling under any of the six following descriptions.' },
                { section: '395', title: 'Punishment for dacoity', penalty: '10 years and fine', description: 'Whoever commits dacoity shall be punished with imprisonment for life, or with rigorous imprisonment for a term which may extend to ten years.' },
                { section: '304', title: 'Punishment for culpable homicide not amounting to murder', penalty: '10 years or fine', description: 'Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life.' },
                { section: '406', title: 'Punishment for criminal breach of trust', penalty: '3 years or fine', description: 'Whoever commits criminal breach of trust shall be punished with imprisonment of either description for a term which may extend to three years.' },
                { section: '498A', title: 'Husband or relative of husband of a woman subjecting her to cruelty', penalty: '3 years and fine', description: 'Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished.' },
                { section: '506', title: 'Punishment for criminal intimidation', penalty: '2 years or fine', description: 'Whoever commits, the offence of criminal intimidation shall be punished with imprisonment of either description for a term which may extend to two years.' }
            ],
            procedures: [
                {
                    title: 'FIR Registration Process',
                    steps: [
                        'Receive complaint from complainant',
                        'Verify identity and collect contact details',
                        'Record detailed statement',
                        'Determine cognizable offense',
                        'Register FIR with unique number',
                        'Provide copy to complainant',
                        'Begin preliminary investigation'
                    ]
                },
                {
                    title: 'Evidence Collection Protocol',
                    steps: [
                        'Secure crime scene immediately',
                        'Document scene with photographs',
                        'Collect physical evidence systematically',
                        'Maintain chain of custody',
                        'Label and seal evidence properly',
                        'Record witness statements',
                        'Prepare evidence inventory'
                    ]
                },
                {
                    title: 'Arrest Procedure',
                    steps: [
                        'Verify arrest warrant if required',
                        'Inform suspect of charges',
                        'Read rights to the accused',
                        'Conduct lawful search if necessary',
                        'Inform family/friends of arrest',
                        'Medical examination if required',
                        'Present before magistrate within 24 hours'
                    ]
                }
            ],
            templates: [
                { name: 'FIR Template', type: 'document', description: 'Standard FIR registration format' },
                { name: 'Charge Sheet', type: 'document', description: 'Final report against accused' },
                { name: 'Search Warrant Application', type: 'request', description: 'Application for search warrant' },
                { name: 'Bail Application', type: 'application', description: 'Application for bail' },
                { name: 'Arrest Warrant', type: 'warrant', description: 'Warrant for arrest of accused' },
                { name: 'Investigation Report', type: 'report', description: 'Detailed investigation findings' }
            ]
        };
    }

    displayResources() {
        const container = document.getElementById('legalResourcesGrid');
        if (!container) return;

        container.innerHTML = `
            <div class="resources-tabs">
                <button class="resource-tab ${this.currentType === 'ipc' ? 'active' : ''}" data-type="ipc">
                    <i class="material-icons">gavel</i>
                    IPC Sections
                </button>
                <button class="resource-tab ${this.currentType === 'procedures' ? 'active' : ''}" data-type="procedures">
                    <i class="material-icons">list_alt</i>
                    Procedures
                </button>
                <button class="resource-tab ${this.currentType === 'templates' ? 'active' : ''}" data-type="templates">
                    <i class="material-icons">description</i>
                    Templates
                </button>
            </div>
            
            <div class="resources-content">
                <div class="resource-section ${this.currentType === 'ipc' ? 'active' : ''}" id="ipc-section">
                    ${this.renderIPCSections()}
                </div>
                
                <div class="resource-section ${this.currentType === 'procedures' ? 'active' : ''}" id="procedures-section">
                    ${this.renderProcedures()}
                </div>
                
                <div class="resource-section ${this.currentType === 'templates' ? 'active' : ''}" id="templates-section">
                    ${this.renderTemplates()}
                </div>
            </div>
        `;

        this.setupResourceTabs();
    }

    renderIPCSections() {
        if (!this.resources.ipc_sections) return '<p>No IPC sections available</p>';

        return `
            <div class="ipc-sections-grid">
                ${this.resources.ipc_sections.map(section => `
                    <div class="ipc-card">
                        <div class="ipc-header">
                            <h4>Section ${section.section}</h4>
                            <span class="section-title">${section.title}</span>
                        </div>
                        <div class="ipc-description">
                            <p>${section.description || 'No description available'}</p>
                        </div>
                        <div class="ipc-penalty">
                            <strong>Penalty:</strong> ${section.penalty}
                        </div>
                        <div class="ipc-actions">
                            <button class="btn-copy" onclick="copyToClipboard('Section ${section.section}: ${section.title}')">
                                <i class="material-icons">content_copy</i> Copy
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderProcedures() {
        if (!this.resources.procedures) return '<p>No procedures available</p>';

        return `
            <div class="procedures-list">
                ${this.resources.procedures.map(proc => `
                    <div class="procedure-card">
                        <div class="procedure-header">
                            <h4><i class="material-icons">fact_check</i>${proc.title}</h4>
                        </div>
                        <div class="procedure-steps">
                            <ol>
                                ${proc.steps.map(step => `<li>${step}</li>`).join('')}
                            </ol>
                        </div>
                        <div class="procedure-actions">
                            <button class="btn-download" onclick="downloadProcedure('${proc.title}')">
                                <i class="material-icons">download</i> Download
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTemplates() {
        if (!this.resources.templates) return '<p>No templates available</p>';

        return `
            <div class="templates-grid">
                ${this.resources.templates.map(template => `
                    <div class="template-card">
                        <div class="template-icon">
                            <i class="material-icons">description</i>
                        </div>
                        <div class="template-content">
                            <h4>${template.name}</h4>
                            <p class="template-type">${template.type} template</p>
                            <p class="template-description">${template.description || ''}</p>
                        </div>
                        <div class="template-actions">
                            <button class="btn-download" onclick="downloadTemplate('${template.name}')">
                                <i class="material-icons">download</i> Download
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
                
                this.currentType = e.target.getAttribute('data-type');
            });
        });
    }

    async searchResources() {
        const searchTerm = document.getElementById('legalSearch')?.value;
        if (!searchTerm) {
            alert('Please enter a search term');
            return;
        }

        this.showLoading();
        
        // Simulate search delay
        setTimeout(() => {
            const filteredResources = this.filterResources(searchTerm);
            this.displayFilteredResources(filteredResources, searchTerm);
        }, 500);
    }

    filterResources(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = {
            ipc_sections: [],
            procedures: [],
            templates: []
        };

        // Filter IPC sections
        if (this.resources.ipc_sections) {
            filtered.ipc_sections = this.resources.ipc_sections.filter(section => 
                section.section.toLowerCase().includes(term) ||
                section.title.toLowerCase().includes(term) ||
                (section.description && section.description.toLowerCase().includes(term))
            );
        }

        // Filter procedures
        if (this.resources.procedures) {
            filtered.procedures = this.resources.procedures.filter(proc => 
                proc.title.toLowerCase().includes(term) ||
                proc.steps.some(step => step.toLowerCase().includes(term))
            );
        }

        // Filter templates
        if (this.resources.templates) {
            filtered.templates = this.resources.templates.filter(template => 
                template.name.toLowerCase().includes(term) ||
                (template.description && template.description.toLowerCase().includes(term))
            );
        }

        return filtered;
    }

    displayFilteredResources(filteredResources, searchTerm) {
        const container = document.getElementById('legalResourcesGrid');
        if (!container) return;

        const totalResults = filteredResources.ipc_sections.length + 
                           filteredResources.procedures.length + 
                           filteredResources.templates.length;

        if (totalResults === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="material-icons">search_off</i>
                    <h3>No Results Found</h3>
                    <p>No resources found for "${searchTerm}"</p>
                    <button class="btn-clear-search" onclick="window.legalResourcesManager.loadResources()">
                        Clear Search
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="search-results">
                <div class="search-header">
                    <h3>Search Results for "${searchTerm}" (${totalResults} found)</h3>
                    <button class="btn-clear-search" onclick="window.legalResourcesManager.loadResources()">
                        <i class="material-icons">clear</i> Clear
                    </button>
                </div>
                
                ${filteredResources.ipc_sections.length > 0 ? `
                    <div class="results-section">
                        <h4><i class="material-icons">gavel</i> IPC Sections (${filteredResources.ipc_sections.length})</h4>
                        <div class="ipc-sections-grid">
                            ${filteredResources.ipc_sections.map(section => `
                                <div class="ipc-card">
                                    <div class="ipc-header">
                                        <h4>Section ${section.section}</h4>
                                        <span class="section-title">${section.title}</span>
                                    </div>
                                    <div class="ipc-description">
                                        <p>${section.description || 'No description available'}</p>
                                    </div>
                                    <div class="ipc-penalty">
                                        <strong>Penalty:</strong> ${section.penalty}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${filteredResources.procedures.length > 0 ? `
                    <div class="results-section">
                        <h4><i class="material-icons">list_alt</i> Procedures (${filteredResources.procedures.length})</h4>
                        <div class="procedures-list">
                            ${filteredResources.procedures.map(proc => `
                                <div class="procedure-card">
                                    <h4>${proc.title}</h4>
                                    <ol>
                                        ${proc.steps.map(step => `<li>${step}</li>`).join('')}
                                    </ol>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${filteredResources.templates.length > 0 ? `
                    <div class="results-section">
                        <h4><i class="material-icons">description</i> Templates (${filteredResources.templates.length})</h4>
                        <div class="templates-grid">
                            ${filteredResources.templates.map(template => `
                                <div class="template-card">
                                    <div class="template-icon">
                                        <i class="material-icons">description</i>
                                    </div>
                                    <div class="template-content">
                                        <h4>${template.name}</h4>
                                        <p>${template.description || ''}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showLoading() {
        const container = document.getElementById('legalResourcesGrid');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="material-icons">gavel</i>
                    <p>Loading legal resources...</p>
                </div>
            `;
        }
    }
}

// Global functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy to clipboard');
    });
}

function downloadTemplate(templateName) {
    alert(`Downloading ${templateName} template - Feature will be implemented soon!`);
}

function downloadProcedure(procedureName) {
    alert(`Downloading ${procedureName} procedure - Feature will be implemented soon!`);
}

// Initialize legal resources manager
window.legalResourcesManager = new LegalResourcesManager();